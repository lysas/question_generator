import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def verify():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, user_email, source, model, created_at FROM public.questions;")
            rows = cur.fetchall()
            print("\n=== DATABASE CONTENTS ===")
            if not rows:
                print("The 'questions' table is currently empty.")
            else:
                print(f"Found {len(rows)} record(s):")
                for row in rows:
                    print(f"ID: {row[0]} | Email: {row[1]} | Source: {row[2]} | Model: {row[3]} | Time: {row[4]}")
            print("=========================\n")
    except Exception as e:
        print(f"Error reading database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    verify()
