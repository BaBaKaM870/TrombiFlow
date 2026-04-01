from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..models.class_ import ClassModel

router = APIRouter(prefix="/api/classes", tags=["classes"])


class ClassCreate(BaseModel):
    label: str
    year: Optional[int] = None


class ClassUpdate(BaseModel):
    label: Optional[str] = None
    year: Optional[int] = None


@router.get("/")
def get_all():
    return ClassModel.find_all()


@router.get("/{id}")
def get_by_id(id: int):
    cls = ClassModel.find_by_id(id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    return cls


@router.post("/", status_code=201)
def create(data: ClassCreate):
    return ClassModel.create(data.label, data.year)


@router.put("/{id}")
def update(id: int, data: ClassUpdate):
    cls = ClassModel.update(id, data.model_dump(exclude_none=True))
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    return cls


@router.delete("/{id}", status_code=204)
def remove(id: int):
    if not ClassModel.delete(id):
        raise HTTPException(status_code=404, detail="Class not found")
