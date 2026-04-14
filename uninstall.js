#!/usr/bin/env node

/**
 * doc-agent-ai uninstaller
 * Removes the documentation workflow agent from an existing opencode setup.
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import os from "os";

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION = "1.0.0";
const AGENT_IDS = ["doc-arch", "doc-rec", "doc-prd", "doc-tech", "doc-pti"];
const OPENCODE_DIR = path.join(os.homedir(), ".config", "opencode");
const OPENCODE_JSON = path.join(OPENCODE_DIR, "opencode.json");

// ─── Colors ───────────────────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

const ok = (msg) => console.log(`  ${c.green}✔${c.reset} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow}⚠${c.reset}  ${msg}`);
const err = (msg) => console.log(`  ${c.red}✖${c.reset} ${msg}`);
const info = (msg) => console.log(`  ${c.blue}→${c.reset} ${msg}`);
const skip = (msg) => console.log(`  ${c.gray}–${c.reset} ${msg} ${c.gray}(not found, skipped)${c.reset}`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function removeDirIfExists(dirPath, label) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    ok(`removed: ${label}`);
  } else {
    skip(label);
  }
}

function removeFileIfExists(filePath, label) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    ok(`removed: ${label}`);
  } else {
    skip(label);
  }
}

// ─── Uninstall steps ─────────────────────────────────────────────────────────

function removeSkills() {
  const skillsDir = path.join(OPENCODE_DIR, "skills");
  const skills = [
    "doc-arch",
    "requirements-elicitation",
    "doc-prd",
    "tech-speccreate",
    "prd-to-issues",
  ];
  for (const skill of skills) {
    removeDirIfExists(path.join(skillsDir, skill), `skill: ${skill}`);
  }
}

function removePrompts() {
  const promptsDir = path.join(OPENCODE_DIR, "prompts", "doc");
  removeDirIfExists(promptsDir, "prompts/doc/");
}

function removeCommands() {
  const commandsDir = path.join(OPENCODE_DIR, "commands");
  const commands = ["arch", "rec", "prd", "tech", "pti", "mod"];
  for (const cmd of commands) {
    removeFileIfExists(
      path.join(commandsDir, `${cmd}.md`),
      `command: /${cmd}`
    );
  }
}

function removeAgentsFromJson() {
  if (!fs.existsSync(OPENCODE_JSON)) {
    warn("opencode.json not found — skipping agent cleanup.");
    return;
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(OPENCODE_JSON, "utf8"));
  } catch {
    err("opencode.json is not valid JSON — skipping agent cleanup.");
    return;
  }

  if (!config.agent) return;

  let removed = 0;
  for (const id of AGENT_IDS) {
    if (config.agent[id]) {
      delete config.agent[id];
      ok(`agent removed: ${id}`);
      removed++;
    } else {
      skip(`agent: ${id}`);
    }
  }

  if (removed > 0) {
    fs.writeFileSync(OPENCODE_JSON, JSON.stringify(config, null, 2));
  }
}

function removeSkillRegistry() {
  const registryPath = path.join(OPENCODE_DIR, ".atl", "skill-registry.md");
  removeFileIfExists(registryPath, ".atl/skill-registry.md");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log();
  console.log(`${c.bold}${c.cyan}  doc-agent-ai${c.reset} ${c.gray}v${VERSION} — uninstaller${c.reset}`);
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Check what's installed
    let config;
    try {
      config = JSON.parse(fs.readFileSync(OPENCODE_JSON, "utf8"));
    } catch {
      err("opencode.json not found or invalid. Nothing to uninstall.");
      process.exit(0);
    }

    const installed = AGENT_IDS.filter((id) => config.agent?.[id]);
    if (installed.length === 0) {
      warn("doc-agent-ai does not appear to be installed.");
      info("No agents found in opencode.json. Nothing to do.");
      process.exit(0);
    }

    console.log(`${c.bold}  The following will be removed:${c.reset}`);
    console.log(`${c.gray}  ────────────────────────────────────────────${c.reset}`);
    info("Skills:   doc-arch, requirements-elicitation, doc-prd, tech-speccreate, prd-to-issues");
    info("Prompts:  prompts/doc/ (all 5 files)");
    info("Commands: /arch, /rec, /prd, /tech, /pti, /mod");
    info("Agents:   doc-arch, doc-rec, doc-prd, doc-tech, doc-pti (from opencode.json)");
    info("Registry: .atl/skill-registry.md");
    console.log();
    warn("Your project documentation files in the projects base path are NOT affected.");
    console.log();

    const confirm = await ask(rl, `  ${c.bold}${c.red}Uninstall doc-agent-ai?${c.reset} (y/N) `);
    if (confirm.trim().toLowerCase() !== "y") {
      info("Uninstall cancelled.");
      process.exit(0);
    }
    console.log();

    console.log(`${c.bold}  Removing skills...${c.reset}`);
    removeSkills();
    console.log();

    console.log(`${c.bold}  Removing prompts...${c.reset}`);
    removePrompts();
    console.log();

    console.log(`${c.bold}  Removing commands...${c.reset}`);
    removeCommands();
    console.log();

    console.log(`${c.bold}  Removing agents from opencode.json...${c.reset}`);
    removeAgentsFromJson();
    console.log();

    console.log(`${c.bold}  Removing skill registry...${c.reset}`);
    removeSkillRegistry();
    console.log();

    console.log(`${c.bold}${c.green}  ✔ Uninstall complete.${c.reset}`);
    console.log(`${c.gray}  Restart opencode for changes to take effect.${c.reset}`);
    console.log();
  } finally {
    rl.close();
  }
}

main().catch((e) => {
  err(`Unexpected error: ${e.message}`);
  process.exit(1);
});
