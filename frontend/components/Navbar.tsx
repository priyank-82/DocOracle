"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut, signIn } from "next-auth/react"

export default function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (!session) return null

  const initials = (session.user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="h-12 border-b border-border bg-bg flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-fg">DocOracle</span>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-fg-inverted">
            {initials}
          </div>
          <span className="text-sm text-fg-muted hidden sm:block">
            {session.user?.name || "Account"}
          </span>
          <svg
            className={`w-4 h-4 text-fg-subtle transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-xl py-1 z-50 animate-fade-in">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-fg truncate">{session.user?.name}</p>
              <p className="text-xs text-fg-subtle truncate">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signIn("google", { prompt: "select_account" })}
              className="w-full text-left px-3 py-2 text-sm text-fg-muted hover:bg-bg-elevated transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Switch account
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger-dim transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}