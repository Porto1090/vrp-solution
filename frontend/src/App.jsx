import { useEffect, useState } from 'react';
import { fetchNodes, fetchStations, fetchVehicles, fetchSegmentRoute, fetchBackend } from './services/api';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [origin, setOrigin] = useState([42.36, -71.0805]); // Default to Cambridge, MA if no valid nodes    
  const [nodes, setNodes] = useState([
    { id: "0", name: "Depot", address: "", lat: "", lng: "", load: 0, working_time: 0 }
  ]);
  const [vehicles, setVehicles] = useState([
    { id: "v1", name: "Vehicle 1", capacity: 100, fixed_cost: 50 }
  ]);
  const [stations, setStations] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const waitForBackend = async () => {
      try {
        await fetchBackend();
        
        if (isMounted) {
          setBackendReady(true);
          fetchNodes().then(fetchedData => {
            if (fetchedData && fetchedData.length > 0) {
              setNodes(fetchedData);
            }
          }).catch(console.error);
          fetchVehicles().then(fetchedData => {
            if (fetchedData && fetchedData.length > 0) {
              setVehicles(fetchedData);
            }
          }).catch(console.error);
          fetchStations().then(setStations).catch(console.error);
        }
      } catch (error) {
        console.warn("Backend unreachable or waking up, retrying in 3 seconds...");
        if (isMounted) {
          timeoutId = setTimeout(waitForBackend, 3000);
        }
      }
    };

    waitForBackend();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const drawRoute = async () => {
    if (nodes.length < 2) {
      alert("Please add at least one Depot and one Customer node.");
      return;
    }
    if (vehicles.length === 0) {
      alert("Please add at least one Vehicle.");
      return;
    }

    const hasIncompleteNodes = nodes.some(
      n => !n.name?.toString().trim() || !n.address?.toString().trim() || n.lat === "" || n.lat == null || n.lng === "" || n.lng == null
    );
    
    if (hasIncompleteNodes) {
      alert("Incomplete Nodes: Please ensure all nodes have a Name, Address, and have been geocoded (Lat/Lng).");
      return;
    }

    const hasIncompleteVehicles = vehicles.some(
      v => !v.name?.toString().trim() || v.capacity == null || v.capacity <= 0 || v.fixed_cost == null
    );

    if (hasIncompleteVehicles) {
      alert("Incomplete Vehicles: Please ensure all vehicles have a Name and a valid Capacity/Fixed Cost.");
      return;
    }

    setLoading(true);

    try {
      const routes = await fetchSegmentRoute({ nodes, vehicles, stations });
      setRouteData(routes);
    } catch (err) {
      console.error("Route optimization failed:", err);
      alert("Failed to calculate routes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 1. PANTALLA DE CARGA AISLADA
  if (!backendReady) {
    return <LoadingScreen />;
  }

  // 2. LAYOUT PRINCIPAL
  return (
    <div className="flex flex-row h-screen w-screen overflow-hidden bg-white">
      
      {/* PANEL IZQUIERDO: Exactamente 2/5 del ancho */}
      <div className="w-1/2 h-full border-r border-gray-200 p-8 overflow-y-auto">
        <Sidebar 
          setOrigin={setOrigin}
          nodes={nodes}
          setNodes={setNodes}
          vehicles={vehicles}
          setVehicles={setVehicles}
          routeData={routeData}
          loading={loading}
          onCalculate={drawRoute}
        />
      </div>

      {/* PANEL DERECHO (MAPA): Exactamente 3/5 del ancho */}
      <div className="w-1/2 h-full relative">
        <MapView
          origin={origin}
          nodes={(routeData?.nodes || nodes).filter(n => n.lat !== "" && n.lng !== "" && !isNaN(n.lat) && !isNaN(n.lng))}
          stations={stations}
          routes={routeData?.routes || []}
          setNodes={setNodes}
        />
        
        {/* FOOTER FLOTANTE SOBRE EL MAPA */}
        <div className="absolute bottom-0 right-0 m-4 bg-white/90 p-2 text-xs text-gray-700 rounded shadow-md z-[1000] pointer-events-none">
          <p>Dev by: <strong>Camilo A. Mora-Quiñones (camimora@mit.edu)</strong> & <strong>Eduardo Porto Morales (eduardo12porto@gmail.com)</strong></p>
        </div>
      </div>

    </div>
  );
}

export default App;