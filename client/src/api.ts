// client/client/src/api.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function submitLead(payload: {
  name?: string;
  email?: string;
  company?: string;
  pitch: string;
}) {
  const res = await fetch(`${API_BASE}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text(); // read text so we can show helpful error text
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    // Throw an Error that includes status + parsed body for UI or logging
    const msg = parsed && parsed.error ? parsed.error : text || res.statusText;
    throw new Error(`${res.status} ${msg}`);
  }

  return parsed;
}
