"""Packer model."""
from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.database import Base


class Packer(Base):
    """Packer model for service providers."""
    
    __tablename__ = "packers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    lat = Column(DECIMAL(10, 8), nullable=False, index=True)
    lng = Column(DECIMAL(11, 8), nullable=False, index=True)
    inventory = Column(JSON, nullable=False, default={})  # {material_name: quantity}
    available = Column(Boolean, default=True, index=True)
    rating = Column(DECIMAL(3, 2), default=5.00)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="packer")
    
    def __repr__(self):
        return f"<Packer(id={self.id}, name={self.name}, available={self.available})>"
