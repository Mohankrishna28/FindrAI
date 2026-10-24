import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

database_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
if database_url:
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = database_url
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if os.environ.get("VERCEL"):
        DB_PATH = "/tmp/lost_and_found.db"
    else:
        DB_PATH = os.path.join(BASE_DIR, "lost_and_found.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    # Ensure SQLite handles threads properly and enforces foreign keys
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
