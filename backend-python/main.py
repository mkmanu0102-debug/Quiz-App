import os
import smtplib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import get_db
from routers.auth import router as auth_router
from routers.quiz import router as quiz_router
from routers.admin import router as admin_router

app = FastAPI(
    title="Quiz World API",
    description="FastAPI Backend for Quiz World Application",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(quiz_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {"message": "Quiz World Python (FastAPI) API Running!"}

@app.get("/debug")
def debug():
    status_info = {
        "env": {
            "DB_HOST": "SET" if os.getenv("DB_HOST") else "NOT SET",
            "DB_PORT": "SET" if os.getenv("DB_PORT") else "NOT SET",
            "DB_USER": "SET" if os.getenv("DB_USER") else "NOT SET",
            "DB_PASSWORD": "SET" if os.getenv("DB_PASSWORD") else "NOT SET",
            "DB_NAME": "SET" if os.getenv("DB_NAME") else "NOT SET",
            "EMAIL_USER": "SET" if os.getenv("EMAIL_USER") else "NOT SET",
            "EMAIL_PASS": "SET" if os.getenv("EMAIL_PASS") else "NOT SET",
            "JWT_SECRET": "SET" if os.getenv("JWT_SECRET") else "NOT SET",
            "GEMINI_API_KEY": "SET" if os.getenv("GEMINI_API_KEY") else "NOT SET",
        },
        "dbConnection": None,
        "emailTransporter": None,
    }

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 + 1 AS result")
            row = cursor.fetchone()
            status_info["dbConnection"] = {"success": True, "result": row["result"]}
        conn.close()
    except Exception as err:
        status_info["dbConnection"] = {"success": False, "error": str(err)}

    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")
    if email_user and email_pass:
        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=5) as server:
                server.login(email_user, email_pass)
            status_info["emailTransporter"] = {"success": True}
        except Exception as err:
            status_info["emailTransporter"] = {"success": False, "error": str(err)}
    else:
        status_info["emailTransporter"] = {"success": False, "error": "Email credentials not configured"}

    return status_info

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
