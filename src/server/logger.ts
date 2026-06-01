const DEBUG = process.env.DEBUG === "true";

export const logger = {
  debug: (msg: string) => { if (DEBUG) console.debug(msg); },
  info: (msg: string) => console.info(msg),
  warn: (msg: string) => console.warn(msg),
  error: (msg: string) => console.error(msg),
};

export default logger;
