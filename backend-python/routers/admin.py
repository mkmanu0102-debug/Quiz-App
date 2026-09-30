import os
import re
import json
import requests
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from jose import jwt, JWTError

from database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])

JWT_SECRET = os.getenv("JWT_SECRET", "quizworld_secret_key_2024")
ALGORITHM = "HS256"

def verify_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided!")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin only!")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token!")

class GenerateQuizRequest(BaseModel):
    topic: str
    numQuestions: Any
    difficulty: str
    category: str

class UpdateQuizRequest(BaseModel):
    title: str
    category: str
    difficulty: str

class CustomQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int

class CreateQuizRequest(BaseModel):
    title: str
    category: str
    difficulty: str
    questions: List[CustomQuestion]

def generate_fallback_questions(topic: str, num_q: int, difficulty: str, category: str):
    templates = [
        ("What is a core principle of {topic}? (Concept #{i})", ["Primary operational standard", "Secondary auxiliary process", "Unrelated system component", "Deprecated legacy protocol"]),
        ("Which of the following is most commonly associated with {topic}?", ["High efficiency and structured methodology", "Random unorganized data", "Manual static configuration", "Temporary volatile memory"]),
        ("Why is {topic} important in modern {category}?", ["It increases system reliability and performance", "It reduces data security", "It slows down execution speed", "It has no practical application"]),
        ("What is a major advantage of using {topic}?", ["Enhanced performance and scalability", "Higher hardware requirement", "Complex implementation process", "Limited platform compatibility"]),
        ("Which tool or feature is frequently used alongside {topic}?", ["Automated analysis and optimization framework", "Legacy manual calculator", "Unformatted text editor", "Discontinued system driver"]),
        ("What key factor determines the effectiveness of {topic}?", ["Proper implementation and configuration", "Color scheme of the user interface", "Number of physical cables", "Time of day it is executed"]),
        ("In the context of {difficulty} level {topic}, what is a primary best practice?", ["Continuous testing and structured validation", "Ignoring error outputs", "Bypassing standard procedures", "Hardcoding temporary values"]),
        ("What happens when {topic} is misconfigured?", ["Unexpected system behavior or performance degradation", "Instant hardware upgrade", "Automatic database backup", "No effect whatsoever"]),
        ("Which layer or component handles {topic} processing?", ["Core logic and execution engine", "Physical outer casing", "Static display banner", "External power cord"]),
        ("What is a future trend or development direction for {topic}?", ["Increased automation and AI integration", "Complete reliance on paper documentation", "Reduction in execution speed", "Deprecating digital storage"])
    ]

    questions = []
    cat_name = category or "applications"
    for i in range(1, num_q + 1):
        idx = (i - 1) % len(templates)
        q_fmt, opts = templates[idx]
        q_text = q_fmt.format(topic=topic, i=i, category=cat_name, difficulty=difficulty)
        
        target_correct = i % 4
        shuffled_opts = list(opts)
        shuffled_opts[0], shuffled_opts[target_correct] = shuffled_opts[target_correct], shuffled_opts[0]
        
        questions.append({
            "question": q_text,
            "options": shuffled_opts,
            "correct": target_correct
        })
    return questions

