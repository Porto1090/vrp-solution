// Función auxiliar para generar y descargar el CSV
export const generateCSV = (headers, data, filename) => {
  const csvContent = [
    headers.join(","),
    ...data.map(row => row.map(item => `"${item}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};