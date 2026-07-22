import type {
  CanonicalQuestion,
  Choice,
  DocumentExtractionResult,
  PageRegion,
  QuestionEvidence,
} from "./schemas";

export type LocalExtractionPage = {
  pageNumber: number;
  pageText?: string | null;
};

type WorkingPage = {
  documentId: string;
  pageNumber: number;
  pageText: string;
};

type AnswerLine = {
  label: string | null;
  rawText: string | null;
  uncertain: boolean;
  lines: string[];
};

export function extractDocumentLocally(
  documentId: string,
  pages: LocalExtractionPage[],
): DocumentExtractionResult {
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const questions: CanonicalQuestion[] = [];
  const regions: PageRegion[] = [];
  const evidence: QuestionEvidence[] = [];
  const warnings: string[] = [];

  for (const page of sorted) {
    const workingPage: WorkingPage = {
      documentId,
      pageNumber: page.pageNumber,
      pageText: page.pageText ?? "",
    };
    const pageQuestions = extractPageQuestions(workingPage, questions.length);

    if (!page.pageText?.trim()) {
      warnings.push(`page ${page.pageNumber}: no selectable text found`);
    } else if (!pageQuestions.length) {
      warnings.push(`page ${page.pageNumber}: no local MCQ pattern found`);
    }

    for (const question of pageQuestions) {
      questions.push(question);
      regions.push({
        id: question.source.regionIds[0] ?? `region_p${page.pageNumber}_q${questions.length}`,
        pageNumber: page.pageNumber,
        type: "question_stem",
        text: question.versions.source.stem,
        boundingBox: { x: 5, y: 5, width: 90, height: 22 },
        confidence: question.confidence.segmentation,
        associatedQuestionId: question.id,
      });
      evidence.push({
        id: question.source.evidenceIds[0] ?? `evidence_${question.id}`,
        questionId: question.id,
        pageNumber: page.pageNumber,
        evidenceType: "typed_recall",
        text: question.versions.source.stem,
        assetId: null,
        boundingBox: { x: 5, y: 5, width: 90, height: 22 },
        confidence: question.confidence.stem,
      });
    }
  }

  return {
    documentId,
    pageCount: sorted.length,
    questions,
    regions,
    evidence,
    ragReady: questions.map((question) => ({
      questionId: question.id,
      stem: question.versions.quizReady.stem,
      choices: question.versions.quizReady.choices,
      answerStatus: question.answer.status,
      origin: question.origin,
      pageNumbers: question.source.pageNumbers,
      usabilityStatus: question.usabilityStatus,
    })),
    warnings,
  };
}

function extractPageQuestions(page: WorkingPage, globalQuestionOffset: number) {
  const blocks = splitQuestionBlocks(page.pageText);
  const questions: CanonicalQuestion[] = [];

  for (const block of blocks) {
    const question = buildNativeQuestion(block, page, globalQuestionOffset + questions.length);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

function splitQuestionBlocks(text: string) {
  const normalized = text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) {
    return [];
  }

  const paragraphBlocks = normalized
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter((block) => block.split(/\n/).filter(Boolean).length >= 3);

  if (paragraphBlocks.length > 1) {
    return paragraphBlocks;
  }

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (startsNewRecallBlock(line, current) || startsNewNumberedBlock(line, current)) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length) {
    blocks.push(current);
  }

  return blocks
    .map((block) => block.join("\n"))
    .filter((block) => block.split(/\n/).length >= 3);
}

function startsNewNumberedBlock(line: string, current: string[]) {
  return current.length >= 3 && /^(?:Q(?:uestion)?\s*)?\d{1,4}[\).:-]\s+/i.test(line);
}

function startsNewRecallBlock(line: string, current: string[]) {
  if (current.length < 3 || isHeaderOrComment(line)) {
    return false;
  }

  const trailingChoices = collectTrailingChoices(current);
  if (trailingChoices.length < 2) {
    return false;
  }

  return looksLikeQuestionStartLine(line) || !looksLikeChoiceLine(line);
}

