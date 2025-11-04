# 🎓 Questly

**An AI-assisted study companion that transforms your learning materials into an interactive, gamified experience.**

Questly converts your uploaded slides and documents into an intelligent learning roadmap complete with checkpoints, embedded educational videos, and mini-quizzes. Your progress is automatically saved locally and can be synced with Supabase for production deployments.

---

## 🌟 Overview

Questly revolutionizes the way you study by creating a personalized, interactive learning journey:

- 📤 **Smart Upload** — Upload slides or PQP files to automatically generate ordered learning checkpoints
- 🎥 **Video Integration** — Each checkpoint includes a relevant YouTube video tailored to the topic
- 📝 **Mini-Quizzes** — Test your knowledge with short quizzes after each learning session
- 💾 **Progress Tracking** — Your progress persists locally, allowing you to exit and resume anytime
- 🏠 **Unified Dashboard** — Access everything from the root path (`/`) at `http://localhost:8081/`

---

## 🤖 AI Architecture

Questly employs a dual-AI system with clearly defined responsibilities:

### Gemma 3 — The User-Facing Assistant
**Role:** Final content preparation and user interaction

- Receives formatted inputs from Gemini
- Prepares and displays all user-facing responses
- Creates the polished messages shown in the UI
- Designated final assistant for all visible content

### Gemini — The Data Retriever
**Role:** Information gathering and structuring

- Retrieves information from web and uploaded files
- Structures raw data into organized formats
- Formats content specifically for Gemma 3 consumption
- Powers topic generation, video query refinement, and quiz creation
- **Never directly interfaces with users**

**Architecture Flow:** Gemini gathers → Gemini formats → Gemma 3 prepares → User sees final output

---

## 📁 Project Structure

### Core Pages
```
src/pages/
├── Index.tsx              # Root dashboard (default landing page)
├── UploadMaterials.tsx    # Material upload and processing interface
├── Roadmap.tsx            # Interactive skill tree with checkpoint navigation
└── Quiz.tsx               # Initial assessment interface
```

### Key Components
```
src/components/
└── LearningModal.tsx      # Video embedding and mini-quiz logic for each checkpoint
```

### Library Modules
```
src/lib/
├── localStore.ts          # Local persistence (studies, topics, quizzes, resume points)
├── gemini.ts              # Retrieval, formatting, YouTube search, checkpoint & quiz generation
├── ollama.ts              # Local LLM utilities (Gemma 3 integration placeholder)
└── supabase.ts            # Supabase client and data model stubs
```

---

## 🚀 Setup

### Prerequisites
- **Node.js** 18+ (recommended)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   
   Copy the example environment file and add your API keys:
   ```bash
   cp .env.example .env
   ```

3. **Environment Variables**

   Edit `.env` with the following configuration:

   #### Required Configuration
   ```bash
   # Gemini API (Required)
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   #### Optional Gemini Configuration
   ```bash
   VITE_GEMINI_MODEL=          # Override default Gemini model
   VITE_GEMINI_BASE_URL=       # Custom base URL or dev proxy (default: /gemini-api)
   ```

   #### Video Search (Choose One)
   ```bash
   # Option 1: YouTube Data API
   VITE_YOUTUBE_API_KEY=your_youtube_api_key_here

   # Option 2: Google Custom Search Engine
   VITE_GOOGLE_CSE_API_KEY=your_cse_api_key_here
   VITE_GOOGLE_CSE_CX=your_cse_id_here
   ```

   #### Optional Services
   ```bash
   # Supabase (for production persistence)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Local LLM via Ollama (for Gemma 3)
   VITE_OLLAMA_HOST=http://localhost:11434
   VITE_OLLAMA_MODEL=gemma3
   ```

---

## 🖥️ Running Locally

### Start Development Server
```bash
npm run dev
```

The server automatically selects an available port. Recent runs typically use:
```
http://localhost:8081/
```

**Default Landing:** Navigate to the root path (`/`) to access the main dashboard.

---

## 📖 User Guide

### Getting Started

1. **Create a Study Session**
   - Launch the app and navigate to the root dashboard
   - Click to start a new study session

2. **Upload Learning Materials**
   - Upload your slides or PQP files
   - The app automatically analyzes content and generates learning checkpoints

3. **Follow Your Learning Roadmap**
   - Open the Roadmap to view your personalized skill tree
   - Click any checkpoint to begin learning

4. **Learn and Progress**
   - Watch the embedded educational video for each topic
   - Complete the mini-quiz to test your understanding
   - Correct answers mark the topic as completed and save your progress

5. **Resume Anytime**
   - Your progress is automatically saved
   - Return to continue from your last checkpoint
   - Click "Exit to Dashboard" to return to the main menu (`/`)

---

## 💾 Persistence and Resume System

### How Progress is Saved

Questly implements a robust local persistence system to ensure your learning progress is never lost:

#### Local Storage
- **Videos & Quizzes:** Checkpoint videos and mini-quizzes persist in `localStorage` within each study's topics object
- **Progress Tracking:** Study progress and last accessed checkpoint are continuously tracked
- **Auto-Resume:** Automatic resumption from your last learning position

### Key Files & Functions

#### `src/lib/localStore.ts`
**Data Structures:**
- `LocalStudy` — Study session metadata and configuration
- `LocalTopic` — Individual topic details and completion status

**Core Functions:**
- `setTopicQuiz(studyId, topicTitle, items)` — Save quiz questions for a topic
- `getTopicQuiz(studyId, topicTitle)` — Retrieve cached quiz questions
- `last_checkpoint_title` — Tracks most recent checkpoint accessed
- `last_opened_at` — Timestamp of last study session

#### `src/components/LearningModal.tsx`
**Responsibilities:**
- Load previously cached quiz questions and video URLs
- Generate new content when no cache exists
- Save newly generated content for future access
- Handle quiz submission and validation

#### `src/pages/Roadmap.tsx`
**Features:**
- Auto-resume from last checkpoint on load
- Exit navigation returns to root dashboard (`/`)
- Visual progress indicators for completed topics

### Data Flow
```
User Completes Quiz → localStorage Updated → Resume Point Saved → Next Session Auto-Resumes
```

---

## 🗺️ Application Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Index | Default dashboard and main landing page |
| `/upload-materials` | UploadMaterials | Material upload and processing interface |
| `/roadmap` | Roadmap | Interactive skill tree view (accepts `?studyId` parameter) |
| `/quiz` | Quiz | Initial assessment interface (if enabled) |

### Deprecated Routes
- `/dashboard` — Retained in codebase for compatibility but not actively used
  - Navigation exits return to `/` instead

---

## 🛠️ Technical Stack

### Frontend
- **Framework:** React with Vite
- **UI Library:** shadcn/ui
- **Routing:** React Router

### AI & APIs
- **Gemini API** — Content retrieval and structuring
- **Gemma 3** — Final user-facing responses (via Ollama)
- **YouTube Data API** — Video search and embedding
- **Google Custom Search** — Alternative video search option

### Data Storage
- **Primary:** Browser localStorage
- **Optional:** Supabase for cloud sync

---

## 📄 License

This project is licensed under the MIT License - [LICENSE](LICENSE)

---

## ARCHITECTURE

Go to the [ARCHITECTURE.md](ARCHITECTURE.md) documentation for detailed technical information.

---

**Built with ❤️ for learners everywhere**
