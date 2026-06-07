import os
from groq import Groq

from models.schemas import Citation

GROQ_MODEL = "llama-3.3-70b-versatile"
_client: Groq | None = None

SYSTEM_PROMPT = """You are a precise document assistant. Answer questions based ONLY on the provided document excerpts. If the answer is not in the excerpts, say so clearly. Always cite which excerpt supports your answer using [Excerpt N] notation. Be concise and factual."""


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
    return _client


def _build_prompt(question: str, citations: list[Citation]) -> str:
    excerpts = "\n\n".join(
        [
            f"[Excerpt {i + 1}] (Page {c.page_number or 'N/A'}): {c.content}"
            for i, c in enumerate(citations)
        ]
    )
    return f"""Document Excerpts:
{excerpts}

Question: {question}

Answer with citations:"""


def ask_groq(question: str, citations: list[Citation]) -> str:
    client = _get_client()
    prompt = _build_prompt(question, citations)

    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )
    return completion.choices[0].message.content or ""
