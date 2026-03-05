from ortools.constraint_solver import pywrapcp, routing_enums_pb2

def solve_vrp(distance_matrix, vehicles, depot=0, demands=None, force_use_all_vehicles=False):
    print("=== VRP DEBUG START ===")
    num_vehicles = len(vehicles)
    print(f"Number of vehicles: {num_vehicles}")
    print(f"Depot index: {depot}")
    print(f"Distance matrix size: {len(distance_matrix)} x {len(distance_matrix[0])}")

    # Demanda por nodo
    if demands is None:
        demands = [0] + [1] * (len(distance_matrix) - 1)
    print(f"Demands: {demands}")

    vehicle_capacities = [v.capacity for v in vehicles]
    vehicle_fixed_costs = [v.fixed_cost for v in vehicles]
    print(f"Vehicle capacities: {vehicle_capacities}")
    print(f"Vehicle fixed costs: {vehicle_fixed_costs}")

    # --- MANAGER Y ROUTING ---
    try:
        manager = pywrapcp.RoutingIndexManager(len(distance_matrix), num_vehicles, depot)
        routing = pywrapcp.RoutingModel(manager)
        print("Routing model created successfully")
    except Exception as e:
        print("Error creating routing model:", e)
        return []

    # --- CALLBACK DISTANCIA ---
    for vehicle_id in range(num_vehicles):
        def make_distance_callback(v_id):
            def callback(from_index, to_index):
                from_node = manager.IndexToNode(from_index)
                to_node = manager.IndexToNode(to_index)
                distance_cost = distance_matrix[from_node][to_node]
                fixed_cost = vehicle_fixed_costs[v_id] if from_node == depot else 0
                return int(distance_cost + fixed_cost)
            return callback

        transit_callback_index = routing.RegisterTransitCallback(make_distance_callback(vehicle_id))
        routing.SetArcCostEvaluatorOfVehicle(transit_callback_index, vehicle_id)
    print("Distance callbacks registered")

    # --- CALLBACK DEMANDA ---
    def demand_callback(from_index):
        node = manager.IndexToNode(from_index)
        return demands[node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,
        vehicle_capacities,
        True,
        "Capacity"
    )
    print("Capacity dimension added")

    # --- VEHÍCULO NO USADO ---
    if force_use_all_vehicles:
        for vehicle_id in range(num_vehicles):
            routing.SetFixedCostOfVehicle(vehicle_fixed_costs[vehicle_id] * 10, vehicle_id)

    # --- PARÁMETROS DE BÚSQUEDA ---
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_parameters.time_limit.seconds = 10

    solution = routing.SolveWithParameters(search_parameters)

    if not solution:
        print("No solution found!")
        return []

    print("Solution found! Extracting routes...")

    # --- EXTRAER RUTAS ---
    routes = []
    for vehicle_idx, vehicle in enumerate(vehicles):
        index = routing.Start(vehicle_idx)
        vehicle_route = []

        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            vehicle_route.append(node_index)
            index = solution.Value(routing.NextVar(index))

        vehicle_route.append(manager.IndexToNode(index))
        print(f"Vehicle {vehicle.id} route indices: {vehicle_route}")
        routes.append((vehicle.id, vehicle_route))

    print("=== VRP DEBUG END ===")
    return routes