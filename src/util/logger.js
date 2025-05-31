class Logger {
  static instance = null;
  constructor() {
    // console.log("Logger initialized");
  }
  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`);
  }
  info(message) {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] INFO: ${message}`);
  }
  error(message) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`);
  }
  warn(message) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`);
  }
  debug(message) {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] DEBUG: ${message}`);
  }
}

export default new Logger();
// This module provides a simple logging utility that can be used throughout the application.
