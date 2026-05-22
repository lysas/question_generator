import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def create_table():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS public.questions (
                id SERIAL PRIMARY KEY,
                user_main_id TEXT,
                user_id TEXT,
                user_email TEXT,
                source TEXT,
                prompt TEXT,
                response JSONB,
                model TEXT,
                cost FLOAT,
                tokens JSONB,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """)
        conn.commit()
        print("✅ Successfully created 'questions' table!")
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to create table: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_table()
