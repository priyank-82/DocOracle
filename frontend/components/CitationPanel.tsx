"use client"

interface Props {
  chunk: { content: string; page: number }
  onClose: () => void
}

export default function CitationPanel({ chunk, onClose }: Props) {
  return (
    <aside className="w-96 border-l bg-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Excerpt — Page {chunk.page}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          &times;
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {chunk.content}
        </p>
      </div>
    </aside>
  )
}