function buildNativeQuestion(
  block: string,
  page: WorkingPage,
  questionIndex: number,
): CanonicalQuestion | null {
  const choiceMatches = Array.from(
    block.matchAll(/(?:^|\s)([A-H])[\).:-]\s*([^A-H]{1,240}?)(?=\s+[A-H][\).:-]|\s+(?:Answer|Ans)\b|$)/gi),
  );

  if (choiceMatches.length >= 2) {
    return buildLabeledQuestion(block, page, questionIndex, choiceMatches);
  }

  return buildRecallStyleQuestion(block, page, questionIndex);
}

function buildLabeledQuestion(
  block: string,
  page: WorkingPage,
  questionIndex: number,
  choiceMatches: RegExpMatchArray[],
): CanonicalQuestion | null {
  const firstChoiceIndex = choiceMatches[0]?.index ?? -1;
  const stem = cleanOcrText(
    block
      .slice(0, firstChoiceIndex > 0 ? firstChoiceIndex : undefined)
      .replace(/^(?:Q(?:uestion)?\s*)?\d{1,4}[\).:-]\s*/i, ""),
  );

  if (!stem) {
    return null;
  }

  const answerFromBlock = extractAnswerFromLines(block.split(/\n+/));
  const choices = choiceMatches
    .map((match) => {
      const label = match[1]?.toUpperCase() ?? null;
      const text = cleanChoiceText(match[2]?.trim() || "", label);
      return { label, text };
    })
    .filter((choice) => choice.text && !isAnswerLine(choice.text) && !isCategoryChoice(choice.text))
    .map((choice, index) => ({
      id: `q_${page.documentId}_${String(questionIndex + 1).padStart(3, "0")}_c${index + 1}`,
      label: choice.label,
      text: choice.text,
    }));

  if (!looksLikeRealExamStem(stem, choices.map((choice) => choice.text))) {
    return null;
  }

  return createQuestion({
    page,
    questionIndex,
    stem,
    choices,
    answer: answerFromBlock,
    confidence: answerFromBlock.label ? 0.82 : 0.72,
  });
}

function buildRecallStyleQuestion(
  block: string,
  page: WorkingPage,
  questionIndex: number,
): CanonicalQuestion | null {
  const lines = block
    .split(/\n+/)
    .map((line) => cleanOcrText(line))
    .filter(Boolean)
    .filter((line) => !isHeaderOrComment(line));

  if (lines.length < 3) {
    return null;
  }

  const answer = extractAnswerFromLines(lines);
  const contentLines = answer.lines;
  const questionEnd = contentLines.findIndex((line) => line.includes("?"));
  let stemLines: string[];
  let choiceLines: string[];

  if (questionEnd >= 0 && contentLines.length - questionEnd - 1 >= 2) {
    stemLines = contentLines.slice(0, questionEnd + 1);
    choiceLines = contentLines.slice(questionEnd + 1);
  } else {
    const trailingChoices = collectTrailingChoices(contentLines);
    if (trailingChoices.length < 2 || trailingChoices.length >= contentLines.length) {
      return null;
    }

    stemLines = contentLines.slice(0, contentLines.length - trailingChoices.length);
    choiceLines = trailingChoices;
  }

  choiceLines = choiceLines
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .map((line, index) => cleanChoiceText(line, String.fromCharCode(65 + index)))
    .filter((line) => line && !isHeaderOrComment(line) && !isAnswerLine(line) && !isCategoryChoice(line))
    .slice(0, 6);

  if (choiceLines.length < 2 || !stemLines.join(" ").trim()) {
    return null;
  }

  const stem = cleanOcrText(
    stemLines.join(" ").replace(/^(?:Q(?:uestion)?\s*)?\d{1,4}[\).:-]\s*/i, ""),
  );

  if (!looksLikeRealExamStem(stem, choiceLines)) {
    return null;
  }

  const choices = choiceLines.map((line, index) => ({
    id: `q_${page.documentId}_${String(questionIndex + 1).padStart(3, "0")}_c${index + 1}`,
    label: String.fromCharCode(65 + index),
    text: line,
  }));

  return createQuestion({
    page,
    questionIndex,
    stem,
    choices,
    answer,
    confidence: answer.label ? 0.76 : 0.68,
  });
}

