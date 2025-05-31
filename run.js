#!/usr/bin/env node

import { getMissingIndexes } from "./src/check-indexes.js";
import logger from "./src/util/logger.js";
import { Command } from "commander";
const program = new Command();
const version = "1.0.1";

program
  .name("mongo-compare-indexes")
  .description("Compare indexes between two MongoDB databases")
  .version(version);

program
  .command("run")
  .description("Compare indexes between two databases and print missing indexes in each")
  .argument("[source-mongodb-url]", "source server mongodb://src-host/url", process.env.SOURCE_MONGO_URL)
  .argument("[target-mongodb-url]", "target server mongodb://target-host/url", process.env.TARGET_MONGO_URL)
  .option("--skip-missing-collections", "Skip _id indexes that indicate missing collections", false)
  .action((sourceMongodbUrl, targetMongodbUrl, options) => {
    // TODO: add handling for --skip-missing-collections option
    const skipMissingCollections = options.skipMissingCollections ? true : false;
    runComparison(sourceMongodbUrl, targetMongodbUrl).catch((error) => {
      logger.error("Unhandled error during command execution:", error);
    });
  });

program.parse();

async function runComparison(sourceUrl, targetUrl) {
  try {
    const timeStart = performance.now();
    if (!targetUrl || !sourceUrl) {
      logger.error("Please set TARGET_MONGO_URL and SOURCE_MONGO_URL environment variables.");
      return;
    }

    logger.info("Starting MongoDB index comparison...");
    const missingIndexesResult = await getMissingIndexes(targetUrl, sourceUrl);
    const { missingIndexesSource, missingIndexesTarget } = missingIndexesResult;
 
    const totalMissingSource = missingIndexesSource.length;
    const totalMissingTarget = missingIndexesTarget.length;

    console.table(missingIndexesSource, ["collection", "index_name", "index_value"]);
    console.log(`Total missing indexes in source: ${totalMissingSource}`);

    console.table(missingIndexesTarget, ["collection", "index_name", "index_value"]);
    console.log(`Total missing indexes in target: ${totalMissingTarget}`);

    const timeEnd = performance.now();
    logger.info(`Index comparison completed in ${(timeEnd - timeStart).toFixed(2)} ms.`);
  } catch (error) {
    logger.error("An error occurred:", error.stack || error.message);
    logger.error("Please check your MongoDB connection strings and ensure the databases are accessible.");
  }
}
