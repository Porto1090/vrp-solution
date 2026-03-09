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
    name: "",
    address: "",
    lat: "",
    lng: ""
  };

  const emptyVehicle = {
    id: uuidv4(),
    name: "",
    capacity: 10,
    fixed_cost: 50,
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
        `${API_BASE_URL}/geocode?q=${encodeURIComponent(address)} ${encodeURIComponent(locationSpecs.city)} ${encodeURIComponent(locationSpecs.country)}`
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
        // no se encontró
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
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1 text-blue-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Filtros de Búsqueda (Geocoding)
          </h3>
          <p className="text-xs text-gray-500">Mejora la precisión de las coordenadas limitando la búsqueda.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">
              Ciudad
            </label>
            <input
              value={locationSpecs.city}
              onChange={(e) => setLocationSpecs({ ...locationSpecs, city: e.target.value })}
              className="border border-gray-300 rounded-md p-2.5 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              placeholder="City"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">
              País
            </label>
            <input
              value={locationSpecs.country}
              onChange={(e) => setLocationSpecs({ ...locationSpecs, country: e.target.value })}
              className="border border-gray-300 rounded-md p-2.5 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              placeholder="Country"
            />
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-3">NODES TO VISIT</h2>
        {nodes.length <= 1 &&
          <div
            role="note"
            className="mb-4 p-3 rounded border-l-4 border-yellow-400 bg-yellow-50 text-yellow-800 flex items-start space-x-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 flex-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>

            <div>
              <p className="font-semibold">Note</p>
              <p className="text-sm">
                The first node is considered the depot. Please ensure there are at least two distinct nodes, and consider clicking "Search" to geocode each address and retrieve lat/lng to the map.
              </p>
            </div>
          </div>
        }

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="w-1/3">Name</th>
              <th className="w-1/2">Address</th>
              <th className="w-1/8"></th>
              <th className="w-1/6"></th>
            </tr>
          </thead>

          <tbody>
            {nodeRows.map((row, i) => (
              <tr key={i} className="border-t">

                <td className="p-1">
                  <input
                    value={row.name}
                    onChange={(e)=>updateNode(i,"name",e.target.value)}
                    className="border p-2 w-full"
                    placeholder={i === 0 ? "Depot Name" : `Customer Name`}
                  />
                </td>

                <td className="p-1">
                  <input
                    value={row.address}
                    onChange={(e)=>updateNode(i,"address",e.target.value)}
                    className="border p-2 w-full"
                    placeholder="MIT Center for Transportation & Logistics, Cambridge, MA"
                  />
                </td>

                <td className="p-1">
                  <button
                    onClick={()=>geocodeAddress(i)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Search
                  </button>
                    {geocodeErrors[i] && (
                      <p className="text-sm text-red-600 mt-1">{geocodeErrors[i]}</p>
                    )}
                </td>

                <td className="p-1">
                  <div className="pl-2 text-sm">
                  Latitud: {row.lat || "N/A"} <br/>
                  Longitud: {row.lng || "N/A"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addNodeRow}
          className="mt-2 bg-gray-700 text-white px-3 py-1 rounded"
        >
          Add Node
        </button>
      </div>


      <div>
        <h2 className="text-lg font-semibold mb-3">VEHICLES</h2>

        <table className="w-full border">

          <thead className="bg-gray-100">
            <tr>
              <th>Name</th>
              <th>Capacity</th>
              <th>Fixed Cost</th>
              {/* <th>Cost Factor</th> */}
            </tr>
          </thead>

          <tbody>
            {vehicleRows.map((row,i)=>(
              <tr key={i} className="border-t">
                <td className="p-1">
                  <input
                    value={row.name}
                    onChange={(e)=>updateVehicle(i,"name",e.target.value)}
                    className="border p-2 w-full"
                    placeholder="Vehicle Name"
                  />
                </td>

                <td className="p-1">
                  <input
                    type="number"
                    value={row.capacity}
                    onChange={(e)=>updateVehicle(i,"capacity",e.target.value)}
                    className="border p-2 w-full"
                  />
                </td>

                <td className="p-1">
                  <input
                    type="number"
                    value={row.fixed_cost}
                    onChange={(e)=>updateVehicle(i,"fixed_cost",e.target.value)}
                    className="border p-2 w-full"
                  />
                </td>
              </tr>
            ))}
          </tbody>

        </table>

        <button
          onClick={addVehicleRow}
          className="mt-2 bg-gray-700 text-white px-3 py-1 rounded"
        >
          Add Vehicle
        </button>

      </div>
    </div>
  );
}