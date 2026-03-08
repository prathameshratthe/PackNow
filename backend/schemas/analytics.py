"""Analytics schemas for response validation."""
from typing import List
from pydantic import BaseModel


class RevenueTrendItem(BaseModel):
    """Schema for a single revenue trend data point."""
    date: str
    revenue: float
    order_count: int


class CategoryBreakdownItem(BaseModel):
    """Schema for category breakdown data point."""
    category: str
    count: int
    revenue: float


class PackerPerformanceItem(BaseModel):
    """Schema for packer performance data point."""
    name: str
    orders_completed: int
    rating: float
    revenue: float


class RevenueTrendResponse(BaseModel):
    """Schema for revenue trend response."""
    data: List[RevenueTrendItem]


class CategoryBreakdownResponse(BaseModel):
    """Schema for category breakdown response."""
    data: List[CategoryBreakdownItem]


class PackerPerformanceResponse(BaseModel):
    """Schema for packer performance response."""
    data: List[PackerPerformanceItem]
