# StudyBuddy RAG

An AI study assistant. Upload your course documents, then chat with an AI tutor that answers from them, and generate flashcards and quizzes from the same material.

It uses **RAG (Retrieval-Augmented Generation)**: documents are split into chunks, embedded with a local HuggingFace model, and stored in MongoDB Atlas Vector Search. When you ask a question, the most relevant chunks are retrieved and sent to an LLM (via OpenRouter) together with your question.

An interactive diagram of the pipeline is in [`docs/rag-flow.html`](docs/rag-flow.html). Open it in a browser.

## Features

- Sign up and log in with JWT auth (access and refresh tokens, `student` and `admin` roles)
- Upload and manage study documents (PDF, Markdown, text)
- An AI tutor chat that answers from your documents, with Markdown and LaTeX math rendering
- Flashcards generated from documents
- Quizzes: generate, take, and review them
- Light and dark themes

## Tech stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui (Radix), React Router 7, React Hook Form + Zod, Axios |
| Backend   | FastAPI, LangChain, sentence-transformers (`all-MiniLM-L6-v2`), PyJWT, bcrypt |
| Data      | MongoDB Atlas Vector Search (cloud, or local via Docker), Redis (cache) |
| LLM       | OpenRouter (any chat model; the default is set in `.env`) |

## Repository layout

```
StuddyBuddyRAG/
├── src/                  # React frontend
│   ├── pages/            # Dashboard, Documents, ChatAgent, Flashcard, MyQuizzes, QuizTake, ...
│   ├── components/       # Layouts, sidebar, theme, shadcn/ui components
│   ├── services/         # Axios API clients (instance.ts handles tokens and refresh)
│   └── schemas/, types/, lib/, hooks/
├── docs/rag-flow.html    # RAG pipeline diagram
├── start.sh              # Runs the backend and frontend together
└── nerd-RAG-backend/     # FastAPI backend (separate git repo, cloned into this folder)
```

> The backend has its own repository: <https://github.com/faster24/nerd-RAG-backend>. This repo's `.gitignore` excludes it, so you clone it into this folder yourself (step 1).

---

## Installation

### Prerequisites

| Tool | Version | Used for |
|------|---------|----------|
| Git | any | Cloning the repos |
| Node.js | 20.19+ or 22.12+ (required by Vite 7) | Frontend |
| Python | 3.10+ | Backend |
| Docker | any recent version | Local MongoDB and Redis (recommended) |
| OpenRouter API key | — | LLM answers. Get one at <https://openrouter.ai/keys> |

The first backend start downloads the embedding model (about 90 MB), so you need internet access the first time.

### 1. Clone both repositories

```bash
git clone https://github.com/faster24/StudyBuddyRAG.git StuddyBuddyRAG
cd StuddyBuddyRAG
git clone https://github.com/faster24/nerd-RAG-backend.git nerd-RAG-backend
```

The folder name must be exactly `nerd-RAG-backend`, because `start.sh` looks for it.

### 2. Start MongoDB (with Vector Search)

Pick one option.

**Option A: local MongoDB in Docker (recommended for development)**

The `mongodb-atlas-local` image includes Atlas Vector Search, which plain `mongo` images don't have.

```bash
docker run -d --name studybuddy-mongo \
  -p 127.0.0.1:27018:27017 \
  mongodb/mongodb-atlas-local:8.0
```

Connection string: `mongodb://localhost:27018/?directConnection=true`

`start.sh` starts this container automatically on later runs, as long as it is named `studybuddy-mongo`. To use a different name, set the `MONGO_CONTAINER` environment variable.

**Option B: MongoDB Atlas (cloud)**

Create a free cluster at <https://www.mongodb.com/atlas>, add a database user, allow your IP address, and copy the `mongodb+srv://...` connection string.

You don't need to create the vector search index by hand in either case. The backend creates or updates it on startup.

### 3. Start Redis

