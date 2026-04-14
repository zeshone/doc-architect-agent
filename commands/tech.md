---
description: "Paso 3 — Especificación técnica para un sistema o módulo"
agent: doc-arch
---

Ejecuta el Paso 3 (Tech Spec) para el sistema o módulo indicado.

El usuario invocó: `/tech $ARGUMENTS`

Delega al sub-agente doc-tech con el argumento: $ARGUMENTS

El argumento puede ser:
- `<sistema>` → tech spec completo del sistema
- `<sistema>/<modulo>` → tech spec del módulo (delta o completo según arquitectura)
- `<sistema>/<modulo>/<submodulo>` → tech spec del sub-módulo

Sigue el protocolo `tech` definido en tu skill para el nivel correspondiente.
Prerequisito: debe existir _prd.md. Si no, indicar al usuario que ejecute /prd primero.
Si es módulo: preguntar siempre si hereda arquitectura del padre o diverge.
