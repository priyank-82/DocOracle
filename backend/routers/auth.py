import uuid
import os
import jwt
from jwt import PyJWKClient
import requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from models.database import User, get_db

security = HTTPBearer(auto_error=False)

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_TOKEN_INFO = "https://www.googleapis.com/oauth2/v1/tokeninfo"
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

_jwk_client = None


def _get_jwk_client():
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient(GOOGLE_CERTS_URL, cache_keys=True)
    return _jwk_client


def _verify_id_token(token: str) -> dict:
    try:
        jwk_client = _get_jwk_client()
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=GOOGLE_CLIENT_ID,
            options={"verify_exp": True},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid audience")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid ID token: {str(e)}")


def _verify_via_tokeninfo(token: str) -> dict | None:
    try:
        resp = requests.get(f"{GOOGLE_TOKEN_INFO}?access_token={token}", timeout=5)
        if resp.status_code != 200:
            return None
        return resp.json()
    except Exception:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> uuid.UUID:
    if not credentials:
        return uuid.UUID(os.environ.get("DEV_USER_ID", "00000000-0000-0000-0000-000000000001"))

    token = credentials.credentials
    data = None

    # Try ID token (JWT) first
    try:
        header = jwt.get_unverified_header(token)
        if header.get("kid"):
            data = _verify_id_token(token)
    except HTTPException:
        raise
    except Exception:
        pass

    # Fallback: try as access token via tokeninfo
    if data is None:
        data = _verify_via_tokeninfo(token)

    if data is None:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    try:
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
