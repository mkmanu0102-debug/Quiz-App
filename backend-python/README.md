# Quiz World - Python (FastAPI) Backend

This is the Python FastAPI backend for the Quiz World mobile and web application.

## 🚀 Features
- **FastAPI** with auto-generated interactive documentation at `/docs` (Swagger UI).
- **Authentication**: JWT tokens, bcrypt password hashing, OTP verification via Email (SMTP) & SMS (Twilio).
- **AI Quiz Generation**: Groq AI API integration with automatic model fallback (`qwen3.8-27b`, `gpt-oss-120b`).
- **MySQL Database**: `PyMySQL` connection pool with auto-reconnect and transaction safety.
- **Admin Dashboard**: Full CRUD on quizzes, questions, results, and registered users.

---

## 🛠️ How to Run Locally

### 1. Install Dependencies
```bash
cd backend-python
pip install -r requirements.txt
```

### 2. Start the Server
```bash
python main.py
```
Or using `uvicorn`:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Open Interactive API Docs (Swagger UI)
Once the server is running, open:
🔗 **http://localhost:8000/docs**
