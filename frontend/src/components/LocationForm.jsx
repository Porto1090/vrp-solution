import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function LocationForm({ nodes, setNodes, vehicles, setVehicles }) {
  const [geocodeErrors, setGeocodeErrors] = useState({});
  const [locationSpecs, setLocationSpecs] = useState({
    city: "Boston",
    country: "United States"
  });

  const emptyNode = {
    name: "", address: "", lat: "", lng: ""
  };

  const emptyVehicle = {
    id: uuidv4(), name: "", capacity: 10, fixed_cost: 50
  };

  const [nodeRows, setNodeRows] = useState([
    { ...emptyNode, name: "Depot" }
  ]);
  const [vehicleRows, setVehicleRows] = useState([
    { ...emptyVehicle, name: "Vehicle 1" }
  ]);

  useEffect(() => {
    if (nodes && nodes.length > 0) {
      setNodeRows(nodes);
    }
  }, [nodes]);

  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      setVehicleRows(vehicles);
    }
  }, [vehicles]);

  const geocodeAddress = async (index) => {
    const address = nodeRows[index].address;

    if (!address) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/geocode?q=${encodeURIComponent(address)} ${encodeURIComponent(locationSpecs?.city)} ${encodeURIComponent(locationSpecs?.country)}`
      );
  
      const data = await res.json();
  
      if (data.results.length > 0) {
        const best = data.results[0];
  
        const updated = [...nodeRows];
        updated[index].lat = best.lat;
        updated[index].lng = best.lng;
  
        setNodeRows(updated);
        setGeocodeErrors((prev) => {
          const copy = { ...prev };
          delete copy[index];
          return copy;
        });
      } else {
        setGeocodeErrors((prev) => ({
          ...prev,
          [index]: "No results found for this address"
        }));
      }
    } catch (err) {
      setGeocodeErrors((prev) => ({
        ...prev,
        [index]: "Error fetching geocode data"
      }));
    }
  
    saveScenario();
  };

  const updateNode = (index, field, value) => {
    const updated = [...nodeRows];
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

    setNodeRows(updated);
  };

  const updateVehicle = (index, field, value) => {
    const updated = [...vehicleRows];
    updated[index][field] = value;
    setVehicleRows(updated);
  };

  const addNodeRow = () => {
    setNodeRows([...nodeRows, { ...emptyNode, name: `Customer ${nodeRows.length}` }]);
  };

  const addVehicleRow = () => {
    setVehicleRows([...vehicleRows, { ...emptyVehicle, name: `Vehicle ${vehicleRows.length + 1}` }]);
  };

  const removeNode = (index) => {
    if (index === 0) return;
    setNodeRows(nodeRows.filter((_, i) => i !== index));
  };

  const removeVehicle = (index) => {
    setVehicleRows(vehicleRows.filter((_, i) => i !== index));
  };

  const saveScenario = () => {
    const preparedNodes = nodeRows
      .filter(n => n.lat && n.lng)
      .map((n, i) => ({
        ...n,
        id: i === 0 ? "0" : uuidv4(),
        lat: parseFloat(n.lat),
        lng: parseFloat(n.lng)
      }));

    setNodes(preparedNodes);
    setVehicles(vehicleRows);
  };

  return (
    <div className="space-y-8">
      {/* SECCIÓN DE NODOS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Nodes to Visit</h2>
        </div>
        
        {nodes.length <= 1 &&
          <div className="mb-4 p-3 rounded-md border-l-4 border-yellow-400 bg-yellow-50 text-yellow-800 flex items-start space-x-3 text-sm">
             <p><strong>Note:</strong> The first node is the depot. Add at least 2 nodes and click "Search" to geocode.</p>
          </div>
        }

        {/* SECCIÓN DE BÚSQUEDA / FILTROS */}
        <div className="flex flex-col gap-3 bg-gray-50 p-3 rounded-md border border-gray-100">
          <span className="text-xs font-bold uppercase text-gray-500">Search Filters (Geocoding)</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-xs text-gray-500 mb-1">City</label>
              <input
                value={locationSpecs.city}
                onChange={(e) => setLocationSpecs({ ...locationSpecs, city: e.target.value })}
                className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                placeholder="City"
              />
            </div>

            <div className="flex flex-col">
              <label className="block text-xs text-gray-500 mb-1">Country</label>
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
          {nodeRows.map((row, i) => (
            <div key={i} className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm transition-all ${i === 0 ? 'border-l-4 border-l-blue-500' : ''}`}>
            
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
                      onChange={(e)=>updateNode(i,"name",e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={i === 0 ? "Depot Name" : "Customer Name"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Address</label>
                    <input
                      value={row.address}
                      onChange={(e)=>updateNode(i,"address",e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="MIT Center for Transportation & Logistics"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                  <div className="flex flex-col items-center md:flex-row gap-2 align-middle w-full md:w-auto">
                    
                    {/* LÓGICA DEL BOTÓN: Ocultarlo si ya hay coordenadas */}
                    {(!row.lat || !row.lng) ? (
                      <button 
                        onClick={()=>geocodeAddress(i)} 
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
                  
                  {geocodeErrors[i] ? 
                    <p className="text-xs text-red-600 text-center w-full md:w-auto">{geocodeErrors[i]}</p> 
                    :
                    <div className="text-xs text-gray-600 font-mono text-center sm:text-right w-full md:w-auto">
                      <div>Lat: <span className="font-semibold text-gray-800">{row.lat ? Number(row.lat).toFixed(5) : "Pending"}</span></div>
                      <div>Lng: <span className="font-semibold text-gray-800">{row.lng ? Number(row.lng).toFixed(5) : "Pending"}</span></div>
                    </div>
                  }
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
          {vehicleRows.map((row,i)=>(
            <div key={i} className="relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-blue-300 transition-colors">
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">🚚 Vehicle {i + 1}</span>
                {vehicleRows.length > 1 && (
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
                    onChange={(e)=>updateVehicle(i,"name",e.target.value)}
                    className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Ford Transit"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Capacity</label>
                    <input
                      type="number"
                      value={row.capacity}
                      onChange={(e)=>updateVehicle(i,"capacity",e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fixed Cost</label>
                    <input
                      type="number"
                      value={row.fixed_cost}
                      onChange={(e)=>updateVehicle(i,"fixed_cost",e.target.value)}
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