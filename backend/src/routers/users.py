from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel

from ..middlewares.auth import ADMIN_ROLE, TEACHER_ROLE, require_admin
from ..models.export import ExportModel
from ..models.user import UserModel
from .auth import _normalize_password

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Depends(require_admin)],
)

_pwd = CryptContext(schemes=["argon2"], deprecated="auto")
ALLOWED_ROLES = {ADMIN_ROLE, TEACHER_ROLE}


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = TEACHER_ROLE


class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str | None = None
    role: str | None = None


def _clean_role(role: str) -> str:
    normalized = role.strip().lower()
    if normalized not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    return normalized


@router.get("")
@router.get("/", include_in_schema=False)
def get_users():
    return UserModel.find_all()


@router.post("", status_code=201)
@router.post("/", status_code=201, include_in_schema=False)
def create_user(data: UserCreate):
    username = data.username.strip()
    email = data.email.strip()
    if not username or not email or not data.password:
        raise HTTPException(status_code=400, detail="Username, email and password are required")

    try:
        return UserModel.create(
            username=username,
            email=email,
            password_hash=_pwd.hash(_normalize_password(data.password)),
            role=_clean_role(data.role),
        )
    except Exception as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/{id}")
def update_user(id: int, data: UserUpdate, current_user: dict = Depends(require_admin)):
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

    if data.role is not None:
        role = _clean_role(data.role)
        if id == current_user["id"] and role != ADMIN_ROLE:
            raise HTTPException(status_code=400, detail="An admin cannot remove their own admin role")
        fields["role"] = role

    try:
        updated = UserModel.update(id, fields)
    except Exception as e:
        raise HTTPException(status_code=409, detail=str(e))

    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@router.delete("/{id}", status_code=204)
def delete_user(id: int, current_user: dict = Depends(require_admin)):
    if id == current_user["id"]:
        raise HTTPException(status_code=400, detail="An admin cannot delete their own account")
    if not UserModel.delete(id):
        raise HTTPException(status_code=404, detail="User not found")


@router.get("/{id}/exports")
def get_user_exports(id: int):
    if not UserModel.find_by_id(id):
        raise HTTPException(status_code=404, detail="User not found")
    return ExportModel.find_by_user(id)
