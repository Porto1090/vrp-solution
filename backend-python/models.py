from pydantic import BaseModel
from typing import List, Optional

class Node(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    lat: float
    lng: float
    nearby_node_id: Optional[int] = None
    load: int = 0
    working_time: int = 0

class Station(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    
class Vehicle(BaseModel):
    id: str
    name: str
    capacity: int
    fixed_cost: int
    
class VRPRequest(BaseModel):
    nodes: List[Node]
    vehicles: List[Vehicle]
    stations: List[Station]
    use_auto_hubs: bool = False