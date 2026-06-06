import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-5xl font-bold mb-4">DocOracle</h1>
      <p className="text-xl text-gray-600 mb-8 text-center max-w-xl">
        Upload PDFs, ask natural language questions, and get cited answers
        powered by AI.
      </p>
      <Link
        href="/dashboard"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700 transition"
      >
        Get Started
      </Link>
    </main>
  )
}
