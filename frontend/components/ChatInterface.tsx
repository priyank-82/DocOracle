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
      console.error("Chat error:", err)
      const msg = err instanceof Error ? err.message : "Unknown error"
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${msg}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-bg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xl rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-accent text-fg-inverted"
                  : "bg-card border border-border text-fg"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {msg.citations.map((c, j) => (
                    <button
                      key={j}
                      onClick={(e) => {
                        e.stopPropagation()
                        onCite({ content: c.content, page: c.page_number })
                      }}
                      className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-lg border border-accent/30 hover:bg-accent/20 hover:border-accent/50 transition-all cursor-pointer"
                    >
                      Page {c.page_number} · Excerpt {j + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <span className="text-sm text-fg-subtle">Typing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-4 bg-bg">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask a question about this document..."
            className="flex-1 rounded-xl px-4 py-3 text-sm text-white bg-[#1a1a1f] border border-border placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-accent text-fg-inverted px-5 py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}