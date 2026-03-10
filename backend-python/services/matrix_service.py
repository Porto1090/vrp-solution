import requests
from config import ORS_API_KEY, ORS_BASE_URL

def get_vehicle_matrix(nodes):

    locations = [[node.lng, node.lat] for node in nodes]

    response = requests.post(
        f"{ORS_BASE_URL}/v2/matrix/driving-car",
        json={
            "locations": locations,
            "metrics": ["distance", "duration"]
        },
        headers={
            "Authorization": ORS_API_KEY,
            "Content-Type": "application/json"
        }
    )

    data = response.json()

    return {
        "distance_matrix": data["distances"],
        "duration_matrix": data["durations"]
    }
    
# def get_walking_matrix(parking, customers):

#     locations = [[parking.lng, parking.lat]] + [
#         [c.lng, c.lat] for c in customers
#     ]

#     response = requests.post(
#         f"{ORS_BASE_URL}/v2/matrix/foot-walking",
#         json={
#             "locations": locations,
#             "sources": [0],
#             "destinations": list(range(1, len(locations))),
#             "metrics": ["distance", "duration"]
#         },
#         headers={
#             "Authorization": ORS_API_KEY,
#             "Content-Type": "application/json"
#         }
#     )

#     data = response.json()

#     walking_routes = []

#     for i, customer in enumerate(customers):

#         walking_routes.append({
#             "node": customer,
#             "coords": [[parking.lng, parking.lat], [customer.lng, customer.lat]],
#             "distance": data["distances"][0][i],
#             "duration": data["durations"][0][i],
#             "station_id": parking.id
#         })

#     return walking_routes