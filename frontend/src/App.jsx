import { useEffect, useState } from 'react';
import { fetchNodes, fetchStations, fetchVehicles, fetchSegmentRoute } from './services/api';
import MapView from './components/MapView';
import RouteStats from './components/RouteStats';
import LocationForm from './components/LocationForm';

function App() {
  const [nodes, setNodes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);

  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      fetchNodes().then(setNodes);
      fetchStations().then(setStations);
      fetchVehicles().then(setVehicles);
    };
    loadData();
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
      n => !n.name?.trim() || !n.address?.trim() || !n.lat || !n.lng
    );
    
    if (hasIncompleteNodes) {
      alert("Incomplete Nodes: Please ensure all nodes have a Name, Address, and have been geocoded (Lat/Lng).");
      return;
    }

    const hasIncompleteVehicles = vehicles.some(
      v => !v.name?.trim() || v.capacity == null || v.capacity <= 0 || v.fixed_cost == null
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

   return (
    <div className="h-screen">
      {/* LEFT PANEL */}
      <div className="border p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">
          VRP - Park and Loop Tool
        </h1>
        {!routeData ? (
        <>
          {!loading && (
            <LocationForm
              nodes={nodes}
              setNodes={setNodes}
              vehicles={vehicles}
              setVehicles={setVehicles}
            />
          )}
          <button
            onClick={drawRoute}
            disabled={loading || nodes.length < 2 || vehicles.length === 0}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Calculating..." : "Calculate Routes"}
          </button>
        </>
        ) : routeData.routes.length > 0 ? (
          <RouteStats
            routes={routeData?.routes || []}
          />
        ) : (
          <div className="mt-4 p-3 rounded border-l-4 border-red-400 bg-red-50 text-red-800">
            <p className="font-semibold">No routes found</p>
            <p className="text-sm">
              We couldn't generate a route with the current nodes and vehicles. Please try again.
            </p>
          </div>
        )}
      </div>

      {/* MAP */}
      <div className="flex-1">
        <MapView
          nodes={routeData?.nodes || nodes}
          stations={stations}
          routes={routeData?.routes || []}
          setNodes={setNodes}
        />
      </div>

      <div className="mt-8 p-4 border-t border-gray-200 text-sm text-gray-600 text-left">
        <p>
          Developed by <strong>Camilo A. Mora-Quiñones</strong> &mdash;{" "}
          <a href="mailto:camimora@mit.edu" className="underline hover:text-gray-800">
            camimora@mit.edu
          </a>
        </p>
        <p>
          Developed by <strong>Eduardo Porto Morales</strong>
        </p>
      </div>
    </div>
  )
}

export default App