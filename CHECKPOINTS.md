# AI Document Intelligence Platform — Checkpoint Tracker

## Status Legend
✅ Done | 📝 Pending | ⚠️ Blocked | 🔄 In Progress

## Token Tracking
| Session | Start % | End % | Used | Work Done |
|---------|---------|-------|------|-----------|
| 1       | 100%    | 29%   | 71%  | Full scaffold + Terraform deploy + Backend live on EC2 |
| 2       | 100%    | ~12%  | ~88% | Lambda end-to-end ✅, auth fix ✅, fastembed ✅, page_count ✅ |


---

## CP0 — Project Scaffolding & Foundation
**Status: ✅ Complete**

### Tasks
- [✅] Create CHECKPOINTS.md tracker
- [✅] Scaffold full directory tree
- [✅] Frontend skeleton (Next.js 14 + Tailwind + all components)
- [✅] Backend skeleton (FastAPI + all routers/services/models)
- [✅] Lambda skeleton (handler + chunker + embedder + db)
- [✅] Terraform skeleton (all .tf files written)
- [✅] .gitignore
- [✅] GitHub Actions deploy.yml

### Problems/Notes
- Backend imports fixed to be Docker-compatible (no `backend.` prefix)
- Lambda UUID extraction logic fixed for S3 key format
- `get_db` session factory added to `models/database.py`
- Lambda Dockerfile created (ECR-based deployment)
- Switched from PyMuPDF to pypdf for Lambda (pure Python, no C compilation needed)

---

## CP1 — Infrastructure as Code (Terraform)
**Status: ✅ Deployed (39 resources)**

### Tasks
- [✅] main.tf (providers, S3 backend)
- [✅] variables.tf
- [✅] outputs.tf
- [✅] vpc.tf (VPC + subnets + NAT gateway)
- [✅] s3.tf (bucket + versioning + S3 → Lambda notification)
- [✅] rds.tf (PostgreSQL 15 + pgvector + security groups)
- [✅] ec2.tf (t4g.micro arm64 + security group + elastic IP)
- [✅] lambda.tf (function + SG + S3 invoke permission) — restored & deployed
- [✅] ecr.tf (backend + Lambda container repos)
- [✅] iam.tf (Lambda execution + EC2 instance roles)

### Live Resources
- **EC2**: `13.223.146.103` (t4g.micro, arm64, Ubuntu 22.04)
- **RDS**: `docoracle-pgvector.c8j64e0we4a7.us-east-1.rds.amazonaws.com:5432` (pgvector 0.8.1, datatabase: `docdb`)
- **S3**: `docoracle-documents-e4f2d18a`
- **ECR backend**: `372806410415.dkr.ecr.us-east-1.amazonaws.com/docoracle-backend`
- **ECR lambda**: `372806410415.dkr.ecr.us-east-1.amazonaws.com/docoracle-lambda`
- **Lambda**: `docoracle-pdf-processor` (arm64, 1024MB, 5min timeout)

### Problems/Notes
- `terraform apply -auto-approve` ran successfully (39 resources)
- AMI changed from x86_64 to arm64 (t4g.micro) due to no x86_64 Ubuntu 22.04 AMIs in us-east-1
- Lambda needs `architectures = ["arm64"]` because image is built for arm64/Graviton
- Legacy Docker builder (`DOCKER_BUILDKIT=0`) required — OCI manifest format not supported by Lambda
- Database is `docdb` (not `docoracle`) — had to fix DATABASE_URL across all services
- `documents` table has `s3_key` NOT NULL column — crucial for INSERT queries
- HuggingFace cache env vars (`TRANSFORMERS_CACHE`, `HF_HOME`, etc.) must point to `/tmp` on Lambda

---

## CP2 — Lambda PDF Processing Pipeline
**Status: ✅ Live — End-to-end tested**

### Tasks
- [✅] handler.py (S3 event → orchestration)
- [✅] chunker.py (pypdf text extraction + chunking)
- [✅] embedder.py (sentence-transformers all-MiniLM-L6-v2)
- [✅] db.py (psycopg2 + pgvector insert/update + ensure_document)
- [✅] Dockerfile + requirements.txt
- [✅] Build & push Lambda container to ECR
- [✅] Upload sample PDF to S3, verify processing in RDS

### Test Results
- **PDF**: 1.2KB, single page with text
- **Processing time**: ~3s runtime + ~9s init (cold start)
- **Memory**: 784MB max used
- **Output**: 1 chunk created, document status = `ready`

