"""Tests for material estimator service."""
import pytest
from services.material_estimator import MaterialEstimator
from core.constants import PackagingCategory, FragilityLevel


def test_calculate_volume():
    """Test volume calculation."""
    volume = MaterialEstimator.calculate_volume(10, 20, 30)
    assert volume == 6000


def test_determine_box_size():
    """Test box size determination."""
    # Small box
    assert MaterialEstimator.determine_box_size(7000) == "small"
    
    # Medium box
    assert MaterialEstimator.determine_box_size(25000) == "medium"
    
    # Large box
    assert MaterialEstimator.determine_box_size(50000) == "large"
    
    # Extra large box
    assert MaterialEstimator.determine_box_size(150000) == "extra_large"


def test_calculate_bubble_wrap():
    """Test bubble wrap calculation."""
    dimensions = {"length": 30, "width": 20, "height": 10}
    
    # Low fragility
    wrap_low = MaterialEstimator.calculate_bubble_wrap(dimensions, FragilityLevel.LOW)
    assert wrap_low > 0
    
    # High fragility should need more
    wrap_high = MaterialEstimator.calculate_bubble_wrap(dimensions, FragilityLevel.HIGH)
    assert wrap_high > wrap_low


def test_electronics_fragile_estimation():
    """Test material estimation for fragile electronics."""
    dimensions = {"length": 30, "width": 25, "height": 5}
    
    materials, box_size = MaterialEstimator.estimate_materials(
        category=PackagingCategory.ELECTRONICS,
        dimensions=dimensions,
        fragility=FragilityLevel.HIGH
    )
    
    # Should have double box for high fragility electronics
    box_key = f"cardboard_box_{box_size}"
    assert materials[box_key] == 2.0
    
    # Should have bubble wrap
    assert "bubble_wrap" in materials
    
    # Should have foam sheets
    assert "foam_sheet" in materials
    assert materials["foam_sheet"] == 4.0
    
    # Should have fragile stickers
    assert "fragile_sticker" in materials


def test_gift_wrapping_estimation():
    """Test material estimation for gift wrapping."""
    dimensions = {"length": 20, "width": 20, "height": 15}
    
    materials, box_size = MaterialEstimator.estimate_materials(
        category=PackagingCategory.GIFT,
        dimensions=dimensions,
        fragility=FragilityLevel.LOW
    )
    
    # Should have gift wrapping paper
    assert "gift_wrapping_paper" in materials
    
    # Should have ribbon
    assert "ribbon" in materials


def test_food_packaging_estimation():
    """Test material estimation for food."""
    dimensions = {"length": 25, "width": 25, "height": 20}
    
    materials, _ = MaterialEstimator.estimate_materials(
        category=PackagingCategory.FOOD,
        dimensions=dimensions,
        fragility=FragilityLevel.LOW
    )
    
    # Should have insulated box
    assert "insulated_box" in materials
    
    # Should have cooling pack
    assert "cooling_pack" in materials


def test_document_packaging_estimation():
    """Test material estimation for documents."""
    dimensions = {"length": 30, "width": 21, "height": 2}
    
    materials, _ = MaterialEstimator.estimate_materials(
        category=PackagingCategory.DOCUMENTS,
        dimensions=dimensions,
        fragility=FragilityLevel.LOW
    )
    
    # Should have waterproof envelope
    assert "waterproof_envelope" in materials


def test_house_shifting_estimation():
    """Test material estimation for house shifting."""
    dimensions = {"length": 50, "width": 40, "height": 35}
    
    materials, _ = MaterialEstimator.estimate_materials(
        category=PackagingCategory.HOUSE_SHIFTING,
        dimensions=dimensions,
        fragility=FragilityLevel.MEDIUM
    )
    
    # Should have extra tape
    assert materials["packing_tape"] == 3.0
    
    # Should have labels
    assert "label_sticker" in materials
    

def test_calculate_material_cost():
    """Test material cost calculation."""
    materials = {
        "bubble_wrap": 3.0,
        "cardboard_box_medium": 1.0,
        "packing_tape": 1.0
    }
    
    cost = MaterialEstimator.calculate_material_cost(materials)
    
    # Cost should be: (3 * 15) + (1 * 35) + (1 * 25) = 105
    assert cost == 105.0
