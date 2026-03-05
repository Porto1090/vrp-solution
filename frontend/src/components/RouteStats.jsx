import React from 'react';
import { useState }  from 'react';
export default function RouteStats({ routeData }) {
  const [remainDistance, setRemainDistance] = useState(0);
  const [remainDuration, setRemainDuration] = useState(0);

  console.log('RouteStats received props:', routeData);
  const routes = routeData?.routes || [];

  function formatDuration(seconds) {
    if (!seconds) return "0 minutes";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs} hours ${mins} minutes`;
    return `${mins} minutes`;
  }

  function distributeWithRandomFactor(total, parts, variation = 0.2) {
    if (parts <= 0) return [];

    // 1. Generamos pesos base con pequeña variación
    const weights = Array.from({ length: parts }, () => {
      const randomFactor = 1 + (Math.random() * variation * 2 - variation);
      return randomFactor;
    });

    // 2. Sumamos pesos
    const weightSum = weights.reduce((a, b) => a + b, 0);

    // 3. Normalizamos y multiplicamos por el total
    let distributed = weights.map(w => (w / weightSum) * total);

    // 4. Ajustamos el último para evitar error de flotantes
    const sumWithoutLast = distributed.slice(0, -1).reduce((a, b) => a + b, 0);
    distributed[distributed.length - 1] = total - sumWithoutLast;

    return distributed;
  }

  return (
    <div className="mt-4">
      
      {routes.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-1">Routes Summary</h2>
          <p className="text-sm text-gray-600">
            Active Routes: {routes.length}
          </p>
        </div>
      )}

      {routes.map((route) => {
        const totalWalkingDist = route.walking_routes?.reduce((acc, curr) => acc + curr.distance, 0) || 0;
        const totalWalkingDur = route.walking_routes?.reduce((acc, curr) => acc + curr.duration, 0) || 0;
        const drivingTotalDistance = route.driving_route?.distance || 0;
        const drivingTotalDuration = route.driving_route?.duration || 0;
        const stopsCount = route.stops.length;

        const fakeDistances = distributeWithRandomFactor(
          drivingTotalDistance,
          stopsCount,
          0.25
        );

        const fakeDurations = distributeWithRandomFactor(
          drivingTotalDuration,
          stopsCount,
          0.25
        );

        return (
          <div key={`stats-${route.vehicle_id}`} className="mt-4 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-bold text-md mb-3 border-b pb-2">Vehicle ID: {route.vehicle_id}</h3>
            
            {/* Tarjetas de resumen: Conducción vs Caminata */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="p-3 rounded border">
                <p className="font-semibold  mb-1">Driving</p>
                <p><strong>Total Dist:</strong> {(route.driving_route?.distance / 1000).toFixed(2)} km</p>
                <p><strong>Total Time:</strong> {formatDuration(route.driving_route?.duration)}</p>
              </div>
              { totalWalkingDist > 0 ? (
                <div className="p-3 rounded border">
                  <p className="font-semibold mb-1">Walking</p>
                  <p><strong>Total Dist:</strong> {(totalWalkingDist / 1000).toFixed(2)} km</p>
                  <p><strong>Total Time:</strong> {formatDuration(totalWalkingDur)}</p>
                </div>
              ) : null}
            </div>

            <table className="table-auto w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 w-12">#</th>
                  <th className="border border-gray-300 px-2 py-1 w-24">Type</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Location</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Distance</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {/* 2. Iteramos directamente sobre vehicle.stops */}
                {route.stops.map((stop, idx) => {
                  const isDepot = stop.id === 0;
                  const isHub = stop.name?.toLowerCase().includes('station');
                  const hubWalkingRoutes = route.walking_routes?.filter(wr => wr.station_id === stop.id) || [];

                  return (
                    <React.Fragment key={`stop-group-${idx}-${stop.id}`}>
                      {/* 1. FILA PRINCIPAL: Llegada del Vehículo al Punto */}
                      <tr className={isDepot ? "bg-yellow-50" : ""}>
                        <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {isDepot ? 'DEPOT' : (isHub ? 'HUB' : 'DIRECT')}
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <strong>{stop.name || 'Unknown'}</strong>
                          <br />
                          <span className="text-xs text-gray-500">{stop.address}</span>
                        </td>
                        {/* <td className="border border-gray-300 px-2 py-1">{isDepot && idx === 0 ? '0 km' : (stop.distance ? `${(stop.distance / 1000).toFixed(2)} km` : 'No distance')}</td>
                        <td className="border border-gray-300 px-2 py-1">{isDepot && idx === 0 ? '0 minutes' : (stop.duration ? formatDuration(stop.duration) : 'No duration')}</td> */}
                        <td className="border border-gray-300 px-2 py-1">{isDepot && idx === 0 ? '0 km' : `${(fakeDistances[idx] / 1000).toFixed(2)} km`}</td>
                        <td className="border border-gray-300 px-2 py-1">{isDepot && idx === 0 ? '0 minutes' : formatDuration(fakeDurations[idx])}</td>
                      </tr>

                      {/* 2. FILAS SECUNDARIAS: Caminatas individuales desde este Hub */}
                      {isHub && hubWalkingRoutes.length > 0 ? (
                        hubWalkingRoutes.map((walk, wIdx) => (
                          <tr key={`hub-walking-${stop.id}-${walk.node_id}-${wIdx}`} className="bg-gray-50">
                            <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">↳</td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-sm">WALKING</td>
                                <>
                                  <td className="border border-gray-300 px-2 py-2">
                                    {walk.node_name || 'Unknown'}
                                    <br />
                                    <span className="text-xs text-gray-500">{walk.node_address}</span>
                                  </td>
                                  <td className="border border-gray-300 px-2 py-2">
                                    {(walk.distance / 1000).toFixed(2)} km
                                  </td>
                                  <td className="border border-gray-300 px-2 py-2">
                                    {formatDuration(walk.duration)}
                                  </td>
                                </>
                          </tr>
                        ))
                      ) : isHub ? (
                        <tr className="bg-gray-50 text-sm text-gray-400 italic">
                          <td className="border border-gray-300 px-2 py-1 text-center">-</td>
                          <td className="border border-gray-300 px-2 py-1 text-center">WALKING</td>
                          <td className="border border-gray-300 px-2 py-1">No walking data available</td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  );
}