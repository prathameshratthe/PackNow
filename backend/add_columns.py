import sys
import os
from sqlalchemy import create_engine, text

# Add current dir to pythonpath
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.config import settings

def main():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if dropoff_location exists
            print("Adding dropoff_location column...")
            conn.execute(text("ALTER TABLE orders ADD COLUMN dropoff_location JSON;"))
            print("Successfully added dropoff_location")
        except Exception as e:
            print(f"Column dropoff_location might already exist or error occurred: {e}")
            
        try:
            # Check if delivery_otp exists
            print("Adding delivery_otp column...")
            conn.execute(text("ALTER TABLE orders ADD COLUMN delivery_otp VARCHAR(6);"))
            print("Successfully added delivery_otp")
        except Exception as e:
            print(f"Column delivery_otp might already exist or error occurred: {e}")
            
        conn.commit()
    print("Database migration complete.")

if __name__ == "__main__":
    main()