function createQuestion({
  page,
  questionIndex,
  stem,
  choices,
  answer,
  confidence,
}: {
  page: WorkingPage;
  questionIndex: number;
  stem: string;
  choices: Choice[];
  answer: AnswerLine;
  confidence: number;
}): CanonicalQuestion | null {
  if (!stem || choices.length < 2) {
    return null;
  }

  const questionId = `q_${page.documentId}_${String(questionIndex + 1).padStart(3, "0")}`;
  const correctChoice = answer.label
    ? choices.find((choice) => choice.label === answer.label)
    : null;
  const answerStatus = answer.label ? (answer.uncertain ? "uncertain" : "explicit") : "missing";

  return {
    id: questionId,
    origin: "extracted",
    source: {
      documentId: page.documentId,
      pageNumbers: [page.pageNumber],
      regionIds: [`region_${questionId}`],
      evidenceIds: [`evidence_${questionId}`],
    },
    versions: {
      source: { stem, choices },
      normalized: { stem, choices },
      quizReady: { stem, choices },
    },
    answer: {
      correctChoiceId: correctChoice?.id ?? null,
      sourceChoiceLabel: answer.label,
      status: answerStatus,
      rawAnswerText: answer.rawText,
      confidence: answer.label ? (answer.uncertain ? 0.45 : 0.7) : 0,
    },
    assets: [],
    completeness: {
      stemComplete: true,
      choicesComplete: choices.length >= 2,
      imagePresentWhenRequired: true,
      answerPresent: Boolean(answer.label),
      missingParts: answer.label ? [] : ["answer"],
      score: confidence,
    },
    usabilityStatus: answer.label && !answer.uncertain ? "quiz_ready" : "needs_review",
    confidence: {
      segmentation: confidence,
      stem: confidence,
      choices: confidence,
      answer: answer.label ? (answer.uncertain ? 0.45 : 0.7) : 0,
      imageAssociation: 1,
      overall: confidence,
    },
    warnings: answer.uncertain ? ["Answer key is uncertain."] : [],
    reviewStatus: "review_required",
  };
}

function collectTrailingChoices(lines: string[]) {
  const choices: string[] = [];

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line || isHeaderOrComment(line) || looksLikeQuestionLine(line)) {
      break;
    }

    if (looksLikeChoiceLine(line)) {
      choices.unshift(line);
    } else {
      break;
    }
  }

  return choices.slice(-6);
}

function looksLikeChoiceLine(line: string) {
  const wordCount = line.split(/\s+/).length;
  return (
    line.length <= 110 &&
    wordCount <= 12 &&
    !/^(and|or|but)\b/i.test(line) &&
    !isAnswerLine(line) &&
    !isCategoryChoice(line)
  );
}

function looksLikeQuestionLine(line: string) {
  return (
    line.includes("?") ||
    /\b(what|which|best|most likely|diagnosis|management|treatment|next step|initial|confirm|responsible)\b/i.test(line)
  );
}

function looksLikeRealExamStem(stem: string, choices: string[]) {
  const normalizedStem = stem.replace(/\s+/g, " ").trim();
  const normalizedChoices = choices.join(" ").replace(/\s+/g, " ");

  if (isNonQuestionStem(normalizedStem) || choices.some(isCategoryChoice)) {
    return false;
  }

  return (
    normalizedStem.includes("?") ||
    /\b(patient|woman|man|male|female|child|boy|girl|newborn|infant|pregnant|presents?|diagnosis|management|treatment|next step|most likely|appropriate|initial|confirm|screening|investigation|therapy|complication)\b/i.test(
      normalizedStem,
    ) ||
    /\b(allopurinol|hydroxyurea|transfusion|antibiotic|surgery|ocp|calcium|glucose|cortisol|metanephrines|ultrasound|ct|mri|x-?ray)\b/i.test(
      normalizedChoices,
    )
  );
}

