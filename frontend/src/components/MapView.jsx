import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker } from 'react-leaflet';
import MapController from "./MapController";
import 'leaflet/dist/leaflet.css';

const COLORS = [
  'blue', 'green', 'red', 'orange', 'purple', 'brown', 'pink', 'cyan'
];

export default function MapView({ nodes, stations, routeData, setNodes }) {
  const center = (nodes && nodes.length && nodes[0]?.lat != null && nodes[0]?.lng != null)
    ? [nodes[0].lat, nodes[0].lng]
    : [42.3601, -71.0589]; // Default to Boston, MA if no valid nodes
  const routes = routeData?.routes || [];
  
  return (
    <MapContainer center={center} zoom={14} style={{ height: '700px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={center} />

      {/* 1. Dibujar las Estaciones (Hubs) */}
      {stations.map((station) => {
        const stationExists = routes?.some(route =>
          route.stops?.slice(1, -1).some(stop => stop.id === station.id)
        );

        if (stationExists) {
          return (
            <div key={`station-group-${station.id}`}>
              {station.id !== 0 && (
                <Circle center={[station.lat, station.lng]} pathOptions={{fillColor: 'none', color: 'black', weight: 1}} radius={500} />
              )}
              <CircleMarker
                center={[station.lat, station.lng]}
                radius={station.id === 0 ? 8 : 6}
                pathOptions={{
                  fillColor: station.id === 0 ? 'black' : 'gray',
                  color: 'white',
                  weight: 2,
                  fillOpacity: 0.75
                }}
                >
                <Popup>
                  <strong>{station.name}</strong><br/>
                  {station.address}
                </Popup>
              </CircleMarker>
            </div>
          );
        }
        return null;
      })}

      {/* 2. Dibujar los Nodos (Clientes Finales) */}
      {nodes.map((node) => (
        <Marker 
          key={`node-${node.id}`} 
          position={[node.lat, node.lng]}
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
            {node.address} <br/>
            {node.nearby_node_id ? `(Assigned to Station ${node.nearby_node_id})` : '(Direct Delivery)'}
          </Popup>
        </Marker>
      ))}

      {/* 3. Dibujar las Rutas de los Vehículos */}
      {routes.map((route, idx) => {
        const routeColor = COLORS[idx % COLORS.length];
        return (
          <div key={`vehicle-routes-${route.vehicle_id}`}>

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
                key={`walking-${route.vehicle_id}-${wIdx}`}
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