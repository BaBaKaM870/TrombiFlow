import base64
import hashlib
import os

import random
import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from ..config.storage import UPLOAD_DIR
from ..services.image_service import resize_photo
from ..services.storage_service import save_photo
from ..config.limiter import limiter

from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from ..models.user import UserModel
from ..middlewares.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])
_pwd = CryptContext(schemes=["argon2"], deprecated="auto")


class LoginBody(BaseModel):
    email: str
    password: str


class RegisterBody(BaseModel):
    username: str
    email: str
    password: str
    role: str = "teacher"
    photo_url: str | None = None


class ProfileUpdateBody(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str | None = None


ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024
MAX_ARGON2_PASSWORD_BYTES = 10000000000


def _validate_photo(photo: UploadFile):
    ext = os.path.splitext(photo.filename or "")[1].lower()
    if (
        photo.content_type not in ALLOWED_PHOTO_TYPES
        and ext not in ALLOWED_PHOTO_EXTENSIONS
    ):
        raise HTTPException(
            status_code=415,
            detail="Only JPEG, PNG and WebP images are allowed",
        )
    return ext if ext in ALLOWED_PHOTO_EXTENSIONS else ".jpg"


async def _save_uploaded_photo(photo: UploadFile) -> str:
    ext = _validate_photo(photo)
    content = await photo.read()
    if len(content) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")

    tmp_path = os.path.join(
        UPLOAD_DIR,
        f"{int(time.time() * 1000)}-{random.randint(0, 999999)}{ext}",
    )
    with open(tmp_path, "wb") as f:
        f.write(content)

    try:
        return save_photo(tmp_path)
    except Exception:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


def _normalize_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) <= MAX_ARGON2_PASSWORD_BYTES:
        return password
    digest = hashlib.sha256(password_bytes).digest()
    return base64.b64encode(digest).decode("ascii")


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, data: LoginBody):
    user = UserModel.find_by_email(data.email)
    password = _normalize_password(data.password)
    if not user or not _pwd.verify(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode(
        {"userId": user["id"], "role": user["role"]},
        os.environ.get("JWT_SECRET", "default_secret"),
        algorithm="HS256",
    )
    return {
        "token": token,
        "user": {k: user[k] for k in ("id", "username", "email", "role", "photo_url")},
    }


@router.post("/register", status_code=201)
def register(data: RegisterBody):
    password_hash = _pwd.hash(_normalize_password(data.password))
    try:
        return UserModel.create(
            data.username,
            data.email,
            password_hash,
            data.role,
            data.photo_url,
        )
    except Exception as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/register-with-photo", status_code=201)
async def register_with_photo(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form("teacher"),
    photo: UploadFile | None = File(None),
):
    password_hash = _pwd.hash(_normalize_password(password))
    photo_url = None

    if photo:
        photo_url = await _save_uploaded_photo(photo)

    try:
        return UserModel.create(username, email, password_hash, role, photo_url)
    except Exception as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.put("/me")
def update_me(data: ProfileUpdateBody, current_user: dict = Depends(get_current_user)):
    fields = {}

    if data.username is not None:
        username = data.username.strip()
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        fields["username"] = username

    if data.email is not None:
        email = data.email.strip()
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        fields["email"] = email

    if data.password:
        fields["password_hash"] = _pwd.hash(_normalize_password(data.password))

    try:
        updated = UserModel.update(current_user["id"], fields)
    except Exception as e:
        raise HTTPException(status_code=409, detail=str(e))

    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@router.post("/me/photo")
async def update_me_photo(
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    photo_url = await _save_uploaded_photo(photo)
    updated = UserModel.update_photo(current_user["id"], photo_url)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated
