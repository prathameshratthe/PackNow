"""Tests for pricing engine."""
import pytest
from services.pricing_engine import PricingEngine
from core.constants import PackagingCategory, UrgencyLevel


def test_base_pricing():
    """Test base price calculation."""
    materials = {
        "cardboard_box_medium": 1.0,
        "packing_tape": 1.0
    }
    
    # Material cost: 35 + 25 = 60
    # Base price: 60 + 50 (base fee) = 110
    
    price_breakdown = PricingEngine.calculate_price(
        category=PackagingCategory.GIFT,
        materials=materials,
        distance_km=0,
        urgency=UrgencyLevel.NORMAL
    )
    
    assert price_breakdown["material_cost"] == 60.0
    assert price_breakdown["base_price"] == 110.0
    assert price_breakdown["distance_charge"] == 0.0
    assert price_breakdown["urgency_multiplier"] == 1.0
    assert price_breakdown["category_multiplier"] == 1.0
    assert price_breakdown["final_price"] == 110.0


def test_distance_charges():
    """Test distance-based pricing."""
    materials = {
        "cardboard_box_medium": 1.0,
        "packing_tape": 1.0
    }
    
    # Distance charge: 5 km * 10 per km = 50
    # Base: 110 + 50 = 160
    
    price_breakdown = PricingEngine.calculate_price(
        category=PackagingCategory.GIFT,
        materials=materials,
        distance_km=5.0,
        urgency=UrgencyLevel.NORMAL
    )
    
    assert price_breakdown["distance_charge"] == 50.0
    assert price_breakdown["final_price"] == 160.0


def test_urgent_multiplier():
    """Test urgent pricing multiplier."""
    materials = {
        "cardboard_box_medium": 1.0,
        "packing_tape": 1.0
    }
    
    # Base + distance: 110
    # Urgent multiplier: 1.5
    # Final: 110 * 1.5 = 165
    
    price_breakdown = PricingEngine.calculate_price(
        category=PackagingCategory.GIFT,
        materials=materials,
        distance_km=0,
        urgency=UrgencyLevel.URGENT
    )
    
    assert price_breakdown["urgency_multiplier"] == 1.5
    assert price_breakdown["final_price"] == 165.0


def test_category_multipliers():
    """Test category-specific multipliers."""
    materials = {
        "cardboard_box_medium": 1.0,
        "packing_tape": 1.0
    }
    
    # Electronics category has 1.2x multiplier
    # Base: 110 * 1.2 = 132
    
    price_breakdown = PricingEngine.calculate_price(
        category=PackagingCategory.ELECTRONICS,
        materials=materials,
        distance_km=0,
        urgency=UrgencyLevel.NORMAL
    )
    
    assert price_breakdown["category_multiplier"] == 1.2
    assert price_breakdown["final_price"] == 132.0


def test_combined_pricing():
    """Test complex pricing with all factors."""
    materials = {
        "bubble_wrap": 3.0,
        "foam_sheet": 2.0,
        "cardboard_box_large": 1.0,
        "packing_tape": 1.0,
        "fragile_sticker": 2.0
    }
    
    # Material cost: (3*15) + (2*10) + (1*50) + (1*25) + (2*2) = 45 + 20 + 50 + 25 + 4 = 144
    # Base: 144 + 50 = 194
    # Distance: 3 km * 10 = 30
    # Subtotal: 194 + 30 = 224
    # Urgent: 1.5x
    # Category (fragile): 1.3x
    # Final: 224 * 1.5 * 1.3 = 436.8
    
    price_breakdown = PricingEngine.calculate_price(
        category=PackagingCategory.FRAGILE_ITEMS,
        materials=materials,
        distance_km=3.0,
        urgency=UrgencyLevel.URGENT
    )
    
    assert price_breakdown["material_cost"] == 144.0
    assert price_breakdown["base_price"] == 194.0
    assert price_breakdown["distance_charge"] == 30.0
    assert price_breakdown["urgency_multiplier"] == 1.5
    assert price_breakdown["category_multiplier"] == 1.3
    assert price_breakdown["final_price"] == 436.8
