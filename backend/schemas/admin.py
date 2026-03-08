"""Admin schemas for request/response validation."""
from typing import Optional, Dict, List
from pydantic import BaseModel, EmailStr
from datetime import datetime


class AdminLogin(BaseModel):
    """Schema for admin login."""
    email: str
    password: str


class AdminResponse(BaseModel):
    """Schema for admin response."""
    id: int
    name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    """Schema for admin dashboard statistics."""
    total_orders: int
    total_users: int
    total_packers: int
    total_revenue: float
    active_orders: int
    completed_orders: int
    cancelled_orders: int
    available_packers: int


class UserListItem(BaseModel):
    """Schema for user list in admin panel."""
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    order_count: int
    created_at: datetime


class PackerListItem(BaseModel):
    """Schema for packer list in admin panel."""
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    available: bool
    rating: float
    order_count: int
    inventory: Dict[str, int]
    created_at: datetime


class OrderListItem(BaseModel):
    """Schema for order list in admin panel."""
    id: int
    user_name: str
    packer_name: Optional[str] = None
    status: str
    category: str
    price: float
    distance_km: Optional[float] = None
    created_at: datetime
