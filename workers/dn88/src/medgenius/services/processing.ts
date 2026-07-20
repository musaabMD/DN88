import {
  computeCreditCost,
  incrementDocumentUsage,
  spendCredits,
} from "./credits";
import { isCorruptParsedMarkdown } from "./markdown-quality";
import {
  computeFileHash,
  parseDocumentWithOcrFallback,
} from "./context-dev";
import {
  buildR2Keys,
  findDuplicateDocument,
  getDocument,
  getMarkdown,
  storeMarkdown,
  updateDocumentStatus,
} from "./documents";
import {
  detectDuplicateGroups,
  insertQuestions,
  mergeExtractedQuestions,
  parseExtractedQuestions,
} from "./questions";
import { extractRecallMcqsFromMarkdown } from "./recall-extraction";
import {
  extractQuestionsFromMarkdown,
  generateDocumentSummary,
  generateFlashcardsFromQuestion,
} from "./openrouter";
import { sanitizeUserError } from "./user-errors";
import type { Bindings } from "../../types";
import type { ProcessingStage, QueueMessage } from "../types";

export async function createDocumentUpload(
  env: Bindings,
  params: {
    userId: string;
    examId?: string;
    name: string;
    filename: string;
    mimeType: string;
    fileBytes: ArrayBuffer;
  }
): Promise<{ documentId: string; duplicate: boolean; reprocessed?: boolean }> {
  const fileHash = await computeFileHash(params.fileBytes);
  const existing = await findDuplicateDocument(env.DB, params.userId, fileHash);
  if (existing) {
    const corrupt = await documentHasCorruptMarkdown(env, existing);
    if (corrupt) {
      await reprocessDocument(env, existing.id, params.userId);
      return { documentId: existing.id, duplicate: false, reprocessed: true };
    }
    return { documentId: existing.id, duplicate: true };
  }

  const documentId = crypto.randomUUID();
  const keys = buildR2Keys(params.userId, documentId, params.filename);

  await env.USER_CONTENT.put(keys.original, params.fileBytes, {
    httpMetadata: { contentType: params.mimeType },
    customMetadata: { userId: params.userId, documentId },
  });

  await env.DB.prepare(
    `INSERT INTO medgenius_documents (
      id, user_id, exam_id, name, original_filename, mime_type,
      file_size_bytes, file_hash, r2_original_key, processing_status, processing_progress
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`
  )
    .bind(
      documentId,
      params.userId,
      params.examId ?? null,
      params.name,
      params.filename,
      params.mimeType,
      params.fileBytes.byteLength,
      fileHash,
      keys.original
    )
    .run();

  const jobId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO medgenius_processing_jobs (id, document_id, user_id, stage, status)
     VALUES (?, ?, ?, 'parse', 'queued')`
  )
    .bind(jobId, documentId, params.userId)
    .run();

  await env.PROCESSING_QUEUE.send({
    jobId,
    documentId,
    userId: params.userId,
    stage: "parse",
  } satisfies QueueMessage);

  return { documentId, duplicate: false };
}

export async function processQueueMessage(
  env: Bindings,
  message: QueueMessage
): Promise<void> {
  const { jobId, documentId, userId, stage } = message;

  await env.DB.prepare(
    "UPDATE medgenius_processing_jobs SET status = 'running', started_at = datetime('now') WHERE id = ?"
  )
    .bind(jobId)
    .run();

  try {
    switch (stage) {
      case "parse":
        await runParseStage(env, documentId, userId, jobId);
        break;
      case "extract_questions":
        await runExtractQuestionsStage(env, documentId, userId, jobId);
        break;
      case "detect_duplicates":
        await runDuplicateStage(env, documentId, userId, jobId);
        break;
      case "generate_flashcards":
        await runFlashcardStage(env, documentId, userId, jobId);
        break;
      default:
        await completeJob(env, jobId);
    }
  } catch (error) {
    const errorMessage = sanitizeUserError(
      error instanceof Error ? error.message : "Processing failed",
      "processing"
    );
    await env.DB.prepare(
      "UPDATE medgenius_processing_jobs SET status = 'failed', error_message = ?, finished_at = datetime('now') WHERE id = ?"
    )
      .bind(errorMessage, jobId)
      .run();
    await updateDocumentStatus(env.DB, documentId, "failed", 0, errorMessage);
    throw error;
  }
}

async function runParseStage(
  env: Bindings,
  documentId: string,
  userId: string,
  jobId: string
): Promise<void> {
  await updateDocumentStatus(env.DB, documentId, "parsing", 10);

  const doc = await env.DB.prepare("SELECT * FROM medgenius_documents WHERE id = ?")
    .bind(documentId)
    .first<{
      original_filename: string;
      mime_type: string;
      r2_original_key: string;
      name: string;
    }>();

  if (!doc) throw new Error("Document not found");

  const obj = await env.USER_CONTENT.get(doc.r2_original_key);
  if (!obj) throw new Error("Original file missing from storage");

  const fileBytes = await obj.arrayBuffer();
  const parsed = await parseDocumentWithOcrFallback(env.CONTEXT_DEV_API_KEY, {
    fileBytes,
    filename: doc.original_filename,
    mimeType: doc.mime_type,
    options: {
      includeLinks: true,
      includeImages: true,
      shortenBase64Images: true,
      useMainContentOnly: false,
    },
  });

  const parseCost = parsed.creditsConsumed;
  await spendCredits(env.DB, userId, parseCost, "page_parse", {
    type: "document",
    id: documentId,
    metadata: {
      pageCount: parsed.pageCount,
      contextDevType: parsed.type,
      creditsConsumed: parsed.creditsConsumed,
    },
  });

  const keys = buildR2Keys(userId, documentId, doc.original_filename);
  await storeMarkdown(env.USER_CONTENT, keys.markdown, parsed.markdown);

  await env.DB.prepare(
    `UPDATE medgenius_documents SET
      page_count = ?, r2_markdown_key = ?, context_dev_job_id = ?,
      processing_status = 'extracting', processing_progress = 40, updated_at = datetime('now')
    WHERE id = ?`
  )
    .bind(parsed.pageCount, keys.markdown, parsed.jobId, documentId)
    .run();

  await incrementDocumentUsage(env.DB, userId, parsed.pageCount);
  await completeJob(env, jobId, 100);

  const nextJobId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO medgenius_processing_jobs (id, document_id, user_id, stage, status)
     VALUES (?, ?, ?, 'extract_questions', 'queued')`
  )
    .bind(nextJobId, documentId, userId)
    .run();

  await env.PROCESSING_QUEUE.send({
    jobId: nextJobId,
    documentId,
    userId,
    stage: "extract_questions",
  } satisfies QueueMessage);
}

