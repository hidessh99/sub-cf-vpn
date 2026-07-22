import { safeBase64Encode } from './common';

export interface GeneratedConfigResult {
  url: string;
  clash: string;
  singbox: string;
  b64: string;
}

export function generateSingleVlessLink(
  id: string,
  svr: string,
  port: number,
  sec: string,
  host: string,
  path: string,
  sni: string,
  name: string
): GeneratedConfigResult {
  const decodedName = decodeURIComponent(name);
  const decodedPath = decodeURIComponent(path);
  const isTls = sec === 'tls';

  const u = `vless://${id}@${svr}:${port}?encryption=none&security=${sec}&type=ws&host=${host}&path=${path}&sni=${sni}#${name}`;
  
  const c = `- name: "${decodedName}"
  type: vless
  server: ${svr}
  port: ${port}
  uuid: ${id}
  network: ws
  tls: ${isTls}
  servername: ${sni}
  skip-cert-verify: true
  ws-opts:
    path: ${decodedPath}
    headers:
      Host: ${host}`;

  const singboxObj = {
    type: 'vless',
    tag: decodedName,
    server: svr,
    server_port: port,
    uuid: id,
    transport: {
      type: 'ws',
      path: decodedPath,
      headers: {
        Host: host,
      },
    },
    tls: {
      enabled: isTls,
      server_name: sni,
      insecure: true,
    },
  };

  return {
    url: u,
    clash: c,
    singbox: JSON.stringify(singboxObj, null, 2),
    b64: safeBase64Encode(u),
  };
}

export function generateSingleTrojanLink(
  pw: string,
  svr: string,
  port: number,
  sec: string,
  host: string,
  path: string,
  sni: string,
  name: string
): GeneratedConfigResult {
  const decodedName = decodeURIComponent(name);
  const decodedPath = decodeURIComponent(path);
  const isTls = sec === 'tls';

  const u = `trojan://${pw}@${svr}:${port}?security=${sec}&type=ws&host=${host}&path=${path}&sni=${sni}#${name}`;
  let c = '';
  if (isTls) {
    c = `- name: "${decodedName}"
  type: trojan
  server: ${svr}
  port: ${port}
  password: ${pw}
  network: ws
  sni: ${sni}
  skip-cert-verify: true
  ws-opts:
    path: ${decodedPath}
    headers:
      Host: ${host}`;
  }

  const singboxObj = {
    type: 'trojan',
    tag: decodedName,
    server: svr,
    server_port: port,
    password: pw,
    transport: {
      type: 'ws',
      path: decodedPath,
      headers: {
        Host: host,
      },
    },
    tls: {
      enabled: isTls,
      server_name: sni,
      insecure: true,
    },
  };

  return {
    url: u,
    clash: c,
    singbox: JSON.stringify(singboxObj, null, 2),
    b64: safeBase64Encode(u),
  };
}

export function generateSingleSSLink(
  pw: string,
  svr: string,
  port: number,
  sec: string,
  host: string,
  path: string,
  sni: string,
  name: string
): GeneratedConfigResult {
  const decodedName = decodeURIComponent(name);
  const usr = safeBase64Encode(`none:${pw}`);
  const u = `ss://${usr}@${svr}:${port}?encryption=none&type=ws&host=${host}&path=${path}&security=${sec}&sni=${sni}#${name}`;

  const singboxObj = {
    type: 'shadowsocks',
    tag: decodedName,
    server: svr,
    server_port: port,
    method: 'none',
    password: pw,
  };

  return {
    url: u,
    clash: '',
    singbox: JSON.stringify(singboxObj, null, 2),
    b64: safeBase64Encode(u),
  };
}
