# DocOracle

Production-grade RAG (Retrieval-Augmented Generation) platform for document intelligence. Upload PDFs, ask natural language questions, and get cited AI-powered answers — all in a secure, multi-user dark-themed interface.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│  Next.js +   │     │   FastAPI    │     │  + pgvector  │
│   Vercel     │     │  EC2/Docker  │     │   RDS        │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐     ┌──────────────┐
                     │  AWS Lambda  │────▶│      S3      │
                     │ PDF Processor│     │  Documents   │
                     └──────────────┘     └──────────────┘
```

## Features

- **PDF Upload & Processing** — Drag-and-drop upload with real-time progress. AWS Lambda extracts text via pypdf, chunks content, and generates embeddings with fastembed.
- **Semantic Search** — pgvector-powered similarity search on document embeddings for precise context retrieval.
- **AI-Powered Q&A** — Groq LLM (Llama 3.3 70B) generates cited answers with page-level excerpt references.
- **Citation Panel** — Click any excerpt to view the exact source text and page number.
- **Multi-User Auth** — Google OAuth via NextAuth with JWT ID token verification on the backend.
- **Dark Theme UI** — Minimalist design with real-time processing status polling.
- **Infrastructure as Code** — 39 Terraform-managed AWS resources (VPC, EC2, RDS, Lambda, S3, ECR, IAM).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, NextAuth |
| Backend | FastAPI, Python 3.11, SQLAlchemy |
| Database | PostgreSQL 15 + pgvector |
| Embeddings | fastembed (sentence-transformers/all-MiniLM-L6-v2) |
| LLM | Groq API (Llama 3.3 70B Versatile) |
| PDF Processing | pypdf, AWS Lambda |
| Infrastructure | AWS (EC2, RDS, S3, Lambda, ECR), Terraform |
| Deployment | Docker, ECR, Vercel |

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker
- AWS CLI configured
- Groq API key

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Environment Variables:**
Copy `.env.example` to `.env` and fill in:
```env
GROQ_API_KEY=your_groq_key
DATABASE_URL=postgresql://user:pass@host:5432/docdb
S3_BUCKET_NAME=your_bucket
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_secret
```

### Docker Deployment

```bash
docker build -t docoracle-backend ./backend
docker run -p 8000:8000 --env-file .env docoracle-backend
```

### Infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Project Structure

```
DocOracle/
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── routers/
│   │   ├── auth.py          # Google OAuth verification
│   │   ├── documents.py     # Upload, list, delete
│   │   └── chat.py          # Query, history
│   ├── services/
│   │   ├── embedding_service.py
│   │   ├── retrieval_service.py
│   │   ├── groq_service.py
│   │   ├── s3_service.py
│   │   └── lambda_service.py
│   ├── models/
│   │   ├── database.py      # SQLAlchemy models
│   │   └── schemas.py       # Pydantic schemas
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Landing page
│   │   ├── dashboard/       # Main dashboard
│   │   └── api/auth/        # NextAuth routes
│   ├── components/
│   │   ├── ChatInterface.tsx
│   │   ├── CitationPanel.tsx
│   │   ├── DocumentList.tsx
│   │   ├── FileUpload.tsx
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   └── auth.ts          # NextAuth config
│   └── next.config.js       # Vercel rewrites
├── lambda/
│   ├── handler.py           # PDF processor entry
│   ├── chunker.py           # Text chunking
│   ├── embedder.py          # Embedding generation
│   └── db.py                # pgvector storage
└── terraform/               # 39 AWS resources
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload PDF |
| GET | `/api/documents` | List documents |
| GET | `/api/documents/{id}/status` | Get status |
| DELETE | `/api/documents/{id}` | Delete document |
| POST | `/api/chat/query` | Ask a question |
| GET | `/api/chat/history/{doc_id}` | Chat history |

## License

MIT
