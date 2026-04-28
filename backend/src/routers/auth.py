import os
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from ..models.user import UserModel
from ..middlewares.auth import get_current_user
from ..config.limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginBody(BaseModel):
    email: str
    password: str


class RegisterBody(BaseModel):
    username: str
    email: str
    password: str
    role: str = "teacher"


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, data: LoginBody):
    user = UserModel.find_by_email(data.email)
    if not user or not _pwd.verify(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode(
        {"userId": user["id"], "role": user["role"]},
        os.environ.get("JWT_SECRET", "default_secret"),
        algorithm="HS256",
    )
    return {
        "token": token,
        "user": {k: user[k] for k in ("id", "username", "email", "role")},
    }


@router.post("/register", status_code=201)
def register(data: RegisterBody):
    password_hash = _pwd.hash(data.password)
    try:
        return UserModel.create(data.username, data.email, password_hash, data.role)
    except Exception as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
