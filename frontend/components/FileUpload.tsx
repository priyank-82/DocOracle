"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { useSession } from "next-auth/react"
import { uploadDocument } from "@/lib/api"

interface FileUploadProps {
  onUploadComplete?: () => void
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const { data: session } = useSession()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [docId, setDocId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (!file || !session?.accessToken) return

      if (file.type !== "application/pdf") {
        setError("File must be a PDF")
        return
      }

      setUploading(true)
      setProgress(0)
      setError(null)
      try {
        const doc = await uploadDocument(file, session.accessToken, setProgress)
        setDocId(doc.id)
        onUploadComplete?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [session, onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
        isDragActive
          ? "border-accent bg-accent-dim"
          : uploading
          ? "border-border-hover bg-bg-elevated"
          : "border-border hover:border-border-hover bg-card-hover"
      } ${uploading ? "pointer-events-none opacity-80" : ""}`}
    >
      <input {...getInputProps()} />
      {error && (
        <div className="absolute -top-8 left-0 right-0 text-center">
          <span className="inline-block px-3 py-1.5 bg-danger-dim text-danger text-xs rounded-full animate-fade-in">
            {error}
          </span>
        </div>
      )}
      {uploading ? (
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">
            {docId ? "Processing document…" : `Uploading… ${progress}%`}
          </p>
          {!docId && (
            <div className="w-full bg-bg-elevated rounded-full h-2 overflow-hidden">
              <div
                className="bg-accent h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <svg
            className="mx-auto w-10 h-10 text-fg-subtle"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-fg-muted">
            {isDragActive ? "Drop PDF here" : "Drag & drop a PDF, or click to select"}
          </p>
          <p className="text-xs text-fg-subtle">Max 1 file · PDF only</p>
        </div>
      )}
    </div>
  )
}