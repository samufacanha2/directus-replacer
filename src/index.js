import { fetchTranslations } from "./utils/fetchTranslations.js";
import { replaceTranslations } from "./utils/replaceTranslations.js";

const oldText = process.env.OLD_TEXT;
const newText = process.env.NEW_TEXT;

console.log(
  `Replacing "${oldText}" with "${newText}", do you want to continue? (y/n)`
);
const answer = await new Promise((resolve) => {
  process.stdin.once("data", (data) => resolve(data.toString().trim()));
});

if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
  console.log("Aborted.");
  process.exit(0);
}

console.log("Fetching translations...");

await fetchTranslations(oldText);

await replaceTranslations(oldText, newText);
