---
description: "Paso 4 — Desglose en issues para un sistema o módulo"
agent: doc-arch
---

Ejecuta el Paso 4 (desglose en issues) para el sistema o módulo indicado.

El usuario invocó: `/pti $ARGUMENTS`

Delega al sub-agente doc-pti con el argumento: $ARGUMENTS

El argumento puede ser:
- `<sistema>` → issues del sistema
- `<sistema>/<modulo>` → issues del módulo
- `<sistema>/<modulo>/<submodulo>` → issues del sub-módulo

Sigue el protocolo `pti` definido en tu skill para el nivel correspondiente.
Prerequisito: debe existir _prd.md. Si no, indicar al usuario que ejecute /prd primero.
Los issues se generan como archivo .md local — NO crear en GitHub salvo que el usuario lo pida explícitamente.
