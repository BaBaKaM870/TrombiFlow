import os
import random
import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt

from ..models.user import UserModel
from ..middlewares.auth import get_current_user
from ..config.storage import UPLOAD_DIR
from ..services.image_service import resize_photo

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
    photo_url: str | None = None


ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024


@router.post("/login")
def login(data: LoginBody):
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
        "user": {k: user[k] for k in ("id", "username", "email", "role", "photo_url")},
    }


@router.post("/register", status_code=201)
def register(data: RegisterBody):
    password_hash = _pwd.hash(data.password)
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
    password_hash = _pwd.hash(password)
    photo_url = None

    if photo:
        if photo.content_type not in ALLOWED_PHOTO_TYPES:
            raise HTTPException(
                status_code=415,
                detail="Only JPEG, PNG and WebP images are allowed",
            )
        content = await photo.read()
        if len(content) > MAX_PHOTO_SIZE:
            raise HTTPException(status_code=413, detail="File too large (max 5 MB)")

        ext = os.path.splitext(photo.filename or "")[1].lower() or ".jpg"
        tmp_path = os.path.join(
            UPLOAD_DIR,
            f"{int(time.time() * 1000)}-{random.randint(0, 999999)}{ext}",
        )

        with open(tmp_path, "wb") as f:
            f.write(content)

        try:
            final_path = resize_photo(tmp_path)
            photo_url = "uploads/" + os.path.basename(final_path)
        except Exception:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise

    try:
        return UserModel.create(username, email, password_hash, role, photo_url)
    except Exception as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
