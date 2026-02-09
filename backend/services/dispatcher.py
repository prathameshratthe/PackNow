"""Dispatcher service for packer assignment."""
from typing import Optional, Dict, List, Tuple
import math
from sqlalchemy.orm import Session

from models.packer import Packer
from core.config import settings


class Dispatcher:
    """Service for assigning packers to orders."""
    
    @staticmethod
    def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate distance between two points using Haversine formula.
        
        Args:
            lat1: Latitude of point 1
            lng1: Longitude of point 1
            lat2: Latitude of point 2
            lng2: Longitude of point 2
            
        Returns:
            Distance in kilometers
        """
        # Earth radius in kilometers
        R = 6371.0
        
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lng1_rad = math.radians(lng1)
        lat2_rad = math.radians(lat2)
        lng2_rad = math.radians(lng2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad
        
        a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        distance = R * c
        return round(distance, 2)
    
    @staticmethod
    def check_inventory_sufficient(
        packer_inventory: Dict[str, int],
        required_materials: Dict[str, float]
    ) -> bool:
        """
        Check if packer has sufficient inventory.
        
        Args:
            packer_inventory: Packer's current inventory
            required_materials: Required materials for order
            
        Returns:
            True if inventory is sufficient, False otherwise
        """
        for material, required_qty in required_materials.items():
            current_qty = packer_inventory.get(material, 0)
            if current_qty < required_qty:
                return False
        return True
    
    @staticmethod
    def find_nearest_packer(
        db: Session,
        order_location: Dict[str, float],
        required_materials: Dict[str, float]
    ) -> Optional[Tuple[Packer, float]]:
        """
        Find the nearest available packer with sufficient inventory.
        
        Args:
            db: Database session
            order_location: Order pickup location {lat, lng}
            required_materials: Required materials for order
            
        Returns:
            Tuple of (Packer, distance) or None if no packer found
        """
        # Get all available packers
        available_packers = db.query(Packer).filter(
            Packer.available == True
        ).all()
        
        if not available_packers:
            return None
        
        # Calculate distances and filter by inventory
        qualified_packers: List[Tuple[Packer, float]] = []
        
        for packer in available_packers:
            # Check inventory
            if not Dispatcher.check_inventory_sufficient(
                packer.inventory,
                required_materials
            ):
                continue
            
            # Calculate distance
            distance = Dispatcher.haversine_distance(
                float(packer.lat),
                float(packer.lng),
                order_location["lat"],
                order_location["lng"]
            )
            
            # Only consider packers within search radius
            if distance <= settings.DEFAULT_PACKER_SEARCH_RADIUS_KM:
                qualified_packers.append((packer, distance))
        
        if not qualified_packers:
            return None
        
        # Sort by distance (ascending), then by rating (descending)
        qualified_packers.sort(key=lambda x: (x[1], -float(x[0].rating)))
        
        # Return nearest packer
        return qualified_packers[0]
    
    @staticmethod
    def deduct_inventory(
        packer: Packer,
        required_materials: Dict[str, float]
    ) -> Dict[str, int]:
        """
        Deduct materials from packer inventory.
        
        Args:
            packer: Packer model instance
            required_materials: Materials to deduct
            
        Returns:
            Updated inventory
        """
        updated_inventory = packer.inventory.copy()
        
        for material, quantity in required_materials.items():
            if material in updated_inventory:
                updated_inventory[material] -= int(math.ceil(quantity))
                
                # Ensure inventory doesn't go negative
                if updated_inventory[material] < 0:
                    updated_inventory[material] = 0
        
        return updated_inventory
    
    @staticmethod
    def return_inventory(
        packer: Packer,
        materials_to_return: Dict[str, float]
    ) -> Dict[str, int]:
        """
        Return materials to packer inventory (e.g., when order is cancelled).
        
        Args:
            packer: Packer model instance
            materials_to_return: Materials to return
            
        Returns:
            Updated inventory
        """
        updated_inventory = packer.inventory.copy()
        
        for material, quantity in materials_to_return.items():
            if material in updated_inventory:
                updated_inventory[material] += int(math.ceil(quantity))
            else:
                updated_inventory[material] = int(math.ceil(quantity))
        
        return updated_inventory
