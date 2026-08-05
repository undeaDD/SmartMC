# SmartMC landing site

The public landing/docs site for SmartMC, built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com), and [Starlight](https://starlight.astro.build) (for the `/wiki` section). Deployed to GitHub Pages on every push to `main` that touches this workspace.

## Structure

- `src/pages/` — plain Astro pages: home, roadmap, FAQ, gallery, contributors.
- `src/content/docs/wiki/` — the wiki (players / server owners / developers guides), rendered by Starlight.
- `src/content/roadmap/` — one Markdown file per milestone; update the `status` frontmatter (`planned` / `in-progress` / `done`) as milestones progress. This is deliberately hand-maintained, not wired to CI.

## Commands

Run from this directory, or from the repo root with `bun run --cwd apps/landing <script>`:

| Command | Action |
| --- | --- |
| `bun run dev` | Start the local dev server |
| `bun run build` | Build the production site to `./dist/` |
| `bun run typecheck` | Run `astro check` |
