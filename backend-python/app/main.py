from platform import node
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import VRPRequest
from services.matrix_service import get_distance_matrix
from services.optimizer_service import solve_vrp
from services.routing_service import get_vehicle_route_geometry, get_walking_route_geometry
from services.preprocessor import prepare_vrp_data
import uuid
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

nodes = [
    # {"id": str(uuid.uuid4()), "address": "Timothy J. Toomey, Jr. Park", "name": "Customer 2", "lat": 42.3665529, "lng": -71.0807375},
    # {"id": str(uuid.uuid4()), "address": "Cambridge Center Garage", "name": "Customer 3", "lat": 42.36213529, "lng": -71.08123375, "nearby_node_id": 1},
    # {"id": str(uuid.uuid4()), "address": "Cambridge CVS", "name": "Customer 4", "lat": 42.3632432529, "lng": -71.083123375, "nearby_node_id": 1},
    # {"id": str(uuid.uuid4()), "address": "Cambridge Public Library", "name": "Customer 5", "lat": 42.3632432529, "lng": -71.087123375, "nearby_node_id": 1},
    # {"id": str(uuid.uuid4()), "address": "Ñalbany", "name": "Customer 6", "lat": 42.33795, "lng": -71.06964, "nearby_node_id": 2},
    # {"id": str(uuid.uuid4()), "address": "Porter Street Train", "name": "Customer 7", "lat": 42.3833845, "lng": -71.0883563},
    # {"id": str(uuid.uuid4()), "address": "Burgers Tony", "name": "Customer 8", "lat": 42.3474614, "lng": -71.0960999, "nearby_node_id": 4},
]

stations = [
    # {"id": 0, "address": "Dowtown Crossing", "name": "Depot", "lat": 42.359829, "lng": -71.054099}, 
    # {"id": 1, "address": "MIT CTL", "name": "Station 1", "lat": 42.3611465, "lng": -71.0837124},
    # {"id": 2, "address": "Albany Street", "name": "Station 2", "lat": 42.33695, "lng": -71.06864},
    # {"id": 3, "address": "Prudential Center", "name": "Station 3", "lat": 42.3456782, "lng": -71.0813915},
    # {"id": 4, "address": "Fenway Park", "name": "Station 4", "lat": 42.3444614, "lng": -71.0955999},
    # {"id": 5, "address": "Harvard University", "name": "Station 5", "lat": 42.3657432, "lng": -71.1222139},
    # {"id": 6, "address": "Porter Street", "name": "Station 6", "lat": 42.3733845, "lng": -71.0883563},
    # {"id": 7, "address": "Boston Airport", "name": "Station 7", "lat": 42.3631767, "lng": -71.0236401},
]

vehicles = [
    # {"id": str(uuid.uuid4()), "name": "Vehicle 1", "capacity": 1, "fixed_cost": 50, "cost_factor": 1.0},
    # {"id": str(uuid.uuid4()), "name": "Vehicle 2", "capacity": 4, "fixed_cost": 80, "cost_factor": 1.2},
    # {"id": str(uuid.uuid4()), "name": "Vehicle 3", "capacity": 6, "fixed_cost": 100, "cost_factor": 1.5},
]

# https://thumbs.dreamstime.com/b/depot-glyph-vector-icon-can-easily-edit-modify-depot-glyph-vector-icon-can-easily-edit-modify-279123003.jpg
# https://img.freepik.com/premium-vector/parking-pinpoint-icon-blue-location-pin-with-parking-symbol-it-icon-transparent-background_1056423-612.jpg

@app.get("/nodes")
def get_nodes():
    return nodes

@app.post("/nodes")
def add_nodes(new_nodes: list[dict]):
    nodes_list = []
    for node in new_nodes:
        node["id"] = str(uuid.uuid4())
        nodes_list.append(node)

    nodes.extend(nodes_list)
    return nodes_list

@app.get("/stations")
def get_stations():
    return stations

@app.get("/vehicles")
def get_vehicles():
    return vehicles

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/geocode")
def geocode(q: str):
    url = "https://nominatim.openstreetmap.org/search"
    clean_q = q.strip().translate({ord(c): None for c in ".,;-"})
    
    params = {
      "format": "json",
      "q": clean_q
    }

    r = requests.get(
      url,
      params=params,
      headers={"User-Agent": "vrp-research-app"}
    )

    data = r.json()
    results = []

    for item in data[:5]:
      results.append({
        "name": item["display_name"],
        "lat": float(item["lat"]),
        "lng": float(item["lon"])
      })
    return {"results": results}
    
@app.post("/optimize-routes")
def optimize_routes(data: VRPRequest):
    vrp_nodes, vrp_demands, station_customers = prepare_vrp_data(data.nodes, data.stations)
    print("VRP NODES:")
    for n in vrp_nodes:
        print(f"Node {n.id} - {n.name} ({n.lat}, {n.lng})")
    
    distance_matrix = get_distance_matrix(vrp_nodes)
    routes = solve_vrp(distance_matrix, data.vehicles, depot=0, demands=vrp_demands)
    print("Optimized Routes:")
    for vehicle_id, route_indices in routes:
        print(f"Vehicle {vehicle_id} route: {[vrp_nodes[i].name for i in route_indices]}")

    vehicle_routes = []
    for vehicle_id, route_indices in routes:
        if len(route_indices) <= 2:
            continue
        route_nodes = [vrp_nodes[i] for i in route_indices]
        driving_data = get_vehicle_route_geometry(route_indices, vrp_nodes)
        
        walking_segments = []

        for node in route_nodes:
            if hasattr(node, "id") and node.id in station_customers and getattr(node, "name", "").startswith("Station"):
                walking_routes = get_walking_route_geometry(node, station_customers[node.id])
                walking_segments.extend(walking_routes)

        vehicle_routes.append({
            "vehicle_id": vehicle_id,
            "driving_route": {
                "coords": driving_data["coords"],
                "distance": driving_data["distance"],
                "duration": driving_data["duration"]
            },
            "walking_routes": walking_segments,
            "stops": route_nodes
        })
            
    return {"routes": vehicle_routes}