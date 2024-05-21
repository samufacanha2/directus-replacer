import { fetchTranslations } from "./utils/fetchTranslations.js";
import { replaceTranslations } from "./utils/replaceTranslations.js";

const oldText = process.env.OLD_TEXT;
const newText = process.env.NEW_TEXT;

await fetchTranslations(oldText);

await replaceTranslations(oldText, newText);
