import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export default function LocationForm({ nodes, setNodes, vehicles, setVehicles }) {
  const [geocodeErrors, setGeocodeErrors] = useState({});
  const emptyNode = {
    id: uuidv4(),
    name: "",
    address: "",
    lat: "",
    lng: ""
  };

  const emptyVehicle = {
    id: uuidv4(),
    name: "",
    capacity: 1,
    fixed_cost: 50,
    cost_factor: 1
  };

  const [nodeRows, setNodeRows] = useState([emptyNode]);
  const [vehicleRows, setVehicleRows] = useState([emptyVehicle]);

  const geocodeAddress = async (index) => {
    const address = nodeRows[index].address;

    if (!address) return;

    try {
      const res = await fetch(
        `http://localhost:8000/geocode?q=${encodeURIComponent(address)}`
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
    setNodeRows([...nodeRows, { ...emptyNode }]);
  };

  const addVehicleRow = () => {
    setVehicleRows([...vehicleRows, { ...emptyVehicle }]);
  };

  const saveScenario = () => {
    const preparedNodes = nodeRows
      .filter(n => n.lat && n.lng)
      .map((n, i) => ({
        id: uuidv4(),
        ...n,
        lat: parseFloat(n.lat),
        lng: parseFloat(n.lng)
      }));

    setNodes(preparedNodes);
    setVehicles(vehicleRows);
  };

  return (
    <div className="space-y-8">

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