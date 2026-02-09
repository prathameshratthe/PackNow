"""Order model."""
from sqlalchemy import Column, Integer, String, DateTime, JSON, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.database import Base


class Order(Base):
    """Order model for packaging requests."""
    
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    packer_id = Column(Integer, ForeignKey("packers.id"), nullable=True, index=True)
    status = Column(String(50), nullable=False, index=True)  # OrderStatus enum values
    category = Column(String(100), nullable=False)  # PackagingCategory enum values
    item_dimensions = Column(JSON, nullable=False)  # {length, width, height, weight}
    fragility_level = Column(String(20), nullable=True)  # FragilityLevel enum values
    urgency = Column(String(20), nullable=True)  # UrgencyLevel enum values
    materials_required = Column(JSON, nullable=False)  # {material_name: quantity}
    price = Column(DECIMAL(10, 2), nullable=False)
    distance_km = Column(DECIMAL(5, 2), nullable=True)
    pickup_location = Column(JSON, nullable=False)  # {lat, lng, address}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="orders")
    packer = relationship("Packer", back_populates="orders")
    
    def __repr__(self):
        return f"<Order(id={self.id}, status={self.status}, category={self.category})>"
