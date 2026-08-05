import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),

  roadmap: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/roadmap' }),
    schema: z.object({
      title: z.string(),
      status: z.enum(['planned', 'in-progress', 'done']),
      order: z.number(),
    }),
  }),
};
