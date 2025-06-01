const { getMissingIndexes } = require("mongo-compare-indexes");

async function main() {
  try {
    const targetUrl = process.env.TARGET_MONGO_URL || 'mongodb://localhost:27017/db_name';
    const sourceUrl = process.env.SOURCE_MONGO_URL || 'mongodb://localhost:27017/db_name';

    console.log("Starting MongoDB index comparison...");
    const missingIndexesResult = await getMissingIndexes(targetUrl, sourceUrl);
    const { missingIndexesSource, missingIndexesTarget } = missingIndexesResult;
    for (const index of missingIndexesSource) {
      console.log(`Missing in source: ${index.collection} - ${index.index_name}`);
    }
    for (const index of missingIndexesTarget) {
      console.log(`Missing in target: ${index.collection} - ${index.index_name}`);
    }
    console.log("Index comparison completed successfully.");
    const totalMissingSource = missingIndexesSource.length;
    const totalMissingTarget = missingIndexesTarget.length;

    console.table(missingIndexesSource, ["collection", "index_name", "index_value"]);
    console.log(`Total missing indexes in source: ${totalMissingSource}`);

    console.table(missingIndexesTarget, ["collection", "index_name", "index_value"]);
    console.log(`Total missing indexes in target: ${totalMissingTarget}`);
  } catch (error) {
    console.error("An error occurred:", error.stack || error.message);
    console.error("Please check your MongoDB connection strings and ensure the databases are accessible.");
  }
}

main().catch((error) => {
  console.error("Unhandled error during command execution:", error);
});
