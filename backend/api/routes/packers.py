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
