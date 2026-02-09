"""Order management routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from models.database import get_db
from models.user import User
from models.order import Order
from models.packer import Packer
from schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    MaterialEstimateRequest,
    MaterialEstimateResponse,
    PriceEstimateRequest,
    PriceEstimateResponse
)
from api.deps import get_current_user, get_current_packer
from services.material_estimator import MaterialEstimator
from services.pricing_engine import PricingEngine
from services.dispatcher import Dispatcher
from services.inventory import InventoryManager
from core.constants import OrderStatus


router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/estimate/materials", response_model=MaterialEstimateResponse)
def estimate_materials(request: MaterialEstimateRequest):
    """
    Estimate required materials for packaging.
    
    Args:
        request: Material estimation request
        
    Returns:
        Estimated materials and cost
    """
    dimensions_dict = request.item_dimensions.dict()
    
    materials, box_size = MaterialEstimator.estimate_materials(
        category=request.category,
        dimensions=dimensions_dict,
        fragility=request.fragility_level
    )
    
    material_cost = MaterialEstimator.calculate_material_cost(materials)
    
    return {
        "materials": materials,
        "material_cost": material_cost,
        "estimated_box_size": box_size
    }


@router.post("/estimate/price", response_model=PriceEstimateResponse)
def estimate_price(request: PriceEstimateRequest):
    """
    Estimate price for an order.
    
    Args:
        request: Price estimation request
        
    Returns:
        Price breakdown
    """
    dimensions_dict = request.item_dimensions.dict()
    
    # Get materials first
    materials, _ = MaterialEstimator.estimate_materials(
        category=request.category,
        dimensions=dimensions_dict,
        fragility=request.fragility_level
    )
    
    # Calculate price
    price_breakdown = PricingEngine.calculate_price(
        category=request.category,
        materials=materials,
        distance_km=request.distance_km,
        urgency=request.urgency
    )
    
    return price_breakdown


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new packaging order.
    
    Args:
        order_data: Order creation data
        background_tasks: Background task manager
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Created order
    """
    # Estimate materials
    dimensions_dict = order_data.item_dimensions.dict()
    materials, _ = MaterialEstimator.estimate_materials(
        category=order_data.category,
        dimensions=dimensions_dict,
        fragility=order_data.fragility_level
    )
    
    # Calculate initial price (distance will be updated after packer assignment)
    price_breakdown = PricingEngine.calculate_price(
        category=order_data.category,
        materials=materials,
        distance_km=0,  # Will be updated
        urgency=order_data.urgency
    )
    
    # Create order
    new_order = Order(
        user_id=current_user.id,
        status=OrderStatus.CREATED,
        category=order_data.category,
        item_dimensions=dimensions_dict,
        fragility_level=order_data.fragility_level,
        urgency=order_data.urgency,
        materials_required=materials,
        price=price_breakdown["final_price"],
        pickup_location=order_data.pickup_location.dict()
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # Dispatch packer in background
    background_tasks.add_task(dispatch_packer, new_order.id, db)
    
    return new_order


def dispatch_packer(order_id: int, db: Session):
    """
    Background task to assign packer to order.
    
    Args:
        order_id: Order ID
        db: Database session
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        return
    
    # Find nearest packer
    result = Dispatcher.find_nearest_packer(
        db=db,
        order_location=order.pickup_location,
        required_materials=order.materials_required
    )
    
    if result:
        packer, distance = result
        
        # Update order with packer and distance
        order.packer_id = packer.id
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
        updated_inventory = Dispatcher.deduct_inventory(packer, order.materials_required)
        InventoryManager.update_packer_inventory(db, packer, updated_inventory)
        
        db.commit()


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get order details.
    
    Args:
        order_id: Order ID
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Order details
        
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
            detail="Not authorized to access this order"
        )
    
    return order


@router.get("", response_model=List[OrderResponse])
def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all orders for current user.
    
    Args:
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of orders
    """
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return orders


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    current_packer: Packer = Depends(get_current_packer),
    db: Session = Depends(get_db)
):
    """
    Update order status (packer only).
    
    Args:
        order_id: Order ID
        status_update: New status
        current_packer: Authenticated packer
        db: Database session
        
    Returns:
        Updated order
        
    Raises:
        HTTPException: If order not found or unauthorized
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.packer_id != current_packer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this order"
        )
    
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an order.
    
    Args:
        order_id: Order ID
        current_user: Authenticated user
        db: Database session
        
    Raises:
        HTTPException: If order not found, unauthorized, or already completed
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
            detail="Not authorized to cancel this order"
        )
    
    if order.status in [OrderStatus.COMPLETED, OrderStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed or already cancelled order"
        )
    
    # Return inventory to packer if assigned
    if order.packer_id:
        packer = db.query(Packer).filter(Packer.id == order.packer_id).first()
        if packer:
            updated_inventory = Dispatcher.return_inventory(packer, order.materials_required)
            InventoryManager.update_packer_inventory(db, packer, updated_inventory)
    
    order.status = OrderStatus.CANCELLED
    db.commit()
