import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),

  // Status is intentionally not part of the schema -- it's derived from
  // config.json's currentMilestone (see src/lib/roadmap.ts) rather than
  // hand-set per file, so advancing the roadmap is a one-number change.
  roadmap: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/roadmap' }),
    schema: z.object({
      title: z.string(),
      order: z.number(),
      date: z.string().optional(),
    }),
  }),
};
