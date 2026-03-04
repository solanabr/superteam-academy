const isProd = process.env.NODE_ENV === "production";

const logger = {
  debug: (...args: unknown[]) => {
    if (!isProd) console.debug("[debug]", ...args);
  },
  info: (...args: unknown[]) => {
    console.info("[info]", ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn("[warn]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[error]", ...args);
  },
};

export default logger;
