"""Packer management routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models.database import get_db
from models.packer import Packer
from models.order import Order
from schemas.packer import PackerResponse, PackerLocationUpdate, PackerAvailabilityUpdate
from schemas.order import OrderResponse
from api.deps import get_current_packer
from core.constants import OrderStatus
from services.dispatcher import Dispatcher
from services.pricing_engine import PricingEngine
from services.inventory import InventoryManager
from models.tracking import TrackingEvent

router = APIRouter(prefix="/packers", tags=["Packers"])


@router.get("/me", response_model=PackerResponse)
def get_packer_profile(current_packer: Packer = Depends(get_current_packer)):
    """
    Get current packer profile.
    
    Args:
        current_packer: Authenticated packer
        
    Returns:
        Packer profile
    """
    return current_packer


@router.patch("/me/location", response_model=PackerResponse)
def update_packer_location(
    location_update: PackerLocationUpdate,
    current_packer: Packer = Depends(get_current_packer),
    db: Session = Depends(get_db)
):
    """
    Update packer location.
    
    Args:
        location_update: New location data
        current_packer: Authenticated packer
        db: Database session
        
    Returns:
        Updated packer profile
    """
    current_packer.lat = location_update.lat
    current_packer.lng = location_update.lng
    
    db.commit()
    db.refresh(current_packer)
    
    return current_packer


@router.patch("/me/availability", response_model=PackerResponse)
def update_packer_availability(
    availability_update: PackerAvailabilityUpdate,
    current_packer: Packer = Depends(get_current_packer),
    db: Session = Depends(get_db)
):
    """
    Update packer availability status.
    
    Args:
        availability_update: New availability status
        current_packer: Authenticated packer
        db: Database session
        
    Returns:
        Updated packer profile
    """
    current_packer.available = availability_update.available
    
    db.commit()
    db.refresh(current_packer)
    
    return current_packer


@router.get("/me/orders", response_model=List[OrderResponse])
def get_packer_orders(
    current_packer: Packer = Depends(get_current_packer),
    db: Session = Depends(get_db)
):
    """
    Get all orders assigned to current packer.
    
    Args:
        current_packer: Authenticated packer
        db: Database session
        
    Returns:
        List of orders
    """
    orders = db.query(Order).filter(
        Order.packer_id == current_packer.id
    ).order_by(Order.created_at.desc()).all()
    
    return orders


@router.get("/live-orders", response_model=List[OrderResponse])
def get_live_orders(
    current_packer: Packer = Depends(get_current_packer),
    db: Session = Depends(get_db)
):
    """
    Get all live/unassigned orders nearby (Gig Economy Model).
    """
    if not current_packer.available:
        return []

    # Get all unassigned orders
    orders = db.query(Order).filter(
        Order.status == OrderStatus.CREATED
    ).order_by(Order.created_at.desc()).all()
    
    # Filter out orders where packer doesn't have enough inventory
    valid_orders = []
    for order in orders:
        if Dispatcher.check_inventory_sufficient(current_packer.inventory, order.materials_required):
            # Optional: Calculate distance and only include if within radius
            valid_orders.append(order)
            
    return valid_orders


@router.post("/orders/{order_id}/accept", response_model=OrderResponse)
def accept_order(
    order_id: int,
    current_packer: Packer = Depends(get_current_packer),
    db: Session = Depends(get_db)
):
    """
    Accept an unassigned live order.
    """
    if not current_packer.available:
        raise HTTPException(status_code=400, detail="You must be online to accept orders")

    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    if order.status != OrderStatus.CREATED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order has already been accepted or cancelled"
        )
        
    # Check inventory
    if not Dispatcher.check_inventory_sufficient(current_packer.inventory, order.materials_required):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You do not have sufficient inventory to accept this order"
        )
        
    # Calculate distance
    distance = Dispatcher.haversine_distance(
        float(current_packer.lat), float(current_packer.lng), 
        order.pickup_location["lat"], order.pickup_location["lng"]
    )
    
    # Update order with packer and distance
    order.packer_id = current_packer.id
    order.distance_km = distance
    order.status = OrderStatus.PACKER_ASSIGNED
    
    # Recalculate price with actual distance
    price_breakdown = PricingEngine.calculate_price(
        category=order.category,
        materials=order.materials_required,
        distance_km=distance,
        urgency=order.urgency
    )
    order.price = price_breakdown["final_price"]
    
    # Deduct inventory
    updated_inventory = Dispatcher.deduct_inventory(current_packer, order.materials_required)
    InventoryManager.update_packer_inventory(db, current_packer, updated_inventory)
    
    # Create tracking event
    tracking_event = TrackingEvent(
        order_id=order.id,
        status=OrderStatus.PACKER_ASSIGNED,
        message=f"Packer {current_packer.name} has accepted your order and is {distance} km away.",
        packer_lat=current_packer.lat,
        packer_lng=current_packer.lng
    )
    db.add(tracking_event)
    db.commit()
    db.refresh(order)
    
    return order


@router.get("/{packer_id}", response_model=PackerResponse)
def get_packer(packer_id: int, db: Session = Depends(get_db)):
    """
    Get packer details by ID.
    
    Args:
        packer_id: Packer ID
        db: Database session
        
    Returns:
        Packer details
        
    Raises:
        HTTPException: If packer not found
    """
    packer = db.query(Packer).filter(Packer.id == packer_id).first()
    
    if not packer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Packer not found"
        )
    
    return packer
