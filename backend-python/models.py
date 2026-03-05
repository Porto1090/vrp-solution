from pydantic import BaseModel
from typing import List, Optional

class Node(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    lat: float
    lng: float
    nearby_node_id: Optional[int] = None

class Station(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    
class Vehicle(BaseModel):
    id: str
    capacity: int
    fixed_cost: int
    cost_factor: float
    
class VRPRequest(BaseModel):
    nodes: List[Node]
    vehicles: List[Vehicle]
    stations: List[Station]