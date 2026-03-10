import React, { useMemo } from 'react';
import { Truck, PersonWalking, MapPin, Package } from 'lucide-react';

export default function RouteStats({ routes }) {
  console.log("Rendering RouteStats with routes:", routes);
  const startHour = 28800;
  
  function formatDuration(seconds) {
    if (seconds === undefined || seconds === null) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const paddedHours = String(hrs).padStart(2, "0");
    const paddedMins = String(mins).padStart(2, "0");

    return `${paddedHours}:${paddedMins}`;
  }

  return (
    <div className="mt-4">
      
      {routes?.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-1">Routes Summary</h2>
          <p className="text-sm text-gray-600">
            Active Routes: {routes.length}
          </p>
        </div>
      )}

      {routes.map((route) => {
        const totalWalkingDist = route.total_walking_distance || 0;
        const totalWalkingDur = route.total_walking_time || 0;
        const drivingTotalDistance = route.total_driving_distance || 0;
        const drivingTotalDuration = route.total_driving_time || 0;

        let arrivalHour = 0;
        let accumulatedTime = 0;
        let departureHour = 0;

        let distanceAccumulated = 0;

        return (
          <div key={`stats-${route.vehicle.id}`} className="mt-4 p-4 border rounded-lg shadow-sm bg-white">
            <div className="flex flex-row items-center justify-between mb-4 border-b">
              <div>
                <h2 className="font-bold text-lg">{route.vehicle.name}</h2>
                <h3 className="font-semibold text-gray-700 text-sm mb-3 pb-2">Vehicle ID: {route.vehicle.id}</h3>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-3 pb-2">Route Load: {route.route_load}</h3>
            </div>
            
            {/* Tarjetas de resumen: Conducción vs Caminata */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="p-3 rounded border">
                <p className="font-semibold  mb-1">Driving</p>
                <p><strong>Total Dist:</strong> {(drivingTotalDistance / 1000).toFixed(2)}</p>
                <p><strong>Total Time:</strong> {formatDuration(drivingTotalDuration)}</p>
              </div>
              {totalWalkingDist > 0 ? (
                <div className="p-3 rounded border">
                  <p className="font-semibold mb-1">Walking</p>
                  <p><strong>Total Dist:</strong> {(totalWalkingDist / 1000).toFixed(2)}</p>
                  <p><strong>Total Time:</strong> {formatDuration(totalWalkingDur)}</p>
                </div>
              ) : null}
            </div>

            <table className="table-auto w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 w-12">#</th>
                  <th className="border border-gray-300 px-2 py-1 w-24">Type</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Location Name</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Distance</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Load</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Driving/WalkingTime</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Arrival</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Departure</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Working Time (min)</th>
                </tr>
              </thead>
              <tbody>
                {/* 2. Iteramos directamente sobre vehicle.stops */}
                {route.stops.map((stop, idx) => {
                  const isFirstDepot = idx === 0;
                  const isDepot = stop.id === 0 || stop.id === "0";
                  const isHub = stop.name?.toLowerCase().includes('parking')
                  const hubWalkingRoutes = route.walking_routes?.filter(wr => wr.station_id === stop.id) || [];

                  const segmentDistance = isFirstDepot ? 0 : route.driving_routes?.[idx - 1]?.distance || 0;
                  const segmentDuration = isFirstDepot ? 0 : route.driving_routes?.[idx - 1]?.duration || 0;
                  
                  arrivalHour += segmentDuration;
                  departureHour += segmentDuration + (isDepot ? 0 : (stop.working_time || 0) * 60);
                  arrivalHour = departureHour;

                  distanceAccumulated += segmentDistance;

                  return (
                    <React.Fragment key={`stop-group-${idx}-${stop.id}`}>
                      {/* 1. FILA PRINCIPAL: Llegada del Vehículo al Punto */}
                      <tr className={isDepot ? "bg-yellow-50" : ""}>
                        <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">
                          {idx}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {isDepot ? 'DEPOT' : (isHub ? 'HUB' : 'DIRECT')}
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <strong>{stop.name || 'Unknown'}</strong>
                          <br />
                          <span className="text-xs text-gray-500">{stop.address}</span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">{isDepot && idx === 0 ? '0.00' : `${(distanceAccumulated / 1000).toFixed(2)}`}</td>
                        <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">{stop.load || "0"}</td>
                        <td className="border border-gray-300 px-2 py-1">{isDepot && idx === 0 ? '00:00' : formatDuration(segmentDuration)}</td>
                        <td className="border border-gray-300 px-2 py-1">{formatDuration(arrivalHour)}</td>
                        <td className="border border-gray-300 px-2 py-1">{formatDuration(departureHour)}</td>
                        <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">{!isDepot ? (!isHub ? formatDuration((stop.working_time || 0) * 60) : "") : "00:00"}</td>
                      </tr>

                      {/* 2. FILAS SECUNDARIAS: Caminatas individuales desde este Hub */}
                      {isHub && hubWalkingRoutes.length > 0 && (
                        hubWalkingRoutes.map((walk, wIdx) => {
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
                              {formatDuration(walk.duration)}
                            </td>
                            <td className="border border-gray-300 px-2 py-1">{formatDuration(arrivalHour)}</td>
                            <td className="border border-gray-300 px-2 py-1">{formatDuration(departureHour)}</td>
                            <td className="border border-gray-300 px-2 py-2 text-center text-gray-500">{formatDuration((walk.node.working_time || 0) * 60)}</td>
                          </tr>
                          );
                        })
                      )}
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