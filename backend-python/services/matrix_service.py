import requests
from config import ORS_API_KEY, ORS_BASE_URL

def get_distance_matrix(nodes):

    locations = [[node.lng, node.lat] for node in nodes]

    response = requests.post(
        f"{ORS_BASE_URL}/v2/matrix/driving-car",
        json={
            "locations": locations,
            "metrics": ["distance"]
        },
        headers={
            "Authorization": ORS_API_KEY,
            "Content-Type": "application/json"
        }
    )

    return response.json()["distances"]