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