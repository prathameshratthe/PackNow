"""Material model."""
from sqlalchemy import Column, Integer, String, DECIMAL, Text

from models.database import Base


class Material(Base):
    """Material model for packaging supplies."""
    
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    unit = Column(String(50), nullable=False)  # MaterialUnit enum values
    unit_cost = Column(DECIMAL(10, 2), nullable=False)
    description = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<Material(id={self.id}, name={self.name}, unit_cost={self.unit_cost})>"
