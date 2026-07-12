import { isPrivateIP } from "../utils/ipValidator";
import { ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export interface GeoIPResult {
  success: boolean;
  country_code: string;
  city: string;
  region: string;
  postal: string;
  latitude: string;
  longitude: string;
  connection: {
    asn: number | null;
    org: string | null;
  };
}

export interface IGeoIPService {
  lookup(ip: string): Promise<GeoIPResult>;
}

export class GeoIPService implements IGeoIPService {
  async lookup(ip: string): Promise<GeoIPResult> {
    if (isPrivateIP(ip)) {
      logger.warn(`GeoIPService blocked lookup for private IP: ${ip}`, "GeoIPService");
      throw new ValidationError("Cannot lookup GeoIP for private IP addresses");
    }

    try {
      // Fetch from ipwho.is (Primary)
      const res = await fetch(`https://ipwho.is/${ip}`);
      if (!res.ok) {
        throw new Error("Failed to fetch geo data from primary provider");
      }
      const data = (await res.json()) as any;
      if (!data || data.success === false) {
        throw new Error(data?.message || "Invalid IP or lookup failed on primary provider");
      }
      return {
        success: true,
        country_code: String(data.country_code || "UNK"),
        city: String(data.city || ""),
        region: String(data.region || ""),
        postal: String(data.postal || ""),
        latitude: String(data.latitude || ""),
        longitude: String(data.longitude || ""),
        connection: {
          asn: data.connection?.asn ? Number(data.connection.asn) : null,
          org: String(data.connection?.org || data.connection?.isp || ""),
        },
      };
    } catch (e: any) {
      logger.warn(`GeoIP primary provider failed for ${ip}: ${e.message}, trying fallback...`, "GeoIPService");
      // Fallback: try freeipapi.com
      try {
        const backupRes = await fetch(`https://freeipapi.com/api/json/${ip}`);
        if (!backupRes.ok) {
          throw new Error("Failed to fetch geo data from backup provider");
        }
        const backupData = (await backupRes.json()) as any;
        return {
          success: true,
          country_code: String(backupData.countryCode || "UNK"),
          city: String(backupData.cityName || ""),
          region: String(backupData.regionName || ""),
          postal: String(backupData.zipCode || ""),
          latitude: String(backupData.latitude || ""),
          longitude: String(backupData.longitude || ""),
          connection: {
            asn: backupData.asn ? Number(backupData.asn) : null,
            org: String(backupData.asName || ""),
          },
        };
      } catch (backupErr: any) {
        logger.error(`GeoIP lookup failed for ${ip} (both providers)`, backupErr, "GeoIPService");
        throw new ValidationError(e.message || "GeoIP lookup failed");
      }
    }
  }
}
