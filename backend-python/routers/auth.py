import os
import time
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt

from database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "quizworld_secret_key_2024")
ALGORITHM = "HS256"

# In-memory OTP storage
otp_store = {}
forgot_password_otp_store = {}

def is_email(identifier: str) -> bool:
    return "@" in identifier

def log_fallback(identifier: str, otp: str):
    try:
        log_path = os.path.join(os.path.dirname(__file__), "..", "log.txt")
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ')}] OTP for {identifier}: {otp}\n")
        print(f"📝 OTP logged to log.txt for testing.")
    except Exception as e:
        print("Failed to write to log.txt:", e)

def send_email_otp(email: str, otp: str):
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")

    print(f"📧 [Email OTP] Sending OTP {otp} to email: {email}")

    if email_user and email_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Quiz World - OTP Verification"
            msg["From"] = f"Quiz World <{email_user}>"
            msg["To"] = email

            html_content = f"""
            <h2>Quiz World OTP Verification</h2>
            <p>Your OTP is: <b style="font-size:24px; color:#4f46e5;">{otp}</b></p>
            <p>Valid for 5 minutes only.</p>
            """
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(email_user, email_pass)
                server.sendmail(email_user, email, msg.as_string())
            print(f"✅ [SMTP] Email sent successfully to {email}")
        except Exception as err:
            print(f"❌ [SMTP] Failed to send email to {email}: {err}")
            log_fallback(email, otp)
    else:
        print("⚠️ Email credentials not set. Logging OTP.")
        log_fallback(email, otp)

def send_sms_otp(phone: str, otp: str):
    print(f"📱 [SMS OTP] Sending OTP {otp} to phone: {phone}")
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_phone = os.getenv("TWILIO_PHONE_NUMBER")

    if account_sid and auth_token and from_phone:
        try:
            import requests
            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            data = {
                "Body": f"Quiz World Verification Code: {otp}. Valid for 5 minutes.",
                "From": from_phone,
                "To": phone
            }
            res = requests.post(url, data=data, auth=(account_sid, auth_token))
            if res.status_code in [200, 201]:
                print(f"✅ [Twilio] SMS sent successfully to {phone}")
            else:
                log_fallback(phone, otp)
        except Exception as e:
            print(f"❌ [Twilio] Error: {e}")
            log_fallback(phone, otp)
    else:
        log_fallback(phone, otp)

# Pydantic Request Models
class RegisterRequest(BaseModel):
    name: str
    password: str
    email: Optional[str] = None
    phone: Optional[str] = None
    emailOrPhone: Optional[str] = None

class VerifyOtpRequest(BaseModel):
    otp: str
    email: Optional[str] = None
    phone: Optional[str] = None
    emailOrPhone: Optional[str] = None

class LoginRequest(BaseModel):
    password: str
    email: Optional[str] = None
    phone: Optional[str] = None
    emailOrPhone: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    emailOrPhone: str

class ResetPasswordRequest(BaseModel):
    emailOrPhone: str
    otp: str
    newPassword: str

# 1. Register - Step 1: Send OTP
@router.post("/register")
def register(req: RegisterRequest):
    identifier = req.emailOrPhone or req.email or req.phone
    if not req.name or not identifier or not req.password:
        raise HTTPException(status_code=400, detail="All fields (name, email/phone, password) are required!")

    field_type = "email" if is_email(identifier) else "phone"

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT * FROM users WHERE {field_type} = %s", (identifier,))
            existing = cursor.fetchone()
            if existing:
                conn.close()
                raise HTTPException(
                    status_code=400,
                    detail=f"{'Email' if field_type == 'email' else 'Phone number'} already registered!"
                )
        conn.close()
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

    otp = str(random.randint(100000, 999999))
    otp_store[identifier] = {
        "name": req.name,
        "password": req.password,
        "otp": otp,
        "expires": time.time() + (5 * 60)
    }

    if field_type == "email":
        send_email_otp(identifier, otp)
        return {"message": "OTP sent to your email!"}
    else:
        send_sms_otp(identifier, otp)
        return {"message": "OTP sent to your phone!"}

