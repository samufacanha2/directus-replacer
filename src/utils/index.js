import { createDirectus, rest, staticToken } from "@directus/sdk";

export const queryDirectus = () => {
  return createDirectus(process.env.DIRECTUS_URL)
    .with(rest())
    .with(staticToken(process.env.DIRECTUS_TOKEN));
};
