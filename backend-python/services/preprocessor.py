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
    
    depot = nodes[0]
    depot.id = 0
    vrp_nodes.append(depot)
    vrp_demands.append(0)
    
    for node in nodes[1:]:
        nearby_id = node.nearby_node_id
        if nearby_id is not None:
            if nearby_id not in station_customers:
                station_customers[nearby_id] = []
            station_customers[nearby_id].append(node)
        else:
            vrp_nodes.append(node)
            vrp_demands.append(1)

    for station in stations:
        if station.id in station_customers and station.id != 0:
            demanda_estacion = len(station_customers[station.id])
            vrp_nodes.append(station)
            vrp_demands.append(demanda_estacion)
            
    return vrp_nodes, vrp_demands, station_customers

def determine_nearby_stations(nodes, stations, radius_km=0.25):
    for node in nodes:
        if node.id == 0 or str(node.id) == "0":
            continue
            
        best_station_id = None
        min_distance = float('inf')
        
        for station in stations:
            coord_node = (node.lat, node.lng)
            coord_station = (station.lat, station.lng)
            
            dist = haversine(coord_node, coord_station, unit=Unit.KILOMETERS)
            
            # Buscamos que esté dentro del radio, Y que sea la distancia más corta hasta ahora
            if dist <= radius_km and dist < min_distance:
                min_distance = dist
                best_station_id = station.id
                
        # Asignar la mejor estación encontrada (o None si no había ninguna cerca)
        node.nearby_node_id = best_station_id

    return nodes