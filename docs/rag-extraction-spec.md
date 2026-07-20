# Critical document-extraction behavior

The uploaded documents are often unofficial exam-recall compilations rather than clean exam papers.

A page may contain:

* One or more original questions
* A short recalled version of a question
* A screenshot containing a more complete version
* An answer written below the question
* An editor’s explanation
* A reference image
* A Telegram link or watermark
* Arabic commentary
* Highlighted passages
* Corrected or conflicting answers
* Non-question educational notes
* Charts unrelated to the questions
* Multiple versions of the same question

The system must identify the semantic boundaries of every question rather than assuming:

```text
one page = one question
```

The correct rule is:

```text
one page may contain zero, one, or many questions
one question may span several regions or pages
```

## Core product behavior

### Mode 1: Exact extraction

Use when the source contains a recognizable question. Preserve original wording, spelling/grammar mistakes, abbreviations, choice order/count, numerical values, source language (including mixed Arabic/English), and explicit uncertainty. Source version is immutable unless the user edits it.

### Mode 2: Generated quiz question

Use only when there is no usable question, choices are missing, material is educational-only, or the user explicitly asks to generate. Generated questions must never be represented as exact source questions.

Every question must have:

```ts
origin: "extracted" | "reconstructed" | "generated";
```

The quiz UI must visibly label reconstructed and generated questions.

## Implementation map

| Concern | Location |
|---|---|
| Zod schemas | `src/lib/rag/schemas.ts` |
| LLM prompts | `src/lib/rag/prompts.ts` |
| Trigger tasks | `trigger/extract-page.ts`, `trigger/process-document.ts`, `trigger/generate-question.ts` |
| Worker API | `workers/dn88/src/rag/routes.ts` |
| Lab UI | `/rag` → `src/components/rag/RagLabView.tsx` |

## Processing flow

1. Upload PDF  
2. Validate PDF  
3. Render each page at high resolution  
4. Extract native PDF text and coordinates  
5. Detect raster images and vector regions  
6. Analyze the complete rendered page with a vision model  
7. Segment the page into semantic regions  
8. Detect zero, one, or many question candidates  
9. Group question stem, choices, answers, and images  
10. Classify supporting and unrelated content  
11. Search nearby pages for continuation or duplicate versions  
12. Build source question objects  
13. Reconcile typed text with screenshot text  
14. Determine completeness and answer status  
15. Crop all required question images  
16. Build normalized versions  
17. Create quiz-ready versions  
18. Generate alternatives only when required  
19. Validate every object using Zod  
20. Save all evidence and coordinates  
21. Present uncertain items for user review  
22. Allow approved questions to be added to a quiz  
23. Produce canonical JSON  
24. Produce RAG-ready JSON separately  

## Local Trigger.dev

```bash
# One-time browser login (required for CLI)
npx trigger.dev@latest login

# Dev worker (registers tasks; dashboard refreshes automatically)
npm run trigger:dev
```

Environment:

* `TRIGGER_SECRET_KEY` — Worker + local `.env.local` (never commit)
* `OPENROUTER_API_KEY` — set in Trigger.dev dashboard env for extraction tasks
* Project ref: `proj_urgydtjlxezekgtpcxst`
