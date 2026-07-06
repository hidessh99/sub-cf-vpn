import net from 'node:net';

interface CheckResult {
  ip: string;
  port: number;
  proxyip: boolean;
  latency: number;
}

async function checkProxy(ip: string, port: number, timeoutMs = 2500): Promise<CheckResult> {
  return new Promise((resolve) => {
    const start = performance.now();
    let settled = false;

    const finish = (proxyip: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      const latency = proxyip ? Math.floor(performance.now() - start) : 0;
      resolve({ ip, port, proxyip, latency });
    };

    const socket = net.createConnection({ host: ip, port: port, timeout: timeoutMs });

    socket.on('connect', () => {
      finish(true);
    });

    socket.on('timeout', () => {
      finish(false);
    });

    socket.on('error', () => {
      finish(false);
    });
  });
}

const PORT = parseInt(process.env.PORT || '4002', 10);

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);

    // Endpoint pengecekan kesehatan checker service
    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(JSON.stringify({ status: 'ok', service: 'lufeng-vpn-checker', runtime: 'bun' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (url.pathname.startsWith('/api/check')) {
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

      const list = ipsString.split(',').map(item => item.trim()).filter(Boolean);
      const tasks = list.map(item => {
        const parts = item.split(':');
        const ip = parts[0];
        const port = parseInt(parts[1] || '443', 10);
        return checkProxy(ip, port, 2500);
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

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});

console.log(`🚀 [LuFeng Checker] Service running on http://0.0.0.0:${server.port}`);
