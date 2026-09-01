import json
import os
from typing import Optional, List, Any

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from jose import jwt, JWTError

from database import get_db

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

JWT_SECRET = os.getenv("JWT_SECRET", "quizworld_secret_key_2024")
ALGORITHM = "HS256"

def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided!")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token!")

class ResultRequest(BaseModel):
    quiz_id: int
    score: int
    total: int
    percentage: float

# 1. Leaderboard
@router.get("/leaderboard")
def get_leaderboard(user: dict = Depends(verify_token)):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT u.name, MAX(r.percentage) as best_score, COUNT(r.id) as attempts
                FROM results r
                JOIN users u ON r.user_id = u.id
                GROUP BY u.id, u.name
                ORDER BY best_score DESC
                LIMIT 10
            """)
            rows = cursor.fetchall()
        conn.close()
        return rows
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# 2. History
@router.get("/history")
def get_history(user: dict = Depends(verify_token)):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT r.*, q.title, q.category
                FROM results r
                JOIN quizzes q ON r.quiz_id = q.id
                WHERE r.user_id = %s
                ORDER BY r.created_at DESC
            """, (user["id"],))
            rows = cursor.fetchall()
        conn.close()
        return rows
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# 3. Submit Result
@router.post("/result")
def submit_result(req: ResultRequest, user: dict = Depends(verify_token)):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO results (user_id, quiz_id, score, total, percentage)
                VALUES (%s, %s, %s, %s, %s)
            """, (user["id"], req.quiz_id, req.score, req.total, req.percentage))
        conn.close()
        return {"message": "Result saved!"}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# 4. Get Quizzes
@router.get("")
@router.get("/")
def get_quizzes(user: dict = Depends(verify_token)):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM quizzes ORDER BY created_at DESC")
            quizzes = cursor.fetchall()
        conn.close()
        return quizzes
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# 5. Get Questions for a Quiz
@router.get("/{quiz_id}/questions")
def get_quiz_questions(quiz_id: int, user: dict = Depends(verify_token)):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM questions WHERE quiz_id = %s", (quiz_id,))
            questions = cursor.fetchall()
        conn.close()

        # Parse options if string
        for q in questions:
            if isinstance(q.get("options"), str):
                try:
                    q["options"] = json.loads(q["options"])
                except Exception:
                    pass
        return questions
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")
