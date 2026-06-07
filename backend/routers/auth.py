import uuid
import os
import jwt
import requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from models.database import User, get_db

security = HTTPBearer(auto_error=False)

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

_certs_cache = {"keys": None}


def _get_google_certs():
    if _certs_cache["keys"] is None:
        resp = requests.get(GOOGLE_CERTS_URL, timeout=10)
        _certs_cache["keys"] = resp.json().get("keys", [])
    return _certs_cache["keys"]


def _verify_id_token(token: str) -> dict:
    # Decode header to get kid
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token format")

    kid = header.get("kid")
    keys = _get_google_certs()

    for key_data in keys:
        if key_data.get("kid") == kid:
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
            try:
                payload = jwt.decode(token, public_key, algorithms=["RS256"], audience=GOOGLE_CLIENT_ID)
                return payload
            except jwt.ExpiredSignatureError:
                raise HTTPException(status_code=401, detail="Token expired")
            except jwt.InvalidAudienceError:
                raise HTTPException(status_code=401, detail="Invalid audience")
            except Exception:
                raise HTTPException(status_code=401, detail="Invalid token")

    # Refresh certs in case of key rotation
    _certs_cache["keys"] = None
    keys = _get_google_certs()
    for key_data in keys:
        if key_data.get("kid") == kid:
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
            try:
                payload = jwt.decode(token, public_key, algorithms=["RS256"], audience=GOOGLE_CLIENT_ID)
                return payload
            except Exception:
                raise HTTPException(status_code=401, detail="Invalid token")

    raise HTTPException(status_code=401, detail="Unknown signing key")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> uuid.UUID:
    if not credentials:
        return uuid.UUID(os.environ.get("DEV_USER_ID", "00000000-0000-0000-0000-000000000001"))
    try:
        data = _verify_id_token(credentials.credentials)
        google_id = data.get("sub")
        if not google_id:
            raise HTTPException(status_code=401, detail="No subject in token")
        user_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"google-{google_id}")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = User(
                id=user_id,
                google_id=google_id,
                email=data.get("email"),
                name=data.get("name"),
            )
            db.add(user)
            db.commit()
        else:
            if not user.email and data.get("email"):
                user.email = data.get("email")
            if not user.name and data.get("name"):
                user.name = data.get("name")
            db.commit()

        return user_id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth error: {str(e)}")
