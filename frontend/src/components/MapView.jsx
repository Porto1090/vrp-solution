import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker } from 'react-leaflet';
import MapController from "./MapController";
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import parkingIconUrl from '/parking.png';
import warehouseIconUrl from '/warehouse.png';
import deliveryIconUrl from '/delivery.png';

const stationIcon = new L.Icon({
  iconUrl: parkingIconUrl,
  iconSize: [25, 25],
});

const hubIcon = new L.Icon({
  iconUrl: warehouseIconUrl,
  iconSize: [35, 35],
});

const deliveryIcon = new L.Icon({
  iconUrl: deliveryIconUrl,
  iconSize: [35, 35],
});

const COLORS = [
  'blue', 'yellow', 'brown', 'orange', 'purple', 'red', 'pink', 'cyan'
];

export default function MapView({ nodes, stations, routes, setNodes }) {
  const center = (nodes && nodes.length && nodes[0]?.lat != null && nodes[0]?.lng != null)
    ? [nodes[0].lat, nodes[0].lng]
    : [42.36, -71.0805]; // Default to Boston, MA if no valid nodes    
  
  return (
    <MapContainer center={center} zoom={14} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={center} />

      {/* 1. Dibujar las Estaciones (Hubs) */}
      {stations.map((station) => {
        const hasRoutes = routes && routes.length > 0;
        const stationExists = routes?.some(route =>
          route.stops?.slice(1, -1).some(stop => stop.id === station.id)
        );

        if (hasRoutes && !stationExists) {
          return null; 
        }

        return (
          <React.Fragment key={`station-${station.id}`}>
            {stationExists && (
              <Circle center={[station.lat, station.lng]} pathOptions={{fillColor: 'gray', color: 'black', weight: 1.25, opacity: 0.25}} radius={250} />
            )}
            {/* <CircleMarker
              center={[station.lat, station.lng]}
              radius={6}
              icon={stationIcon}
              pathOptions={{
                fillColor: 'blue',
                color: 'white',
                weight: 2,
                fillOpacity: 0.5
              }}
              >
            </CircleMarker> */}
            <Marker
              position={[station.lat, station.lng]}
              icon={stationIcon}
              opacity={stationExists ? 1 : 0.5}
              >
              <Popup>
                <strong>{station.name}</strong><br/>
                {station.address}
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}

      {/* 2. Dibujar los Nodos (Clientes Finales) */}
      {nodes.map((node) => (
        String(node.id) === "0" ? (
          /* --- RENDERIZAR DEPOT --- */
          <Marker
            key={`depot-${node.id}`}
            position={[node.lat, node.lng]}
            icon={hubIcon}
          >
            <Popup>
              <strong>{node.name}</strong><br/>
              {node.address}

            </Popup>
          </Marker>
        ) : (
          /* --- RENDERIZAR NODOS NORMALES --- */
          <Marker 
            key={`node-${node.id}`} 
            position={[node.lat, node.lng]}
            icon={deliveryIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const pos = e.target.getLatLng()
                setNodes(prev =>
                  prev.map(n =>
                    n.id === node.id
                      ? { ...n, lat: pos.lat, lng: pos.lng }
                      : n
                  )
                )
              }
            }}
          >
            <Popup>
              <strong>{node.name}</strong><br/>
              {node.address && (
                <>
                  {node.address}<br/>
                </>
              )}
              {node.nearby_node_id && (
                <>{`(Assigned to EZ Parking ${node.nearby_node_id})`}</>
              )}
            </Popup>
          </Marker>
        )
      ))}

      {/* 3. Dibujar las Rutas de los Vehículos */}
      {routes.map((route, idx) => {
        const routeColor = COLORS[idx % COLORS.length];
        return (
          <div key={`vehicle-routes-${route.vehicle.id}`}>

            {/* Ruta Principal (Conduciendo) - Línea Sólida */}
            {route.driving_route?.coords && (
              <Polyline
                positions={route.driving_route.coords}
                pathOptions={{
                  color: routeColor,
                  weight: 5,
                  opacity: 0.8
                }}
              />
            )}

            {/* Rutas Secundarias (Caminando) - Línea Punteada */}
            {route.walking_routes?.map((walkingRoute, wIdx) => (
              <Polyline
                key={`walking-${route.vehicle.id}-${wIdx}`}
                positions={walkingRoute.coords}
                pathOptions={{
                  color: 'black',
                  weight: 4,
                  opacity: 0.7,
                  dashArray: "8, 8"
                }}
              />
            ))}
          </div>
          );
        })}
    </MapContainer>
  );
}