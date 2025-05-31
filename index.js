const app = require('./src/check-indexes');
const logger = require('./src/util/logger');

async function main() {
  try {
    const targetUrl = process.env.TARGET_MONGO_URL;
    const sourceUrl = process.env.SOURCE_MONGO_URL;
    const timeStart = performance.now();

    if (!targetUrl || !sourceUrl) {
      logger.error("Please set TARGET_MONGO_URL and SOURCE_MONGO_URL environment variables.");
      return;
    }
    logger.info("Starting MongoDB index comparison...");
    await app.executeIndexesComparison(targetUrl, sourceUrl, null, "Missing index");
    const timeEnd = performance.now();
    logger.info(`Index comparison completed in ${(timeEnd - timeStart).toFixed(2)} ms.`);
  } catch (error) {
    logger.error("An error occurred:", error.stack || error.message);
    logger.error("Please check your MongoDB connection strings and ensure the databases are accessible.");
  }
}
main().catch(error => {
  logger.error("Unhandled error during command execution:", error);
});