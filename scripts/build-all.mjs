#!/usr/bin/env node
// Собирает каждый сайт из sites/* и складывает его dist в showcase/public/s/<slug>,
// затем собирает витрину. Итог — единый статический showcase/dist.
import { readdirSync, existsSync, rmSync, cpSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sitesDir = join(root, 'sites');
const stageDir = join(root, 'showcase', 'public', 's');

const sleep = (ms) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { /* busy wait — короткая пауза между сборками */ }
};

// На Windows + Node 24 сборка иногда падает нативным крэшем libuv на ВЫХОДЕ процесса
// (0xC0000409 / UV_HANDLE_CLOSING) — при этом dist уже успешно записан.
// Поэтому критерий успеха — наличие свежего dist, а не код возврата.
function buildWithDist(cmd, opts, distDir, tries = 5) {
  for (let i = 1; i <= tries; i++) {
    if (existsSync(distDir)) rmSync(distDir, { recursive: true, force: true });
    let threw = false;
    try { execSync(cmd, opts); }
    catch { threw = true; }
    if (existsSync(distDir)) {
      if (threw) console.log('  ⚠ процесс упал на выходе, но dist собран — засчитываю успех');
      return true;
    }
    console.log(`  ⚠ попытка ${i}: dist не появился, повтор...`);
    sleep(400);
  }
  return false;
}

if (existsSync(stageDir)) rmSync(stageDir, { recursive: true, force: true });

const sites = existsSync(sitesDir)
  ? readdirSync(sitesDir).filter((n) => statSync(join(sitesDir, n)).isDirectory())
  : [];

const failed = [];
for (const slug of sites) {
  const dir = join(sitesDir, slug);
  if (!existsSync(join(dir, 'package.json'))) continue;
  console.log(`\n▶ building site: ${slug}`);
  const dist = join(dir, 'dist');
  const ok = buildWithDist('npm run build', {
    cwd: dir,
    stdio: 'inherit',
    env: { ...process.env, SITE_BASE: `/s/${slug}/` },
  }, dist);
  if (ok && existsSync(dist)) {
    cpSync(dist, join(stageDir, slug), { recursive: true });
  } else {
    console.warn(`  ✗ ${slug}: не удалось собрать — пропускаю (витрина соберётся без него)`);
    failed.push(slug);
  }
  sleep(250);
}

console.log('\n▶ building showcase');
const showcaseDist = join(root, 'showcase', 'dist');
const scOk = buildWithDist('npm run build', { cwd: join(root, 'showcase'), stdio: 'inherit' }, showcaseDist);
if (!scOk) {
  console.error('\n✗ Витрина не собралась. Прерываю, чтобы не задеплоить пустоту.');
  process.exit(1);
}

console.log('\n✅ Готово → showcase/dist (витрина + сайты под /s/<slug>/)');
if (failed.length) console.log(`⚠ Не собрались сайты: ${failed.join(', ')} — их карточки могут вести в 404.`);
