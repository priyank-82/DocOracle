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
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
      } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} />
      {error && (
        <p className="text-sm text-red-500 mb-2" role="alert">{error}</p>
      )}
      {uploading ? (
        <div>
          <p className="text-sm text-gray-600">
            {docId ? "Processing..." : `Uploading... ${progress}%`}
          </p>
          {!docId && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {isDragActive
            ? "Drop PDF here"
            : "Drag & drop a PDF, or click to select"}
        </p>
      )}
    </div>
  )
}
