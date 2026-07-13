export const MAIN_DOMAINS = [
  "lufeng.my.id", 
  "hidessh.qzz.io"
];

// Minimal fallback list to keep initial bundle size small. Real list fetched from API / static json.
export const BUG_LIST = [
  "dev.appsflyer.com",
  "quiz.vidio.com",
  "open.spotify.com",
  "support.zoom.us"
];

export const CONFIG = {
  proxyListUrl: import.meta.env.VITE_PROXY_LIST_URL || "/api/v1/public/proxies",
  domainListUrl: import.meta.env.VITE_DOMAIN_LIST_URL || "/api/v1/public/domains",
  bugListUrl: import.meta.env.VITE_BUG_LIST_URL || "/api/v1/public/bugs",
  apiCheckUrl: import.meta.env.VITE_API_CHECK_URL || "/api/check?ips=",
  pathTemplate: import.meta.env.VITE_PATH_TEMPLATE || "/{ip}-{port}",
  webName: import.meta.env.VITE_WEB_NAME || "HideSSH VPN CF"
};
