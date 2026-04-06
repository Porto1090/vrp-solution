const BASE = import.meta.env.VITE_API_BASE_URL;

// Sistema de "polling" (sondeo)
export async function fetchBackend() {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error('Failed backend');
  return res.json();
}

export async function fetchNodes() {
  const res = await fetch(`${BASE}/nodes`);
  if (!res.ok) throw new Error('Failed nodes');
  return res.json();
}
  
export async function fetchStations() {
  const res = await fetch(`${BASE}/stations`);
  if (!res.ok) throw new Error('Failed stations');
  return res.json();
}

export async function fetchVehicles() {
  const res = await fetch(`${BASE}/vehicles`);
  if (!res.ok) throw new Error('Failed vehicles');
  return res.json();
}

export async function submitNodes(nodes) {
  try {
    const response = await fetch(`${BASE}}/nodes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(nodes)
    });

    if (!response.ok) {
      throw new Error("Error saving nodes");
    }

    return await response.json();

  } catch (error) {
    console.error(error);
  }
};

export async function fetchSegmentRoute(data) {
  const res = await fetch(`${BASE}/optimize-routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok){
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to calculate routes.");
  }
  
  return await res.json();
}