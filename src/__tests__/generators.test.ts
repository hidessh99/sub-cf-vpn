import { describe, it, expect } from 'vitest';
import {
  generateSingleVlessLink,
  generateSingleTrojanLink,
  generateSingleSSLink,
} from '../utils/generators';

describe('V2Ray / Xray Link Generators', () => {
  const mockId = 'test-uuid-12345';
  const mockServer = 'bug.domain.com';
  const mockPort = 443;
  const mockSec = 'tls';
  const mockHost = 'domain.com';
  const mockPath = '%2Ftest-path';
  const mockSni = 'bug.domain.com';
  const mockName = 'Test-Server-TLS';

  it('should generate correct VLESS link and Clash config', () => {
    const result = generateSingleVlessLink(
      mockId,
      mockServer,
      mockPort,
      mockSec,
      mockHost,
      mockPath,
      mockSni,
      mockName
    );

    expect(result.url).toContain('vless://');
    expect(result.url).toContain(mockId);
    expect(result.url).toContain(`${mockServer}:${mockPort}`);
    expect(result.url).toContain(`security=${mockSec}`);
    expect(result.url).toContain(`host=${mockHost}`);
    expect(result.url).toContain(`path=${mockPath}`);
    expect(result.url).toContain(`sni=${mockSni}`);
    expect(result.url).toContain(`#${mockName}`);

    expect(result.clash).toContain('type: vless');
    expect(result.clash).toContain(`server: ${mockServer}`);
    expect(result.clash).toContain(`port: ${mockPort}`);
    expect(result.clash).toContain(`uuid: ${mockId}`);
    expect(result.clash).toContain(`Host: ${mockHost}`);
  });

  it('should generate correct Trojan link and Clash config', () => {
    const result = generateSingleTrojanLink(
      mockId,
      mockServer,
      mockPort,
      mockSec,
      mockHost,
      mockPath,
      mockSni,
      mockName
    );

    expect(result.url).toContain('trojan://');
    expect(result.url).toContain(mockId);
    expect(result.url).toContain(`security=${mockSec}`);
    expect(result.clash).toContain('type: trojan');
  });

  it('should generate correct Shadowsocks link and empty Clash config', () => {
    const result = generateSingleSSLink(
      mockId,
      mockServer,
      mockPort,
      mockSec,
      mockHost,
      mockPath,
      mockSni,
      mockName
    );

    expect(result.url).toContain('ss://');
    expect(result.clash).toBe('');
  });
});
