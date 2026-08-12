from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=True)
    phone_number = Column(String, unique=True, nullable=True)
    device_fingerprint = Column(String, nullable=True)
    tiktok_username = Column(String, nullable=True)
    niche = Column(String, nullable=True)
    posting_frequency = Column(String, nullable=True)
    voice_preference = Column(Integer, default=1)
    is_paid = Column(Boolean, default=False)
    trial_start_date = Column(DateTime, default=datetime.utcnow)
    trial_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    verdicts = relationship("Verdict", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")

class Verdict(Base):
    __tablename__ = "verdicts"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    assignment = Column(Text, nullable=True)
    posted_after = Column(Boolean, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="verdicts")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    date = Column(String, nullable=False)
    session_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="chat_sessions")

class DeviceRecord(Base):
    __tablename__ = "device_records"
    id = Column(String, primary_key=True)
    fingerprint = Column(String, unique=True, nullable=False)
    user_id = Column(String, nullable=True)
    trial_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class PhoneRecord(Base):
    __tablename__ = "phone_records"
    id = Column(String, primary_key=True)
    phone_number = Column(String, unique=True, nullable=False)
    user_id = Column(String, nullable=True)
    trial_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ResponseCache(Base):
    __tablename__ = "response_cache"
    id = Column(String, primary_key=True)
    prompt_hash = Column(String, unique=True, nullable=False)
    response = Column(Text, nullable=False)
    hit_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
