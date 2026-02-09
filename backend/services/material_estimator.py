"""Material estimation service."""
from typing import Dict, Tuple
import math

from core.constants import (
    PackagingCategory,
    FragilityLevel,
    BOX_SIZES,
    MATERIAL_TYPES,
)


class MaterialEstimator:
    """Service for estimating required packaging materials."""
    
    @staticmethod
    def calculate_volume(length: float, width: float, height: float) -> float:
        """
        Calculate volume of an item.
        
        Args:
            length: Length in cm
            width: Width in cm
            height: Height in cm
            
        Returns:
            Volume in cubic cm
        """
        return length * width * height
    
    @staticmethod
    def determine_box_size(volume: float) -> str:
        """
        Determine appropriate box size based on volume.
        
        Args:
            volume: Item volume in cubic cm
            
        Returns:
            Box size name
        """
        for size, specs in BOX_SIZES.items():
            if volume <= specs["max_volume"]:
                return size
        return "extra_large"
    
    @staticmethod
    def calculate_bubble_wrap(dimensions: Dict[str, float], fragility: str) -> float:
        """
        Calculate required bubble wrap in meters.
        
        Args:
            dimensions: Item dimensions dict
            fragility: Fragility level
            
        Returns:
            Bubble wrap length in meters
        """
        # Calculate surface area (simplified)
        l, w, h = dimensions["length"], dimensions["width"], dimensions["height"]
        surface_area = 2 * (l*w + w*h + h*l)
        
        # Convert to meters and add buffer
        base_meters = (surface_area / 10000) * 1.5  # Convert cm² to m² and add 50% buffer
        
        # Adjust based on fragility
        fragility_multipliers = {
            FragilityLevel.LOW: 1.0,
            FragilityLevel.MEDIUM: 1.5,
            FragilityLevel.HIGH: 2.0,
        }
        
        multiplier = fragility_multipliers.get(fragility, 1.0)
        return round(base_meters * multiplier, 1)
    
    @staticmethod
    def estimate_materials(
        category: str,
        dimensions: Dict[str, float],
        fragility: str
    ) -> Tuple[Dict[str, float], str]:
        """
        Estimate required materials for packaging.
        
        Args:
            category: Packaging category
            dimensions: Item dimensions
            fragility: Fragility level
            
        Returns:
            Tuple of (materials dict, box size)
        """
        materials = {}
        
        # Calculate volume and determine box size
        volume = MaterialEstimator.calculate_volume(
            dimensions["length"],
            dimensions["width"],
            dimensions["height"]
        )
        box_size = MaterialEstimator.determine_box_size(volume)
        
        # Base materials for all categories
        box_key = f"cardboard_box_{box_size}"
        materials[box_key] = 1.0
        materials["packing_tape"] = 1.0
        
        # Category-specific materials
        if category == PackagingCategory.ELECTRONICS:
            # Electronics need extra protection
            bubble_wrap = MaterialEstimator.calculate_bubble_wrap(dimensions, fragility)
            materials["bubble_wrap"] = bubble_wrap
            
            if fragility in [FragilityLevel.MEDIUM, FragilityLevel.HIGH]:
                materials["foam_sheet"] = 2.0
                materials["fragile_sticker"] = 2.0
            
            # High fragility electronics get double boxing
            if fragility == FragilityLevel.HIGH:
                materials[box_key] = 2.0  # Double box
                materials["foam_sheet"] = 4.0
                materials["bubble_wrap"] = bubble_wrap * 1.5
        
        elif category == PackagingCategory.GIFT:
            # Gift wrapping materials
            materials["gift_wrapping_paper"] = 2.0
            materials["ribbon"] = 1.5
            # Remove cardboard box, use gift box instead
            del materials[box_key]
            materials["cardboard_box_medium"] = 1.0  # Gift box
        
        elif category == PackagingCategory.FOOD:
            # Food packaging
            materials["insulated_box"] = 1.0
            materials["cooling_pack"] = 2.0
            del materials[box_key]  # Use insulated box instead
        
        elif category == PackagingCategory.DOCUMENTS:
            # Document packaging
            materials["waterproof_envelope"] = 1.0
            materials["cardboard_box_small"] = 1.0  # Rigid backing
            del materials[box_key]
        
        elif category == PackagingCategory.FRAGILE_ITEMS:
            # Extra protection for fragile items
            bubble_wrap = MaterialEstimator.calculate_bubble_wrap(dimensions, FragilityLevel.HIGH)
            materials["bubble_wrap"] = bubble_wrap
            materials["foam_sheet"] = 4.0
            materials["fragile_sticker"] = 4.0
            materials[box_key] = 2.0  # Double box
        
        elif category == PackagingCategory.HOUSE_SHIFTING:
            # House shifting needs heavy-duty materials
            materials["packing_tape"] = 3.0  # Extra tape
            materials["label_sticker"] = 5.0  # Multiple labels
            bubble_wrap = MaterialEstimator.calculate_bubble_wrap(dimensions, fragility)
            materials["bubble_wrap"] = bubble_wrap
        
        elif category == PackagingCategory.BUSINESS_ORDERS:
            # Professional packaging
            bubble_wrap = MaterialEstimator.calculate_bubble_wrap(dimensions, fragility)
            materials["bubble_wrap"] = bubble_wrap
            materials["fragile_sticker"] = 1.0
        
        return materials, box_size
    
    @staticmethod
    def calculate_material_cost(materials: Dict[str, float]) -> float:
        """
        Calculate total cost of materials.
        
        Args:
            materials: Dictionary of material names and quantities
            
        Returns:
            Total cost
        """
        total_cost = 0.0
        
        for material_name, quantity in materials.items():
            if material_name in MATERIAL_TYPES:
                unit_cost = MATERIAL_TYPES[material_name]["base_cost"]
                total_cost += unit_cost * quantity
        
        return round(total_cost, 2)
