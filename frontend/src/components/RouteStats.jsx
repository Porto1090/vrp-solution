import React, { useMemo } from 'react';
import { Truck, Footprints, Package } from 'lucide-react';

export default function RouteStats({ routes }) {
  const START_TIME_SECONDS = 6 * 3600; 
  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return "00:00";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} hrs` 
      : `${String(m).padStart(2, '0')} min` == "00 min" ? "<1 min" : `${String(m).padStart(2, '0')} min`;
  };

  const formatClock = (totalSeconds) => {
    const hours24 = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const enrichedRoutes = useMemo(() => {
    return routes.map((route) => {
      let currentTime = START_TIME_SECONDS;
      let currentDistance = 0;

      const enrichedStops = route.stops.map((stop, idx) => {
        const isFirstDepot = idx === 0;
        const isDepot = stop.id === 0 || stop.id === "0";
        const isHub = stop.name?.toLowerCase().includes('parking');
        const walks = route.walking_routes?.filter(wr => wr.station_id === stop.id) || [];

        // 1. Sumar tiempo y distancia de conducción para LLEGAR a esta parada
        let segmentDistance = 0;
        let segmentDuration = 0;
        if (!isFirstDepot && route.driving_routes?.[idx - 1]) {
          segmentDistance = route.driving_routes[idx - 1].distance;
          segmentDuration = route.driving_routes[idx - 1].duration;
        }

        currentTime += segmentDuration;
        currentDistance += segmentDistance;
        
        const arrivalTime = currentTime;
        let enrichedWalks = [];

        // 2. Calcular el tiempo invertido en la parada (Trabajo / Caminatas)
        if (isHub) {
          // Si es un HUB, el vehículo espera mientras se hacen las rutas a pie (Ida y Vuelta)
          walks.forEach(walk => {
            const walkArrival = currentTime + walk.duration;
            const walkWorkTime = (walk.node?.working_time || 0) * 60;
            const walkDeparture = walkArrival + walkWorkTime;
            
            // Se asume un viaje de ida y vuelta (round-trip)
            const legTotalTime = (walk.duration * 2) + walkWorkTime; 
            
            enrichedWalks.push({
              ...walk,
              arrivalTime: walkArrival,
              departureTime: walkDeparture,
            });

            currentTime += legTotalTime; // El tiempo avanza para el siguiente cliente
          });
        } else if (!isDepot) {
          // Parada normal (no depot, no hub)
          const workTimeSeconds = (stop.working_time || 0) * 60;
          currentTime += workTimeSeconds;
        }

        const departureTime = currentTime;

        return {
          ...stop,
          isDepot,
          isHub,
          segmentDistance,
          segmentDuration,
          accumulatedDistance: currentDistance,
          arrivalTime,
          departureTime,
          enrichedWalks
        };
      });

      return { ...route, enrichedStops };
    });
  }, [routes]);

  return (
    <div className="space-y-8 pb-10">
      {enrichedRoutes.map((route) => (
        <div key={route.vehicle.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">

          {/* Header del Vehículo */}
          <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Truck size={20} /> {route.vehicle.name}
              </h2>
              <p className="text-xs opacity-75">ID: {route.vehicle.id}</p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase block opacity-75">Total Load</span>
              <span className="text-xl font-mono font-bold text-yellow-400">{route.route_load}</span><span className="text-xl font-mono font-semibold text-gray-300">/{route.vehicle.capacity}</span>
            </div>
          </div>
          
          {/* Sección de Resumen de Ruta: Conducción vs Caminata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-gray-100">
            {/* Bloque de Conducción */}
            <div className="p-4 flex items-center gap-4 bg-blue-50/30">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Truck size={24} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Driving Summary</p>
                <div className="flex gap-4 mt-1">
                  <div>
                    <span className="text-lg font-bold text-gray-800">
                      {(route.total_driving_distance / 1000).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">km</span>
                  </div>
                  <div className="border-l border-gray-300 pl-4">
                    <span className="text-lg font-bold text-gray-800">
                      {formatDuration(route.total_driving_time)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque de Caminata (Solo si existe distancia) */}
            {route.total_walking_distance > 0 ? (
              <div className="p-4 flex items-center gap-4 bg-indigo-50/30 border-l border-gray-100">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Footprints size={24} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Walking Summary</p>
                  <div className="flex gap-4 mt-1">
                    <div>
                      <span className="text-lg font-bold text-gray-800">
                        {(route.total_walking_distance*2 / 1000).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">km</span>
                    </div>
                    <div className="border-l border-gray-300 pl-4">
                      <span className="text-lg font-bold text-gray-800">
                        {formatDuration(route.total_walking_time*2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-center bg-gray-50 text-gray-400 italic text-sm border-l border-gray-100">
                No walking segments in this route
              </div>
            )}
          </div>

          {/* Tabla de Detalles de Paradas */}
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="border border-gray-300 px-2 py-2 text-center">#</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">Type</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Location Name</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Accum. Dist.</th>
                  <th className="border border-gray-300 px-2 py-2 text-center"><Package size={14} className="mx-auto"/></th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Transp. Duration</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Arrival</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Departure</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Service Time</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* 2. Iteramos directamente sobre vehicle.stops */}
                {route.enrichedStops.map((stop, idx) => {
                  return (
                    <React.Fragment key={`stop-group-${idx}-${stop.id}`}>
                      {/* Fila de Conducción / Parada Principal */}
                      <tr className={stop.isDepot ? "bg-blue-100 font-medium" : stop.isHub ? "bg-yellow-50" : ""}>
                        <td className="border border-gray-300 p-2 text-center text-gray-500">
                          {idx}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-semibold">
                          {stop.isDepot ? 'DEPOT' : stop.isHub ? 'HUB' : 'STOP'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <strong>{stop.name}</strong>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{stop.address}</div>
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          {(stop.accumulatedDistance / 1000).toFixed(2)} km
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center font-medium">
                          {stop.load || "0"}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-600">
                          {idx === 0 ? '--' : formatDuration(stop.segmentDuration)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 font-mono text-center">
                          {idx === 0 ? '--' : formatClock(stop.arrivalTime)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 font-mono text-center">
                          {idx === route.enrichedStops.length - 1 ? '--' : formatClock(stop.departureTime)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-600">
                          {(!stop.isDepot && !stop.isHub) ? formatDuration((stop.working_time || 0) * 60) : '--'}
                        </td>
                      </tr>

                      {/* Filas de Caminata con diseño anidado */}
                      {stop.isHub && stop.enrichedWalks.map((walk, wIdx) => {
                          return (
                            <tr key={`hub-walking-${stop.id}-${walk.node_id}-${wIdx}`} className="bg-gray-50">
                              <td className="border border-gray-300 px-2 py-2 text-center text-indigo-400">↳</td>
                              <td className="border border-gray-300 px-2 py-2 text-center text-xs text-indigo-600 font-semibold">
                                WALKING
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                {walk.node.name || 'Unknown'}
                                <div className="text-xs text-gray-500">{walk.node.address}</div>
                              </td>
                              <td className="border border-gray-300 px-2 py-2  text-xs">
                                + {(walk.distance / 1000).toFixed(2)} km (x2)
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center text-gray-600">
                                {walk.node.load || "0"}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-gray-600">
                                {formatDuration(walk.duration)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 font-mono text-center text-xs text-gray-600">
                                {formatClock(walk.arrivalTime)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 font-mono text-center text-xs text-gray-600">
                                {formatClock(walk.departureTime)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-gray-600">
                                {formatDuration((walk.node.working_time || 0) * 60)}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
    )}
  </div>
)};