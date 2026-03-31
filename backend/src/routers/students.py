import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from ..models.student import StudentModel
from ..config.storage import UPLOAD_DIR
from ..services.image_service import resize_photo
from ..services.csv_service import parse_csv, process_csv_records

router = APIRouter(prefix="/api/students", tags=["students"])

ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024   # 5 MB
MAX_CSV_SIZE   = 10 * 1024 * 1024  # 10 MB


class StudentCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    class_id: Optional[int] = None
    photo_url: Optional[str] = None


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    class_id: Optional[int] = None
    photo_url: Optional[str] = None


@router.get("/")
def get_all(
    class_id: Optional[int] = Query(None),
    q: Optional[str] = Query(None),
):
    return StudentModel.find_all(class_id=class_id, q=q)


@router.get("/{id}")
def get_by_id(id: int):
    s = StudentModel.find_by_id(id)
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return s


@router.post("/", status_code=201)
def create(data: StudentCreate):
    return StudentModel.create(
        data.first_name, data.last_name, data.email, data.class_id, data.photo_url
    )


@router.put("/{id}")
def update(id: int, data: StudentUpdate):
    s = StudentModel.update(id, data.model_dump(exclude_none=True))
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return s


@router.delete("/{id}", status_code=204)
def remove(id: int):
    if not StudentModel.delete(id):
        raise HTTPException(status_code=404, detail="Student not found")


@router.post("/{id}/photo")
async def upload_photo(id: int, photo: UploadFile = File(...)):
    if photo.content_type not in ALLOWED_PHOTO_TYPES:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG and WebP images are allowed")

    content = await photo.read()
    if len(content) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")

    student = StudentModel.find_by_id(id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    import time, random
    ext = os.path.splitext(photo.filename or "")[1].lower() or ".jpg"
    tmp_path = os.path.join(UPLOAD_DIR, f"{int(time.time() * 1000)}-{random.randint(0, 999999)}{ext}")

    with open(tmp_path, "wb") as f:
        f.write(content)

    try:
        final_path = resize_photo(tmp_path)
        rel_url = "uploads/" + os.path.basename(final_path)
        return StudentModel.update_photo(id, rel_url)
    except Exception:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


@router.post("/import", status_code=201)
async def import_csv(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > MAX_CSV_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    records = parse_csv(content)
    if not records:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    students, errors = process_csv_records(records)
    if not students:
        return JSONResponse(
            status_code=400,
            content={"error": "No valid students found in CSV", "errors": errors},
        )

    created = StudentModel.bulk_create(students)
    result = {"created": len(created), "students": created}
    if errors:
        result["errors"] = errors
    return JSONResponse(status_code=201, content=result)
