import React, { useRef, useMemo } from 'react';
import LocationForm from './LocationForm';
import RouteStats from './RouteStats';
import { generateCSV } from '../services/downloadcsv';

export default function Sidebar({ 
  setOrigin,
  nodes, 
  setNodes, 
  vehicles, 
  setVehicles, 
  routeData, 
  loading, 
  onCalculate 
}) {
  const nodesInputRef = useRef(null);
  const vehiclesInputRef = useRef(null);

// --- DESCARGAS DE PLANTILLAS ---
  const downloadNodesTemplate = () => {
    const headers = ["name", "address", "lat", "lng", "load", "working_time"];
    const exampleData = [
      ["Main Depot", "Dewey Library", "42.3611465", "-71.0837124", "0", "0"],
      ["Customer 1", "CVS Pharmacy", "42.3621768", "-71.0850703", "10", "15"]
    ];

    generateCSV(headers, exampleData, "nodes_template.csv");
  };

  const downloadVehiclesTemplate = () => {
    const headers = ["name", "capacity", "fixed_cost"];
    const exampleData = [
      ["Vehicle 1", "10", "50"],
      ["Vehicle 2", "20", "75"]
    ];

    generateCSV(headers, exampleData, "vehicles_template.csv");
  };

  // --- IMPORTACIONES DE CSV ---
  const handleImportNodesCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        alert("El archivo de nodos está vacío o solo tiene encabezados.");
        return;
      }

      const parsedNodes = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,]+))/g);
        if (!row || row.length < 6) continue;

        const cleanVal = (val) => val ? val.replace(/^"|"$/g, '').trim() : "";
        const parsedLat = parseFloat(cleanVal(row[2]));
        const parsedLng = parseFloat(cleanVal(row[3]));

        parsedNodes.push({
          id: i === 1 ? "0" : typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(7), 
          name: cleanVal(row[0]),
          address: cleanVal(row[1]),
          lat: isNaN(parsedLat) ? "" : parsedLat,
          lng: isNaN(parsedLng) ? "" : parsedLng,
          load: parseInt(cleanVal(row[4])) || 0,
          working_time: parseInt(cleanVal(row[5])) || 0
        });
      }

      if (parsedNodes.length > 0) {
        setNodes(parsedNodes); 
        alert(`¡Se importaron ${parsedNodes.length} ubicaciones correctamente!`);
      }
      event.target.value = null; 
    };
    reader.readAsText(file);
  };

  const handleImportVehiclesCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        alert("El archivo de vehículos está vacío o solo tiene encabezados.");
        return;
      }

      const parsedVehicles = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,]+))/g);
        if (!row || row.length < 3) continue;

        const cleanVal = (val) => val ? val.replace(/^"|"$/g, '').trim() : "";

        parsedVehicles.push({
          id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(7), 
          name: cleanVal(row[0]),
          capacity: parseFloat(cleanVal(row[1])) || 0,
          fixed_cost: parseFloat(cleanVal(row[2])) || 0
        });
      }

      if (parsedVehicles.length > 0) {
        setVehicles(parsedVehicles); 
        alert(`¡Se importaron ${parsedVehicles.length} vehículos correctamente!`);
      }
      event.target.value = null; 
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-full flex flex-col"> 
      <div className='flex flex-row items-center justify-between mb-6'>
        <div className='flex flex-col gap-1'>
          <h1 className="text-2xl font-bold">
            EZ-Parking VRP
          </h1>
          <h2 className="text-md italic text-gray-500">
            Democratizing Urban Logistics
          </h2>
        </div>
        
        {/* BOTONES DE IMPORTACIÓN/EXPORTACIÓN */}
        {!routeData && !loading && (
          <div className="flex flex-col gap-2">
            
            {/* Inputs Ocultos */}
            <input type="file" accept=".csv" ref={nodesInputRef} style={{ display: 'none' }} onChange={handleImportNodesCSV} />
            <input type="file" accept=".csv" ref={vehiclesInputRef} style={{ display: 'none' }} onChange={handleImportVehiclesCSV} />

            {/* Grupo: Nodos */}
            <div className="flex gap-2 items-center justify-end">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 text-right">Nodes:</span>
              <button onClick={downloadNodesTemplate} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded border border-gray-300 font-medium transition-colors">
                Template
              </button>
              <button onClick={() => nodesInputRef.current.click()} className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded font-medium shadow-sm transition-colors">
                Import CSV
              </button>
            </div>

            {/* Grupo: Vehículos */}
            <div className="flex gap-2 items-center justify-end">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 text-right">Fleet:</span>
              <button onClick={downloadVehiclesTemplate} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded border border-gray-300 font-medium transition-colors">
                Template
              </button>
              <button onClick={() => vehiclesInputRef.current.click()} className="text-xs bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded font-medium shadow-sm transition-colors">
                Import CSV
              </button>
            </div>

          </div>
        )}
      </div>
      
      {!routeData ? (
        <>
          {!loading && (
            <LocationForm
              setOrigin={setOrigin}
              nodes={nodes}
              setNodes={setNodes}
              vehicles={vehicles}
              setVehicles={setVehicles}
            />
          )}
          <button
            onClick={onCalculate}
            disabled={loading || nodes.length < 2 || vehicles.length === 0}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {loading ? "Calculating..." : "Calculate Routes"}
          </button>
        </>
      ) : routeData.routes.length > 0 ? (
        <RouteStats
          routes={routeData.routes} nodes={nodes}
        />
      ) : (
        <div className="mt-4 p-3 rounded border-l-4 border-red-400 bg-red-50 text-red-800">
          <p className="font-semibold">No routes found</p>
          <p className="text-sm">
            We couldn't generate a route with the current nodes and vehicles. Please try again.
          </p>
        </div>
      )}

      {/* Espaciador para evitar que el contenido se corte al final del scroll */}
      <div className="h-12 shrink-0 w-full" aria-hidden="true"></div>
    </div>
  );
}