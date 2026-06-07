from fastembed import TextEmbedding

_model = None


def get_embedder() -> TextEmbedding:
    global _model
    if _model is None:
        _model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
    return _model


def embed_text(text: str) -> list[float]:
    emb = list(get_embedder().embed(text))[0]
    return emb.tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    return [emb.tolist() for emb in get_embedder().embed(texts)]
