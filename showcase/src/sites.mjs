// Сканирует sites/* и собирает метаданные для витрины (читается на этапе сборки).
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const sitesDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'sites');

export function getSites() {
  if (!existsSync(sitesDir)) return [];
  return readdirSync(sitesDir)
    .filter((n) => statSync(join(sitesDir, n)).isDirectory())
    .map((slug) => {
      const metaPath = join(sitesDir, slug, 'site.meta.json');
      const meta = existsSync(metaPath)
        ? JSON.parse(readFileSync(metaPath, 'utf8'))
        : {};
      return {
        slug,
        href: `/s/${slug}/`,
        title: meta.title || slug,
        description: meta.description || '',
        skill: meta.skill || '',
        tool: meta.tool || '',
        status: meta.status || 'wip',
        accent: meta.accent || '#8b5cf6',
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
