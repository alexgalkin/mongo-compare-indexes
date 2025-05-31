import { executeIndexesComparison } from "./src/check-indexes.js";
import logger from "./src/util/logger.js";
import { version } from "./package.json";
import { Command } from "commander";
const program = new Command();

program.name("mongo-compare-indexes").description("Compare indexes between two MongoDB databases").version(version);

program
  .command("run")
  .description("Compare indexes between two databases and print missing indexes in each")
  .option("--skip-missing-collections", "Skip _id indexes that indicate missing collections", false)
  .option("-s, --source-mongodb-url <char>", "separator character", process.env.SOURCE_MONGO_URL)
  .option("-s, --target-mongodb-url <char>", "separator character", process.env.TARGET_MONGO_URL)
  .action((str, options) => {
    const shouldSkipMissingCollections = options.skipMissingCollections ? true : false;
    console.log("shouldSkipMissingCollections = " + shouldSkipMissingCollections);
    main().catch((error) => {
      logger.error("Unhandled error during command execution:", error);
    });
  });

program.parse();

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
    await executeIndexesComparison(targetUrl, sourceUrl, null, "Missing index");
    const timeEnd = performance.now();
    logger.info(`Index comparison completed in ${(timeEnd - timeStart).toFixed(2)} ms.`);
  } catch (error) {
    logger.error("An error occurred:", error.stack || error.message);
    logger.error("Please check your MongoDB connection strings and ensure the databases are accessible.");
  }
}
