#!/usr/bin/env node

/**
 * doc-agent-ai installer
 * Installs the documentation workflow agent into an existing opencode setup.
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import os from "os";

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION = "1.0.0";
const AGENT_IDS = ["doc-arch", "doc-rec", "doc-prd", "doc-tech", "doc-pti"];

const INSTALLER_DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const OPENCODE_DIR = path.join(os.homedir(), ".config", "opencode");
const OPENCODE_JSON = path.join(OPENCODE_DIR, "opencode.json");

// ─── Colors ───────────────────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
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
const dim = (msg) => console.log(`${c.gray}  ${msg}${c.reset}`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function copyFileSync(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function replaceInFile(filePath, search, replace) {
  const content = fs.readFileSync(filePath, "utf8");
  fs.writeFileSync(filePath, content.replaceAll(search, replace));
}

// ─── Pre-flight ───────────────────────────────────────────────────────────────

function checkOpencode() {
  if (!fs.existsSync(OPENCODE_JSON)) {
    err(`opencode.json not found at: ${OPENCODE_JSON}`);
    err("Make sure opencode is installed before running this installer.");
    err("Install opencode: https://opencode.ai");
    process.exit(1);
  }
}

function checkAlreadyInstalled() {
  try {
    const config = JSON.parse(fs.readFileSync(OPENCODE_JSON, "utf8"));
    const installed = AGENT_IDS.filter((id) => config.agent?.[id]);
    if (installed.length > 0) {
      return installed;
    }
  } catch {
    // JSON parse error handled later
  }
  return [];
}

function validateSourceFiles() {
  const required = [
    "skills/doc-arch/SKILL.md",
    "skills/requirements-elicitation/SKILL.md",
    "skills/requirements-elicitation/references/elicitation-techniques.md",
    "skills/doc-prd/SKILL.md",
    "skills/tech-speccreate/SKILL.md",
    "skills/tech-speccreate/references/template.md",
    "skills/prd-to-issues/SKILL.md",
    "prompts/doc-arch.md",
    "prompts/doc-rec.md",
    "prompts/doc-prd.md",
    "prompts/doc-tech.md",
    "prompts/doc-pti.md",
    "commands/arch.md",
    "commands/rec.md",
    "commands/prd.md",
    "commands/tech.md",
    "commands/pti.md",
    "commands/mod.md",
  ];

  const missing = required.filter(
    (f) => !fs.existsSync(path.join(INSTALLER_DIR, f))
  );

  if (missing.length > 0) {
    err("Installer source files are incomplete. Missing:");
    missing.forEach((f) => err(`  ${f}`));
    err("Re-download the installer package and try again.");
    process.exit(1);
  }
}

// ─── Install steps ────────────────────────────────────────────────────────────

function installSkills() {
  const skillsDir = path.join(OPENCODE_DIR, "skills");
  const skills = [
    "doc-arch",
    "requirements-elicitation",
    "doc-prd",
    "tech-speccreate",
    "prd-to-issues",
  ];

  for (const skill of skills) {
    const src = path.join(INSTALLER_DIR, "skills", skill);
    const dest = path.join(skillsDir, skill);
    copyDirSync(src, dest);
    ok(`skill: ${skill}`);
  }
}

function installPrompts(opencodeDir) {
  const promptsDir = path.join(opencodeDir, "prompts", "doc");
  const prompts = ["doc-arch", "doc-rec", "doc-prd", "doc-tech", "doc-pti"];

  for (const prompt of prompts) {
    const src = path.join(INSTALLER_DIR, "prompts", `${prompt}.md`);
    const dest = path.join(promptsDir, `${prompt}.md`);
    copyFileSync(src, dest);
    ok(`prompt: ${prompt}.md`);
  }
}

function installCommands(opencodeDir) {
  const commandsDir = path.join(opencodeDir, "commands");
  const commands = ["arch", "rec", "prd", "tech", "pti", "mod"];

  for (const cmd of commands) {
    const src = path.join(INSTALLER_DIR, "commands", `${cmd}.md`);
    const dest = path.join(commandsDir, `${cmd}.md`);
    copyFileSync(src, dest);
    ok(`command: /${cmd}`);
  }
}

function patchBasePath(opencodeDir, basePath) {
  const promptsDir = path.join(opencodeDir, "prompts", "doc");

  // The placeholder as it appears literally inside the .md files
  const PLACEHOLDER = "C:\\Obsidian\\";

  // Normalize the user-supplied path: ensure it ends with backslash
  const normalized = basePath.endsWith("\\") || basePath.endsWith("/")
    ? basePath.replace(/\//g, "\\")
    : basePath.replace(/\//g, "\\") + "\\";

  const files = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const filePath = path.join(promptsDir, file);
    replaceInFile(filePath, PLACEHOLDER, normalized);
  }
  ok(`base path set to: ${normalized}`);
}

function patchOpenCodeJson(opencodeDir) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(OPENCODE_JSON, "utf8"));
  } catch {
    err("opencode.json is not valid JSON. Fix it manually before installing.");
    process.exit(1);
  }

  if (!config.agent) config.agent = {};

  const win = (p) => p.replace(/\//g, "\\");
  const promptsBase = win(path.join(opencodeDir, "prompts", "doc"));

  const agentDefs = {
    "doc-arch": {
      description: "Documentation orchestrator — guides the full project documentation workflow",
      mode: "primary",
      prompt: `{file:${path.join(promptsBase, "doc-arch.md")}}`,
      tools: { bash: true, edit: true, read: true, task: true, write: true },
    },
    "doc-rec": {
      description: "Requirements elicitation executor",
      hidden: true,
      mode: "subagent",
      prompt: `{file:${path.join(promptsBase, "doc-rec.md")}}`,
      tools: { edit: true, read: true, write: true },
    },
    "doc-prd": {
      description: "PRD generation executor",
      hidden: true,
      mode: "subagent",
      prompt: `{file:${path.join(promptsBase, "doc-prd.md")}}`,
      tools: { edit: true, read: true, write: true },
    },
    "doc-tech": {
      description: "Technical specification executor",
      hidden: true,
      mode: "subagent",
      prompt: `{file:${path.join(promptsBase, "doc-tech.md")}}`,
      tools: { edit: true, read: true, write: true },
    },
    "doc-pti": {
      description: "Issues breakdown executor",
      hidden: true,
      mode: "subagent",
      prompt: `{file:${path.join(promptsBase, "doc-pti.md")}}`,
      tools: { edit: true, read: true, write: true },
    },
  };

  for (const [id, def] of Object.entries(agentDefs)) {
    config.agent[id] = def;
    ok(`agent registered: ${id}`);
  }

  // Write back preserving formatting
  fs.writeFileSync(OPENCODE_JSON, JSON.stringify(config, null, 2));
}

function installSkillRegistry(opencodeDir, basePath) {
  const atlDir = path.join(opencodeDir, ".atl");
  fs.mkdirSync(atlDir, { recursive: true });

  const registryPath = path.join(atlDir, "skill-registry.md");
  const skillsBase = path.join(opencodeDir, "skills");

  const content = `# Skill Registry — doc-agent-ai

**Auto-generated by doc-agent-ai installer v${VERSION}**
**Base path:** ${basePath}

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| \`/arch\`, \`/rec\`, \`/prd\`, \`/tech\`, \`/pti\`, \`/mod\` — project documentation workflow | doc-arch | ${path.join(skillsBase, "doc-arch", "SKILL.md")} |
| Generating PRD for a project | doc-prd | ${path.join(skillsBase, "doc-prd", "SKILL.md")} |
| Gathering requirements, elicitation session, stakeholder interview | requirements-elicitation | ${path.join(skillsBase, "requirements-elicitation", "SKILL.md")} |
| Creating technical specification, new feature needing documented architecture | tech-speccreate | ${path.join(skillsBase, "tech-speccreate", "SKILL.md")} |
| Converting PRD into GitHub issues, breaking down PRD into work items | prd-to-issues | ${path.join(skillsBase, "prd-to-issues", "SKILL.md")} |

## Compact Rules

### doc-arch
- Base path for all projects: \`${basePath}\`
- Commands: \`arch <s>\` (full flow), \`rec\`, \`prd\`, \`tech\`, \`pti\` (individual), \`mod <s> <m>\` (module)
- Module paths: \`<sistema>/<modulo>\` and \`<sistema>/<modulo>/<submodulo>\` — max 2 levels deep
- Archetype detected in \`rec\`: acotado (single delivery) or evolutivo (long lifecycle with modules)
- Index file \`<sistema>.md\` uses Obsidian \`[[...]]\` links and checkboxes — update after every phase
- Tech spec for modules: ALWAYS ask if inherits parent architecture (delta) or diverges (full spec)
- Modules read parent context: rec reads parent requirements, prd reads parent prd
- Issues generated as local .md only — never push to GitHub unless user explicitly asks
- Never invent context — if prerequisite missing, stop and show exact command to run

### doc-prd
- Follow Strict PRD Schema: Executive Summary → UX & Functionality → AI Requirements → Tech Specs → Risks & Roadmap
- Never skip discovery — ask at least 2 clarifying questions before generating
- Use concrete measurable criteria — never "fast", "easy", or "intuitive"
- If module: also read parent sistema's _prd.md to avoid contradicting Non-Goals
- Label unknowns as \`TBD\` — never hallucinate constraints

### requirements-elicitation
- Identify stakeholders by BABOK category: customer, end user, sponsor, domain expert, regulator, implementation team
- List business events as elicitation drivers — not document templates
- Use minimum 3 techniques per project (interviews + workshop + document analysis as baseline)
- Capture every requirement with source traceability (who said it and why)
- Document conflicts between stakeholders — never resolve silently
- Classify by BABOK hierarchy: business → stakeholder → solution (functional + non-functional) → transition
- Elicitation is iterative — one pass is never "complete"

### tech-speccreate
- Gather inputs first: PRD/brief, project tracking context, output path
- Always ask which repos need exploration before starting
- Use Mermaid for architecture diagrams — never ASCII art
- Populate Design Decisions table throughout (not at the end)
- Write spec incrementally to output file — not in one shot
- For modules: delta spec only if architecture inherited; full spec if diverging
- Validate for stale references and contradictions before concluding

### prd-to-issues
- Break PRD into vertical slices (tracer bullets) — each slice cuts ALL layers (schema, API, UI, tests)
- Never create horizontal slices (one layer only)
- Each issue: HITL (needs human decision) or AFK (no interaction needed) — prefer AFK
- Present breakdown to user for approval before generating the file
- Create issues in dependency order (blockers first)
- Output is local .md file — do NOT run \`gh issue create\` unless user explicitly requests it
`;

  fs.writeFileSync(registryPath, content);
  ok(`skill-registry.md written`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log();
  console.log(
    `${c.bold}${c.cyan}  doc-agent-ai${c.reset} ${c.gray}v${VERSION}${c.reset}`
  );
  console.log(
    `${c.gray}  Documentation workflow agent installer for opencode${c.reset}`
  );
  console.log();

  // Pre-flight
  console.log(`${c.bold}  Checking requirements...${c.reset}`);
  checkOpencode();
  ok("opencode.json found");
  validateSourceFiles();
  ok("installer source files complete");
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Check if already installed
    const alreadyInstalled = checkAlreadyInstalled();
    if (alreadyInstalled.length > 0) {
      warn(`The following agents are already registered in opencode.json:`);
      alreadyInstalled.forEach((id) => dim(`  - ${id}`));
      const answer = await ask(
        rl,
        `\n  ${c.yellow}Overwrite existing installation?${c.reset} (y/N) `
      );
      if (answer.trim().toLowerCase() !== "y") {
        info("Installation cancelled.");
        process.exit(0);
      }
      console.log();
    }

    // Ask for base path
    console.log(`${c.bold}  Configuration${c.reset}`);
    console.log(
      `${c.gray}  This is the root folder where your projects will be documented.${c.reset}`
    );

    // Default: <cwd>\Obsidian  (where the installer is being run from)
    const defaultBase = path.join(process.cwd(), "Obsidian") + path.sep;

    const rawBase = await ask(
      rl,
      `  Base projects path ${c.gray}[${defaultBase}]${c.reset}: `
    );
    const basePath = rawBase.trim() || defaultBase;
    const normalizedBase =
      basePath.endsWith("\\") || basePath.endsWith("/")
        ? basePath
        : basePath + "\\";

    // Verify base path exists — warn but don't block
    if (!fs.existsSync(normalizedBase.replace(/\\$/, ""))) {
      warn(`Path does not exist yet: ${normalizedBase}`);
      warn("The agent will still work — create the folder before first use.");
    }

    console.log();

    // Confirm
    console.log(`${c.bold}  Ready to install${c.reset}`);
    info(`opencode config: ${OPENCODE_DIR}`);
    info(`projects base:   ${normalizedBase}`);
    console.log();
    const confirm = await ask(rl, `  ${c.bold}Proceed?${c.reset} (Y/n) `);
    if (confirm.trim().toLowerCase() === "n") {
      info("Installation cancelled.");
      process.exit(0);
    }
    console.log();

    // Install
    console.log(`${c.bold}  Installing skills...${c.reset}`);
    installSkills();
    console.log();

    console.log(`${c.bold}  Installing prompts...${c.reset}`);
    installPrompts(OPENCODE_DIR);
    console.log();

    console.log(`${c.bold}  Installing commands...${c.reset}`);
    installCommands(OPENCODE_DIR);
    console.log();

    console.log(`${c.bold}  Patching base path in prompts...${c.reset}`);
    patchBasePath(OPENCODE_DIR, normalizedBase);
    console.log();

    console.log(`${c.bold}  Registering agents in opencode.json...${c.reset}`);
    patchOpenCodeJson(OPENCODE_DIR);
    console.log();

    console.log(`${c.bold}  Writing skill registry...${c.reset}`);
    installSkillRegistry(OPENCODE_DIR, normalizedBase);
    console.log();

    // Done
    console.log(`${c.bold}${c.green}  ✔ Installation complete!${c.reset}`);
    console.log();
    console.log(`${c.bold}  Available commands in opencode:${c.reset}`);
    console.log(`${c.gray}  ────────────────────────────────${c.reset}`);
    const cmds = [
      ["/arch <sistema>", "Full documentation flow (4 steps)"],
      ["/rec <sistema>", "Step 1 — Requirements elicitation"],
      ["/prd <sistema>", "Step 2 — Product Requirements Document"],
      ["/tech <sistema>", "Step 3 — Technical specification"],
      ["/pti <sistema>", "Step 4 — Issues breakdown"],
      ["/mod <sistema> <modulo>", "New module inside an evolutivo system"],
    ];
    for (const [cmd, desc] of cmds) {
      console.log(
        `  ${c.cyan}${cmd.padEnd(30)}${c.reset}${c.gray}${desc}${c.reset}`
      );
    }
    console.log();
    console.log(
      `${c.gray}  Restart opencode for changes to take effect.${c.reset}`
    );
    console.log();
  } finally {
    rl.close();
  }
}

main().catch((e) => {
  err(`Unexpected error: ${e.message}`);
  process.exit(1);
});