# 1. AI Generate Quiz
@router.post("/generate-quiz")
def generate_quiz(req: GenerateQuizRequest, admin: dict = Depends(verify_admin)):
    api_key = os.getenv("GEMINI_API_KEY")
    num_q = int(req.numQuestions) if str(req.numQuestions).isdigit() else 5
    
    questions = None

    if api_key and api_key.startswith("gsk_"):
        prompt = f"""Generate {num_q} multiple choice questions on "{req.topic}" at {req.difficulty} difficulty level.
Return ONLY a JSON array like this:
[
  {{
    "question": "Question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }}
]
No extra text, only JSON array."""

        models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "qwen/qwen3.8-27b", "openai/gpt-oss-120b"]
        data = None

        for model in models:
            try:
                res = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7
                    },
                    timeout=15
                )
                res_json = res.json()
                if "choices" in res_json and len(res_json["choices"]) > 0:
                    data = res_json
                    break
                else:
                    print(f"Model {model} failed: {res_json}")
            except Exception as e:
                print(f"Model {model} exception: {e}")

        if data and "choices" in data and len(data["choices"]) > 0:
            content = data["choices"][0]["message"]["content"]
            json_match = re.search(r'\[[\s\S]*\]', content)
            if json_match:
                try:
                    questions = json.loads(json_match.group(0))
                except Exception as e:
                    print("JSON parse error:", e)

    if not questions or not isinstance(questions, list) or len(questions) == 0:
        print("⚠️ Groq API key expired/invalid or failed. Using Question Synthesizer fallback.")
        questions = generate_fallback_questions(req.topic, num_q, req.difficulty, req.category)

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO quizzes (title, category, difficulty, total_questions) VALUES (%s, %s, %s, %s)",
                (req.topic, req.category, req.difficulty, len(questions))
            )
            quiz_id = cursor.lastrowid

            for q in questions:
                correct_ans = q.get("correct", q.get("correct_answer", 0))
                cursor.execute(
                    "INSERT INTO questions (quiz_id, question, options, correct_answer) VALUES (%s, %s, %s, %s)",
                    (quiz_id, q.get("question", ""), json.dumps(q.get("options", [])), correct_ans)
                )
        conn.close()
        return {"message": "Quiz generated and saved!", "quizId": quiz_id}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# 2. Get Quizzes (Admin)
@router.get("/quizzes")
def get_admin_quizzes(admin: dict = Depends(verify_admin)):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM quizzes ORDER BY created_at DESC")
            quizzes = cursor.fetchall()
        conn.close()
        return quizzes
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# 3. Delete Quiz
@router.delete("/quiz/{quiz_id}")
def delete_quiz(quiz_id: int, admin: dict = Depends(verify_admin)):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM results WHERE quiz_id = %s", (quiz_id,))
            cursor.execute("DELETE FROM questions WHERE quiz_id = %s", (quiz_id,))
            cursor.execute("DELETE FROM quizzes WHERE id = %s", (quiz_id,))
        conn.close()
        return {"message": "Quiz deleted!"}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# 4. Update Quiz
@router.put("/quiz/{quiz_id}")
def update_quiz(quiz_id: int, req: UpdateQuizRequest, admin: dict = Depends(verify_admin)):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE quizzes SET title = %s, category = %s, difficulty = %s WHERE id = %s",
                (req.title, req.category, req.difficulty, quiz_id)
            )
        conn.close()
        return {"message": "Quiz updated!"}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# 5. Get Users
@router.get("/users")
def get_users(admin: dict = Depends(verify_admin)):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, email, created_at FROM users")
            users = cursor.fetchall()
        conn.close()
        return users
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# 6. Get Results
@router.get("/results")
def get_results(admin: dict = Depends(verify_admin)):
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT r.*, u.name, u.email, q.title
                FROM results r
                JOIN users u ON r.user_id = u.id
                JOIN quizzes q ON r.quiz_id = q.id
                ORDER BY r.created_at DESC
            """)
            results = cursor.fetchall()
        conn.close()
        return results
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

# 7. Create Custom Quiz
@router.post("/create-quiz")
def create_quiz(req: CreateQuizRequest, admin: dict = Depends(verify_admin)):
    if not req.title or not req.category or not req.difficulty or not req.questions:
        raise HTTPException(status_code=400, detail="All fields are required!")

    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO quizzes (title, category, difficulty, total_questions) VALUES (%s, %s, %s, %s)",
                (req.title, req.category, req.difficulty, len(req.questions))
            )
            quiz_id = cursor.lastrowid

            for q in req.questions:
                cursor.execute(
                    "INSERT INTO questions (quiz_id, question, options, correct_answer) VALUES (%s, %s, %s, %s)",
                    (quiz_id, q.question, json.dumps(q.options), q.correct_answer)
                )
        conn.close()
        return {"message": "Quiz created successfully!", "quizId": quiz_id}
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")