```bash
docker run -d --name studybuddy-redis -p 6379:6379 redis:7-alpine
```

Later runs only need `docker start studybuddy-redis`.

### 4. Configure the backend

```bash
cd nerd-RAG-backend
cp .env.example .env
```

Edit `nerd-RAG-backend/.env`. These are the values you must set:

| Variable | Value |
|----------|-------|
| `JWT_SECRET_KEY` | Output of `python3 -c "import secrets; print(secrets.token_urlsafe(64))"`. The backend won't start without it. |
| `MONGODB_URI` | The connection string from step 2 |
| `OPENROUTER_API_KEY` | Your OpenRouter key |
| `OPENROUTER_MODEL` | Optional. Any OpenRouter model id. |
| `ALLOWED_ORIGINS_STR` | Must include `http://localhost:5173` (the default already does) |

Install the dependencies:

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 5. Configure the frontend

```bash
cp .env-example .env
```

Set `.env` (in the project root) to:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_PREFIX=/api/v1
```

- In development, Vite proxies `VITE_API_PREFIX` to the origin in `VITE_API_BASE_URL`, so you won't get CORS errors.
- In a production build, requests go to `VITE_API_BASE_URL + VITE_API_PREFIX`.

Install the dependencies:

```bash
npm install
```

### 6. Run the app

**Everything at once** (Linux and macOS):

```bash
./start.sh            # add --install to force reinstalling dependencies
```

This starts the MongoDB container, the backend on <http://localhost:8000>, and the frontend on <http://localhost:5173>. Output lines are prefixed `[backend]` or `[frontend]`. Ctrl+C stops both.

**Or in two terminals:**

```bash
# Terminal 1: backend
cd nerd-RAG-backend && source venv/bin/activate && python manage.py

# Terminal 2: frontend
npm run dev
```

### 7. First use

1. Open <http://localhost:5173>. Vite opens `/login` automatically.
2. Register an account. New accounts get the `student` role.
3. Optional: create an admin account:
   ```bash
   cd nerd-RAG-backend && source venv/bin/activate
   python scripts/create_admin.py admin@example.com 'StrongPassword123' --name "Admin"
   ```
4. Upload a document on the **Documents** page, wait until its status shows it's ready, then use **Chat**, **Flashcards**, or **Quizzes**.

The API docs (Swagger) are at <http://localhost:8000/docs>.

---

## Scripts

Frontend (project root):

| Command | Does |
|---------|------|
| `npm run dev` | Dev server with hot reload (port 5173) |
| `npm run build` | Type-checks, then builds to `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run lint` | Runs ESLint |

Backend (`nerd-RAG-backend/`, with the venv active):

| Command | Does |
|---------|------|
| `python manage.py` | Runs the API (port 8000) |
| `pytest` | Runs the tests |
| `docker-compose up --build` | Runs the API and Redis in Docker. MongoDB still comes from `MONGODB_URI`. |
| `python scripts/create_admin.py ...` | Creates an admin user |
| `python scripts/rechunk_documents.py` | Re-chunks stored documents |
| `python scripts/re_embed_questions.py` | Re-embeds quiz questions |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `start.sh` prints `nerd-RAG-backend/.env not found` | Do step 4 |
| The backend exits saying `JWT_SECRET_KEY` is missing | Set it in `nerd-RAG-backend/.env` |
| `Warning: MongoDB container 'studybuddy-mongo' not found` | Do step 2A, or ignore it if you use Atlas |
| Chat returns nothing, or "index not found" errors | Plain MongoDB has no vector search. Use `mongodb-atlas-local` or Atlas. |
| Every API call fails with 404 | Check that `VITE_API_PREFIX=/api/v1` is set in the root `.env`, then restart `npm run dev` |
| CORS errors | Add the frontend URL to `ALLOWED_ORIGINS_STR` |
| Redis connection refused | `docker start studybuddy-redis` |
| Password reset email never arrives | Email isn't implemented yet. The reset code is written to the backend log. |
