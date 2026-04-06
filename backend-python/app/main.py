from platform import node
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import VRPRequest
from services.matrix_service import get_vehicle_matrix
from services.optimizer_service import solve_vrp
from services.routing_service import get_vehicle_route_geometry, get_walking_route_geometry
from services.preprocessor import prepare_vrp_data, determine_nearby_stations, node_distance_checker, generate_hubs
import uuid
import requests
from fastapi import HTTPException

import json

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
    # {"id": str(uuid.uuid4()), "address": "Timothy J. Toomey, Jr. Park", "name": "Customer 1", "lat": 42.3665529, "lng": -71.0807375, "load": 6, "working_time": 41},
    # {"id": str(uuid.uuid4()), "address": "Norbert City", "name": "Customer 6", "lat": 42.36431523548288, "lng": -71.08428955078126, "load": 5, "working_time": 30},
    # {"id": str(uuid.uuid4()), "address": "Norbert City Avenue", "name": "Customer 7", "lat": 42.36529820933543, "lng": -71.08437538146974, "load": 4, "working_time": 20},
    # {"id": str(uuid.uuid4()), "address": "Seaport", "name": "Customer 4", "lat": 42.34465252870443, "lng": -71.06411933898927, "load": 1, "working_time": 10},
    # {"id": str(uuid.uuid4()), "address": "Cambridge Public Library", "name": "Customer 3", "lat": 42.36266634158045, "lng": -71.0987949371338, "load": 2, "working_time": 96},
    # {"id": str(uuid.uuid4()), "address": "Cambridge Center Garage", "name": "Customer 2", "lat": 42.3635614, "lng": -71.0886472, "load": 3, "working_time": 73},
    # {"id": str(uuid.uuid4()), "address": "Albany Street", "name": "Customer 5", "lat": 42.36174674733811, "lng": -71.09310865402223, "load": 3, "working_time": 15},
]

stations = [
    {"id": 1, "name": "EZ Parking 1", "lat": 42.3607667, "lng": -71.0705503}, 
    {"id": 2, "name": "EZ Parking 2", "lat": 42.3576735, "lng": -71.0701434},
    {"id": 3, "name": "EZ Parking 3", "lat": 42.362705, "lng": -71.0820743},
    {"id": 4, "name": "EZ Parking 4", "lat": 42.3651988, "lng": -71.0831014},
    {"id": 5, "name": "EZ Parking 5", "lat": 42.3630885, "lng": -71.0913624},
]

vehicles = [
    # {"id": str(uuid.uuid4()), "name": "Vehicle 1", "capacity": 15, "fixed_cost": 50},
    # {"id": str(uuid.uuid4()), "name": "Vehicle 2", "capacity": 2, "fixed_cost": 10},
    # {"id": str(uuid.uuid4()), "name": "Vehicle 3", "capacity": 12, "fixed_cost": 40},
    # {"id": str(uuid.uuid4()), "name": "Vehicle 4", "capacity": 8, "fixed_cost": 10},
    # {"id": str(uuid.uuid4()), "name": "Vehicle 5", "capacity": 4, "fixed_cost": 45},
]

# https://thumbs.dreamstime.com/b/depot-glyph-vector-icon-can-easily-edit-modify-depot-glyph-vector-icon-can-easily-edit-modify-279123003.jpg
# https://img.freepik.com/premium-vector/parking-pinpoint-icon-blue-location-pin-with-parking-symbol-it-icon-transparent-background_1056423-612.jpg

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/nodes")
def get_nodes():
    return nodes if nodes else []

@app.get("/stations")
def get_stations():
    return stations if stations else []

@app.get("/vehicles")
def get_vehicles():
    return vehicles if vehicles else []

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
    
# Two-Echelon Vehicle Routing Problem (2E-VRP)
@app.post("/optimize-routes")
def optimize_routes(data: VRPRequest):
    node_distance_checker(data.nodes, max_radius_km=100.0)
    stations = data.stations
    
    # with open('./app/response.json', 'r', encoding='utf-8') as f:
    #     data = json.load(f)
    #     return data
    
    if data.use_auto_hubs:
        print("Using automatic hub generation")
        auto_hubs = generate_hubs(data.nodes, stations, num_hubs=2)
        stations = stations + auto_hubs
    else:
        print("Using only real stations")
        
    new_nodes = determine_nearby_stations(data.nodes, stations, radius_km=0.25)
    vrp_nodes, vrp_demands, station_customers = prepare_vrp_data(new_nodes, data.stations)
    
    matrix = get_vehicle_matrix(vrp_nodes)
    distance_matrix = matrix["distance_matrix"]
    duration_matrix = matrix["duration_matrix"]
    
    routes = solve_vrp(duration_matrix, data.vehicles, depot=0, demands=vrp_demands)
    print("Optimized Routes:")

    complete_routes = []
    vehicle_map = {v.id: v for v in data.vehicles}
    
    for route in routes:
        print(f"Vehicle {route['vehicle_id']} route: {[vrp_nodes[i].name for i in route['vehicle_route']]}")
        node_indices = route['vehicle_route']
        if len(node_indices) <= 2:
            continue
        
        current_route_nodes = [vrp_nodes[i] for i in node_indices]
        
        driving_data = get_vehicle_route_geometry(node_indices, vrp_nodes)
        
        walking_segments = []
        total_walking_time = 0
        total_walking_distance = 0

        for node in current_route_nodes:
            if hasattr(node, "id") and node.id in station_customers and "EZ Parking" in getattr(node, "name", ""):
                w_routes, w_time, w_dist = get_walking_route_geometry(node, station_customers[node.id])
                walking_segments.extend(w_routes)
                total_walking_time += w_time
                total_walking_distance += w_dist

        complete_routes.append({
            "vehicle": vehicle_map.get(route["vehicle_id"]),
            "driving_routes": driving_data["segments"],
            "walking_routes": walking_segments,
            "stops": current_route_nodes,
            "total_driving_time": driving_data["duration"],
            "total_driving_distance": driving_data["distance"],
            "total_walking_time": total_walking_time,
            "total_walking_distance": total_walking_distance,
            "route_load": route["load"],
        })
            
    return {"routes": complete_routes, "nodes": new_nodes}
