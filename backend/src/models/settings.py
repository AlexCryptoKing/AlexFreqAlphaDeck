"""
System settings for dashboard configuration
"""

from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer
from src.models import Base

class SystemSetting(Base):
    """Key-value store for system settings"""
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