async function runExtractQuestionsStage(
  env: Bindings,
  documentId: string,
  userId: string,
  jobId: string
): Promise<void> {
  await updateDocumentStatus(env.DB, documentId, "extracting", 50);

  const doc = await env.DB.prepare("SELECT * FROM medgenius_documents WHERE id = ?")
    .bind(documentId)
    .first<{ name: string; r2_markdown_key: string | null }>();

  if (!doc?.r2_markdown_key) throw new Error("Markdown not found");

  const markdown = await getMarkdown(env.USER_CONTENT, doc.r2_markdown_key);
  if (!markdown) throw new Error("Markdown content missing");

  if (isCorruptParsedMarkdown(markdown)) {
    await updateDocumentStatus(
      env.DB,
      documentId,
      "completed",
      100,
      "Document text could not be read. Reprocess the file from the Read tab."
    );
    await completeJob(env, jobId, 100);
    return;
  }

  const recallQuestions = extractRecallMcqsFromMarkdown(markdown);
  let aiQuestions: import("../types").ExtractedQuestion[] = [];

  if (env.OPENROUTER_API_KEY) {
    try {
      const jsonContent = await extractQuestionsFromMarkdown(
        env.OPENROUTER_API_KEY,
        markdown,
        doc.name
      );
      aiQuestions = parseExtractedQuestions(jsonContent);
    } catch (error) {
      console.error("OpenRouter question extraction failed; using recall parser if available", {
        documentId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const questions = mergeExtractedQuestions(aiQuestions, recallQuestions);

  if (questions.length === 0) {
    console.warn("Question extraction returned zero questions", {
      documentId,
      name: doc.name,
      recallCount: recallQuestions.length,
      aiCount: aiQuestions.length,
      hasOpenRouter: Boolean(env.OPENROUTER_API_KEY),
    });
    const message = env.OPENROUTER_API_KEY
      ? "No MCQs were found in the parsed text. Check Parsed text in the Read tab, then reprocess if the content looks correct."
      : "Quiz extraction was skipped — AI extraction is not configured on the server. Reprocess or extract MCQs after AI is enabled.";
    await updateDocumentStatus(env.DB, documentId, "completed", 100, message);
    await completeJob(env, jobId, 100);
    return;
  }

  const extractCost = computeCreditCost("questionExtract", Math.max(questions.length, 1));
  await spendCredits(env.DB, userId, extractCost, "question_extract", {
    type: "document",
    id: documentId,
    metadata: { count: questions.length, recall: recallQuestions.length, ai: aiQuestions.length },
  });

  await insertQuestions(env.DB, userId, documentId, questions);

  if (env.OPENROUTER_API_KEY) {
  try {
    const summary = await generateDocumentSummary(
      env.OPENROUTER_API_KEY,
      markdown,
      "high_yield"
    );

    const summaryCost = computeCreditCost("summaryGenerate");
    await spendCredits(env.DB, userId, summaryCost, "summary_generate", {
      type: "document",
      id: documentId,
    });

    await env.DB.prepare(
      `INSERT INTO medgenius_summaries (id, user_id, document_id, summary_type, content_markdown)
       VALUES (?, ?, ?, 'high_yield', ?)`
    )
      .bind(crypto.randomUUID(), userId, documentId, summary)
      .run();
  } catch (error) {
    console.error("Summary generation failed; continuing document processing", {
      documentId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
  }

  await updateDocumentStatus(env.DB, documentId, "embedding", 70);
  await completeJob(env, jobId, 100);

  const nextJobId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO medgenius_processing_jobs (id, document_id, user_id, stage, status)
     VALUES (?, ?, ?, 'detect_duplicates', 'queued')`
  )
    .bind(nextJobId, documentId, userId)
    .run();

  await env.PROCESSING_QUEUE.send({
    jobId: nextJobId,
    documentId,
    userId,
    stage: "detect_duplicates",
  } satisfies QueueMessage);
}

async function runDuplicateStage(
  env: Bindings,
  documentId: string,
  userId: string,
  jobId: string
): Promise<void> {
  try {
    const cost = computeCreditCost("duplicateDetection");
    await spendCredits(env.DB, userId, cost, "duplicate_detection", {
      type: "document",
      id: documentId,
    });

    await detectDuplicateGroups(env.DB, userId, documentId);
  } catch (error) {
    console.error("Duplicate detection failed; continuing document processing", {
      documentId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
  await updateDocumentStatus(env.DB, documentId, "embedding", 85);
  await completeJob(env, jobId, 100);

  const nextJobId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO medgenius_processing_jobs (id, document_id, user_id, stage, status)
     VALUES (?, ?, ?, 'generate_flashcards', 'queued')`
  )
    .bind(nextJobId, documentId, userId)
    .run();

  await env.PROCESSING_QUEUE.send({
    jobId: nextJobId,
    documentId,
    userId,
    stage: "generate_flashcards",
  } satisfies QueueMessage);
}

async function runFlashcardStage(
  env: Bindings,
  documentId: string,
  userId: string,
  jobId: string
): Promise<void> {
  if (!env.OPENROUTER_API_KEY) {
    await updateDocumentStatus(env.DB, documentId, "completed", 100);
    await completeJob(env, jobId, 100);
    return;
  }

  const questions = await env.DB.prepare(
    "SELECT id, cleaned_text, original_text, explanation, topic FROM medgenius_questions WHERE document_id = ? LIMIT 20"
  )
    .bind(documentId)
    .all<{
      id: string;
      cleaned_text: string | null;
      original_text: string;
      explanation: string | null;
      topic: string | null;
    }>();

  for (const q of questions.results ?? []) {
    const text = q.cleaned_text ?? q.original_text;
    try {
      const cardJson = await generateFlashcardsFromQuestion(
        env.OPENROUTER_API_KEY,
        text,
        q.explanation ?? ""
      );
      const card = JSON.parse(cardJson) as {
        front?: string;
        back?: string;
        highYieldFact?: string;
        memoryTrick?: string;
      };

      if (!card.front || !card.back) continue;

      await spendCredits(env.DB, userId, computeCreditCost("flashcardGenerate"), "flashcard_generate", {
        type: "question",
        id: q.id,
      });

      await env.DB.prepare(
        `INSERT INTO medgenius_flashcards
          (id, user_id, document_id, question_id, front, back, high_yield_fact, memory_trick, topic)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          crypto.randomUUID(),
          userId,
          documentId,
          q.id,
          card.front,
          card.back,
          card.highYieldFact ?? null,
          card.memoryTrick ?? null,
          q.topic ?? null
        )
        .run();
    } catch {
      /* skip malformed flashcard */
    }
  }

  await updateDocumentStatus(env.DB, documentId, "completed", 100);
  await completeJob(env, jobId, 100);
}

async function completeJob(
  env: Bindings,
  jobId: string,
  progress = 100
): Promise<void> {
  await env.DB.prepare(
    "UPDATE medgenius_processing_jobs SET status = 'completed', progress = ?, finished_at = datetime('now') WHERE id = ?"
  )
    .bind(progress, jobId)
    .run();
}

export async function enqueueStage(
  env: Bindings,
  documentId: string,
  userId: string,
  stage: ProcessingStage
): Promise<string> {
  const jobId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO medgenius_processing_jobs (id, document_id, user_id, stage, status)
     VALUES (?, ?, ?, ?, 'queued')`
  )
    .bind(jobId, documentId, userId, stage)
    .run();

  await env.PROCESSING_QUEUE.send({
    jobId,
    documentId,
    userId,
    stage,
  } satisfies QueueMessage);

  return jobId;
}

export async function documentHasCorruptMarkdown(
  env: Bindings,
  doc: { r2_markdown_key: string | null }
): Promise<boolean> {
  if (!doc.r2_markdown_key) return false;
  const markdown = await getMarkdown(env.USER_CONTENT, doc.r2_markdown_key);
  if (!markdown) return false;
  return isCorruptParsedMarkdown(markdown);
}

export async function reprocessDocument(
  env: Bindings,
  documentId: string,
  userId: string
): Promise<void> {
  const doc = await getDocument(env.DB, userId, documentId);
  if (!doc) throw new Error("Document not found");

  await env.DB.prepare("DELETE FROM medgenius_questions WHERE document_id = ?")
    .bind(documentId)
    .run();
  await env.DB.prepare("DELETE FROM medgenius_flashcards WHERE document_id = ?")
    .bind(documentId)
    .run();
  await env.DB.prepare("DELETE FROM medgenius_summaries WHERE document_id = ?")
    .bind(documentId)
    .run();

  await updateDocumentStatus(env.DB, documentId, "pending", 0, null);
  await enqueueStage(env, documentId, userId, "parse");
}

export async function extractQuestionsOnly(
  env: Bindings,
  documentId: string,
  userId: string
): Promise<{ stage: "parse" | "extract_questions" }> {
  const doc = await getDocument(env.DB, userId, documentId);
  if (!doc) throw new Error("Document not found");

  if (!env.OPENROUTER_API_KEY) {
    throw new Error("AI extraction is not configured. Quiz generation cannot run.");
  }

  const markdownKey = doc.r2_markdown_key;
  if (!markdownKey) {
    await updateDocumentStatus(env.DB, documentId, "pending", 0, null);
    await enqueueStage(env, documentId, userId, "parse");
    return { stage: "parse" };
  }

  const markdown = await getMarkdown(env.USER_CONTENT, markdownKey);
  if (!markdown || isCorruptParsedMarkdown(markdown)) {
    await reprocessDocument(env, documentId, userId);
    return { stage: "parse" };
  }

  await env.DB.prepare("DELETE FROM medgenius_questions WHERE document_id = ?")
    .bind(documentId)
    .run();
  await env.DB.prepare("DELETE FROM medgenius_flashcards WHERE document_id = ?")
    .bind(documentId)
    .run();

  await updateDocumentStatus(env.DB, documentId, "extracting", 40, null);
  await enqueueStage(env, documentId, userId, "extract_questions");
  return { stage: "extract_questions" };
}
