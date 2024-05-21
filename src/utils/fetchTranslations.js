import { readCollections, readItems } from "@directus/sdk";
import { queryDirectus } from "./index.js";
import fs from "fs";

const client = queryDirectus();

async function fetchTranslations(text) {
  const collections = await client.request(readCollections());
  const translationsCollections = collections.filter(
    (collection) =>
      collection.collection.endsWith("_translations") &&
      collection.collection !== "directus_translations"
  );

  const maxConcurrentRequests = process.env.MAX_CONCURRENT_REQUESTS || 10;
  const limit = process.env.LIMIT || 500;
  const results = [];
  const erroredCollections = [];

  for (
    let i = 0;
    i < translationsCollections.length;
    i += maxConcurrentRequests
  ) {
    const chunk = translationsCollections.slice(i, i + maxConcurrentRequests);

    const promises = chunk.map((collection) => {
      return client
        .request(
          readItems(collection.collection, {
            search: text,
            limit,
          })
        )
        .then((data) => ({
          status: "fulfilled",
          value: {
            items: data,
            collection: collection.collection,
            count: data.length === limit ? `${limit}+` : data.length,
          },
        }))
        .catch((error) => ({ status: "rejected", reason: error, collection }));
    });

    const chunkResults = await Promise.allSettled(promises);

    chunkResults.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result?.value?.value?.items?.length > 0)
          results.push(result.value.value);
      } else {
        erroredCollections.push(result.collection);
        console.error(
          `Error fetching ${result.collection.collection}:`,
          result.reason
        );
      }
    });

    console.log(
      `Chunk ${i / maxConcurrentRequests + 1}/${Math.ceil(
        translationsCollections.length / maxConcurrentRequests
      )} fetched`
    );
  }

  const total = results
    .reduce(
      (acc, result) =>
        acc +
        (result
          ? result.count === `${limit}+`
            ? limit
            : result.items.length
          : 0),
      0
    )
    .toLocaleString();

  fs.writeFileSync(
    "./out/translations-report.json",
    JSON.stringify({ total, erroredCollections, results }, null, 2)
  );
}

export { fetchTranslations };
