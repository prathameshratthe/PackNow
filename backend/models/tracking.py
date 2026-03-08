"""Tracking event model."""
from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.database import Base


class TrackingEvent(Base):
    """Model for order tracking events."""
    
    __tablename__ = "tracking_events"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    message = Column(String(500), nullable=False)
    packer_lat = Column(DECIMAL(10, 8), nullable=True)
    packer_lng = Column(DECIMAL(11, 8), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="tracking_events")
    
    def __repr__(self):
        return f"<TrackingEvent(id={self.id}, order_id={self.order_id}, status={self.status})>"
