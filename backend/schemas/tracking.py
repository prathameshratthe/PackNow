"""Tracking event schemas for request/response validation."""
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class TrackingEventResponse(BaseModel):
    """Schema for a single tracking event."""
    id: int
    order_id: int
    status: str
    message: str
    packer_lat: Optional[float] = None
    packer_lng: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TrackingTimelineResponse(BaseModel):
    """Schema for full order tracking timeline."""
    order_id: int
    current_status: str
    packer_name: Optional[str] = None
    packer_phone: Optional[str] = None
    packer_rating: Optional[float] = None
    packer_lat: Optional[float] = None
    packer_lng: Optional[float] = None
    delivery_otp: Optional[str] = None
    events: List[TrackingEventResponse]
