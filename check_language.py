import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT email, language FROM users WHERE email = 'shricker44@gmail.com'"))
    for row in result:
        print(row)