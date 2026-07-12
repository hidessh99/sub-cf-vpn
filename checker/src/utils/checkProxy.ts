import * as net from 'node:net';

export interface CheckResult {
  ip: string;
  port: number;
  proxyip: boolean;
  latency: number;
}

export async function checkProxy(ip: string, port: number, timeoutMs = 2500): Promise<CheckResult> {
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
