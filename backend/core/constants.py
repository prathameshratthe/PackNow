"""Application constants and enums."""
from enum import Enum


class OrderStatus(str, Enum):
    """Order lifecycle statuses."""
    CREATED = "CREATED"
    PACKER_ASSIGNED = "PACKER_ASSIGNED"
    ON_THE_WAY = "ON_THE_WAY"
    PACKED = "PACKED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PackagingCategory(str, Enum):
    """Packaging service categories."""
    GIFT = "gift"
    ELECTRONICS = "electronics"
    FOOD = "food"
    DOCUMENTS = "documents"
    BUSINESS_ORDERS = "business_orders"
    FRAGILE_ITEMS = "fragile_items"
    HOUSE_SHIFTING = "house_shifting"


class FragilityLevel(str, Enum):
    """Item fragility levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class UrgencyLevel(str, Enum):
    """Order urgency levels."""
    NORMAL = "normal"
    URGENT = "urgent"


class UserRole(str, Enum):
    """User roles in the system."""
    USER = "user"
    PACKER = "packer"
    ADMIN = "admin"


class MaterialUnit(str, Enum):
    """Material measurement units."""
    METERS = "meters"
    UNITS = "units"
    PIECES = "pieces"
    SHEETS = "sheets"


# Category-specific pricing multipliers
CATEGORY_MULTIPLIERS = {
    PackagingCategory.GIFT: 1.0,
    PackagingCategory.ELECTRONICS: 1.2,
    PackagingCategory.FOOD: 1.1,
    PackagingCategory.DOCUMENTS: 0.8,
    PackagingCategory.BUSINESS_ORDERS: 1.3,
    PackagingCategory.FRAGILE_ITEMS: 1.3,
    PackagingCategory.HOUSE_SHIFTING: 1.5,
}

# Box size definitions (in cm)
BOX_SIZES = {
    "small": {"max_volume": 8000, "dimensions": "20x20x20"},  # cm³
    "medium": {"max_volume": 27000, "dimensions": "30x30x30"},
    "large": {"max_volume": 64000, "dimensions": "40x40x40"},
    "extra_large": {"max_volume": 125000, "dimensions": "50x50x50"},
}

# Material types and their base costs
MATERIAL_TYPES = {
    "bubble_wrap": {"unit": MaterialUnit.METERS, "base_cost": 15.0},
    "foam_sheet": {"unit": MaterialUnit.SHEETS, "base_cost": 10.0},
    "cardboard_box_small": {"unit": MaterialUnit.UNITS, "base_cost": 20.0},
    "cardboard_box_medium": {"unit": MaterialUnit.UNITS, "base_cost": 35.0},
    "cardboard_box_large": {"unit": MaterialUnit.UNITS, "base_cost": 50.0},
    "cardboard_box_extra_large": {"unit": MaterialUnit.UNITS, "base_cost": 70.0},
    "packing_tape": {"unit": MaterialUnit.UNITS, "base_cost": 25.0},
    "fragile_sticker": {"unit": MaterialUnit.PIECES, "base_cost": 2.0},
    "gift_wrapping_paper": {"unit": MaterialUnit.METERS, "base_cost": 20.0},
    "ribbon": {"unit": MaterialUnit.METERS, "base_cost": 5.0},
    "insulated_box": {"unit": MaterialUnit.UNITS, "base_cost": 80.0},
    "cooling_pack": {"unit": MaterialUnit.UNITS, "base_cost": 15.0},
    "waterproof_envelope": {"unit": MaterialUnit.UNITS, "base_cost": 10.0},
    "label_sticker": {"unit": MaterialUnit.PIECES, "base_cost": 1.0},
}

# JWT token types
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"
