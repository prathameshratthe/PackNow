"""Analytics routes for admin reporting."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func, cast, Date
from datetime import datetime, timedelta

from models.database import get_db
from models.admin import Admin
from models.order import Order
from models.packer import Packer
from schemas.analytics import (
    RevenueTrendResponse,
    CategoryBreakdownResponse,
    PackerPerformanceResponse,
)
from api.deps import get_current_admin
from core.constants import OrderStatus


router = APIRouter(prefix="/admin/analytics", tags=["Analytics"])


@router.get("/revenue", response_model=RevenueTrendResponse)
def get_revenue_trend(
    days: int = Query(30, ge=7, le=365),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get daily revenue trend for the specified number of days."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    results = db.query(
        cast(Order.created_at, Date).label("date"),
        sql_func.sum(Order.price).label("revenue"),
        sql_func.count(Order.id).label("order_count")
    ).filter(
        Order.created_at >= start_date,
        Order.status != OrderStatus.CANCELLED
    ).group_by(
        cast(Order.created_at, Date)
    ).order_by(
        cast(Order.created_at, Date)
    ).all()
    
    data = [
        {
            "date": str(row.date),
            "revenue": float(row.revenue or 0),
            "order_count": row.order_count
        }
        for row in results
    ]
    
    return {"data": data}


@router.get("/categories", response_model=CategoryBreakdownResponse)
def get_category_breakdown(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get order breakdown by category."""
    results = db.query(
        Order.category,
        sql_func.count(Order.id).label("count"),
        sql_func.sum(Order.price).label("revenue")
    ).filter(
        Order.status != OrderStatus.CANCELLED
    ).group_by(
        Order.category
    ).all()
    
    data = [
        {
            "category": row.category.replace("_", " ").title(),
            "count": row.count,
            "revenue": float(row.revenue or 0)
        }
        for row in results
    ]
    
    return {"data": data}


@router.get("/packers", response_model=PackerPerformanceResponse)
def get_packer_performance(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get top packers by performance."""
    results = db.query(
        Packer.name,
        sql_func.count(Order.id).label("orders_completed"),
        Packer.rating,
        sql_func.sum(Order.price).label("revenue")
    ).outerjoin(
        Order, (Order.packer_id == Packer.id) & (Order.status == OrderStatus.COMPLETED)
    ).group_by(
        Packer.id, Packer.name, Packer.rating
    ).order_by(
        sql_func.count(Order.id).desc()
    ).all()
    
    data = [
        {
            "name": row.name,
            "orders_completed": row.orders_completed,
            "rating": float(row.rating),
            "revenue": float(row.revenue or 0)
        }
        for row in results
    ]
    
    return {"data": data}
