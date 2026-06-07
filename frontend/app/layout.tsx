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
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
