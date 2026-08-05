// @ts-check

import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://undeadd.github.io',
  base: '/SmartMC',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    starlight({
      title: 'SmartMC Docs',
      description: 'Start here: guides for players, server owners, and developers.',
      customCss: ['./src/styles/starlight.css'],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/undeaDD/SmartMC' }],
      components: {
        SiteTitle: './src/components/StarlightSiteTitle.astro',
      },
      sidebar: [
        {
          label: 'Getting started',
          items: [
            { label: 'For players', slug: 'wiki/players' },
            { label: 'For server owners', slug: 'wiki/server-owners' },
            { label: 'For developers', slug: 'wiki/developers' },
          ],
        },
      ],
    }),
  ],
});
