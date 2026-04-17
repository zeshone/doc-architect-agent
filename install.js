#!/usr/bin/env node

/**
 * doc-agent-ai installer
 * Detects available platforms (opencode / Qwen Code) and installs agents accordingly.
 * Each platform is optional — at least one must be present.
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import os from "os";
import { execSync } from "child_process";

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION = "1.3.0";
const AGENT_IDS = ["doc-arch", "doc-rec", "doc-prd", "doc-tech", "doc-pti"];

const INSTALLER_DIR = path
  .dirname(new URL(import.meta.url).pathname)
  .replace(/^\/([A-Z]:)/, "$1");

const HOME = os.homedir();
const OPENCODE_DIR = path.join(HOME, ".config", "opencode");
const OPENCODE_JSON = path.join(OPENCODE_DIR, "opencode.json");
const QWEN_DIR = path.join(HOME, ".qwen");
const QWEN_SETTINGS = path.join(QWEN_DIR, "settings.json");
const COPILOT_DIR = path.join(HOME, ".copilot");
const CLAUDE_DIR  = path.join(HOME, ".claude");

const PLACEHOLDER = "C:\\Obsidian\\";

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

const ok   = (msg) => console.log(`  ${c.green}✔${c.reset} ${msg}`);
const warn = (msg) => console.log(`  ${c.yellow}⚠${c.reset}  ${msg}`);
const err  = (msg) => console.log(`  ${c.red}✖${c.reset} ${msg}`);
const info = (msg) => console.log(`  ${c.blue}→${c.reset} ${msg}`);
const dim  = (msg) => console.log(`${c.gray}  ${msg}${c.reset}`);
const head = (msg) => console.log(`\n${c.bold}  ${msg}${c.reset}`);

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

function normalizeBasePath(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return process.cwd() + path.sep;
  const withBackslash = trimmed.replace(/\//g, "\\");
  return withBackslash.endsWith("\\") ? withBackslash : withBackslash + "\\";
}

// ─── Platform detection ───────────────────────────────────────────────────────

function detectPlatforms() {
  let copilot = false;
  if (fs.existsSync(COPILOT_DIR)) {
    try {
      execSync("code --version", { stdio: "ignore" });
      copilot = true;
    } catch {
      copilot = false;
    }
  }

  let claude = false;
  if (fs.existsSync(CLAUDE_DIR)) {
    try {
      execSync("claude --version", { stdio: "ignore" });
      claude = true;
    } catch {
      // ~/.claude exists but CLI not in PATH — still detect it
      claude = true;
    }
  }

  return {
    opencode: fs.existsSync(OPENCODE_JSON),
    qwen: fs.existsSync(QWEN_DIR),
    copilot,
    claude,
  };
}

// ─── Source file validation ───────────────────────────────────────────────────

function validateSourceFiles(platforms) {
  const required = [
    // Skills (shared by both platforms)
    "skills/doc-arch/SKILL.md",
    "skills/requirements-elicitation/SKILL.md",
    "skills/requirements-elicitation/references/elicitation-techniques.md",
    "skills/doc-prd/SKILL.md",
    "skills/tech-speccreate/SKILL.md",
    "skills/tech-speccreate/references/template.md",
    "skills/prd-to-issues/SKILL.md",
  ];

  if (platforms.opencode) {
    required.push(
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
      "commands/mod.md"
    );
  }

  if (platforms.qwen) {
    required.push(
      "prompts-qwen/doc-arch.md",
      "prompts-qwen/doc-rec.md",
      "prompts-qwen/doc-prd.md",
      "prompts-qwen/doc-tech.md",
      "prompts-qwen/doc-pti.md",
      "agents-qwen/doc-arch.md",
      "agents-qwen/doc-rec.md",
      "agents-qwen/doc-prd.md",
      "agents-qwen/doc-tech.md",
      "agents-qwen/doc-pti.md"
    );
  }

  if (platforms.copilot) {
    required.push(
      "prompts-copilot/doc-arch.md",
      "prompts-copilot/doc-rec.md",
      "prompts-copilot/doc-prd.md",
      "prompts-copilot/doc-tech.md",
      "prompts-copilot/doc-pti.md",
      "agents-copilot/doc-arch.agent.md",
      "agents-copilot/doc-rec.agent.md",
      "agents-copilot/doc-prd.agent.md",
      "agents-copilot/doc-tech.agent.md",
      "agents-copilot/doc-pti.agent.md"
    );
  }

  if (platforms.claude) {
    required.push(
      "prompts-claude/doc-arch.md",
      "prompts-claude/doc-rec.md",
      "prompts-claude/doc-prd.md",
      "prompts-claude/doc-tech.md",
      "prompts-claude/doc-pti.md",
      "agents-claude/doc-arch.md",
      "agents-claude/doc-rec.md",
      "agents-claude/doc-prd.md",
      "agents-claude/doc-tech.md",
      "agents-claude/doc-pti.md"
    );
  }

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

// ─── Shared: install skills ───────────────────────────────────────────────────

function installSkills(skillsDir) {
  const skills = [
    "doc-arch",
    "requirements-elicitation",
    "doc-prd",
    "tech-speccreate",
    "prd-to-issues",
  ];
  for (const skill of skills) {
    copyDirSync(
      path.join(INSTALLER_DIR, "skills", skill),
      path.join(skillsDir, skill)
    );
    ok(`skill: ${skill}`);
  }
}

// ─── opencode install ─────────────────────────────────────────────────────────

function installOpencodePrompts(basePath) {
  const promptsDir = path.join(OPENCODE_DIR, "prompts", "doc");
  for (const agent of AGENT_IDS) {
    const src = path.join(INSTALLER_DIR, "prompts", `${agent}.md`);
    const dest = path.join(promptsDir, `${agent}.md`);
    copyFileSync(src, dest);
    ok(`prompt: ${agent}.md`);
  }
  // Patch base path
  const promptFiles = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md"));
  for (const file of promptFiles) {
    replaceInFile(path.join(promptsDir, file), PLACEHOLDER, basePath);
  }
}

function installOpencodeCommands(basePath) {
  const commandsDir = path.join(OPENCODE_DIR, "commands");
  const commands = ["arch", "rec", "prd", "tech", "pti", "mod"];
  for (const cmd of commands) {
    const src = path.join(INSTALLER_DIR, "commands", `${cmd}.md`);
    const dest = path.join(commandsDir, `${cmd}.md`);
    copyFileSync(src, dest);
    ok(`command: /${cmd}`);
  }
  // Patch base path
  const cmdFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md"));
  for (const file of cmdFiles) {
    replaceInFile(path.join(commandsDir, file), PLACEHOLDER, basePath);
  }
}

function patchOpencodeJson(basePath) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(OPENCODE_JSON, "utf8"));
  } catch {
    err("opencode.json is not valid JSON. Fix it manually before installing.");
    process.exit(1);
  }

  if (!config.agent) config.agent = {};

  const win = (p) => p.replace(/\//g, "\\");
  const promptsBase = win(path.join(OPENCODE_DIR, "prompts", "doc"));

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

  fs.writeFileSync(OPENCODE_JSON, JSON.stringify(config, null, 2));
}

function installOpencodeSkillRegistry(basePath) {
  const atlDir = path.join(OPENCODE_DIR, ".atl");
  fs.mkdirSync(atlDir, { recursive: true });

  const skillsBase = path.join(OPENCODE_DIR, "skills");

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

  fs.writeFileSync(path.join(atlDir, "skill-registry.md"), content);
  ok(`skill-registry.md written`);
}

// ─── Qwen Code install ────────────────────────────────────────────────────────

function installQwenPrompts(basePath) {
  const promptsDir = path.join(QWEN_DIR, "prompts", "doc");
  for (const agent of AGENT_IDS) {
    const src = path.join(INSTALLER_DIR, "prompts-qwen", `${agent}.md`);
    const dest = path.join(promptsDir, `${agent}.md`);
    copyFileSync(src, dest);
    ok(`prompt: ${agent}.md`);
  }
  // Patch base path
  const promptFiles = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md"));
  for (const file of promptFiles) {
    replaceInFile(path.join(promptsDir, file), PLACEHOLDER, basePath);
  }
}

function installQwenAgents(basePath) {
  const agentsDir = path.join(QWEN_DIR, "agents");
  fs.mkdirSync(agentsDir, { recursive: true });

  for (const agent of AGENT_IDS) {
    const src = path.join(INSTALLER_DIR, "agents-qwen", `${agent}.md`);
    const dest = path.join(agentsDir, `${agent}.md`);
    copyFileSync(src, dest);
    // Patch base path in agent file
    replaceInFile(dest, PLACEHOLDER, basePath);
    ok(`agent: ${agent}`);
  }
}

// ─── GitHub Copilot install ───────────────────────────────────────────────────

function installCopilotPrompts(basePath) {
  const promptsDir = path.join(COPILOT_DIR, "prompts", "doc");
  for (const agent of AGENT_IDS) {
    const src = path.join(INSTALLER_DIR, "prompts-copilot", `${agent}.md`);
    const dest = path.join(promptsDir, `${agent}.md`);
    copyFileSync(src, dest);
    ok(`prompt: ${agent}.md`);
  }
  // Patch base path
  const promptFiles = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md"));
  for (const file of promptFiles) {
    replaceInFile(path.join(promptsDir, file), PLACEHOLDER, basePath);
  }
}

function installCopilotAgents(basePath) {
  const agentsDir = path.join(COPILOT_DIR, "agents");
  fs.mkdirSync(agentsDir, { recursive: true });

  for (const agent of AGENT_IDS) {
    const src = path.join(INSTALLER_DIR, "agents-copilot", `${agent}.agent.md`);
    const dest = path.join(agentsDir, `${agent}.agent.md`);
    copyFileSync(src, dest);
    // Patch base path in agent file
    replaceInFile(dest, PLACEHOLDER, basePath);
    ok(`agent: ${agent}`);
  }
}

// ─── Claude Code install ──────────────────────────────────────────────────────

function installClaudePrompts(basePath) {
  const promptsDir = path.join(CLAUDE_DIR, "prompts", "doc");
  for (const agent of AGENT_IDS) {
    const src = path.join(INSTALLER_DIR, "prompts-claude", `${agent}.md`);
    const dest = path.join(promptsDir, `${agent}.md`);
    copyFileSync(src, dest);
    ok(`prompt: ${agent}.md`);
  }
  // Patch base path
  const promptFiles = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md"));
  for (const file of promptFiles) {
    replaceInFile(path.join(promptsDir, file), PLACEHOLDER, basePath);
  }
}

function installClaudeAgents(basePath) {
  const agentsDir = path.join(CLAUDE_DIR, "agents");
  fs.mkdirSync(agentsDir, { recursive: true });

  for (const agent of AGENT_IDS) {
    const src = path.join(INSTALLER_DIR, "agents-claude", `${agent}.md`);
    const dest = path.join(agentsDir, `${agent}.md`);
    copyFileSync(src, dest);
    // Patch base path in agent file
    replaceInFile(dest, PLACEHOLDER, basePath);
    ok(`agent: ${agent}`);
  }
}

function installClaudeSkillRegistry(basePath) {
  const atlDir = path.join(CLAUDE_DIR, ".atl");
  fs.mkdirSync(atlDir, { recursive: true });

  const skillsBase = path.join(CLAUDE_DIR, "skills");

  const content = `# Skill Registry — doc-agent-ai

**Auto-generated by doc-agent-ai installer v${VERSION}**
**Base path:** ${basePath}

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| Documenting a project, /arch, /rec, /prd, /tech, /pti, /mod | doc-arch | ${path.join(skillsBase, "doc-arch", "SKILL.md")} |
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

  fs.writeFileSync(path.join(atlDir, "skill-registry.md"), content);
  ok(`skill-registry.md written`);
}



function checkOpencodeAlreadyInstalled() {
  try {
    const config = JSON.parse(fs.readFileSync(OPENCODE_JSON, "utf8"));
    return AGENT_IDS.filter((id) => config.agent?.[id]);
  } catch {
    return [];
  }
}

function checkQwenAlreadyInstalled() {
  const agentsDir = path.join(QWEN_DIR, "agents");
  if (!fs.existsSync(agentsDir)) return [];
  return AGENT_IDS.filter((id) =>
    fs.existsSync(path.join(agentsDir, `${id}.md`))
  );
}

function checkCopilotAlreadyInstalled() {
  const agentsDir = path.join(COPILOT_DIR, "agents");
  if (!fs.existsSync(agentsDir)) return [];
  return AGENT_IDS.filter((id) =>
    fs.existsSync(path.join(agentsDir, `${id}.agent.md`))
  );
}

function checkClaudeAlreadyInstalled() {
  const agentsDir = path.join(CLAUDE_DIR, "agents");
  if (!fs.existsSync(agentsDir)) return [];
  return AGENT_IDS.filter((id) =>
    fs.existsSync(path.join(agentsDir, `${id}.md`))
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log();
  console.log(`${c.bold}${c.cyan}  doc-agent-ai${c.reset} ${c.gray}v${VERSION}${c.reset}`);
  console.log(`${c.gray}  Documentation workflow agent installer${c.reset}`);
  console.log();

  // ── Detect platforms ──
  head("Detecting platforms...");
  const platforms = detectPlatforms();

  if (platforms.opencode) ok(`opencode detected  ${c.gray}(${OPENCODE_DIR})${c.reset}`);
  else warn(`opencode not found  ${c.gray}(${OPENCODE_JSON} missing)${c.reset}`);

  if (platforms.qwen) ok(`Qwen Code detected  ${c.gray}(${QWEN_DIR})${c.reset}`);
  else warn(`Qwen Code not found  ${c.gray}(${QWEN_DIR} missing)${c.reset}`);

  if (platforms.copilot) ok(`GitHub Copilot detected  ${c.gray}(${COPILOT_DIR} + code CLI)${c.reset}`);
  else warn(`GitHub Copilot not found  ${c.gray}(${COPILOT_DIR} missing or 'code' not in PATH)${c.reset}`);

  if (platforms.claude) ok(`Claude Code detected  ${c.gray}(${CLAUDE_DIR})${c.reset}`);
  else warn(`Claude Code not found  ${c.gray}(${CLAUDE_DIR} missing)${c.reset}`);

  if (!platforms.opencode && !platforms.qwen && !platforms.copilot && !platforms.claude) {
    console.log();
    err("No supported platform detected.");
    err("Install opencode (https://opencode.ai), Qwen Code, GitHub Copilot in VS Code, or Claude Code before running this installer.");
    process.exit(1);
  }

  // ── Validate source files ──
  validateSourceFiles(platforms);
  console.log();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    // ── Platform selection ──
    let installOpencode = platforms.opencode;
    let installQwen = platforms.qwen;
    let installCopilot = platforms.copilot;
    let installClaude = platforms.claude;

    const detected = [platforms.opencode, platforms.qwen, platforms.copilot, platforms.claude].filter(Boolean).length;
    if (detected > 1) {
      head("Platform selection");
      console.log(`${c.gray}  Multiple platforms detected. Choose which to install:${c.reset}`);
      const options = [];
      if (platforms.opencode) options.push(["opencode"]);
      if (platforms.qwen)     options.push(["Qwen Code"]);
      if (platforms.copilot)  options.push(["GitHub Copilot"]);

      let idx = 1;
      const labelMap = {};
      if (platforms.opencode) { console.log(`${c.gray}  [${idx}] opencode only${c.reset}`);        labelMap[idx++] = "opencode"; }
      if (platforms.qwen)     { console.log(`${c.gray}  [${idx}] Qwen Code only${c.reset}`);       labelMap[idx++] = "qwen"; }
      if (platforms.copilot)  { console.log(`${c.gray}  [${idx}] GitHub Copilot only${c.reset}`);  labelMap[idx++] = "copilot"; }
      if (platforms.claude)   { console.log(`${c.gray}  [${idx}] Claude Code only${c.reset}`);     labelMap[idx++] = "claude"; }
      console.log(`${c.gray}  [${idx}] All (default)${c.reset}`);
      console.log();
      const choice = await ask(rl, `  Selection ${c.gray}(Enter = all)${c.reset}: `);
      const sel = parseInt(choice.trim(), 10);
      if (labelMap[sel]) {
        installOpencode = labelMap[sel] === "opencode";
        installQwen     = labelMap[sel] === "qwen";
        installCopilot  = labelMap[sel] === "copilot";
        installClaude   = labelMap[sel] === "claude";
      }
      // else: all (default)
    }

    // ── Already-installed check ──
    if (installOpencode) {
      const existing = checkOpencodeAlreadyInstalled();
      if (existing.length > 0) {
        console.log();
        warn("The following agents are already registered in opencode.json:");
        existing.forEach((id) => dim(`  - ${id}`));
        const answer = await ask(rl, `\n  ${c.yellow}Overwrite opencode installation?${c.reset} (y/N) `);
        if (answer.trim().toLowerCase() !== "y") {
          info("Skipping opencode.");
          installOpencode = false;
        }
      }
    }

    if (installQwen) {
      const existing = checkQwenAlreadyInstalled();
      if (existing.length > 0) {
        console.log();
        warn("The following agents are already installed in Qwen Code:");
        existing.forEach((id) => dim(`  - ${id}`));
        const answer = await ask(rl, `\n  ${c.yellow}Overwrite Qwen Code installation?${c.reset} (y/N) `);
        if (answer.trim().toLowerCase() !== "y") {
          info("Skipping Qwen Code.");
          installQwen = false;
        }
      }
    }

    if (installCopilot) {
      const existing = checkCopilotAlreadyInstalled();
      if (existing.length > 0) {
        console.log();
        warn("The following agents are already installed in GitHub Copilot:");
        existing.forEach((id) => dim(`  - ${id}`));
        const answer = await ask(rl, `\n  ${c.yellow}Overwrite GitHub Copilot installation?${c.reset} (y/N) `);
        if (answer.trim().toLowerCase() !== "y") {
          info("Skipping GitHub Copilot.");
          installCopilot = false;
        }
      }
    }

    if (installClaude) {
      const existing = checkClaudeAlreadyInstalled();
      if (existing.length > 0) {
        console.log();
        warn("The following agents are already installed in Claude Code:");
        existing.forEach((id) => dim(`  - ${id}`));
        const answer = await ask(rl, `\n  ${c.yellow}Overwrite Claude Code installation?${c.reset} (y/N) `);
        if (answer.trim().toLowerCase() !== "y") {
          info("Skipping Claude Code.");
          installClaude = false;
        }
      }
    }

    if (!installOpencode && !installQwen && !installCopilot && !installClaude) {
      info("Nothing to install. Exiting.");
      process.exit(0);
    }

    // ── Base path ──
    head("Configuration");
    console.log(`${c.gray}  Where should the agent save your project documentation?${c.reset}`);
    console.log(`${c.gray}  This is the root folder where all systems, PRDs and specs will be created.${c.reset}`);
    console.log(`${c.yellow}  ⚠  If you skip this, files will be saved in the current directory: ${process.cwd()}${c.reset}`);
    console.log();

    const rawBase = await ask(rl, `  Documentation path ${c.gray}(press Enter to use current dir)${c.reset}: `);
    const basePath = normalizeBasePath(rawBase);

    if (!fs.existsSync(basePath.replace(/\\$/, ""))) {
      warn(`Path does not exist yet: ${basePath}`);
      warn("The agent will still work — create the folder before first use.");
    }

    // ── Confirm ──
    console.log();
    head("Ready to install");
    if (installOpencode) info(`opencode config:        ${OPENCODE_DIR}`);
    if (installQwen)     info(`Qwen Code config:       ${QWEN_DIR}`);
    if (installCopilot)  info(`GitHub Copilot config:  ${COPILOT_DIR}`);
    if (installClaude)   info(`Claude Code config:     ${CLAUDE_DIR}`);
    info(`projects base:          ${basePath}`);
    console.log();

    const confirm = await ask(rl, `  ${c.bold}Proceed?${c.reset} (Y/n) `);
    if (confirm.trim().toLowerCase() === "n") {
      info("Installation cancelled.");
      process.exit(0);
    }

    // ── Install skills (shared, one copy per platform) ──
    head("Installing skills...");
    if (installOpencode) installSkills(path.join(OPENCODE_DIR, "skills"));
    if (installQwen)     installSkills(path.join(QWEN_DIR, "skills"));
    if (installCopilot)  installSkills(path.join(COPILOT_DIR, "skills"));
    if (installClaude)   installSkills(path.join(CLAUDE_DIR, "skills"));

    // ── Install opencode ──
    if (installOpencode) {
      head("Installing for opencode...");
      installOpencodePrompts(basePath);
      installOpencodeCommands(basePath);
      patchOpencodeJson(basePath);
      installOpencodeSkillRegistry(basePath);
    }

    // ── Install Qwen Code ──
    if (installQwen) {
      head("Installing for Qwen Code...");
      installQwenPrompts(basePath);
      installQwenAgents(basePath);
    }

    // ── Install GitHub Copilot ──
    if (installCopilot) {
      head("Installing for GitHub Copilot...");
      installCopilotPrompts(basePath);
      installCopilotAgents(basePath);
    }

    // ── Install Claude Code ──
    if (installClaude) {
      head("Installing for Claude Code...");
      installClaudePrompts(basePath);
      installClaudeAgents(basePath);
      installClaudeSkillRegistry(basePath);
    }

    // ── Done ──
    console.log();
    console.log(`${c.bold}${c.green}  ✔ Installation complete!${c.reset}`);
    console.log();

    if (installOpencode) {
      console.log(`${c.bold}  opencode — available commands:${c.reset}`);
      console.log(`${c.gray}  ────────────────────────────────${c.reset}`);
      const cmds = [
        ["/arch <sistema>",      "Full documentation flow (4 steps)"],
        ["/rec <sistema>",       "Step 1 — Requirements elicitation"],
        ["/prd <sistema>",       "Step 2 — Product Requirements Document"],
        ["/tech <sistema>",      "Step 3 — Technical specification"],
        ["/pti <sistema>",       "Step 4 — Issues breakdown"],
        ["/mod <sistema> <mod>", "New module inside an evolutivo system"],
      ];
      for (const [cmd, desc] of cmds) {
        console.log(`  ${c.cyan}${cmd.padEnd(30)}${c.reset}${c.gray}${desc}${c.reset}`);
      }
      console.log(`\n${c.gray}  Restart opencode for changes to take effect.${c.reset}`);
      console.log();
    }

    if (installQwen) {
      console.log(`${c.bold}  Qwen Code — available agents:${c.reset}`);
      console.log(`${c.gray}  ────────────────────────────────${c.reset}`);
      const agents = [
        ["doc-arch", "Documentation orchestrator (start here)"],
        ["doc-rec",  "Requirements elicitation executor"],
        ["doc-prd",  "PRD generation executor"],
        ["doc-tech", "Technical specification executor"],
        ["doc-pti",  "Issues breakdown executor"],
      ];
      for (const [name, desc] of agents) {
        console.log(`  ${c.cyan}${name.padEnd(30)}${c.reset}${c.gray}${desc}${c.reset}`);
      }
      console.log(`\n${c.gray}  Restart Qwen Code for changes to take effect.${c.reset}`);
      console.log();
    }

    if (installCopilot) {
      console.log(`${c.bold}  GitHub Copilot — available agents:${c.reset}`);
      console.log(`${c.gray}  ────────────────────────────────${c.reset}`);
      const agents = [
        ["doc-arch", "Documentation orchestrator (start here — select in Chat)"],
        ["doc-rec",  "Requirements elicitation executor (delegated)"],
        ["doc-prd",  "PRD generation executor (delegated)"],
        ["doc-tech", "Technical specification executor (delegated)"],
        ["doc-pti",  "Issues breakdown executor (delegated)"],
      ];
      for (const [name, desc] of agents) {
        console.log(`  ${c.cyan}${name.padEnd(30)}${c.reset}${c.gray}${desc}${c.reset}`);
      }
      console.log(`\n${c.gray}  In VS Code: open GitHub Copilot Chat → select 'doc-arch' from the agents dropdown.${c.reset}`);
      console.log(`${c.gray}  Installed to: ${path.join(COPILOT_DIR, "agents")}${c.reset}`);
      console.log();
    }

    if (installClaude) {
      console.log(`${c.bold}  Claude Code — available agents:${c.reset}`);
      console.log(`${c.gray}  ────────────────────────────────${c.reset}`);
      const agents = [
        ["doc-arch", "Documentation orchestrator (start here)"],
        ["doc-rec",  "Requirements elicitation executor (delegated)"],
        ["doc-prd",  "PRD generation executor (delegated)"],
        ["doc-tech", "Technical specification executor (delegated)"],
        ["doc-pti",  "Issues breakdown executor (delegated)"],
      ];
      for (const [name, desc] of agents) {
        console.log(`  ${c.cyan}${name.padEnd(30)}${c.reset}${c.gray}${desc}${c.reset}`);
      }
      console.log(`\n${c.gray}  In Claude Code: type /doc-arch or select the agent from the agents list.${c.reset}`);
      console.log(`${c.gray}  Installed to: ${path.join(CLAUDE_DIR, "agents")}${c.reset}`);
      console.log();
    }

  } finally {
    rl.close();
  }
}

main().catch((e) => {
  err(`Unexpected error: ${e.message}`);
  process.exit(1);
});
