from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from psycopg2 import errors as pg_errors

from ..models.class_ import ClassModel

router = APIRouter(prefix="/api/classes", tags=["classes"])


class ClassCreate(BaseModel):
    label: str
    year: Optional[str] = None


class ClassUpdate(BaseModel):
    label: Optional[str] = None
    year: Optional[str] = None


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
    try:
        return ClassModel.create(data.label, data.year)
    except pg_errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Resource already exists")


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
