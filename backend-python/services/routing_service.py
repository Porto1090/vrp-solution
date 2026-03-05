import requests
import polyline
from config import ORS_API_KEY, ORS_BASE_URL

def get_vehicle_route_geometry(route_nodes, all_nodes):
    coordinates = [
        [all_nodes[i].lng, all_nodes[i].lat]
        for i in route_nodes
    ]

    response = requests.post(
        f"{ORS_BASE_URL}/v2/directions/driving-car",
        json={"coordinates": coordinates},
        headers={
            "Authorization": ORS_API_KEY,
            "Content-Type": "application/json"
        }
    )

    data = response.json()

    geometry = polyline.decode(data["routes"][0]["geometry"])

    return {
        "coords": geometry,
        "distance": data["routes"][0]["summary"]["distance"],
        "duration": data["routes"][0]["summary"]["duration"]
    }
    
def get_walking_route_geometry(parking, all_nearby_nodes):
    walking_routes = []

    for node in all_nearby_nodes:
        coordinates = [
            [parking.lng, parking.lat],
            [node.lng, node.lat]
        ]

        response = requests.post(
            f"{ORS_BASE_URL}/v2/directions/foot-hiking",
            json={"coordinates": coordinates},
            headers={
                "Authorization": ORS_API_KEY,
                "Content-Type": "application/json"
            }
        )

        data = response.json()

        if "routes" not in data:
            print("ORS Error:", data)
            continue

        route = data["routes"][0]

        geometry = polyline.decode(route["geometry"])

        walking_routes.append({
            "node_id": node.id,
            "coords": geometry,
            "distance": route["summary"]["distance"],
            "duration": route["summary"]["duration"],
            "station_id": parking.id,
            "node_name": node.name,
            "node_address": node.address
        })

    return walking_routes