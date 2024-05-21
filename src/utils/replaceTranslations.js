import { updateItem } from "@directus/sdk";
import { queryDirectus } from "./index.js";
import fs from "fs";

const client = queryDirectus();

async function replaceTranslations(oldText, newText) {
  const updatedItems = [];
  let { results } = JSON.parse(
    fs.readFileSync("./out/translations-report.json", "utf-8")
  );

  for (const result of results) {
    for (const item of result.items) {
      let updated = false;

      for (const key of Object.keys(item)) {
        if (typeof item[key] === "string" && item[key].includes(oldText)) {
          item[key] = item[key].replace(new RegExp(oldText, "g"), newText);
          updated = true;
        }
      }

      if (updated) {
        try {
          await client.request(updateItem(result.collection, item.id, item));
          console.log(
            `Updated item ${item.id} in collection ${result.collection}`
          );
          updatedItems.push({
            collection: result.collection,
            itemID: item.id,
          });
        } catch (error) {
          console.error(
            `Failed to update item ${item.id} in collection ${result.collection}:`,
            error
          );
        }
      }
    }
  }

  console.log("Updated items:", updatedItems);
}

export { replaceTranslations };
