---
description: "Paso 2 — Product Requirements Document para un sistema o módulo"
agent: doc-arch
---

Ejecuta el Paso 2 (PRD) para el sistema o módulo indicado.

El usuario invocó: `/prd $ARGUMENTS`

Delega al sub-agente doc-prd con el argumento: $ARGUMENTS

El argumento puede ser:
- `<sistema>` → PRD a nivel de sistema
- `<sistema>/<modulo>` → PRD a nivel de módulo
- `<sistema>/<modulo>/<submodulo>` → PRD a nivel de sub-módulo

Sigue el protocolo `prd` definido en tu skill para el nivel correspondiente.
Prerequisito: debe existir _requirements.md. Si no, indicar al usuario que ejecute /rec primero.
