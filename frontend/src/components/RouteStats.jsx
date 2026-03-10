import React, { useMemo } from 'react';
import { Truck, Footprints, Package } from 'lucide-react';

export default function RouteStats({ routes }) {
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  let arrivalHour = 0;
  let departureHour = 0;
  let distanceAccumulated = 0;

  return (
    <div className="space-y-8 p-4 bg-gray-50">
      {routes.map((route) => (
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
              <span className="text-xl font-mono font-bold text-yellow-400">{route.route_load}</span>
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
                      {formatTime(route.total_driving_time)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">hrs</span>
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
                        {(route.total_walking_distance / 1000).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">km</span>
                    </div>
                    <div className="border-l border-gray-300 pl-4">
                      <span className="text-lg font-bold text-gray-800">
                        {formatTime(route.total_walking_time)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">min</span>
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
                  <th className="border border-gray-300 px-2 py-1 w-12">#</th>
                  <th className="border border-gray-300 px-2 py-1 w-24">Type</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Location Name</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Distance</th>
                  <th className="p-3 border-b text-center"><Package size={14} className="inline"/></th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Driving/WalkingTime</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Arrival</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Departure</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Working Time (min)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* 2. Iteramos directamente sobre vehicle.stops */}
                {route.stops.map((stop, idx) => {
                  const isFirstDepot = idx === 0;
                  const isDepot = stop.id === 0 || stop.id === "0";
                  const isHub = stop.name?.toLowerCase().includes('parking')
                  const walks = route.walking_routes?.filter(wr => wr.station_id === stop.id) || [];

                  const segmentDistance = isFirstDepot ? 0 : route.driving_routes?.[idx - 1]?.distance || 0;
                  const segmentDuration = isFirstDepot ? 0 : route.driving_routes?.[idx - 1]?.duration || 0;
                  
                  arrivalHour += segmentDuration;
                  departureHour += segmentDuration + (isDepot ? 0 : (stop.working_time || 0) * 60);
                  arrivalHour = departureHour;

                  distanceAccumulated += segmentDistance;

                  return (
                    <React.Fragment key={`stop-group-${idx}-${stop.id}`}>
                      {/* Fila de Conducción / Parada Principal */}
                      <tr className={isDepot ? "bg-blue-100" : ""}>
                        <td className="border border-gray-300 p-2 text-center text-gray-500">
                          {idx}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {isHub ? 'HUB' : 'DEPOT'}
                        </td>
                        <td className="font-semibold border border-gray-300 px-2 py-2">
                          <strong>{stop.name}</strong>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{stop.address}</div>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">{isDepot && idx === 0 ? '0.00' : `${(distanceAccumulated / 1000).toFixed(2)}`}</td>
                        <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">{stop.load || "0"}</td>
                        <td className="border border-gray-300 px-2 py-1">{isDepot && idx === 0 ? '00:00' : formatTime(segmentDuration)}</td>
                        <td className="border border-gray-300 px-2 py-1">WIP</td>
                        <td className="border border-gray-300 px-2 py-1">WIP</td>
                        <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">{!isDepot ? (!isHub ? formatTime((stop.working_time || 0) * 60) : "") : "00:00"}</td>
                      </tr>

                      {/* Filas de Caminata con diseño anidado */}
                      {isHub && walks.map((walk, wIdx) => {
                          arrivalHour += segmentDuration;
                          departureHour += segmentDuration + ((walk.node.working_time*60));
                          arrivalHour = departureHour;

                          return (
                            <tr key={`hub-walking-${stop.id}-${walk.node_id}-${wIdx}`} className="bg-gray-50">
                              <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">↳</td>
                              <td className="border border-gray-300 px-2 py-2 text-center text-sm">WALKING</td>
                              <td className="border border-gray-300 px-2 py-2">
                                {walk.node.name || 'Unknown'}
                                <br />
                                <span className="text-xs text-gray-500">{walk.node.address}</span>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                {(walk.distance / 1000).toFixed(2)} (x2)
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">{walk.node.load || "0"}</td>
                              <td className="border border-gray-300 px-2 py-2">
                                {formatTime(walk.duration)}
                              </td>
                              <td className="border border-gray-300 px-2 py-1">WIP</td>
                              <td className="border border-gray-300 px-2 py-1">WIP</td>
                              <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">{formatTime((walk.node.working_time || 0) * 60)}</td>
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