"""User model."""
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.database import Base


class User(Base):
    """User model for customers."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    location = Column(JSON, nullable=True)  # {lat, lng, address}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, name={self.name}, phone={self.phone})>"
