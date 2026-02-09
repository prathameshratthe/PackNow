"""Packer schemas for request/response validation."""
from typing import Optional, Dict
from pydantic import BaseModel, EmailStr, constr, condecimal
from datetime import datetime


class PackerBase(BaseModel):
    """Base packer schema with common fields."""
    name: constr(min_length=1, max_length=255)
    phone: constr(pattern=r'^\+?[0-9]{10,15}$')
    email: Optional[EmailStr] = None


class PackerCreate(PackerBase):
    """Schema for packer registration."""
    password: constr(min_length=6)
    lat: condecimal(max_digits=10, decimal_places=8)
    lng: condecimal(max_digits=11, decimal_places=8)
    inventory: Dict[str, int] = {}


class PackerResponse(PackerBase):
    """Schema for packer response."""
    id: int
    lat: float
    lng: float
    inventory: Dict[str, int]
    available: bool
    rating: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class PackerLocationUpdate(BaseModel):
    """Schema for updating packer location."""
    lat: condecimal(max_digits=10, decimal_places=8)
    lng: condecimal(max_digits=11, decimal_places=8)


class PackerAvailabilityUpdate(BaseModel):
    """Schema for updating packer availability."""
    available: bool
