"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Document, listDocuments, deleteDocument } from "@/lib/api"

interface Props {
  selectedDocId: string | null
  onSelect: (id: string) => void
  refreshKey: number
}

export default function DocumentList({ selectedDocId, onSelect, refreshKey }: Props) {
  const { data: session } = useSession()
  const [docs, setDocs] = useState<Document[]>([])

  const fetchDocs = async () => {
    if (!session?.accessToken) return
    try {
      const result = await listDocuments(session.accessToken)
      setDocs(result)
    } catch (err) {
      console.error("Failed to list documents:", err)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [session, refreshKey])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!session?.accessToken) return
    try {
      await deleteDocument(id, session.accessToken)
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ready: "bg-success-dim text-success border-success/20",
      processing: "bg-warning-dim text-warning border-warning/20",
      failed: "bg-danger-dim text-danger border-danger/20",
    }
    const labels: Record<string, string> = {
      ready: "Ready",
      processing: "Processing",
      failed: "Failed",
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${variants[status] || "bg-border text-fg-subtle"}`}
      >
        {labels[status] || status}
      </span>
    )
  }

  if (docs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-fg-subtle py-8">
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-sm">No documents yet</p>
        <p className="text-xs mt-1">Drop a PDF to get started</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2" role="list" aria-label="Documents">
      {docs.map((doc) => (
        <li
          key={doc.id}
          className={`group relative p-3 rounded-lg border transition-all duration-150 ${
            selectedDocId === doc.id
              ? "bg-accent-dim border-accent/30"
              : "bg-card-hover hover:bg-bg-hover border-border"
          }`}
          onClick={() => onSelect(doc.id)}
          aria-selected={selectedDocId === doc.id}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fg truncate">{doc.filename}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {statusBadge(doc.status)}
                <span className="text-xs text-fg-subtle">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
                {doc.page_count && (
                  <span className="text-xs text-fg-subtle">
                    {doc.page_count} page{doc.page_count > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(e, doc.id)}
              className="p-1.5 rounded-lg text-fg-subtle hover:text-danger hover:bg-danger-dim opacity-0 group-hover:opacity-100 transition-all duration-150"
              aria-label={`Delete ${doc.filename}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v10m-5 0a2 2 0 012-2h10a2 2 0 012 2" />
              </svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}