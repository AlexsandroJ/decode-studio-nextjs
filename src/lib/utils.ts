export function hexToBytes(hex: string): number[] {
  const bytes = new Array(8).fill(0);
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  for (let i = 0; i < 8 && i * 2 < clean.length; i++) {
    const byteHex = clean.substr(i * 2, 2);
    if (byteHex.length > 0) bytes[i] = parseInt(byteHex.padStart(2, '0'), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
}

export async function apiRequest(
  method: string,
  endpoint: string,
  body: any = null,
  baseUrl: string,
  addLog: (log: any) => void
) {
  const url = `${baseUrl}${endpoint}`;
  const start = Date.now();
  try {
    const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    
    const res = await fetch(url, opts);
    const data = await res.json();
    const duration = Date.now() - start;
    
    addLog({
      time: new Date().toLocaleTimeString(),
      method, endpoint, reqBody: body,
      resData: data, status: res.status, duration
    });
    
    return { success: res.ok, data, status: res.status };
  } catch (err: any) {
    const duration = Date.now() - start;
    addLog({
      time: new Date().toLocaleTimeString(),
      method, endpoint, reqBody: body,
      resData: { error: err.message }, status: 0, duration
    });
    return { success: false, data: { error: err.message }, status: 0 };
  }
}
