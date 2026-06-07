"use client"

import { useState } from "react"
import { useSession, signIn } from "next-auth/react"
import DocumentList from "@/components/DocumentList"
import FileUpload from "@/components/FileUpload"
import ChatInterface from "@/components/ChatInterface"
import CitationPanel from "@/components/CitationPanel"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [citationChunk, setCitationChunk] = useState<{
    content: string
    page: number
  } | null>(null)
  const [docListKey, setDocListKey] = useState(0)

  const handleUploadComplete = () => {
    setDocListKey((k) => k + 1)
  }

  if (!session) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="text-3xl font-bold mb-4">Sign in to continue</h1>
        <p className="text-gray-600 mb-8">You need to sign in with Google to use DocOracle.</p>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
      </main>
    )
  }

  return (
    <div className="flex h-screen">
      <aside className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Documents</h2>
        </div>
        <div className="p-4">
          <FileUpload onUploadComplete={handleUploadComplete} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <DocumentList
            selectedDocId={selectedDocId}
            onSelect={setSelectedDocId}
            refreshKey={docListKey}
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {selectedDocId ? (
          <ChatInterface
            documentId={selectedDocId}
            onCite={(chunk) => setCitationChunk(chunk)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a document to start chatting
          </div>
        )}
      </main>

      {citationChunk && (
        <CitationPanel
          chunk={citationChunk}
          onClose={() => setCitationChunk(null)}
        />
      )}
    </div>
  )
}
