// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://undeadd.github.io',
  base: '/SmartMC',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    starlight({
      title: 'SmartMC',
      description: 'Docs for players, server owners, and developers.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/undeaDD/SmartMC' }
      ],
      sidebar: [
        {
          label: 'Wiki',
          items: [
            { label: 'For players', slug: 'wiki/players' },
            { label: 'For server owners', slug: 'wiki/server-owners' },
            { label: 'For developers', slug: 'wiki/developers' }
          ]
        }
      ]
    })
  ]
});
