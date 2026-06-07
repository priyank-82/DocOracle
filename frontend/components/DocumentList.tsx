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

  const handleDelete = async (id: string) => {
    if (!session?.accessToken) return
    try {
      await deleteDocument(id, session.accessToken)
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ready: "bg-green-100 text-green-800",
      processing: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    }
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || "bg-gray-100"}`}
      >
        {status}
      </span>
    )
  }

  return (
    <ul className="space-y-2">
      {docs.map((doc) => (
        <li
          key={doc.id}
          className={`p-3 rounded-lg cursor-pointer border transition ${
            selectedDocId === doc.id
              ? "border-blue-500 bg-blue-50"
              : "border-transparent hover:bg-gray-50"
          }`}
          onClick={() => onSelect(doc.id)}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium truncate">{doc.filename}</p>
            {statusBadge(doc.status)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">
              {new Date(doc.created_at).toLocaleDateString()}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(doc.id)
              }}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
