import { connect } from 'cloudflare:sockets';

interface CheckResult {
  ip: string;
  port: number;
  proxyip: boolean;
  latency: number;
}

async function checkEdgeSocket(ip: string, port: number, timeoutMs = 2500): Promise<CheckResult> {
  const start = Date.now();
  try {
    const socket = connect(`${ip}:${port}`);
    
    // Promise timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    });

    // Tunggu koneksi TCP terbuka atau timeout
    await Promise.race([socket.opened, timeoutPromise]);
    
    const latency = Date.now() - start;
    socket.close();
    return { ip, port, proxyip: true, latency };
  } catch (err) {
    return { ip, port, proxyip: false, latency: 0 };
  }
}

export async function onRequest(context: any) {
  const url = new URL(context.request.url);
  let ipsString = url.searchParams.get('ips') || url.searchParams.get('ip') || '';
  if (!ipsString && url.pathname.startsWith('/api/check/')) {
    ipsString = decodeURIComponent(url.pathname.replace('/api/check/', ''));
  }

  if (!ipsString) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const list = ipsString.split(',').map((item: string) => item.trim()).filter(Boolean);
  const tasks = list.map((item: string) => {
    const parts = item.split(':');
    const ip = parts[0];
    const port = parseInt(parts[1] || '443', 10);
    return checkEdgeSocket(ip, port, 2500);
  });

  const results = await Promise.all(tasks);
  return new Response(JSON.stringify(results), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
