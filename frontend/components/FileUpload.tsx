"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { useSession } from "next-auth/react"
import { uploadDocument } from "@/lib/api"

export default function FileUpload() {
  const { data: session } = useSession()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [docId, setDocId] = useState<string | null>(null)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (!file || !session?.accessToken) return

      setUploading(true)
      setProgress(0)
      try {
        const doc = await uploadDocument(file, session.accessToken, setProgress)
        setDocId(doc.id)
      } catch (err) {
        console.error("Upload failed:", err)
      } finally {
        setUploading(false)
      }
    },
    [session]
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
