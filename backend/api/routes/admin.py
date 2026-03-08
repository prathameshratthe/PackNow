"""Admin management routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func

from models.database import get_db
from models.admin import Admin
from models.user import User
from models.order import Order
from models.packer import Packer
from models.tracking import TrackingEvent
from schemas.admin import (
    DashboardStats,
    UserListItem,
    PackerListItem,
    OrderListItem,
)
from schemas.order import OrderResponse, OrderStatusUpdate
from api.deps import get_current_admin
from core.constants import OrderStatus


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics."""
    total_orders = db.query(Order).count()
    total_users = db.query(User).count()
    total_packers = db.query(Packer).count()
    
    total_revenue = db.query(sql_func.sum(Order.price)).filter(
        Order.status == OrderStatus.COMPLETED
    ).scalar() or 0.0
    
    active_orders = db.query(Order).filter(
        Order.status.in_([OrderStatus.CREATED, OrderStatus.PACKER_ASSIGNED, OrderStatus.ON_THE_WAY, OrderStatus.PACKED])
    ).count()
    
    completed_orders = db.query(Order).filter(Order.status == OrderStatus.COMPLETED).count()
    cancelled_orders = db.query(Order).filter(Order.status == OrderStatus.CANCELLED).count()
    available_packers = db.query(Packer).filter(Packer.available == True).count()
    
    return {
        "total_orders": total_orders,
        "total_users": total_users,
        "total_packers": total_packers,
        "total_revenue": float(total_revenue),
        "active_orders": active_orders,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "available_packers": available_packers,
    }


@router.get("/orders", response_model=List[OrderListItem])
def get_all_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all orders with optional filtering."""
    query = db.query(Order, User.name.label("user_name"), Packer.name.label("packer_name")).join(
        User, Order.user_id == User.id
    ).outerjoin(
        Packer, Order.packer_id == Packer.id
    )
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) |
            (User.phone.ilike(f"%{search}%")) |
            (Order.category.ilike(f"%{search}%"))
        )
    
    results = query.order_by(Order.created_at.desc()).all()
    
    return [
        {
            "id": order.id,
            "user_name": user_name,
            "packer_name": packer_name,
            "status": order.status,
            "category": order.category,
            "price": float(order.price),
            "distance_km": float(order.distance_km) if order.distance_km else None,
            "created_at": order.created_at,
        }
        for order, user_name, packer_name in results
    ]


@router.get("/users", response_model=List[UserListItem])
def get_all_users(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all registered users."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    
    return [
        {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "order_count": len(user.orders),
            "created_at": user.created_at,
        }
        for user in users
    ]


@router.get("/packers", response_model=List[PackerListItem])
def get_all_packers(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all registered packers."""
    packers = db.query(Packer).order_by(Packer.created_at.desc()).all()
    
    return [
        {
            "id": packer.id,
            "name": packer.name,
            "phone": packer.phone,
            "email": packer.email,
            "available": packer.available,
            "rating": float(packer.rating),
            "order_count": len(packer.orders),
            "inventory": packer.inventory,
            "created_at": packer.created_at,
        }
        for packer in packers
    ]


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
def admin_update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin override to update any order status."""
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order.status = status_update.status
    
    # Create tracking event for admin override
    tracking_event = TrackingEvent(
        order_id=order.id,
        status=status_update.status,
        message=f"Order status updated to {status_update.status} by admin."
    )
    db.add(tracking_event)
    
    db.commit()
    db.refresh(order)
    
    return order
