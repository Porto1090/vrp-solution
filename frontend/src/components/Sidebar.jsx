import React, { useRef } from 'react';
import LocationForm from './LocationForm';
import RouteStats from './RouteStats';

export default function Sidebar({ 
  nodes, 
  setNodes, 
  vehicles, 
  setVehicles, 
  routeData, 
  loading, 
  onCalculate 
}) {
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const headers = ["name", "address", "lat", "lng", "load", "working_time"];
    
    const exampleData = [
      ["Main Depot", "Dewey Library", "42.3611465", "-71.0837124", "0", "0"],
      ["Customer 1", "CVS Pharmacy", "42.3621768", "-71.0850703", "10", "15"]
    ];

    const csvContent = [
      headers.join(","),
      ...exampleData.map(row => row.map(item => `"${item}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "vrp_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        alert("El archivo está vacío o solo tiene encabezados.");
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

  return (
    <div className="min-h-full flex flex-col"> 
      <div className='flex flex-row items-center justify-between mb-6'>
        <h1 className="text-2xl font-bold">
          VRP - Park and Loop Tool
        </h1>
        
        {!routeData && (
          <>
            {/* Input de archivo oculto */}
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImportCSV} 
            />

            <div className="flex gap-3">
              <button 
                onClick={downloadTemplate}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded border border-gray-300 font-medium transition-colors"
              >
                Descargar plantilla CSV
              </button>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="text-sm bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded font-medium shadow-sm transition-colors"
              >
                Importar CSV
              </button>
            </div>
          </>
        )}
      </div>
      
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
            onClick={onCalculate}
            disabled={loading || nodes.length < 2 || vehicles.length === 0}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {loading ? "Calculating..." : "Calculate Routes"}
          </button>
        </>
      ) : routeData.routes.length > 0 ? (
        <RouteStats
          routes={routeData.routes}
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