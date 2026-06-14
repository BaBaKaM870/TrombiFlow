import threading
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import HTMLResponse, FileResponse, Response
from typing import Optional

from ..models.student import StudentModel
from ..models.class_ import ClassModel
from ..models.export import ExportModel
from ..middlewares.auth import ADMIN_ROLE, get_current_user, require_admin
from ..config.storage import UPLOAD_DIR
from ..services.html_service import generate_trombi_html, save_trombi_html
from ..services.pdf_service import generate_pdf

router = APIRouter(prefix="/api/trombi", tags=["trombi"])


def _log_export(**kwargs):
    """Fire-and-forget export log (runs in a daemon thread)."""

    def _run():
        try:
            ExportModel.create(**kwargs)
        except Exception as e:
            print(f"[warn] Export log failed: {e}")

    threading.Thread(target=_run, daemon=True).start()


def _safe_export_filename(class_label: str | None, extension: str) -> str:
    safe_label = "".join(
        ch if ch.isalnum() or ch in ("-", "_") else "-" for ch in (class_label or "all")
    )
    return f"trombi-{safe_label}.{extension}"


@router.get("", include_in_schema=False)
@router.get("/")
def generate(
    class_id: Optional[int] = Query(None),
    format: str = Query("html"),
    current_user: dict = Depends(get_current_user),
):
    if format not in ("html", "pdf"):
        raise HTTPException(status_code=400, detail='format must be "html" or "pdf"')

    students = StudentModel.find_all(class_id=class_id)
    if not students:
        raise HTTPException(status_code=404, detail="No students found")

    class_label = ""
    if class_id:
        cls = ClassModel.find_by_id(class_id)
        class_label = cls["label"] if cls else ""

    opts = {"title": "Trombinoscope", "class_label": class_label}
    user_id = current_user["id"] if current_user else None

    if format == "html":
        html = generate_trombi_html(students, opts)
        html_path = save_trombi_html(students, opts)
        _log_export(
            class_id=class_id, format="html", file_path=html_path, generated_by=user_id
        )
        return HTMLResponse(content=html, media_type="text/html; charset=utf-8")

    pdf_path = generate_pdf(students, opts)
    _log_export(
        class_id=class_id, format="pdf", file_path=pdf_path, generated_by=user_id
    )
    filename = f"trombi-{class_label or 'all'}.pdf"
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=filename,
    )


@router.get("/exports")
def get_exports(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == ADMIN_ROLE:
        return ExportModel.find_all()
    return ExportModel.find_by_user(current_user["id"])


@router.get("/exports/{id}/download")
def download_export(id: int, current_user: dict = Depends(get_current_user)):
    export = ExportModel.find_by_id(id)
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")
    if (
        current_user.get("role") != ADMIN_ROLE
        and export.get("generated_by") != current_user.get("id")
    ):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    export_format = (export.get("format") or "").lower()
    if export_format not in ("pdf", "html"):
        raise HTTPException(
            status_code=404, detail="No downloadable file for this export"
        )

    class_label = export.get("class_label") or "all"

    if export_format == "html" and not export.get("file_path"):
        students = StudentModel.find_all(class_id=export.get("class_id"))
        if not students:
            raise HTTPException(status_code=404, detail="No students found for this export")

        html = generate_trombi_html(
            students,
            {"title": "Trombinoscope", "class_label": export.get("class_label") or ""},
        )
        return Response(
            content=html,
            media_type="text/html; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{_safe_export_filename(class_label, "html")}"'
            },
        )

    if not export.get("file_path"):
        raise HTTPException(
            status_code=404, detail="No downloadable file for this export"
        )

    file_path = Path(export["file_path"]).resolve()
    upload_root = Path(UPLOAD_DIR).resolve()
    if file_path != upload_root and upload_root not in file_path.parents:
        raise HTTPException(
            status_code=403, detail="Export file is outside the upload directory"
        )

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Export file is missing")

    extension = "html" if export_format == "html" else "pdf"
    media_type = "text/html; charset=utf-8" if export_format == "html" else "application/pdf"
    filename = _safe_export_filename(class_label, extension)
    return FileResponse(
        str(file_path),
        media_type=media_type,
        filename=filename,
    )


@router.delete("/exports/{id}", status_code=204)
def delete_export(id: int, _: dict = Depends(require_admin)):
    export = ExportModel.find_by_id(id)
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")

    file_path_value = export.get("file_path")
    if file_path_value:
        file_path = Path(file_path_value).resolve()
        upload_root = Path(UPLOAD_DIR).resolve()
        if file_path == upload_root or upload_root in file_path.parents:
            if file_path.exists() and file_path.is_file():
                file_path.unlink()

    if not ExportModel.delete(id):
        raise HTTPException(status_code=404, detail="Export not found")
