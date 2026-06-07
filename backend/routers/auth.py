import uuid
import os
import requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from models.database import User, get_db

security = HTTPBearer(auto_error=False)

GOOGLE_TOKEN_INFO = "https://www.googleapis.com/oauth2/v1/tokeninfo"


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> uuid.UUID:
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
        user_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"google-{google_id}")
        
        # Upsert user with email and name
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
            # Update email/name if missing
            if not user.email and data.get("email"):
                user.email = data.get("email")
            if not user.name and data.get("name"):
                user.name = data.get("name")
            db.commit()
        
        return user_id
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Failed to verify with Google")
