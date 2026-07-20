# MedGenius AI Backend

Cloudflare Worker API for document processing, AI tutoring, and credit-enforced study features.

## Architecture

```
Upload → R2 (original) → Queue
              ↓
         Context.dev (parse bytes → Markdown only)
              ↓
         Page-aware Markdown (`<!-- PAGE:n -->` markers)
              ↓
         Document classifier (per chunk)
              ↓
         Question-boundary chunker
              ↓
         OpenRouter LLM (extract or generate, json_schema)
              ↓
         Validation + deduplication
              ↓
         D1 (structured questions) + Quiz UI
```

Context.dev converts PDFs and Office files to Markdown. OpenRouter classifies chunks and extracts or generates structured MCQs. The two stages are separate by design.

Upload form fields (optional):

| Field | Values | Default |
|-------|--------|---------|
| `processingMode` | `auto`, `extract`, `generate`, `extract_and_generate` | `auto` |
| `qualityMode` | `fast`, `balanced`, `maximum` | `balanced` |
| `incompletePolicy` | `keep_for_review`, `exclude` | `keep_for_review` |

- **fast**: single Context.dev parse
- **balanced** / **maximum**: PDFs parsed in 8-page batches with page markers

All AI and parsing runs **once per document**. Subsequent reads come from D1/R2 only.

## Credit System

Every user has a credit balance enforced on **every** paid operation. Credits never go negative.

| Plan | Monthly credits | Documents | Pages | Daily AI tokens |
|------|----------------|-----------|-------|-----------------|
| free | 500 | 3 | 50 | 8,000 |
| starter | 1,000 | 5 | 100 | 15,000 |
| student | 50,000 | 100 | 5,000 | 100,000 |
| pro | 200,000 | 10,000 | 100,000 | 500,000 |

Plan is read from Clerk `publicMetadata.plan` or `publicMetadata.subscription`.

## Environment Variables (Worker secrets)

```bash
OPENROUTER_API_KEY=       # AI tutor, question extraction, search
CONTEXT_DEV_API_KEY=      # Document parsing (PDF, OCR, Office)
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
```

## API Endpoints

Base path: `/api/medgenius` (requires Clerk Bearer token)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/credits` | Credit balance and plan limits |
| GET | `/documents` | List uploaded documents |
| GET | `/documents/:id` | Document processing status |
| GET | `/documents/:id/markdown` | Processed markdown content |
| POST | `/documents/upload` | Upload file (multipart: file, name, examId, processingMode, qualityMode, incompletePolicy) |
| GET | `/questions` | List extracted questions |
| GET | `/questions/:id` | Single question with images |
| GET | `/search?q=` | Semantic question search |
| POST | `/ai/chat` | AI tutor conversation |
| GET | `/flashcards` | Generated flashcards |
| POST | `/sessions` | Start study session |
| POST | `/sessions/:id/attempts` | Record answer attempt |
| POST | `/bookmarks` | Bookmark a question |
| GET | `/analytics` | Study analytics |

## Setup

```bash
# Create R2 bucket (once)
npx wrangler r2 bucket create dn88-user-content -c workers/dn88/wrangler.jsonc

# Create queue (once)
npx wrangler queues create medgenius-processing

# Run D1 migration
npm run medgenius:migrate
npx wrangler d1 execute dn88-catalog --file=migrations/d1/003_medgenius_processing_options.sql -c workers/dn88/wrangler.jsonc --remote

# Set secrets
npx wrangler secret put OPENROUTER_API_KEY -c workers/dn88/wrangler.jsonc
npx wrangler secret put CONTEXT_DEV_API_KEY -c workers/dn88/wrangler.jsonc

# Deploy
npm run worker:deploy
```

## Frontend Integration

```typescript
import { fetchCredits, uploadDocument, sendAiChat } from "@/lib/medgenius/api";
import { askMedGeniusAi } from "@/lib/medgenius/chat";
import { useMedGeniusCredits } from "@/lib/medgenius/hooks";
```

UI components wired to the backend:
- `DrNoteHome` — upload + Ask AI chat
- `QuestionChatPanel` — question tutor
- `ArticleAskBar` — article tutor

## Processing Pipeline

1. **parse** — Context.dev → markdown in R2 (credits: 10/page)
2. **extract_questions** — OpenRouter → D1 questions (credits: 3/question)
3. **detect_duplicates** — Group by topic (credits: 15)
4. **generate_flashcards** — Top 20 questions → flashcards (credits: 20 each)

Duplicate file uploads (same SHA-256) return existing document without reprocessing.
