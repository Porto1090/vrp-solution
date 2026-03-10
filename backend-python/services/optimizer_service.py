from ortools.constraint_solver import pywrapcp, routing_enums_pb2

def solve_vrp(distance_matrix, vehicles, depot=0, demands=None, penalty=10000, max_route_distance=100000):
    print("=== VRP DEBUG START ===")
    num_vehicles = len(vehicles)
    num_nodes = len(distance_matrix)
    
    print(f"Nodes: {num_nodes}")
    print(f"Vehicles: {num_vehicles}")

    # -------------------------
    # DEMANDAS
    # -------------------------  
    if demands is None:
        demands = [0] + [1] * (len(distance_matrix) - 1)
            
    vehicle_capacities = [v.capacity for v in vehicles]
    vehicle_fixed_costs = [v.fixed_cost for v in vehicles]
    print(f"Vehicle Capacities: {vehicle_capacities}")
    print(f"Vehicle Fixed Costs: {vehicle_fixed_costs}")

    # -------------------------
    # CREAR MODELO
    # -------------------------
    try:
        """ Esto crea el modelo matemático del problema.
            El manager se encarga de convertir:
            indices internos <-> nodos reales
            Porque OR-Tools usa índices internos.
        """
        manager = pywrapcp.RoutingIndexManager(len(distance_matrix), num_vehicles, depot)
        routing = pywrapcp.RoutingModel(manager)
        print("Routing model created successfully")
    except Exception as e:
        print("Error creating routing model:", e)
        return []

    # -------------------------
    # CALLBACK DISTANCIA
    # -------------------------
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)

        return int(distance_matrix[from_node][to_node])

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    print("Distance callbacks registered")

    # -------------------------
    # COSTO FIJO VEHICULO
    # -------------------------
    for vehicle_id in range(num_vehicles):
        routing.SetFixedCostOfVehicle(vehicle_fixed_costs[vehicle_id], vehicle_id)

    print("Vehicle fixed costs applied")
    
    # -------------------------
    # DEMANDA
    # ------------------------- 
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

    # -------------------------
    # LIMITE DISTANCIA RUTA
    # -------------------------
    routing.AddDimension(
        transit_callback_index,
        0,
        max_route_distance,
        True,
        "Distance"
    )
    print("Max route distance constraint added")

    # -------------------------
    # NODOS OPCIONALES
    # -------------------------
    for node in range(1, num_nodes):
        routing.AddDisjunction(
            [manager.NodeToIndex(node)],
            penalty
        )
    print(f"Optional nodes enabled (penalty={penalty})")
    
    # -------------------------
    # PARAMETROS BUSQUEDA
    # -------------------------
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    
    # Construye rutas greedily tomando el arco más barato.
    search_parameters.first_solution_strategy = (routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION)
    
    # Es un algoritmo que mejora la solución inicial buscando mejores rutas.
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    
    search_parameters.time_limit.seconds = 10
    
    search_parameters.log_search = False

    solution = routing.SolveWithParameters(search_parameters)

    if not solution:
        print("No solution found!")
        return []
    print("Solution found! Extracting routes...")

    # -------------------------
    # EXTRAER RUTAS
    # -------------------------
    routes = []
    for vehicle_idx, vehicle in enumerate(vehicles):
        index = routing.Start(vehicle_idx)
        route = []
        route_load = 0

        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            route.append(node_index)
            route_load += demands[node_index]
            index = solution.Value(routing.NextVar(index))

        route.append(manager.IndexToNode(index))
        routes.append({
            "vehicle_id": vehicle.id,
            "vehicle_route": route,
            "load": route_load
        })

    print("=== VRP DEBUG END ===")
    return routes