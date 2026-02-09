"""Pricing engine service."""
from typing import Dict

from core.config import settings
from core.constants import CATEGORY_MULTIPLIERS, PackagingCategory, UrgencyLevel
from services.material_estimator import MaterialEstimator


class PricingEngine:
    """Service for calculating dynamic pricing."""
    
    @staticmethod
    def calculate_price(
        category: str,
        materials: Dict[str, float],
        distance_km: float,
        urgency: str
    ) -> Dict[str, float]:
        """
        Calculate dynamic price for an order.
        
        Args:
            category: Packaging category
            materials: Dictionary of materials and quantities
            distance_km: Distance to packer in km
            urgency: Urgency level
            
        Returns:
            Dictionary with price breakdown
        """
        # Calculate material cost
        material_cost = MaterialEstimator.calculate_material_cost(materials)
        
        # Base price: materials + packing fee
        base_price = material_cost + settings.BASE_PACKING_FEE
        
        # Distance charge
        distance_charge = distance_km * settings.PRICE_PER_KM
        
        # Urgency multiplier
        urgency_multiplier = (
            settings.URGENT_MULTIPLIER 
            if urgency == UrgencyLevel.URGENT 
            else 1.0
        )
        
        # Category multiplier
        category_multiplier = CATEGORY_MULTIPLIERS.get(
            PackagingCategory(category), 
            1.0
        )
        
        # Final price calculation
        final_price = (base_price + distance_charge) * urgency_multiplier * category_multiplier
        
        return {
            "base_price": round(base_price, 2),
            "material_cost": round(material_cost, 2),
            "distance_charge": round(distance_charge, 2),
            "urgency_multiplier": urgency_multiplier,
            "category_multiplier": category_multiplier,
            "final_price": round(final_price, 2),
        }
