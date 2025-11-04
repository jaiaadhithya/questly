# Questly

Questly is an AI-assisted study companion that turns your uploaded materials into an interactive learning roadmap with checkpoints, embedded videos, and mini-quizzes. Progress is saved locally and can be synced with Supabase in production deployments.

## Overview

- Upload slides or PQP files to generate ordered learning checkpoints.
- Each checkpoint embeds a relevant YouTube video and provides a short mini-quiz.
- Progress persists locally, so you can exit and resume from the last checkpoint.
- The default dashboard is the root path (`/`) at `http://localhost:8081/`.

## AI Responsibilities

- `Gemma 3` is the final AI that prepares and displays user-facing responses. It receives formatted inputs and produces the final messages shown to the user.
- `Gemini` is used only for information gathering from the web and files. Gemini retrieves and structures raw information, formats it for Gemma 3, and hands it off. Gemma 3 then prepares the final output for the UI.

In the current codebase, Gemini powers topic generation, video query refinement, and mini-quiz creation. Gemma 3 is the designated final assistant for user-visible responses; the UI is architected to consume outputs that are prepared for Gemma 3.

## Project Structure

- `src/pages/Index.tsx` — Root dashboard page (default landing).
- `src/pages/UploadMaterials.tsx` — Upload and processing flow.
- `src/pages/Roadmap.tsx` — Interactive skill tree with checkpoints and resume flow.
- `src/components/LearningModal.tsx` — Video embed and mini-quiz logic per checkpoint.
- `src/lib/localStore.ts` — Local persistence for studies, topics, quizzes, and resume point.
- `src/lib/gemini.ts` — Retrieval, formatting, YouTube search, checkpoints, and quiz generation.
- `src/lib/ollama.ts` — Local LLM utilities (placeholder for Gemma 3 integration and local processing).
- `src/lib/supabase.ts` — Supabase client and data model stubs.

## Setup

1. Node 18+ recommended.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in keys:
   - `VITE_GEMINI_API_KEY` — Gemini API key for retrieval and formatting.
   - `VITE_GEMINI_MODEL` — Optional override for Gemini model.
   - `VITE_GEMINI_BASE_URL` — Optional base URL or dev proxy (default `/gemini-api` locally).
   - `VITE_YOUTUBE_API_KEY` — YouTube Data API key OR `VITE_GOOGLE_CSE_API_KEY` + `VITE_GOOGLE_CSE_CX`.
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase credentials (optional for dev/stubs).
   - `VITE_OLLAMA_HOST`, `VITE_OLLAMA_MODEL` — Optional local LLM host/model for Gemma 3 via Ollama.

## Running Locally

- Start the dev server: `npm run dev`
- The server selects an available port automatically. Recent runs show `http://localhost:8081/`.
- Navigate to root `/` to see the default dashboard.

## Usage

- Start a new study from the root dashboard.
- Upload materials (slides/PQP). The app derives checkpoints and topics.
- Open the Roadmap to follow the skill tree. Click a checkpoint to see the embedded video and take the mini-quiz.
- On correct quiz submission, the topic is marked completed and your resume point is saved.
- Click “Exit to Dashboard” on the Roadmap to return to `/`.

## Persistence and Resume

- Checkpoint videos and mini-quizzes persist in `localStorage` under the study’s topics object.
- Study progress and the last opened checkpoint are tracked, enabling auto-resume.
- Files involved:
  - `src/lib/localStore.ts` — `LocalStudy`, `LocalTopic`, `setTopicQuiz`, `getTopicQuiz`, `last_checkpoint_title`, `last_opened_at`.
  - `src/components/LearningModal.tsx` — Loads persisted quiz/video or generates and saves new ones.
  - `src/pages/Roadmap.tsx` — Auto-resumes the last checkpoint and exits to root.

## Routes

- `/` — Default dashboard (Index).
- `/upload-materials` — Upload flow for materials.
- `/roadmap` — Skill tree view; accepts `?studyId`.
- `/quiz` — Initial assessment (if enabled).
- Deprecated: `/dashboard` — retained in code but not used for navigation (exit returns to `/`).

## Scripts

- `npm run dev` — Start dev server.
- `npm run build` — Production build.
- `npm run preview` — Preview the build.

## Notes for GitHub

- This repository is ready for GitHub: comprehensive README, architecture documentation, and environment configuration via `.env`.
- CI/CD and issue templates can be added on request.
