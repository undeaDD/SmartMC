// Reads the monorepo-wide config.json at the repo root (not inside this
// workspace), so the landing site and other workspaces stay in sync on the
// current milestone and platform links without duplicating them.
import rawConfig from '../../../../config.json';

export interface MonorepoConfig {
  currentMilestone: number;
  links: {
    appStore: string;
    playStore: string;
    modrinth: string;
    curseforge: string;
  };
}

export const config = rawConfig as MonorepoConfig;

export function isLinkEnabled(link: string): boolean {
  return link.trim().length > 0;
}
