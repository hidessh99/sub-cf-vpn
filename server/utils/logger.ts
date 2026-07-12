export const logger = {
  debug(msg: string, context = "") {
    console.log(`[DEBUG] [${context}] ${msg}`);
  },
  info(msg: string, context = "") {
    console.log(`[INFO] [${context}] ${msg}`);
  },
  warn(msg: string, context = "") {
    console.warn(`[WARN] [${context}] ${msg}`);
  },
  error(msg: string, err: any = null, context = "") {
    console.error(`[ERROR] [${context}] ${msg}`, err || "");
  }
};
