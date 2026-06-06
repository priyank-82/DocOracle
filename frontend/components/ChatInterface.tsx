"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { queryDocument, getChatHistory } from "@/lib/api"

interface Message {
  role: "user" | "assistant"
  content: string
  citations?: { chunk_id: string; content: string; page_number: number }[]
}

interface Props {
  documentId: string
  onCite: (chunk: { content: string; page: number }) => void
}

export default function ChatInterface({ documentId, onCite }: Props) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!session?.accessToken) return
    getChatHistory(documentId, session.accessToken)
      .then((history) =>
        setMessages(
          history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
        )
      )
      .catch(() => setMessages([]))
  }, [documentId, session])

  const send = async () => {
    if (!input.trim() || !session?.accessToken) return

    const userMsg: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await queryDocument(documentId, input, session.accessToken)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer, citations: res.citations },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xl rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {msg.citations.map((c, j) => (
                    <button
                      key={j}
                      onClick={() =>
                        onCite({ content: c.content, page: c.page_number })
                      }
                      className="text-xs bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200"
                    >
                      [Excerpt {j + 1}]
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-lg px-4 py-2">
              <span className="text-sm text-gray-400">Typing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask a question about this document..."
            className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
