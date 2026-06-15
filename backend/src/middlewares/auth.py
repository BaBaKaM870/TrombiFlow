import os
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from ..models.user import UserModel
from datetime import datetime, timezone

_security = HTTPBearer()
ADMIN_ROLE = "admin"
TEACHER_ROLE = "teacher"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> dict:
    token = credentials.credentials
    secret = os.environ.get("JWT_SECRET", "default_secret")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        user_id = payload.get("userId")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = UserModel.find_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        # If user had temporary admin access that expired, downgrade to teacher
        try:
            admin_until = user.get("admin_until")
            if user.get("role") == ADMIN_ROLE and admin_until is not None:
                now = datetime.now(timezone.utc)
                admin_until_dt = None
                # admin_until may be a datetime object or an ISO string
                if isinstance(admin_until, str):
                    # try builtin parser first
                    try:
                        admin_until_dt = datetime.fromisoformat(admin_until)
                    except Exception:
                        # strip trailing Z and try again
                        try:
                            admin_until_dt = datetime.fromisoformat(admin_until.rstrip("Z"))
                        except Exception:
                            admin_until_dt = None
                else:
                    admin_until_dt = admin_until

                if admin_until_dt is not None:
                    # ensure timezone-aware
                    if admin_until_dt.tzinfo is None:
                        admin_until_dt = admin_until_dt.replace(tzinfo=timezone.utc)

                    if admin_until_dt <= now:
                        # downgrade user in DB and in-memory
                        try:
                            UserModel.update(user_id, {"role": TEACHER_ROLE, "admin_until": None})
                        except Exception:
                            pass
                        user["role"] = TEACHER_ROLE
                        user["admin_until"] = None
        except Exception:
            # non-blocking: if date parsing or update fails, ignore and proceed
            pass
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_roles(*roles: str):
    allowed_roles = set(roles)

    def _dependency(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user

    return _dependency


require_admin = require_roles(ADMIN_ROLE)
