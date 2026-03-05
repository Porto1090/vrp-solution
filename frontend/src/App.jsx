import { useState } from 'react';
import { fetchNodes, fetchStations, fetchVehicles, fetchSegmentRoute } from './services/api';
import MapView from './components/MapView';
import RouteStats from './components/RouteStats';
import LocationForm from './components/LocationForm';

function App() {
  const [nodes, setNodes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stations] = useState([]);

  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);

  const drawRoute = async () => {
    // console.log("Nodes:", nodes);
    // console.log("Vehicles:", vehicles);
    // console.log("Stations:", stations);

    if (nodes.length < 2) {
      alert("Need at least depot + 1 node");
      return;
    }

    setLoading(true);

    try {
      const routes = await fetchSegmentRoute({ nodes, vehicles, stations });
      setRouteData(routes);
    } catch (err) {
      console.error("Route optimization failed:", err);
    } finally {
      setLoading(false);
    }
  };

   return (
    <div className="h-screen">
      {/* LEFT PANEL */}
      <div className="border p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">
          VRP Research Tool
        </h1>
        {!routeData ? (
        <>
          <LocationForm
            nodes={nodes}
            setNodes={setNodes}
            vehicles={vehicles}
            setVehicles={setVehicles}
          />
          <button
            onClick={drawRoute}
            disabled={loading || nodes.length < 2 || vehicles.length === 0}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Optimizing..." : "Optimize Routes"}
          </button>
        </>
        ) : routeData.routes.length > 0 ? (
          <RouteStats
            nodes={nodes}
            stations={stations}
            routeData={routeData}
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
          nodes={nodes}
          stations={stations}
          routeData={routeData}
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