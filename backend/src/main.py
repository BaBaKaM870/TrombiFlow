from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from psycopg2 import errors as pg_errors

from .config.storage import UPLOAD_DIR
from .middlewares.auth import get_current_user
from .routers import auth, classes, students, trombi

app = FastAPI(title="TrombiFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(classes.router)
app.include_router(students.router)
app.include_router(trombi.router)


@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    if isinstance(exc, pg_errors.UniqueViolation):
        return JSONResponse(status_code=409, content={"error": "Resource already exists"})
    if isinstance(exc, pg_errors.ForeignKeyViolation):
        return JSONResponse(status_code=400, content={"error": "Referenced resource does not exist"})
    return JSONResponse(status_code=500, content={"error": str(exc)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
