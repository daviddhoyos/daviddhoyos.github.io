# Auditoría del portfolio — octubre 2026

Registro de lo revisado y cambiado, de mayor a menor impacto. Pensado para dos lectores: el recruiter que escanea en 30 segundos y el design hiring manager que lee con lupa.

## 1. Credibilidad y funcionalidad

| Cambio | Detalle |
|---|---|
| Links rotos | El "Next" de Edelap iba a `in-progress.html`. Cadena actual: PM → Fury → Conduiit → Edelap → Edge226 → Propelify → PM. |
| Bug en el footer de las 8 páginas | `class="ce-copy width=` tenía la comilla mal cerrada. Corregido. |
| 404 | `<base href="/">` para que funcione en rutas anidadas, y links a los cuatro casos. |
| Agencias | Se sacaron Loopstudio, QK Studio e Improving. Los casos muestran el trabajo como propio. |
| Datos de relleno en imágenes | Approval matrix de Conduiit, desktop y mobile: nombres y subtítulos de Game of Thrones ("Kahleesi + bunch of other stuff") reemplazados por datos de muestra de producción audiovisual. Purchase order: el campo "????" ahora dice "Amount". |

## 2. Home

- Hero: "Simple products for complex problems." Debajo: seis años para empresas de EE. UU., Canadá, Portugal y Latinoamérica.
- Casos en orden PM → Fury → Conduiit → Edelap. Los thumbnails muestran solo título, descripción y meta.
- More projects: la card entera es el link, con hover animado igual al "Read the case study" (subrayado, flecha y leve elevación). Respeta reduced-motion.
- Contacto: en desktop, clic en el email lo copia y "Write to me" abre el mail; en touch, el email abre el mail. Sin formulario: quien llega ya pidió el portfolio y prefiere escribir desde su correo.

## 3. Casos existentes

- Conduiit: bloque At a glance, spending limits, pre-audit checks y un "What I'd do differently".
- Conduiit, "From a color token to a full dashboard": estaciones de scroll iguales a las del home (`stations.js`). Un gesto avanza un paso (Tokens, Atoms, Molecules, Organisms, Screens) y se sale de forma nativa en el primero y en el último. Solo desktop con mouse o trackpad, y nunca con reduced motion.
- Conduiit, "The screens people work in every day": las pantallas altas van en un marco con la proporción de la approval matrix, ancladas arriba, sin achicarse y con lupa para verlas completas.
- Conduiit, mobile: solo dashboard y approval matrix.
- Fury: suma la versión modular para empresas externas y el uso de Gemini en discovery.
- Edelap: las métricas aclaran "in tests".
- Zoom de imágenes en todos los casos, salvo heroes, logos, íconos, scrolls internos y la sección interactiva "Each company can make it look like theirs".

## 4. Casos nuevos (desde los Figma)

**Edge226**
- Orden: resumen → negocio → modelo → antes/después → la idea (226 km = triatlón completo, de ahí Peak y las metáforas de cumbre) → trabajo con marketing → 5 iteraciones → 3 arquitecturas de información → color por sección → guía de estilos → sitio final con scroll → detalle → rebranding con las fotos de los stands → "still there today" → aprendizaje.
- Quedó fuera por calidad: el mega-menú (lorem ipsum, typos) y los bloques grises de Finance y Peak.

**Propelify**
- Orden: resumen → negocio → antes/después con benchmark (2.6 veces TechCrunch Disrupt) → la idea (el cohete) → audiencias → arquitectura de información → la tarea de la home → detalle → sitio final → tickets y formularios → señalética.
- Las homes desktop y mobile están curadas, sin las grillas de relleno (speakers repetidos, lorem ipsum, logos duplicados).
- Quedó fuera por calidad: los checkouts (typo, título duplicado, precios inconsistentes) y los eventos pasados (nombres de relleno).

## 5. Pendiente o para confirmar

- El logo de Azulo figura en "Companies I've worked with" pero no en el CV.
- El CV dice "with Figma and AI tools" para Edelap (2019–2021): puede leerse como anacronismo.
- Si conseguís la captura de web archive de Edge226 de 2021, puede reemplazar el frame "Actual" de Figma como "antes".
- SFR3 Vendor Dashboard está en el CV y no en el portfolio: candidato a More projects.
