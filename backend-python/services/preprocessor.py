from scipy.spatial import KDTree
import numpy as np
from sklearn.cluster import KMeans
from haversine import haversine, Unit

def node_distance_checker(nodes, max_radius_km):
    if not nodes or len(nodes) < 2:
        return True
        
    depot = nodes[0]
    depot_coords = (depot.lat, depot.lng)

    for node in nodes[1:]:
        node_coords = (node.lat, node.lng)
        dist = haversine(depot_coords, node_coords, unit=Unit.KILOMETERS)
        
        if dist > max_radius_km:
            raise ValueError(
                f"Distance limit exceeded. Node '{node.name}' is {dist:.1f} km away from the Depot. Maximum allowed is {max_radius_km} km."
            )
            
    return True
    
def prepare_vrp_data(nodes, stations):
    vrp_nodes = []
    vrp_demands = []
    
    station_customers = {}
    
    vrp_nodes.append(nodes[0])
    vrp_demands.append(0)
    
    for node in nodes[1:]:
        nearby_id = node.nearby_node_id
        if nearby_id is not None:
            if nearby_id not in station_customers:
                station_customers[nearby_id] = []
            station_customers[nearby_id].append(node)
        else:
            vrp_nodes.append(node)
            vrp_demands.append(node.load)

    for station in stations:
        if station.id in station_customers:
            demanda_estacion = sum(c.load for c in station_customers[station.id])            
            vrp_nodes.append(station)
            vrp_demands.append(demanda_estacion)
            
    return vrp_nodes, vrp_demands, station_customers

def determine_nearby_stations(nodes, stations, radius_km):
    if not stations:
        return nodes

    station_coords = np.array([[s.lat, s.lng] for s in stations])
    tree = KDTree(station_coords)

    radius_deg = radius_km / 90

    for node in nodes:

        if node.id == "0":
            continue

        node_coord = [node.lat, node.lng]
        indices = tree.query_ball_point(node_coord, r=radius_deg)

        if not indices:
            node.nearby_node_id = None
            continue
        best_station = None
        min_dist = float("inf")

        for idx in indices:
            station = stations[idx]

            dist = haversine(
                (node.lat, node.lng),
                (station.lat, station.lng),
                unit=Unit.KILOMETERS
            )

            if dist < min_dist:
                min_dist = dist
                best_station = station

        node.nearby_node_id = best_station.id if best_station else None

    return nodes

def generate_hubs(nodes, stations, num_hubs, min_station_distance_km=0.1):

    coords = np.array([[n.lat, n.lng] for n in nodes if n.id != "0"])

    kmeans = KMeans(n_clusters=num_hubs)
    kmeans.fit(coords)

    hubs = []

    for i, center in enumerate(kmeans.cluster_centers_):

        hub_lat = center[0]
        hub_lng = center[1]

        too_close = False

        for station in stations:
            dist = haversine(
                (hub_lat, hub_lng),
                (station.lat, station.lng),
                unit=Unit.KILOMETERS
            )

            if dist < min_station_distance_km:
                too_close = True
                break

        if too_close:
            continue

        hubs.append({
            "id": f"auto_hub_{i}",
            "lat": hub_lat,
            "lng": hub_lng,
            "name": f"Auto Hub {i}"
        })

    return hubs