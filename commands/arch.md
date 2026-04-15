---
description: "Documenta un sistema completo en 4 pasos: rec → prd → tech → pti"
agent: doc-arch
---

Ejecuta el flujo completo de documentación para el sistema indicado.

El usuario invocó: `/arch $ARGUMENTS`

Sigue el protocolo `arch <sistema>` definido en tu skill:
1. Verifica/crea el directorio C:\Obsidian\$ARGUMENTS\
2. Crea el índice maestro si no existe
3. Ejecuta rec → prd → tech → pti en secuencia
4. Pausa entre cada paso para confirmación del usuario
5. Actualiza checkboxes del índice al completar cada fase
