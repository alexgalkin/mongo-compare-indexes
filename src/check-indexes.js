const mongoose = require("mongoose");
const logger = require("./util/logger");

/**
 * Connects to the source and target MongoDB databases.
 * @param {string=} targetUrl - The connection string for the target MongoDB database.
 * @param {string=} sourceUrl - The connection string for the source MongoDB database.
 * @param {object=} dbOptions - Optional mongoose connection options.
 */
async function getConnectionsToDbs(targetUrl, sourceUrl, dbOptions) {
  const opts = dbOptions || { useNewUrlParser: true, useUnifiedTopology: true };
  const targetConnection = await mongoose.createConnection(targetUrl, opts).asPromise();
  console.log("Connected successfully to Target MongoDB server.");
  const sourceConnection = await mongoose.createConnection(sourceUrl, opts).asPromise();
  console.log("Connected successfully to Source MongoDB server.");
  return { targetConnection, sourceConnection };
}

/**
 * Get all collection names from the connection
 * @param {object} conn - The mongoose connection object.
 * @returns {Promise<Array>} - A promise that resolves to an array of collection names.
 */
async function getCollectionNames(conn) {
  const dbCollections = await conn.db.listCollections().toArray();
  return dbCollections;
}

/**
 * Get all collection names from the connection
 * @param {object} conn - The mongoose connection object.
 * @param {Array} collectionNames - An array of collection names to get indexes for.
 * @param {string=} debugNote - Optional debug note to log.
 * @returns {Promise<Array>} - A promise that resolves to an array of collection names.
 */
async function getIndexesMapFromCollections(conn, collectionNames, debugNote) {
  for (const collection of collectionNames) {
    // Get indexes for each collection
    const indexes = await conn.db.collection(collection.name).indexes();
    for (let i = 0; i < indexes.length; i++) {
      const indexFullName = collection.name + "::" + indexes[i].name;
      indexes.set(indexFullName, indexes[i].key);
      if (debugNote) {
        logger.debug(debugNote + ": " + indexFullName);
      }
    }
  }
}

async function getMissingIndexes(sourceIndexes, targetIndexes, debugNote) {
  const missingIndexesTarget = [];
  const missingIndexesSource = [];

  for (const [key, value] of targetIndexes.entries()) {
    if (!sourceIndexes.has(key)) {
      missingIndexesSource.push({ collection: key.split("::")[0], index: key, key: value });
      if (debugNote) {
        logger.debug(debugNote + "_source: " + key);
      }
    }
  }
  for (const [key, value] of sourceIndexes.entries()) {
    if (!targetIndexes.has(key)) {
      missingIndexesTarget.push({ collection: key.split("::")[0], index: key, key: value });
      if (debugNote) {
        logger.debug(debugNote + "_target: " + key);
      }
    }
  }

  return { missingIndexesSource, missingIndexesTarget };
}

/**
 * Checks for missing indexes between source and target MongoDB databases.
 * @param {string} sourceUrl - The connection string for the source MongoDB database.
 * @param {string} targetUrl - The connection string for the target MongoDB database.
 * @param {object=} dbOptions - Optional mongoose connection options.
 * @returns {Promise<void>}
 */
async function checkIndexes(sourceUrl, targetUrl, dbOptions) {
  const { targetConnection, sourceConnection } = await getConnectionsToDbs(targetUrl, sourceUrl, dbOptions);

  const sourceCollections = await getCollectionNames(sourceConnection);
  const targetCollections = await getCollectionNames(targetConnection);

  const sourceIndexes = new Map();
  const targetIndexes = new Map();

  await getIndexesMapFromCollections(sourceConnection, sourceCollections, "Source");
  await getIndexesMapFromCollections(targetConnection, targetCollections, "Target");

  const { missingIndexesSource, missingIndexesTarget } = await getMissingIndexes(sourceIndexes, targetIndexes, "Check");

  if (missingIndexesSource.length > 0) {
    logger.warn("Missing indexes in Source: ", missingIndexesSource);
  } else {
    logger.info("No missing indexes in Source.");
  }

  if (missingIndexesTarget.length > 0) {
    logger.warn("Missing indexes in Target: ", missingIndexesTarget);
  } else {
    logger.info("No missing indexes in Target.");
  }

  await targetConnection.close();
  await sourceConnection.close();
}
