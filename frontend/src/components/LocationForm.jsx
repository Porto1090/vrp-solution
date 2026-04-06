// LocationForm.js
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Lista de ciudades predefinidas con sus coordenadas
const PRESET_LOCATIONS = [
  { name: "Cambridge, MA", city: "Cambridge", country: "United States", lat: 42.3601, lng: -71.0805 },
  { name: "Mexico City", city: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "Madrid", city: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Buenos Aires", city: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Sao Paulo", city: "Sao Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Lima", city: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428 },
  { name: "Bogota", city: "Bogota", country: "Colombia", lat: 4.7110, lng: -74.0721 },
  { name: "Santiago", city: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693 },
  { name: "Quito", city: "Quito", country: "Ecuador", lat: -0.1807, lng: -78.4678 },
  { name: "Caracas", city: "Caracas", country: "Venezuela", lat: 10.4806, lng: -66.9036 }
];

export default function LocationForm({ setOrigin, nodes, setNodes, vehicles, setVehicles }) {

  const [geocodeErrors, setGeocodeErrors] = useState({});
  const [locationSpecs, setLocationSpecs] = useState({
    city: "Cambridge",
    country: "United States"
  });

  const emptyNode = {
    name: "", address: "", lat: "", lng: "", load: 0, working_time: 0
  };

  const emptyVehicle = {
    name: "", capacity: 10, fixed_cost: 50
  };

  const geocodeAddress = async (index) => {
    const address = nodes[index].address;
    if (!address) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/geocode?q=${encodeURIComponent(address)} ${encodeURIComponent(locationSpecs?.city)} ${encodeURIComponent(locationSpecs?.country)}`
      );
  
      const data = await res.json();
  
      if (data.results.length > 0) {
        const best = data.results[0];
        
        // Actualizamos directamente el estado global
        const updated = [...nodes];
        updated[index].lat = parseFloat(best.lat);
        updated[index].lng = parseFloat(best.lng);
  
        setNodes(updated);
        setGeocodeErrors((prev) => {
          const copy = { ...prev };
          delete copy[index];
          return copy;
        });
      } else {
        setGeocodeErrors((prev) => ({ ...prev, [index]: "No results found" }));
      }
    } catch (err) {
      setGeocodeErrors((prev) => ({ ...prev, [index]: "Error fetching data" }));
    }
  };

  const updateNode = (index, field, value) => {
    const updated = [...nodes];
    updated[index][field] = value;

    if (field === "address") {
      updated[index].lat = "";
      updated[index].lng = "";
      setGeocodeErrors((prev) => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
    }
    setNodes(updated);
  };

  const updateVehicle = (index, field, value) => {
    const updated = [...vehicles];
    // Convertimos a número si el campo lo requiere para evitar strings de inputs
    updated[index][field] = (field === "capacity" || field === "fixed_cost") ? Number(value) : value;
    setVehicles(updated);
  };

  const addNodeRow = () => {
    setNodes([...nodes, { ...emptyNode, id: uuidv4(), name: nodes.length == 0 ? "Depot" : `Customer ${nodes.length}` }]);
  };

  const addVehicleRow = () => {
    setVehicles([...vehicles, { ...emptyVehicle, id: uuidv4(), name: `Vehicle ${vehicles.length + 1}` }]);
  };

  const removeNode = (index) => {
    if (index === 0) return;
    setNodes(nodes.filter((_, i) => i !== index));
  };

  const removeVehicle = (index) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  // NOTA: Eliminamos saveScenario() y los useEffects porque ya no son necesarios.
  // El formulario ahora lee y escribe directamente en 'nodes' y 'vehicles'.

  return (
    <div className="space-y-8">
      {/* SECCIÓN DE NODOS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Nodes to Visit</h2>
        </div>
        
        {nodes.length <= 1 && (
          <div className="mb-4 p-3 rounded-md border-l-4 border-yellow-400 bg-yellow-50 text-yellow-800 flex items-start space-x-3 text-sm">
             <p><strong>Note:</strong> The first node is the depot. Add at least 2 nodes and click "Search" to geocode.</p>
          </div>
        )}

        <div className="flex flex-col gap-3 bg-gray-50 p-3 rounded-md border border-gray-100">
          <span className="text-xs font-bold uppercase text-gray-500">Working Region (Map & Geocoding)</span>
          
          {/* Nuevo Dropdown para centrar el mapa rápido */}
          <div className="flex flex-col mb-1">
            <label className="block text-xs text-gray-500 mb-1">Quick Jump to Region</label>
            <select
              onChange={(e) => {
                const loc = PRESET_LOCATIONS.find(l => l.name === e.target.value);
                if (loc) {
                  setOrigin([loc.lat, loc.lng]); // Mueve el mapa visualmente al instante
                  setLocationSpecs({ city: loc.city, country: loc.country }); // Prepara el geocoder
                }
              }}
              className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
            >
              <option value="">-- Select a starting region --</option>
              {PRESET_LOCATIONS.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-xs text-gray-500 mb-1">City (Manual override)</label>
              <input
                value={locationSpecs.city}
                onChange={(e) => setLocationSpecs({ ...locationSpecs, city: e.target.value })}
                className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                placeholder="City"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-xs text-gray-500 mb-1">Country (Manual override)</label>
              <input
                value={locationSpecs.country}
                onChange={(e) => setLocationSpecs({ ...locationSpecs, country: e.target.value })}
                className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {nodes.map((row, i) => (
            <div key={row.id || i} className={`bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm transition-all ${i === 0 ? 'border-l-4 border-l-blue-500' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-bold uppercase ${i === 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                  {i === 0 ? '📍 Start Point (Depot)' : `👤 Customer ${i}`}
                </span>
                {i !== 0 && (
                  <button onClick={() => removeNode(i)} className="text-red-400 hover:text-red-600 p-1" title="Remove Node">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex flex-col space-between gap-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      value={row.name}
                      onChange={(e) => updateNode(i, "name", e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={i === 0 ? "Depot Name" : "Customer Name"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Address</label>
                    <input
                      value={row.address}
                      onChange={(e) => updateNode(i, "address", e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="MIT Center for Transportation & Logistics"
                    />
                  </div>
                </div>
                {i !== 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Load</label>
                      <input
                        type="number"
                        value={row.load}
                        onChange={(e) => updateNode(i, "load", Number(e.target.value))}
                        className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Working Time (minutes)</label>
                      <input
                        type="number"
                        value={row.working_time}
                        onChange={(e) => updateNode(i, "working_time", Number(e.target.value))}
                        className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-gray-200 p-3 rounded-md border border-gray-100">
                  <div className="flex flex-col items-center md:flex-row gap-2 align-middle w-full md:w-auto">
                    {(!row.lat || !row.lng) ? (
                      <button 
                        onClick={() => geocodeAddress(i)} 
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-colors"
                      >
                        Search Coordinates
                      </button>
                    ) : (
                      <div className="w-full md:w-auto bg-green-50 text-green-700 border border-green-200 text-sm font-medium px-4 py-2 rounded-md flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Geocoded
                      </div>
                    )}
                  </div>
                  
                  {geocodeErrors[i] ? (
                    <p className="text-xs text-red-600 text-center w-full md:w-auto">{geocodeErrors[i]}</p> 
                  ) : (
                    <div className="text-xs text-gray-600 font-mono text-center sm:text-right w-full md:w-auto">
                      <div>Lat: <span className="font-semibold text-gray-800">{row.lat ? Number(row.lat).toFixed(5) : "Pending"}</span></div>
                      <div>Lng: <span className="font-semibold text-gray-800">{row.lng ? Number(row.lng).toFixed(5) : "Pending"}</span></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <button onClick={addNodeRow} className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-md shadow-sm transition-colors flex items-center justify-center w-full">
            + Add Node
          </button>
        </div>
      </div>
      
      {/* SECCIÓN DE VEHÍCULOS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Vehicles</h2>
        </div>

        <div className="space-y-4">
          {vehicles.map((row, i) => (
            <div key={row.id || i} className="relative bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm transition-colors">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">🚚 Vehicle {i + 1}</span>
                {vehicles.length > 1 && (
                  <button onClick={() => removeVehicle(i)} className="text-red-400 hover:text-red-600 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                )}
              </div>

              <div className="flex flex-col space-between gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input
                    value={row.name}
                    onChange={(e) => updateVehicle(i, "name", e.target.value)}
                    className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Vehicle Name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Capacity</label>
                    <input
                      type="number"
                      value={row.capacity}
                      onChange={(e) => updateVehicle(i, "capacity", e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fixed Cost</label>
                    <input
                      type="number"
                      value={row.fixed_cost}
                      onChange={(e) => updateVehicle(i, "fixed_cost", e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addVehicleRow} className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-md shadow-sm transition-colors flex items-center justify-center w-full">
          + Add Vehicle
        </button>
      </div>
    </div>
  );
}