function isNonQuestionStem(stem: string) {
  return (
    /Questions written by many/i.test(stem) ||
    /Collected\s*&\s*Edited by/i.test(stem) ||
    /\bTelegram\b|\bMOF Group\b/i.test(stem) ||
    /لا تنسوا|دعواتكم|بالتوفيق|التيسير/.test(stem) ||
    /\b(Family Medicine|Psychiatry|Statistics|Orthopedic|Radiology|Pediatric|Gynecology|Internal Medicine|Dermatology)\s+Questions\b/i.test(
      stem,
    )
  );
}

function isCategoryChoice(choice: string) {
  return (
    /^(?:[A-H]\s*)?(ENT|ER|Ophthalmology|General Surgery|Family Medicine|Psychiatry|Statistics|Orthopedic|Radiology|Pediatric|Gynecology|Internal Medicine|Dermatology)\s+Questions\b/i.test(
      choice,
    ) ||
    /^(?:[A-H]\s*)?(ENT|ER|Ophthalmology|General Surgery|Family Medicine|Psychiatry|Statistics|Orthopedic|Radiology|Pediatric|Gynecology|Internal Medicine|Dermatology)\s*:\s*$/i.test(
      choice,
    ) ||
    /^\(?\s*we are not sure of\s*\)?$/i.test(choice)
  );
}

function looksLikeQuestionStartLine(line: string) {
  return (
    /^(?:\d{1,4}[\).:-]\s*)?(?:a|an|the)?\s*(patient|woman|man|male|female|child|boy|girl|newborn|infant|pregnant|question|pt)\b/i.test(line) ||
    /\b(presents?|came|coming|history|diagnosed|scheduled|asking|what|which|best|most likely)\b/i.test(line)
  );
}

function isHeaderOrComment(line: string) {
  return (
    /^April 15 2026 SMLE Morning Exam$/i.test(line) ||
    /^Tried to remember/i.test(line) ||
    /^The missing questions/i.test(line) ||
    /^Wish you all/i.test(line) ||
    /^Alhomrani:/i.test(line) ||
    /Questions written by many/i.test(line) ||
    /Collected\s*&\s*Edited by/i.test(line) ||
    /\bTelegram\b|\bMOF Group\b/i.test(line) ||
    /^Notes?:/i.test(line)
  );
}

function cleanOcrText(value: string) {
  return value
    .replace(/\u00d9/g, "ff")
    .replace(/\u00fb/g, "fi")
    .replace(/\u00f9/g, "fi")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanChoiceText(value: string, expectedLabel: string | null) {
  let text = cleanOcrText(value)
    .replace(/^[-*•]\s*/, "")
    .replace(/^\(?\s*([A-H])\s*\)?[\).:-]\s*/i, "")
    .trim();

  if (expectedLabel) {
    text = text.replace(new RegExp(`^${expectedLabel}\\s+[${expectedLabel}]?[\\).:-]?\\s*`, "i"), "").trim();
  }

  return text;
}

function parseAnswerLine(line: string) {
  const match = line.match(/^(?:answer|ans|correct\s+answer)\s*[:\-]?\s*([A-H])\??(?:\b|$)/i);

  if (!match) {
    return null;
  }

  return {
    label: match[1].toUpperCase(),
    rawText: line,
    uncertain: /\?|not sure|unsure/i.test(line),
  };
}

function isAnswerLine(line: string) {
  return Boolean(parseAnswerLine(cleanOcrText(line)));
}

function extractAnswerFromLines(lines: string[]): AnswerLine {
  let label: string | null = null;
  let rawText: string | null = null;
  let uncertain = false;
  const remaining: string[] = [];

  for (const line of lines) {
    const answer = parseAnswerLine(line);
    if (answer && !label) {
      label = answer.label;
      rawText = answer.rawText;
      uncertain = answer.uncertain;
      continue;
    }

    if (answer) {
      continue;
    }

    remaining.push(line);
  }

  return { lines: remaining, label, rawText, uncertain };
}
