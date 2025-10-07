import { createConnection } from "mongoose";
import logger from "./util/logger.js";

/**
 * Connects to the source and target MongoDB databases.
 * @param {string=} sourceUrl - The connection string for the source MongoDB database.
 * @param {string=} targetUrl - The connection string for the target MongoDB database.
 * @param {object=} dbOptions - Optional mongoose connection options.
 */
async function getConnectionsToDbs(sourceUrl, targetUrl, dbOptions, debugNote) {
  try {
    const opts = dbOptions || {};
    const sourceConnection = await createConnection(sourceUrl, opts).asPromise();
    if (debugNote) {
      logger.debug("Successfully connected to source MongoDB database: " + sourceUrl);
    }
    const targetConnection = await createConnection(targetUrl, opts).asPromise();
    if (debugNote) {
      logger.debug("Successfully connected to target MongoDB database: " + targetUrl);
    }

    return { sourceConnection, targetConnection };
  } catch (error) {
    logger.error("Error connecting to MongoDB databases:", error);
    throw error;
  }
}

/**
 * Get all collection names from the connection
 * @param {object} conn - The mongoose connection object.
 * @returns {Promise<Array>} - A promise that resolves to an array of collection names.
 */
async function getCollectionNames(conn) {
  const dbCollections = await conn.db.listCollections({ type: "collection" }).toArray();
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
  const indexesMap = new Map();
  for (const collection of collectionNames) {
    // Get indexes for each collection
    const indexes = await conn.db.collection(collection.name).indexes();
    for (let i = 0; i < indexes.length; i++) {
      const indexFullName = collection.name + "::" + indexes[i].name;
      indexesMap.set(indexFullName, indexes[i].key);
      if (debugNote) {
        logger.debug(debugNote + ": " + indexFullName);
      }
    }
  }
  return indexesMap;
}

/**
 * Compares indexes from source and target MongoDB databases and returns missing indexes.
 * @param {Map} sourceIndexes - A map of indexes from the source database.
 * @param {Map} targetIndexes - A map of indexes from the target database.
 * @param {string=} debugNote - Optional debug note to log.
 * @returns {Promise<{missingIndexesSource: Array, missingIndexesTarget: Array}>} - An object containing arrays of missing indexes.
 */
async function compareIndexes(sourceIndexes, targetIndexes, debugNote) {
  const missingIndexesTarget = [];
  const missingIndexesSource = [];

  for (const [key, value] of targetIndexes.entries()) {
    if (!sourceIndexes.has(key)) {
      missingIndexesSource.push({
        collection: key.split("::")[0],
        index_name: key.split("::")[1],
        index_value: value,
      });
      if (debugNote) {
        logger.debug(debugNote + "[source]: " + key + " :: " + JSON.stringify(value));
      }
    }
  }
  for (const [key, value] of sourceIndexes.entries()) {
    if (!targetIndexes.has(key)) {
      missingIndexesTarget.push({
        collection: key.split("::")[0],
        index_name: key.split("::")[1],
        index_value: value,
      });
      if (debugNote) {
        logger.debug(debugNote + "[target]: " + key + " :: " + JSON.stringify(value));
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
 * @param {string=} debugNote - Optional debug note to log.
 * @returns {Promise<{missingIndexesSource: Array, missingIndexesTarget: Array}>} - An object containing arrays of missing indexes.
 */
async function getMissingIndexes(sourceUrl, targetUrl, dbOptions, debugNote) {
  const { sourceConnection, targetConnection } = await getConnectionsToDbs(targetUrl, sourceUrl, dbOptions);

  const sourceCollections = await getCollectionNames(sourceConnection);
  const targetCollections = await getCollectionNames(targetConnection);

  const sourceIndexes = await getIndexesMapFromCollections(sourceConnection, sourceCollections);
  const targetIndexes = await getIndexesMapFromCollections(targetConnection, targetCollections);

  const { missingIndexesSource, missingIndexesTarget } = await compareIndexes(sourceIndexes, targetIndexes);

  await sourceConnection.close();
  await targetConnection.close();

  return { missingIndexesSource, missingIndexesTarget };
}

/**
 * Checks for missing indexes between source and target MongoDB databases.
 * @param {string} sourceUrl - The connection string for the source MongoDB database.
 * @param {string} targetUrl - The connection string for the target MongoDB database.
 * @param {object=} dbOptions - Optional mongoose connection options.
 * @param {string=} debugNote - Optional debug note to log.
 * @returns {Promise<void>}
 */
async function executeIndexesComparison(sourceUrl, targetUrl, dbOptions, debugNote) {
  const { targetConnection, sourceConnection } = await getConnectionsToDbs(targetUrl, sourceUrl, dbOptions);

  const sourceCollections = await getCollectionNames(sourceConnection);
  const targetCollections = await getCollectionNames(targetConnection);

  const sourceIndexes = await getIndexesMapFromCollections(sourceConnection, sourceCollections);
  const targetIndexes = await getIndexesMapFromCollections(targetConnection, targetCollections);

  const { missingIndexesSource, missingIndexesTarget } = await compareIndexes(sourceIndexes, targetIndexes, "Missing index");

  if (missingIndexesSource.length > 0) {
    logger.warn("Missing indexes in Source: " + missingIndexesSource.length);
  } else {
    logger.info("No missing indexes in Source.");
  }

  if (missingIndexesTarget.length > 0) {
    logger.warn("Missing indexes in Target: " + missingIndexesTarget.length);
  } else {
    logger.info("No missing indexes in Target.");
  }

  await targetConnection.close();
  await sourceConnection.close();
}
export { getMissingIndexes, executeIndexesComparison };
