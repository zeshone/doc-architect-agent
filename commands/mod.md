---
description: "Inicializa un módulo o sub-módulo dentro de un producto evolutivo"
agent: doc-arch
---

Inicializa un nuevo módulo y ejecuta su flujo completo de documentación (rec → prd → tech → pti).

El usuario invocó: `/mod $ARGUMENTS`

El argumento tiene dos formas:
- `<sistema> <modulo>` → crea modules\<modulo>\ dentro del sistema
- `<sistema>/<modulo> <submodulo>` → crea modules\<submodulo>\ dentro del módulo

Sigue el protocolo `mod` definido en tu skill:
1. Verifica que el sistema padre existe y es de arquetipo evolutivo
2. Crea el directorio del módulo en la ruta correcta
3. Crea el índice del módulo con enlace bidireccional al padre
4. Agrega el módulo al índice maestro del sistema
5. Ejecuta rec → prd → tech → pti en secuencia con pausa entre cada paso
