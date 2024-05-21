import { updateItem } from "@directus/sdk";
import { queryDirectus } from "./index.js";
import fs from "fs";

const client = queryDirectus();

async function replaceTranslations(oldText, newText) {
  const updatedItems = [];
  const failedItems = [];
  let { results } = JSON.parse(
    fs.readFileSync("./out/translations-report.json", "utf-8")
  );

  const updatePromises = [];
  const maxConcurrentRequests = process.env.MAX_CONCURRENT_REQUESTS || 10;

  for (const result of results) {
    for (const item of result.items) {
      const oldItem = JSON.parse(JSON.stringify(item));
      let updated = false;

      for (const key of Object.keys(item)) {
        if (typeof item[key] === "string" && item[key].includes(oldText)) {
          item[key] = item[key].replace(new RegExp(oldText, "g"), newText);
          updated = true;
        }
      }

      if (updated) {
        const updatePromise = client
          .request(updateItem(result.collection, item.id, item))
          .then((res) => {
            console.log(
              `Updated item ${item.id} in collection ${result.collection}`
            );
            updatedItems.push({
              collection: result.collection,
              newItem: res,
              oldItem: oldItem,
            });
          })
          .catch((error) => {
            console.error(
              `Failed to update item ${item.id} in collection ${result.collection}:`,
              error
            );
            failedItems.push({
              collection: result.collection,
              itemID: item.id,
              error: error.message,
            });
          });

        updatePromises.push(updatePromise);

        if (updatePromises.length >= maxConcurrentRequests) {
          await Promise.all(updatePromises);
          updatePromises.length = 0;
        }
      }
    }
  }

  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
  }

  console.log("Updated items:", updatedItems);
  console.log("Failed items:", failedItems);

  fs.writeFileSync(
    "./out/failed-replace-items-report.json",
    JSON.stringify({ failedItems }, null, 2)
  );

  fs.writeFileSync(
    "./out/updated-replace-items-report.json",
    JSON.stringify({ updatedItems }, null, 2)
  );
}

export { replaceTranslations };
