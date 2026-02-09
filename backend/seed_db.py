"""Seed database with initial data."""
from models.database import SessionLocal, init_db
# Import ALL models for SQLAlchemy to register relationships
from models.user import User
from models.packer import Packer
from models.order import Order
from models.material import Material
from core.security import hash_password
from core.constants import MATERIAL_TYPES, MaterialUnit


def seed_materials():
    """Seed materials table with default materials."""
    db = SessionLocal()
    
    print("Seeding materials...")
    
    for material_name, details in MATERIAL_TYPES.items():
        existing = db.query(Material).filter(Material.name == material_name).first()
        
        if not existing:
            material = Material(
                name=material_name,
                unit=details["unit"],
                unit_cost=details["base_cost"],
                description=f"{material_name.replace('_', ' ').title()} for packaging"
            )
            db.add(material)
    
    db.commit()
    print(f"✅ Seeded {len(MATERIAL_TYPES)} materials")
    db.close()


def seed_packers():
    """Seed packers table with demo packers."""
    db = SessionLocal()
    
    print("Seeding demo packers...")
    
    demo_packers = [
        {
            "name": "John Doe",
            "phone": "+919876543210",
            "email": "john@packnow.com",
            "password": "packer123",
            "lat": 19.0760,
            "lng": 72.8777,
            "inventory": {
                "bubble_wrap": 100,
                "foam_sheet": 50,
                "cardboard_box_small": 30,
                "cardboard_box_medium": 40,
                "cardboard_box_large": 25,
                "cardboard_box_extra_large": 15,
                "packing_tape": 80,
                "fragile_sticker": 100,
                "gift_wrapping_paper": 50,
                "ribbon": 60,
                "insulated_box": 20,
                "cooling_pack": 40,
                "waterproof_envelope": 50,
                "label_sticker": 200,
            }
        },
        {
            "name": "Sarah Wilson",
            "phone": "+919876543211",
            "email": "sarah@packnow.com",
            "password": "packer123",
            "lat": 19.1176,
            "lng": 72.9060,
            "inventory": {
                "bubble_wrap": 120,
                "foam_sheet": 60,
                "cardboard_box_small": 35,
                "cardboard_box_medium": 45,
                "cardboard_box_large": 30,
                "cardboard_box_extra_large": 20,
                "packing_tape": 90,
                "fragile_sticker": 110,
                "gift_wrapping_paper": 55,
                "ribbon": 65,
                "insulated_box": 25,
                "cooling_pack": 45,
                "waterproof_envelope": 55,
                "label_sticker": 220,
            }
        },
        {
            "name": "Mike Chen",
            "phone": "+919876543212",
            "email": "mike@packnow.com",
            "password": "packer123",
            "lat": 19.0596,
            "lng": 72.8295,
            "inventory": {
                "bubble_wrap": 90,
                "foam_sheet": 45,
                "cardboard_box_small": 28,
                "cardboard_box_medium": 38,
                "cardboard_box_large": 22,
                "cardboard_box_extra_large": 12,
                "packing_tape": 75,
                "fragile_sticker": 95,
                "gift_wrapping_paper": 48,
                "ribbon": 58,
                "insulated_box": 18,
                "cooling_pack": 38,
                "waterproof_envelope": 48,
                "label_sticker": 190,
            }
        },
    ]
    
    for packer_data in demo_packers:
        existing = db.query(Packer).filter(Packer.phone == packer_data["phone"]).first()
        
        if not existing:
            packer = Packer(
                name=packer_data["name"],
                phone=packer_data["phone"],
                email=packer_data["email"],
                password_hash=hash_password(packer_data["password"]),
                lat=packer_data["lat"],
                lng=packer_data["lng"],
                inventory=packer_data["inventory"],
                available=True,
                rating=5.00
            )
            db.add(packer)
    
    db.commit()
    print(f"✅ Seeded {len(demo_packers)} demo packers")
    db.close()


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("✅ Database initialized")
    
    seed_materials()
    seed_packers()
    
    print("\n🎉 Database seeding completed!")
    print("\nDemo packer credentials:")
    print("  Phone: +919876543210, Password: packer123")
    print("  Phone: +919876543211, Password: packer123")
    print("  Phone: +919876543212, Password: packer123")
