# mongo-compare-indexes
compare mongo indexes in two instances

Read this in other languages: English | [Українська](./Readme_uk.md)

## Use Case

You may need to compare the indexes between different servers/environments (e.g. it can be comparison of the `local` and `dev` server, or comparing `production` environment to `staging` or `uat`)

## Usage (CLI)

This command requires two URLs provided for target and source mongodb servers to compare their indexes.

It can be done using environment variables `TARGET_MONGO_URL` and `SOURCE_MONGO_URL`.

You can define them before executing the command, e.g.

```sh
export TARGET_MONGO_URL="mongodb://user:pass@host:port/db_name"
export SOURCE_MONGO_URL="mongodb://localhost/db_name"
```

and then just run:

```
npx mongo-compare-indexes run
```

OR you can define the db URLs inline:

```
npx mongo-compare-indexes run mongodb://localhost:27017/db_name_source mongodb://localhost:27017/db_name_target
```

## Usage (code)

You can also use it within your project using `getMissingIndexes` method.

Here is an example:

```js
import { getMissingIndexes } from './index.js';

async function run {
  const targetUrl = process.env.TARGET_MONGO_URL; // you can replace it with your own variable
  const sourceUrl = process.env.SOURCE_MONGO_URL; // same here

  console.log("Starting MongoDB index comparison...");
  const missingIndexesResult = await getMissingIndexes(targetUrl, sourceUrl);
  const { missingIndexesSource, missingIndexesTarget } = missingIndexesResult;
  for (const index of missingIndexesSource) {
    console.log(`Missing in source: ${index.collection} - ${index.index_name}`);
  }
  for (const index of missingIndexesTarget) {
    console.log(`Missing in target: ${index.collection} - ${index.index_name}`);
  }
}

run()

```
