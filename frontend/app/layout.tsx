import type { Metadata } from "next"
import Provider from "@/components/Provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "DocOracle — AI Document Intelligence",
  description: "Upload PDFs, ask questions, get cited answers powered by AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
