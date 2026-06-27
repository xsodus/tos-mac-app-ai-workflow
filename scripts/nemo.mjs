#!/usr/bin/env node

import { checkbox, select } from '@inquirer/prompts';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_SRC = path.join(ROOT_DIR, 'skills');

const LOCAL_SKILL_TARGETS = [
  { name: '.claude/skills   (Claude Code - this project)', value: path.join(ROOT_DIR, '.claude', 'skills') },
  { name: '.cursor/skills   (Cursor - this project)', value: path.join(ROOT_DIR, '.cursor', 'skills') },
  { name: '.gemini/skills   (Gemini CLI - this project)', value: path.join(ROOT_DIR, '.gemini', 'skills') },
];

const GLOBAL_SKILL_TARGETS = [
  { name: '~/.agents/skills  (shared pool)', value: path.join(os.homedir(), '.agents', 'skills') },
  { name: '~/.claude/skills  (Claude Code)', value: path.join(os.homedir(), '.claude', 'skills') },
  { name: '~/.cursor/skills  (Cursor)', value: path.join(os.homedir(), '.cursor', 'skills') },
  { name: '~/.gemini/skills  (Gemini CLI)', value: path.join(os.homedir(), '.gemini', 'skills') },
];

function getDirectories(srcRoot) {
  if (!fs.existsSync(srcRoot)) return [];
  return fs
    .readdirSync(srcRoot)
    .filter(name => fs.statSync(path.join(srcRoot, name)).isDirectory() && !name.startsWith('.'));
}

function symlinkItemsTo(dest, items, srcRoot) {
  fs.mkdirSync(dest, { recursive: true });

  for (const item of items) {
    const src = path.join(srcRoot, item);
    const target = path.join(dest, item);

    fs.rmSync(target, { recursive: true, force: true });
    fs.symlinkSync(src, target);
    console.log(`  linked ${item}`);
  }
}

async function pickScope() {
  return select({
    message: 'Install locally (this project) or globally?',
    choices: [
      { name: 'Local   - symlink into this project\'s skill dirs', value: 'local' },
      { name: 'Global  - symlink into ~/.claude, ~/.cursor, ~/.gemini, etc.', value: 'global' },
    ],
  });
}

async function pickItems(kind, items) {
  const mode = await select({
    message: `Which ${kind} to install?`,
    choices: [
      { name: `All ${kind}`, value: 'all' },
      { name: 'Let me choose', value: 'pick' },
    ],
  });

  if (mode === 'all') return items;

  return checkbox({
    message: `Select ${kind} to install:`,
    choices: items.map(name => ({ name, value: name })),
  });
}

async function runSymlinkFlow({ kind, items, srcRoot, targets, scope }) {
  if (items.length === 0) {
    console.log(`No ${kind} found in ${srcRoot}.`);
    return;
  }

  const selectedItems = await pickItems(kind, items);
  if (selectedItems.length === 0) {
    console.log(`No ${kind} selected.`);
    return;
  }

  const selectedTargets = await checkbox({
    message: `Select ${scope} targets to symlink ${kind} into:`,
    choices: targets,
  });

  if (selectedTargets.length === 0) {
    console.log('No targets selected.');
    return;
  }

  for (const dest of selectedTargets) {
    const label = targets.find(target => target.value === dest)?.name ?? dest;
    console.log(`\nSymlinking to ${label.trim()}...`);
    symlinkItemsTo(dest, selectedItems, srcRoot);
  }
}

async function symlinkCommand() {
  const scope = await pickScope();

  await runSymlinkFlow({
    kind: 'skills',
    items: getDirectories(SKILLS_SRC),
    srcRoot: SKILLS_SRC,
    targets: scope === 'local' ? LOCAL_SKILL_TARGETS : GLOBAL_SKILL_TARGETS,
    scope,
  });

  console.log('\nDone.');
}

const cli = yargs(hideBin(process.argv))
  .scriptName('nemo')
  .usage('$0 <command>')
  .command({
    command: 'symlink',
    describe: 'Symlink skills into one or more agent tool directories',
    handler: symlinkCommand,
  })
  .demandCommand(1, 'Please specify a command. Run --help for usage.')
  .help();

await cli.parseAsync();
