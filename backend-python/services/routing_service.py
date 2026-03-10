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
        json={
            "coordinates": coordinates,
        },
        headers={
            "Authorization": ORS_API_KEY,
            "Content-Type": "application/json"
        }
    )

    data = response.json()
    
    route = data["routes"][0]

    full_geometry = polyline.decode(route["geometry"])
    segments = []
    
    segments_data = route.get("segments", [])
    for i, segment in enumerate(segments_data):
        steps = []
        segment_distance = segment["distance"]
        segment_duration = segment["duration"]
        
        segment_coords = []
        
        for step in segment["steps"]:
            start, end = step["way_points"]
            segment_coords.extend(full_geometry[start:end+1])
            
        #     steps.append({
        #         "instruction": step["instruction"],
        #         "distance": step["distance"],
        #         "duration": step["duration"],
        #     })
            
        segments.append({
            "from_node": all_nodes[route_nodes[i]],
            "to_node": all_nodes[route_nodes[i + 1]],
            "distance": segment_distance,
            "duration": segment_duration,
            "coords": segment_coords,
            # "steps": steps
        })
    
    return {
        "coords": full_geometry,
        "distance": route["summary"]["distance"],
        "duration": route["summary"]["duration"],
        "segments": segments
    }
            
def get_walking_route_geometry(parking, all_nearby_nodes):
    walking_routes = []
    total_walking_time = 0
    total_walking_distance = 0

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

        route = data["routes"][0]

        geometry = polyline.decode(route["geometry"])
        total_walking_time += route["summary"]["duration"]
        total_walking_distance += route["summary"]["distance"]

        walking_routes.append({
            "node": node,
            "coords": geometry,
            "distance": route["summary"]["distance"],
            "duration": route["summary"]["duration"],
            "station_id": parking.id,
        })

    return walking_routes, total_walking_time, total_walking_distance