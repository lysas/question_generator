import os
import psycopg2
import json
from typing import Any, Dict

class SupabaseWriter:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        if not self.db_url:
            raise ValueError("DATABASE_URL not set in .env")

    def insert_question(self, data: Dict[str, Any]):
        """Insert a row into the `questions` table using direct PostgreSQL connection.
        Expected keys: user_id, user_main_id, user_email, source, prompt, response, model, cost, tokens, created_at
        """
        conn = psycopg2.connect(self.db_url)
        try:
            with conn.cursor() as cur:
                # Ensure all data values are primitive types (convert dict/list to JSON string)
                processed_data = {}
                for k, v in data.items():
                    if isinstance(v, (dict, list)):
                        processed_data[k] = json.dumps(v)
                    else:
                        processed_data[k] = v

                # Dynamically build column list; include all provided keys (including is_default)
                columns = list(processed_data.keys())
                placeholders = ','.join(['%s'] * len(columns))
                query = f"INSERT INTO public.questions ({','.join(columns)}) VALUES ({placeholders})"
            conn.commit()
            return {"status": "success"}
        except Exception as e:
            conn.rollback()
            raise RuntimeError(f"Database insert failed: {str(e)}")
        finally:
            conn.close()