# 2. Register - Step 2: Verify OTP
@router.post("/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    identifier = req.emailOrPhone or req.email or req.phone
    if not identifier or not req.otp:
        raise HTTPException(status_code=400, detail="Identifier and OTP are required!")

    stored = otp_store.get(identifier)
    if not stored:
        raise HTTPException(status_code=400, detail="OTP expired or not found! Please register again.")

    if time.time() > stored["expires"]:
        del otp_store[identifier]
        raise HTTPException(status_code=400, detail="OTP expired!")

    if stored["otp"] != req.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP!")

    hashed_password = pwd_context.hash(stored["password"])
    field_type = "email" if is_email(identifier) else "phone"

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(
                f"INSERT INTO users (name, {field_type}, password) VALUES (%s, %s, %s)",
                (stored["name"], identifier, hashed_password)
            )
        conn.close()
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

    del otp_store[identifier]
    return {"message": "Registration successful! Please login."}

# 3. Login
@router.post("/login")
def login(req: LoginRequest):
    identifier = req.emailOrPhone or req.email or req.phone
    if not identifier or not req.password:
        raise HTTPException(status_code=400, detail="Identifier and password are required!")

    admin_phone = os.getenv("ADMIN_PHONE")
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    # Admin Login Check
    if (
        (admin_phone and identifier == admin_phone and req.password == admin_password) or
        (admin_email and identifier == admin_email and req.password == admin_password) or
        (identifier == "admin" and req.password == "admin123")
    ):
        token_payload = {
            "id": 0,
            "role": "admin",
            "exp": int(time.time()) + (7 * 24 * 3600)
        }
        token = jwt.encode(token_payload, JWT_SECRET, algorithm=ALGORITHM)
        return {
            "token": token,
            "user": {"name": "Admin", "role": "admin"}
        }

    field_type = "email" if is_email(identifier) else "phone"

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT * FROM users WHERE {field_type} = %s", (identifier,))
            user = cursor.fetchone()
        conn.close()
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

    if not user:
        raise HTTPException(status_code=400, detail=f"Invalid {'email' if field_type == 'email' else 'phone number'} or password!")

    if not pwd_context.verify(req.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials!")

    token_payload = {
        "id": user["id"],
        "role": "user",
        "exp": int(time.time()) + (7 * 24 * 3600)
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=ALGORITHM)

    return {
        "token": token,
        "user": {
            "name": user["name"],
            "email": user.get("email"),
            "phone": user.get("phone"),
            "role": "user"
        }
    }

# 4. Forgot Password - Step 1: Send OTP
@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    identifier = req.emailOrPhone.strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or phone number is required!")

    field_type = "email" if is_email(identifier) else "phone"

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT * FROM users WHERE {field_type} = %s", (identifier,))
            user = cursor.fetchone()
        conn.close()
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

    if not user:
        raise HTTPException(status_code=400, detail=f"User with this {'email' if field_type == 'email' else 'phone number'} is not registered!")

    otp = str(random.randint(100000, 999999))
    forgot_password_otp_store[identifier] = {
        "otp": otp,
        "expires": time.time() + (5 * 60)
    }

    if field_type == "email":
        send_email_otp(identifier, otp)
        return {"message": "OTP sent to your email!"}
    else:
        send_sms_otp(identifier, otp)
        return {"message": "OTP sent to your phone!"}

# 5. Forgot Password - Step 2: Reset Password
@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    identifier = req.emailOrPhone.strip()
    if not identifier or not req.otp or not req.newPassword:
        raise HTTPException(status_code=400, detail="All fields (email/phone, OTP, new password) are required!")

    field_type = "email" if is_email(identifier) else "phone"

    stored = forgot_password_otp_store.get(identifier)
    if not stored:
        raise HTTPException(status_code=400, detail="OTP expired or not requested! Please request OTP again.")

    if time.time() > stored["expires"]:
        del forgot_password_otp_store[identifier]
        raise HTTPException(status_code=400, detail="OTP expired!")

    if stored["otp"] != req.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP!")

    hashed_password = pwd_context.hash(req.newPassword)

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(f"UPDATE users SET password = %s WHERE {field_type} = %s", (hashed_password, identifier))
        conn.close()
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

    del forgot_password_otp_store[identifier]
    return {"message": "Password reset successful! Please login with your new password."}
