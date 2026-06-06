from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None


def get_embedder() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed_chunks(chunks: list[dict]) -> list[list[float]]:
    texts = [c["content"] for c in chunks]
    embeddings = get_embedder().encode(texts, show_progress_bar=False)
    return [emb.tolist() for emb in embeddings]
