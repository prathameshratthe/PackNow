"""Order tracking routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models.database import get_db
from models.user import User
from models.order import Order
from models.packer import Packer
from models.tracking import TrackingEvent
from schemas.tracking import TrackingTimelineResponse, TrackingEventResponse
from api.deps import get_current_user


router = APIRouter(prefix="/orders", tags=["Tracking"])


@router.get("/{order_id}/tracking", response_model=TrackingTimelineResponse)
def get_order_tracking(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get full tracking timeline for an order.
    
    Args:
        order_id: Order ID
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Tracking timeline with events and packer info
        
    Raises:
        HTTPException: If order not found or unauthorized
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to track this order"
        )
    
    # Get tracking events in chronological order
    events = db.query(TrackingEvent).filter(
        TrackingEvent.order_id == order_id
    ).order_by(TrackingEvent.created_at.asc()).all()
    
    # Get packer info if assigned
    packer_name = None
    packer_phone = None
    packer_rating = None
    packer_lat = None
    packer_lng = None
    
    if order.packer_id:
        packer = db.query(Packer).filter(Packer.id == order.packer_id).first()
        if packer:
            packer_name = packer.name
            packer_phone = packer.phone
            packer_rating = float(packer.rating)
            packer_lat = float(packer.lat)
            packer_lng = float(packer.lng)
    
    return {
        "order_id": order.id,
        "current_status": order.status,
        "packer_name": packer_name,
        "packer_phone": packer_phone,
        "packer_rating": packer_rating,
        "packer_lat": packer_lat,
        "packer_lng": packer_lng,
        "delivery_otp": order.delivery_otp,
        "events": events
    }
