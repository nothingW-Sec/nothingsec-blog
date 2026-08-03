import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(), description: z.string(), publishDate: z.coerce.date(), updatedDate: z.coerce.date().optional(),
    category: z.string(), tags: z.array(z.string()), draft: z.boolean().default(false), featured: z.boolean().default(false), cover: z.string().optional()
  })
});
export const collections = { posts };
