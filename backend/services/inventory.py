"""Inventory management service."""
from typing import Dict
from sqlalchemy.orm import Session

from models.packer import Packer
from core.config import settings


class InventoryManager:
    """Service for managing packer inventory."""
    
    @staticmethod
    def update_packer_inventory(
        db: Session,
        packer: Packer,
        new_inventory: Dict[str, int]
    ) -> Packer:
        """
        Update packer inventory and availability status.
        
        Args:
            db: Database session
            packer: Packer model instance
            new_inventory: New inventory dictionary
            
        Returns:
            Updated packer instance
        """
        packer.inventory = new_inventory
        
        # Check if any material is low and update availability
        has_low_inventory = InventoryManager.check_low_inventory(new_inventory)
        
        if has_low_inventory:
            packer.available = False
        
        db.commit()
        db.refresh(packer)
        
        return packer
    
    @staticmethod
    def check_low_inventory(inventory: Dict[str, int]) -> bool:
        """
        Check if any material in inventory is below threshold.
        
        Args:
            inventory: Inventory dictionary
            
        Returns:
            True if any material is low, False otherwise
        """
        for material, quantity in inventory.items():
            if quantity < settings.LOW_INVENTORY_THRESHOLD:
                return True
        return False
    
    @staticmethod
    def get_low_inventory_items(inventory: Dict[str, int]) -> Dict[str, int]:
        """
        Get list of materials that are low in inventory.
        
        Args:
            inventory: Inventory dictionary
            
        Returns:
            Dictionary of low inventory items
        """
        low_items = {}
        
        for material, quantity in inventory.items():
            if quantity < settings.LOW_INVENTORY_THRESHOLD:
                low_items[material] = quantity
        
        return low_items
    
    @staticmethod
    def restock_inventory(
        db: Session,
        packer: Packer,
        restock_items: Dict[str, int]
    ) -> Packer:
        """
        Restock packer inventory.
        
        Args:
            db: Database session
            packer: Packer model instance
            restock_items: Items to restock
            
        Returns:
            Updated packer instance
        """
        updated_inventory = packer.inventory.copy()
        
        for material, quantity in restock_items.items():
            if material in updated_inventory:
                updated_inventory[material] += quantity
            else:
                updated_inventory[material] = quantity
        
        return InventoryManager.update_packer_inventory(db, packer, updated_inventory)
