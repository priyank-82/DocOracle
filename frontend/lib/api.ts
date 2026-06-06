const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
  return res.json()
}

export interface Document {
  id: string
  filename: string
  status: "processing" | "ready" | "failed"
  page_count: number | null
  created_at: string
}

export interface QueryResponse {
  answer: string
  citations: { chunk_id: string; content: string; page_number: number }[]
}

export async function uploadDocument(
  file: File,
  token: string,
  onProgress?: (pct: number) => void
): Promise<Document> {
  const form = new FormData()
  form.append("file", file)

  const xhr = new XMLHttpRequest()
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(xhr.responseText))
      }
    })
    xhr.addEventListener("error", () => reject(new Error("Upload failed")))
    xhr.open("POST", `${API_BASE}/api/documents/upload`)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.send(form)
  })
}

export async function listDocuments(token: string): Promise<Document[]> {
  return fetchAPI("/api/documents", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getDocumentStatus(
  id: string,
  token: string
): Promise<Document> {
  return fetchAPI(`/api/documents/${id}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function deleteDocument(
  id: string,
  token: string
): Promise<void> {
  await fetchAPI(`/api/documents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function queryDocument(
  documentId: string,
  question: string,
  token: string
): Promise<QueryResponse> {
  return fetchAPI("/api/chat/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ document_id: documentId, question }),
  })
}

export async function getChatHistory(
  docId: string,
  token: string
): Promise<{ role: string; content: string }[]> {
  return fetchAPI(`/api/chat/history/${docId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
