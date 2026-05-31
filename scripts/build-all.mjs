#!/usr/bin/env node
// Собирает каждый сайт из sites/* и складывает его dist в showcase/public/s/<slug>,
// затем собирает витрину. Итог — единый статический showcase/dist для Vercel.
import { readdirSync, existsSync, rmSync, cpSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sitesDir = join(root, 'sites');
const stageDir = join(root, 'showcase', 'public', 's');

// Сборки на Windows иногда падают флапающим нативным крэшем (0xC0000409) —
// ретраим каждую сборку до 3 раз.
function run(cmd, opts, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try { execSync(cmd, opts); return; }
    catch (e) {
      if (i === tries) throw e;
      console.log(`  ⚠ попытка ${i} упала (${e.status ?? e.message}), повтор...`);
    }
  }
}

if (existsSync(stageDir)) rmSync(stageDir, { recursive: true, force: true });

const sites = existsSync(sitesDir)
  ? readdirSync(sitesDir).filter((n) => statSync(join(sitesDir, n)).isDirectory())
  : [];

for (const slug of sites) {
  const dir = join(sitesDir, slug);
  if (!existsSync(join(dir, 'package.json'))) continue;
  console.log(`\n▶ building site: ${slug}`);
  // SITE_BASE заставляет Astro собрать сайт под подпутём /s/<slug>/
  run('npm run build', {
    cwd: dir,
    stdio: 'inherit',
    env: { ...process.env, SITE_BASE: `/s/${slug}/` },
  });
  const dist = join(dir, 'dist');
  if (existsSync(dist)) cpSync(dist, join(stageDir, slug), { recursive: true });
}

console.log('\n▶ building showcase');
run('npm run build', { cwd: join(root, 'showcase'), stdio: 'inherit' });
console.log('\n✅ Готово → showcase/dist (включает витрину и все сайты под /s/<slug>/)');
