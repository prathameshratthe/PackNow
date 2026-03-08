"""Admin model."""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from models.database import Base


class Admin(Base):
    """Admin model for system administrators."""
    
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Admin(id={self.id}, name={self.name}, email={self.email})>"
