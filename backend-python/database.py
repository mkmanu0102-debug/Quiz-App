import os
import pymysql
import sqlite3
from pymysql.cursors import DictCursor
from dotenv import load_dotenv

load_dotenv()

class SQLiteDictCursor:
    def __init__(self, conn):
        self.conn = conn
        self.cursor = conn.cursor()
        self.lastrowid = None

    def execute(self, query, params=None):
        # Convert %s to ? for SQLite
        sql = query.replace("%s", "?")
        if params is None:
            params = ()
        self.cursor.execute(sql, params)
        self.lastrowid = self.cursor.lastrowid
        return self

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        colnames = [desc[0] for desc in self.cursor.description]
        return dict(zip(colnames, row))

    def fetchall(self):
        rows = self.cursor.fetchall()
        if not rows:
            return []
        colnames = [desc[0] for desc in self.cursor.description]
        return [dict(zip(colnames, row)) for row in rows]

    def close(self):
        self.cursor.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

class SQLiteConnectionAdapter:
    def __init__(self, sqlite_conn):
        self.sqlite_conn = sqlite_conn

    def cursor(self):
        return SQLiteDictCursor(self.sqlite_conn)

    def commit(self):
        self.sqlite_conn.commit()

    def close(self):
        self.sqlite_conn.close()

def init_sqlite():
    db_path = os.path.join(os.path.dirname(__file__), "quizworld_py.sqlite")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            total_questions INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            options TEXT NOT NULL,
            correct_answer INTEGER NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            quiz_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            total INTEGER NOT NULL,
            percentage REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    return conn

def get_db():
    try:
        conn = pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "quizworld"),
            cursorclass=DictCursor,
            autocommit=True,
            connect_timeout=3,
            charset="utf8mb4"
        )
        return conn
    except Exception as e:
        print(f"⚠️ PyMySQL connection failed ({e}). Falling back to local SQLite database.")
        sqlite_conn = init_sqlite()
        return SQLiteConnectionAdapter(sqlite_conn)
