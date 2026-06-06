"use client"

import { useState } from "react"
import DocumentList from "@/components/DocumentList"
import FileUpload from "@/components/FileUpload"
import ChatInterface from "@/components/ChatInterface"
import CitationPanel from "@/components/CitationPanel"

export default function DashboardPage() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [citationChunk, setCitationChunk] = useState<{
    content: string
    page: number
  } | null>(null)

  return (
    <div className="flex h-screen">
      <aside className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Documents</h2>
        </div>
        <div className="p-4">
          <FileUpload />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <DocumentList
            selectedDocId={selectedDocId}
            onSelect={setSelectedDocId}
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
