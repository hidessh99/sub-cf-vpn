import { jsonResponse } from "../utils/response";

export class SystemController {
  async healthCheck(): Promise<Response> {
    return jsonResponse({
      status: 'ok',
      service: 'lufeng-vpn-checker',
      runtime: 'bun'
    });
  }
}
