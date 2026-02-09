"""Order schemas for request/response validation."""
from typing import Optional, Dict
from pydantic import BaseModel, confloat, conint
from datetime import datetime

from core.constants import PackagingCategory, FragilityLevel, UrgencyLevel, OrderStatus


class ItemDimensions(BaseModel):
    """Schema for item dimensions."""
    length: confloat(gt=0)  # cm
    width: confloat(gt=0)   # cm
    height: confloat(gt=0)  # cm
    weight: confloat(gt=0)  # kg


class Location(BaseModel):
    """Schema for location data."""
    lat: float
    lng: float
    address: str


class OrderCreate(BaseModel):
    """Schema for creating an order."""
    category: PackagingCategory
    item_dimensions: ItemDimensions
    fragility_level: Optional[FragilityLevel] = FragilityLevel.LOW
    urgency: Optional[UrgencyLevel] = UrgencyLevel.NORMAL
    pickup_location: Location


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: int
    user_id: int
    packer_id: Optional[int] = None
    status: OrderStatus
    category: str
    item_dimensions: Dict
    fragility_level: Optional[str]
    urgency: Optional[str]
    materials_required: Dict[str, float]
    price: float
    distance_km: Optional[float]
    pickup_location: Dict
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status."""
    status: OrderStatus


class MaterialEstimateRequest(BaseModel):
    """Schema for material estimation request."""
    category: PackagingCategory
    item_dimensions: ItemDimensions
    fragility_level: Optional[FragilityLevel] = FragilityLevel.LOW


class MaterialEstimateResponse(BaseModel):
    """Schema for material estimation response."""
    materials: Dict[str, float]
    material_cost: float
    estimated_box_size: str


class PriceEstimateRequest(BaseModel):
    """Schema for price estimation request."""
    category: PackagingCategory
    item_dimensions: ItemDimensions
    fragility_level: Optional[FragilityLevel] = FragilityLevel.LOW
    urgency: Optional[UrgencyLevel] = UrgencyLevel.NORMAL
    distance_km: confloat(ge=0) = 0


class PriceEstimateResponse(BaseModel):
    """Schema for price estimation response."""
    base_price: float
    material_cost: float
    distance_charge: float
    urgency_multiplier: float
    category_multiplier: float
    final_price: float
