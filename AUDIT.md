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

## 6. Ronda de octubre: negocio y aprendizajes

- **Edge226.**
  - Árbol de arquitectura de información como el del Figma: tres pestañas (sitio original, primera propuesta, versión final), con las conexiones reales de cada nodo.
  - Hero y thumbnail con el diseño nuevo de Global Scale, animados como el resto. La extensión se creó en Figma ("global scale — extended") con las verticales y el CTA reales.
  - Home final con CTAs revisados en una copia del frame ("Home — final (portfolio, refined CTAs)"): primario blanco con violeta profundo, y secundario con contorno en lugar del botón amarillo.
- **Sección "The business" en Policy Manager, Fury, Conduiit y Edelap.**
  - Policy Manager: contratos largos y renovaciones.
  - Fury: gobierno de costos de cloud y la versión SaaS modular.
  - Conduiit: fundadores, modelo SaaS y competencia.
  - Edelap: por qué importa cobrar en la app propia.
- **Edge226:** por qué las verticales tienen su lugar en el menú.
- **Propelify:** el rol del festival para TechUnited:NJ, por qué la renovación era urgente, y el merchandising y los colores del sitio en el propio festival.
- **"What I missed" en los seis casos:**
  - Policy Manager: recordatorios para aprobadores.
  - Fury: una voz propia para toda la plataforma (mapeo completo y reglas compartidas de voz, terminología y patrones), para que se sienta un solo producto.
  - Conduiit: compromisos de las órdenes de compra en el reporte de costos.
  - Edelap: recordatorios y débito automático.
  - Edge226: resultados de clientes en cada página de vertical.
  - Propelify: una página de sponsors que venda, con audiencia, beneficios por nivel y razones para subir de tier.

- **Lente de Product Designer.** Cada sección "The business" cierra con lo que ese modelo significó para el diseño: Fury (el costo en el flujo de creación), Edelap (pagar en menos pasos que una billetera) y Propelify (cuatro decisiones, cuatro caminos).
- **Policy Manager:** la comparación de versiones se explica por lo que resuelve: el aprobador ve qué se eliminó (rojo) y qué se agregó (verde) entre dos versiones, y puede descargarlo como PDF. Título nuevo: "See exactly what changed between two versions".

## 7. Ronda de octubre: posicionamiento, logos y "Your call"

- **Hero.** (Revertido en la ronda siguiente a "Simple products for complex problems." / "Productos simples para problemas complejos.") Frase anterior: "I learn the field, then make the product simple." Ya no encasilla en lo complejo y la bajada muestra el rango: plataforma para desarrolladores, compliance, la app de una empresa de energía y la marca de un festival. Foto chica al lado del nombre. Meta description y JSON-LD actualizados.
- **Empresas.** Pasaron del footer al hero, en orden cronológico, y se sacó la banda vieja de fondo plano. Cada logo (salvo Azulo, sin datos todavía) muestra al pasar el cursor o tocarlo los años, el rol y los casos hechos ahí, con links. Une el CV (empresas) con el portfolio (productos).
- **Home.** Cada caso suma una línea de resultado y el tiempo de lectura. More projects suma el tiempo de lectura.
- **Next case.** Tiempo de lectura y una línea de por qué leerlo. Edelap decía "Next project": unificado.
- **Títulos.** Policy Manager: "Starting point", "Screen by screen", "Beyond the core flows" y "What happened next" pasaron a títulos que dicen la conclusión. Edge226 y Propelify: las secciones de la home final también. "2x, on Lens" ahora dice de dónde sale: ingeniería construyendo desde los prototipos.
- **"Your call" (archivo `engage.js`).** Un dilema real por caso, antes de la sección que lo resuelve: el lector elige y después ve qué hice y por qué. Sin puntajes ni respuestas correctas, se puede saltear y sin JS se lee como pregunta con respuesta. Si el lector habría elegido otra cosa, el cierre lo invita a contarlo con un mail con asunto prearmado.
- **Descartado de la propuesta de Google:** el botón "Simplificar" del hero (refuerza lo complejo y es una UI falsa), parallax con el mouse sobre dashboards, reveals con blur y cortinas en cada imagen (demoran el contenido y repiten la misma entrada en toda la página), el generador de mensajes del footer y el toast con emoji. Los thumbnails ya tienen movimiento y los links ya tienen flecha animada.

### Pendiente
- Azulo: falta saber años, rol y proyecto para sumarlo al índice de empresas.

## 7. Ronda de ajustes del hero y los casos

- **Hero del home.** Sin foto (el avatar queda solo en el footer), para que la imagen no pese en la lectura de seniority. Título vuelve a "Simple products for complex problems." / "Productos simples para problemas complejos.", también en meta description y og/twitter.
- **Empresas.** Logos estáticos: sin hover, sin botón, sin nota con casos. Opacidad fija en 0.62 (entre el 0.3 de "apagado" y el 1 del hover).
- **Lista de casos del home.** Se saca el texto repetido antes de "Read the case study". El encabezado de cada caso ahora lleva rubro y minutos: "Policy Manager · Compliance SaaS · 9 min read", "Mercado Libre · Internal developer platform", "Conduiit · Production finance SaaS", "Edelap · Mobile app, UX audit and redesign". En pantallas chicas queda encabezado + título.
- **Edge226.** Los dos banners ("Indoor event booth" y "Outdoor event") van en columnas iguales y con el mismo recorte. Before/after: se recortó la franja blanca del borde derecho y la banda blanca inferior del After; ambos quedan en 1440 x 752.
- **Heroes de los casos.** La animación ahora es un loop: baja, descansa, sube con la misma duración y curva, descansa, repite. Solo corre mientras el hero está en pantalla y nunca con reduced motion.
- **Propelify.** Hero y card de "More projects" animados como scroll de la home completa (desde `home_desktop.pdf`). Assets: `assets/propelify/pp-scroll-base-*.webp` y `pp-scroll-content-*.webp`.
