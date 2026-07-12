import { onRequest as __api_v1___route___ts_onRequest } from "G:\\cloudflare-vpn\\functions\\api\\v1\\[[route]].ts"
import { onRequest as __api_check_ts_onRequest } from "G:\\cloudflare-vpn\\functions\\api\\check.ts"

export const routes = [
    {
      routePath: "/api/v1/:route*",
      mountPath: "/api/v1",
      method: "",
      middlewares: [],
      modules: [__api_v1___route___ts_onRequest],
    },
  {
      routePath: "/api/check",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_check_ts_onRequest],
    },
  ]