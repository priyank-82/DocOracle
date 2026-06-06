import uuid
import os
import requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

GOOGLE_TOKEN_INFO = "https://www.googleapis.com/oauth2/v1/tokeninfo"


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> uuid.UUID:
    if not credentials:
        return uuid.UUID(os.environ.get("DEV_USER_ID", "00000000-0000-0000-0000-000000000001"))
    try:
        resp = requests.get(f"{GOOGLE_TOKEN_INFO}?access_token={credentials.credentials}", timeout=5)
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        data = resp.json()
        google_id = data.get("user_id")
        if not google_id:
            raise HTTPException(status_code=401, detail="No user_id in token")
        return uuid.uuid5(uuid.NAMESPACE_DNS, f"google-{google_id}")
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Failed to verify with Google")
