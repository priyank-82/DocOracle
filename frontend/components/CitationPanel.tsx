"use client"

interface Props {
  chunk: { content: string; page: number }
  onClose: () => void
}

export default function CitationPanel({ chunk, onClose }: Props) {
  return (
    <aside className="w-96 border-l border-border bg-bg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-fg">Excerpt — Page {chunk.page}</h3>
        <button
          onClick={onClose}
          className="text-fg-subtle hover:text-fg p-1 rounded-lg hover:bg-bg-elevated transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-fg-muted whitespace-pre-wrap leading-relaxed">
          {chunk.content}
        </p>
      </div>
    </aside>
  )
}