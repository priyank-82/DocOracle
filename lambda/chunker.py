from pypdf import PdfReader


def extract_text_pages(pdf_path: str) -> list[dict]:
    reader = PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text.strip():
            pages.append({"page_number": i + 1, "text": text})
    return pages


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def count_pages(pdf_path: str) -> int:
    reader = PdfReader(pdf_path)
    return len(reader.pages)


def process_pdf(pdf_path: str) -> tuple[list[dict], int]:
    pages = extract_text_pages(pdf_path)
    page_count = count_pages(pdf_path)
    all_chunks = []
    for page in pages:
        raw_chunks = chunk_text(page["text"])
        for chunk_text_content in raw_chunks:
            all_chunks.append(
                {"content": chunk_text_content, "page_number": page["page_number"]}
            )
    return all_chunks, page_count
