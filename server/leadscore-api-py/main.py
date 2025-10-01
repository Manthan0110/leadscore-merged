# server/leadscore-api-py/main.py
import os
import json
import random
import string
import traceback
from datetime import datetime, timedelta
from typing import Optional, Dict

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.hash import bcrypt
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()  # loads server/.env

# Where users are persisted
API_USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

# pending verifications: email -> { code, expires_at, payload }
PENDING: Dict[str, Dict] = {}

# SMTP config (from server/.env) — set these in your .env file
SMTP_HOST = os.getenv("SMTP_HOST", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER or "no-reply@leadscore.local")

app = FastAPI(title="LeadScore Lite API - Auth")

# DEV: allow all origins for ease of local testing; tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- helper functions ----------

def load_users():
    if not os.path.exists(API_USERS_FILE):
        return []
    with open(API_USERS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except:
            return []

def save_users(users):
    with open(API_USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)

def find_user_by_email(email: str):
    users = load_users()
    for u in users:
        if u.get("email", "").lower() == email.lower():
            return u
    return None

def _smtp_send_message(msg: EmailMessage):
    """
    Low-level SMTP send. Uses STARTTLS on typical ports (587).
    Raises exception on failure.
    """
    # Connect to SMTP server
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as smtp:
        smtp.ehlo()
        # Use STARTTLS for secure connection if port indicates it
        try:
            if SMTP_PORT in (587, 25):
                smtp.starttls()
                smtp.ehlo()
        except Exception:
            # Some relay servers may not require STARTTLS; proceed if it fails
            pass

        # If credentials provided, login
        if SMTP_USER and SMTP_PASS:
            smtp.login(SMTP_USER, SMTP_PASS)

        smtp.send_message(msg)

def send_email_sync(to_email: str, subject: str, body: str):
    """
    Attempt to send the email via SMTP (Brevo). Raises exception on failure.
    """
    print(f"[email] Attempting to send to {to_email} via {SMTP_HOST}:{SMTP_PORT} (user set: {bool(SMTP_USER)})")
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL or "no-reply@leadscore.local"
    msg["To"] = to_email
    # set both plain text and a simple HTML alternative for readability
    msg.set_content(body, subtype="plain")

    # try sending
    _smtp_send_message(msg)
    print("[email] Mail sent successfully")

def send_verification_email_background(background: BackgroundTasks, to_email: str, code: str):
    """
    Send verification code in background using Brevo SMTP.
    If sending fails, log the error and print the code to console (fallback).
    """
    body = (
        f"Hello,\n\n"
        f"Your LeadScore verification code is: {code}\n\n"
        f"If you did not request this, please ignore.\n\n"
        f"— LeadScore Team"
    )

    def _send_task():
        try:
            send_email_sync(to_email, "Your LeadScore verification code", body)
            print(f"[email] Verification email scheduled/sent to {to_email}")
        except Exception as exc:
            print("[email][error] Failed to send verification email (Brevo SMTP):")
            traceback.print_exc()
            # fallback: print the code to server console for dev/testing
            print(f"[email][fallback] Verification code for {to_email}: {code}")

    background.add_task(_send_task)

def generate_code(length=6):
    # numeric code (6 digits)
    return "".join(random.choice(string.digits) for _ in range(length))

# ---------- request models ----------

class SignupIn(BaseModel):
    name: str
    phone: Optional[str] = ""
    userType: Optional[str] = "Internal"
    email: EmailStr
    password: str

class VerifyIn(BaseModel):
    email: EmailStr
    code: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

# ---------- auth endpoints ----------

@app.post("/auth/signup")
async def signup(payload: SignupIn, background: BackgroundTasks):
    # Do not register if user exists
    if find_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # create pending record with expiry (10 minutes)
    code = generate_code(6)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    PENDING[payload.email.lower()] = {
        "code": code,
        "expires_at": expires_at.isoformat(),
        "payload": payload.dict()
    }

    # Attempt to send the email in background; fallback will print code if sending fails
    send_verification_email_background(background, payload.email, code)

    # Return OK (we don't reveal the code in the response)
    return {"ok": True, "message": "Verification code sent (or printed to server console if email failed)."}

@app.post("/auth/verify")
async def verify(in_data: VerifyIn):
    rec = PENDING.get(in_data.email.lower())
    if not rec:
        raise HTTPException(status_code=400, detail="No pending verification for this email")
    if rec["code"] != in_data.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
    # check expiry
    expires = datetime.fromisoformat(rec["expires_at"])
    if datetime.utcnow() > expires:
        # remove expired pending record
        try:
            del PENDING[in_data.email.lower()]
        except KeyError:
            pass
        raise HTTPException(status_code=400, detail="Verification code expired")

    # create user
    payload = rec["payload"]
    users = load_users()
    # final check
    if find_user_by_email(payload["email"]):
        # remove pending and inform client
        try:
            del PENDING[in_data.email.lower()]
        except KeyError:
            pass
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "id": str(int(datetime.utcnow().timestamp() * 1000)),
        "name": payload["name"].strip(),
        "phone": payload.get("phone",""),
        "userType": payload.get("userType",""),
        "email": payload["email"],
        "password": bcrypt.hash(payload["password"]),  # hashed
        "createdAt": datetime.utcnow().isoformat()+"Z"
    }
    users.append(user)
    save_users(users)

    # clear pending
    try:
        del PENDING[in_data.email.lower()]
    except KeyError:
        pass

    return {"ok": True, "message": "User registered"}

@app.post("/auth/login")
async def login(data: LoginIn):
    # normalize input
    email = data.email.strip().lower()
    password = data.password

    user = find_user_by_email(email)
    # avoid leaking which part failed; keep same error message
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # guard missing password field just in case the store is inconsistent
    hashed = user.get("password")
    if not hashed or not bcrypt.verify(password, hashed):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # never return the password hash
    safe = {k: v for k, v in user.items() if k != "password"}

    return {"ok": True, "user": safe}
