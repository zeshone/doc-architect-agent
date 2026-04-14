# doc-agent-ai

Documentation workflow agent for [opencode](https://opencode.ai). Guides you through 4 structured phases to document any software project — from initial idea to implementation-ready issues.

## Requirements

- [opencode](https://opencode.ai) installed and configured
- Node.js 18+

## Install

```bash
node install.js
```

The installer will ask for your **projects base path** — the root folder where your project documentation will live (e.g. `D:\Obsidian\MyVault\`).

## Uninstall

```bash
node uninstall.js
```

Your project documentation files are **not affected** by uninstall.

---

## Commands

Restart opencode after installing. Commands are available in the autocomplete.

### Full flow

```
/arch <sistema>
```

Runs all 4 phases in sequence with a confirmation pause between each one.

### Individual phases

| Command | Phase | Input |
|---------|-------|-------|
| `/rec <sistema>` | Requirements elicitation | — (interview) |
| `/prd <sistema>` | Product Requirements Document | `_requirements.md` |
| `/tech <sistema>` | Technical specification | `_prd.md` |
| `/pti <sistema>` | Issues breakdown | `_prd.md` |

### Modules (evolutivo systems only)

```
/mod <sistema> <modulo>           ← new module, full flow
/mod <sistema>/<modulo> <sub>     ← new sub-module, full flow

/rec <sistema>/<modulo>           ← individual phases for modules
/prd <sistema>/<modulo>
/tech <sistema>/<modulo>
/pti <sistema>/<modulo>
```

---

## File structure generated

```
<base-path>/
└── <sistema>/
    ├── <sistema>.md                    ← master index (Obsidian links + checkboxes)
    ├── <sistema>_requirements.md
    ├── <sistema>_prd.md
    ├── <sistema>_tech-spec.md
    ├── <sistema>_issues.md
    └── modules/
        └── <modulo>/
            ├── <modulo>.md
            ├── <modulo>_requirements.md
            ├── <modulo>_prd.md
            ├── <modulo>_tech-spec.md   ← delta (inherited) or full (diverging)
            ├── <modulo>_issues.md
            └── modules/
                └── <submodulo>/
                    └── ...
```

## System archetypes

Detected automatically during `/rec`:

| Archetype | Description |
|-----------|-------------|
| **Acotado** | Single delivery, no future evolution. Only issues for bugs. |
| **Evolutivo** | Long lifecycle. Grows with modules and sub-modules over time. |

## Guard rails

Every phase checks before executing:

1. System directory exists
2. Module directory exists *(if targeting a module)*
3. System is `evolutivo` type *(if targeting a module)*
4. Required prerequisite files exist
5. Parent tech-spec exists *(warning only, for module tech specs)*

If any check fails, the agent stops and tells you exactly which command to run next.
