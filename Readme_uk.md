# mongo-compare-indexes
Порівняння індексів між двома mongodb серверами

Доступна документація іншими мовами: [English](./README.md) | Українська

## Приклад використання

Вам може знадобитись порівняти індекси на різних серверах/середовищах (до прикладу, це може бути порівняння `локального` і `дев` сервера, або `продакшн` сервера і сервера для `тестування`).

## Використання (інтерфейс командного рядка)

Команда потребує наявності двох змінних для сервера, який порівнюють, і сервера з яким порівнюють (цільового та вихідного серверів), щоб знайти відсутні індекси в кожному з них.

Це можна зробити за допомогою змінних середовища `TARGET_MONGO_URL` та `SOURCE_MONGO_URL`.

Це можна зробити, виконавши наступні команди:

```sh
export TARGET_MONGO_URL="mongodb://user:pass@host:port/db_name"
export SOURCE_MONGO_URL="mongodb://localhost/db_name"
```

і потім запустити:

```
npx mongo-compare-indexes run
```

АБО ви можете вказати посилання на сервери безпосередньо під час виконання команди:

```
npx mongo-compare-indexes run [options] [source-mongodb-url] [target-mongodb-url]
```

наприклад:

```
npx mongo-compare-indexes run mongodb://localhost:27017/db_name_source mongodb://localhost:27017/db_name_target
```

## Використання (в коді)

Ви також можете порівняти індекси у вашому проєкті, використовуючи метод `getMissingIndexes`.

Наприклад:

```js
import { getMissingIndexes } from 'mongo-compare-indexes';

async function run {
  const targetUrl = process.env.TARGET_MONGO_URL; // ви можете використати вашу змінну тут
  const sourceUrl = process.env.SOURCE_MONGO_URL; // і тут теж

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
