"""Tests for dispatcher service."""
import pytest
from services.dispatcher import Dispatcher


def test_haversine_distance():
    """Test Haversine distance calculation."""
    # Distance between New York (40.7128, -74.0060) and Los Angeles (34.0522, -118.2437)
    # Should be approximately 3936 km
    distance = Dispatcher.haversine_distance(40.7128, -74.0060, 34.0522, -118.2437)
    assert 3900 < distance < 4000
    
    # Same location should be 0
    distance_zero = Dispatcher.haversine_distance(40.7128, -74.0060, 40.7128, -74.0060)
    assert distance_zero == 0.0


def test_check_inventory_sufficient():
    """Test inventory sufficiency check."""
    packer_inventory = {
        "bubble_wrap": 100,
        "cardboard_box_medium": 50,
        "packing_tape": 75
    }
    
    # Sufficient inventory
    required_materials_ok = {
        "bubble_wrap": 5.0,
        "cardboard_box_medium": 1.0,
        "packing_tape": 1.0
    }
    assert Dispatcher.check_inventory_sufficient(packer_inventory, required_materials_ok) == True
    
    # Insufficient inventory
    required_materials_not_ok = {
        "bubble_wrap": 150.0,
        "cardboard_box_medium": 1.0
    }
    assert Dispatcher.check_inventory_sufficient(packer_inventory, required_materials_not_ok) == False
    
    # Missing material
    required_materials_missing = {
        "foam_sheet": 5.0
    }
    assert Dispatcher.check_inventory_sufficient(packer_inventory, required_materials_missing) == False


def test_deduct_inventory():
    """Test inventory deduction."""
    from models.packer import Packer
    
    # Mock packer with inventory
    packer = Packer()
    packer.inventory = {
        "bubble_wrap": 100,
        "cardboard_box_medium": 50,
        "packing_tape": 75
    }
    
    required_materials = {
        "bubble_wrap": 5.0,
        "cardboard_box_medium": 1.0,
        "packing_tape": 2.0
    }
    
    updated_inventory = Dispatcher.deduct_inventory(packer, required_materials)
    
    assert updated_inventory["bubble_wrap"] == 95
    assert updated_inventory["cardboard_box_medium"] == 49
    assert updated_inventory["packing_tape"] == 73


def test_deduct_inventory_partial_amounts():
    """Test inventory deduction with partial amounts (should ceil)."""
    from models.packer import Packer
    
    packer = Packer()
    packer.inventory = {
        "bubble_wrap": 100
    }
    
    required_materials = {
        "bubble_wrap": 2.7  # Should deduct 3
    }
    
    updated_inventory = Dispatcher.deduct_inventory(packer, required_materials)
    
    assert updated_inventory["bubble_wrap"] == 97


def test_return_inventory():
    """Test inventory return."""
    from models.packer import Packer
    
    packer = Packer()
    packer.inventory = {
        "bubble_wrap": 95,
        "cardboard_box_medium": 49
    }
    
    materials_to_return = {
        "bubble_wrap": 5.0,
        "cardboard_box_medium": 1.0
    }
    
    updated_inventory = Dispatcher.return_inventory(packer, materials_to_return)
    
    assert updated_inventory["bubble_wrap"] == 100
    assert updated_inventory["cardboard_box_medium"] == 50
