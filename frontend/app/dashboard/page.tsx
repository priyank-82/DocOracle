"use client"

import { useState } from "react"
import { useSession, signIn } from "next-auth/react"
import DocumentList from "@/components/DocumentList"
import FileUpload from "@/components/FileUpload"
import ChatInterface from "@/components/ChatInterface"
import CitationPanel from "@/components/CitationPanel"
import Navbar from "@/components/Navbar"

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
      <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-bg">
        <h1 className="text-3xl font-bold mb-4 text-fg">Sign in to continue</h1>
        <p className="text-fg-muted mb-8">You need to sign in with Google to use DocOracle.</p>
        <button
          onClick={() => signIn("google")}
          className="bg-accent text-fg-inverted px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-all"
        >
          Sign in with Google
        </button>
      </main>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      <Navbar />
      <div className="flex-1 flex">
        <aside className="w-80 border-r border-border bg-bg flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-lg text-fg">Documents</h2>
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
          <div className="flex-1 flex items-center justify-center text-fg-subtle">
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
    </div>
  )
}