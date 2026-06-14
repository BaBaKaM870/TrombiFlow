from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import logging

from ..middlewares.auth import get_current_user, require_admin
from ..models.admin_request import AdminRequestModel
from ..models.user import UserModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin-requests", tags=["admin-requests"])


class ApproveBody(BaseModel):
    duration_hours: int


@router.get("/me")
def get_my_request(current_user: dict = Depends(get_current_user)):
    req = AdminRequestModel.find_pending_for_user(current_user["id"]) or {}
    logger.debug("get_my_request: user_id=%s found=%s", current_user.get("id"), bool(req))
    return req


@router.post("/me", status_code=201)
def create_my_request(current_user: dict = Depends(get_current_user)):
    # Teachers can request admin access; admins already are admins
    if current_user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Already admin")

    pending = AdminRequestModel.find_pending_for_user(current_user["id"])
    if pending:
        logger.debug("create_my_request: user_id=%s already has pending request id=%s", current_user.get("id"), pending.get("id"))
        raise HTTPException(status_code=409, detail="Existing pending request")

    created = AdminRequestModel.create(current_user["id"])
    logger.info("create_my_request: created request id=%s for user_id=%s", created.get("id") if created else None, current_user.get("id"))
    return created


@router.get("")
@router.get("/", include_in_schema=False)
def list_requests(current_user: dict = Depends(require_admin)):
    results = AdminRequestModel.list_pending()
    logger.info("list_requests: admin_id=%s returned %s pending requests", current_user.get("id"), len(results or []))
    return results


@router.post("/{request_id}/approve")
def approve_request(request_id: int, body: ApproveBody, current_user: dict = Depends(require_admin)):
    duration = int(body.duration_hours or 0)
    if duration < 1 or duration > 72:
        raise HTTPException(status_code=400, detail="duration_hours must be between 1 and 72")

    existing = AdminRequestModel.find_by_id(request_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Request not found")

    updated = AdminRequestModel.approve(request_id, current_user["id"], duration)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to approve request")
    return updated


@router.post("/{request_id}/reject")
def reject_request(request_id: int, current_user: dict = Depends(require_admin)):
    existing = AdminRequestModel.find_by_id(request_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Request not found")

    updated = AdminRequestModel.reject(request_id, current_user["id"])
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to reject request")
    return updated
