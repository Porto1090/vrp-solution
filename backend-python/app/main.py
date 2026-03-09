from platform import node
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import VRPRequest
from services.matrix_service import get_distance_matrix
from services.optimizer_service import solve_vrp
from services.routing_service import get_vehicle_route_geometry, get_walking_route_geometry
from services.preprocessor import prepare_vrp_data, determine_nearby_stations, node_distance_checker
import uuid
import requests
from fastapi import HTTPException

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

nodes = [
    # {"id": "0", "address": "Moakley Library", "name": "Main Depot", "lat": 42.3568568, "lng": -71.0609706},
    # {"id": str(uuid.uuid4()), "address": "Timothy J. Toomey, Jr. Park", "name": "Customer 1", "lat": 42.3665529, "lng": -71.0807375},
    # {"id": str(uuid.uuid4()), "address": "Cambridge Center Garage", "name": "Customer 2", "lat": 42.3635614, "lng": -71.0886472},
    # {"id": str(uuid.uuid4()), "address": "Cambridge Public Library", "name": "Customer 3", "lat": 42.36266634158045, "lng": -71.0987949371338},
    # {"id": str(uuid.uuid4()), "address": "Seaport", "name": "Customer 4", "lat": 42.34465252870443, "lng": -71.06411933898927},
    # {"id": str(uuid.uuid4()), "address": "Albany Street", "name": "Customer 5", "lat": 42.36174674733811, "lng": -71.09310865402223},
    # {"id": str(uuid.uuid4()), "address": "Norbert City", "name": "Customer 6", "lat": 42.36431523548288, "lng": -71.08428955078126},
    # {"id": str(uuid.uuid4()), "address": "Norbert City Avenue", "name": "Customer 7", "lat": 42.36529820933543, "lng": -71.08437538146974},
]

stations = [
    {"id": 1, "name": "EZ Parking 1", "lat": 42.3607667, "lng": -71.0705503}, 
    {"id": 2, "name": "EZ Parking 2", "lat": 42.3576735, "lng": -71.0701434},
    {"id": 3, "name": "EZ Parking 3", "lat": 42.362705, "lng": -71.0820743},
    {"id": 4, "name": "EZ Parking 4", "lat": 42.3651988, "lng": -71.0831014},
    {"id": 5, "name": "EZ Parking 5", "lat": 42.3630885, "lng": -71.0913624},
]

vehicles = [
    # {"id": str(uuid.uuid4()), "name": "Vehicle 1", "capacity": 2, "fixed_cost": 50},
    # {"id": str(uuid.uuid4()), "name": "Vehicle 2", "capacity": 3, "fixed_cost": 30},
    # {"id": str(uuid.uuid4()), "name": "Vehicle 3", "capacity": 3, "fixed_cost": 40},
]

# https://thumbs.dreamstime.com/b/depot-glyph-vector-icon-can-easily-edit-modify-depot-glyph-vector-icon-can-easily-edit-modify-279123003.jpg
# https://img.freepik.com/premium-vector/parking-pinpoint-icon-blue-location-pin-with-parking-symbol-it-icon-transparent-background_1056423-612.jpg

@app.get("/nodes")
def get_nodes():
    return nodes if nodes else []

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
    return stations if stations else []

@app.get("/vehicles")
def get_vehicles():
    return vehicles if vehicles else []

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
    node_distance_checker(data.nodes, max_radius_km=50.0)
    
    new_nodes = determine_nearby_stations(data.nodes, data.stations)
    vrp_nodes, vrp_demands, station_customers = prepare_vrp_data(new_nodes, data.stations)
    print("VRP NODES:")
    for n in vrp_nodes:
        print(n)
    print("Station-Customer Mapping:")
    for station_id, customers in station_customers.items():
        print(f"Station {station_id} has customers: {customers}")
    
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
            if hasattr(node, "id") and node.id in station_customers and getattr(node, "name", "").startswith("EZ Parking"):
                walking_routes = get_walking_route_geometry(node, station_customers[node.id])
                walking_segments.extend(walking_routes)

        vehicle_routes.append({
            "vehicle": next((v for v in data.vehicles if v.id == vehicle_id), None),
            "driving_route": {
                "coords": driving_data["coords"],
                "distance": driving_data["distance"],
                "duration": driving_data["duration"]
            },
            "walking_routes": walking_segments,
            "stops": route_nodes
        })
            
    return {"routes": vehicle_routes, "nodes": new_nodes}