### Known Issues
- Only 1 chunk for small PDF — fine; larger PDFs will generate more
- Cold start ~10s (sentence-transformers loading) — manageable since processing is async
- Lambda env var `DATABASE_URL` hardcoded in terraform — should use a secret
- S3 key format must be `{user_id}/{document_uuid}_{suffix}.pdf` for UUID extraction
- `documents.user_id` FK references `users` table — Lambda can't set it without user existing; backend sets it during proper upload flow

---

## CP3 — FastAPI Backend
**Status: ✅ Deployed & Live**

### Tasks
- [✅] main.py + CORS middleware
- [✅] routers/documents.py (upload, list, status, delete)
- [✅] routers/chat.py (query with citations)
- [✅] routers/auth.py (JWT verification stub)
- [✅] services/s3_service.py
- [✅] services/embedding_service.py
- [✅] services/retrieval_service.py (pgvector similarity)
- [✅] services/groq_service.py (prompt template + LLM call)
- [✅] models/database.py (SQLAlchemy models + session)
- [✅] models/schemas.py (Pydantic schemas)
- [✅] Dockerfile + requirements.txt
- [✅] .env.example
- [ ] Fix JWT auth integration with NextAuth tokens
- [✅] Test locally with `uvicorn main:app --reload`
- [✅] Build Docker image and push to ECR
- [✅] Deploy to EC2
- [✅] Health check passes

### Live
- **URL**: `http://13.223.146.103/api/health` → `{"status":"ok"}`

### Problems/Notes
- `get_current_user()` now verifies Google access_token via Google's tokeninfo API — dev mode returns static UUID when no Bearer token
- Backend switched from sentence-transformers to `fastembed` (no PyTorch dependency, ~100MB lighter)
- `DATABASE_URL` originally pointed to `/docoracle` database — fixed to `/docdb`
- `requests` added to requirements (for Google token verification)
- `python-jose` removed (no longer needed)
- Health endpoint works; `/api/documents` returns empty because no user_id match (expected in dev mode)

---

## CP4 — Next.js Frontend
**Status: ✅ Code complete — 📝 Needs dependencies & deployment**

### Tasks
- [✅] Landing page (/)
- [✅] Dashboard layout + sidebar
- [✅] DocumentList component (list, select, delete)
- [✅] FileUpload component (dropzone, progress, polling)
- [✅] ChatInterface component (messages, citations, typing indicator)
- [✅] CitationPanel component (slide-in excerpt viewer)
- [✅] NextAuth config (Google provider)
- [✅] API client library (all endpoints)
- [ ] Run `npm install` to install dependencies
- [ ] Set up `.env.local` with Google OAuth credentials
- [ ] Deploy to Vercel

### Problems/Notes
- ✅ `npm install` ran successfully (485 packages)
- ✅ `next build` passes clean (types + compilation)
- `SessionProvider` client wrapper fix applied (Provider.tsx)
- Needs Google OAuth credentials to complete auth setup

---

## CP5 — CI/CD + Polish
**Status: 📝 Pending**

### Tasks
- [✅] GitHub Actions deploy.yml
- [ ] Set up GitHub secrets (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.)
- [ ] Error/loading/empty states refinement
- [ ] CloudWatch logging configuration
- [ ] README with architecture diagram
- [ ] Demo video (optional)

### Problems/Notes
- deploy.yml assumes ECR repo URL is in secrets — update to reference Terraform outputs
- Health check URL needs EC2 public IP from Terraform output

---

## Next Session — Where to Start

### Priority 1: Frontend Deployment
1. **Get Google OAuth credentials** from [console.cloud.google.com](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID (Web application)
   - Add `http://localhost:3000` + Vercel URL as authorized redirect URIs
2. Create `frontend/.env.local`:
   ```
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://13.223.146.103
   ```
3. `cd frontend && npm install && npx next build` (already tested — clean build)
4. Deploy to Vercel or test locally with `npm run dev`

### Priority 2: Test Backend End-to-End
- Upload a document via the real flow: frontend upload → backend creates doc + S3 key → Lambda processes
- Test `/api/chat/query` with a real question about a processed document
- Verify citations and answers work with Groq

### Priority 3: CI/CD
- Populate GitHub secrets for GitHub Actions deploy
- Add `DATABASE_URL=postgresql://docadmin:...@...us-east-1.rds.amazonaws.com:5432/docdb` to secrets
- Add `NEXTAUTH_SECRET`, `GROQ_API_KEY`, `S3_BUCKET_NAME`, `ALLOWED_ORIGINS` to secrets

### Priority 4: Polish
- Add error handling for missing Bearer token in auth.py (handled via `auto_error=False`)
- Test with real Google auth token end-to-end
- Remove abandoned documents from DB where Lambda failed (v10-v12)
