// Descripciones (texto del manual: Dominus Exxet / Core Exxet) de las
// habilidades de Ki y Némesis, indexadas por el `id` del catálogo KI_SKILLS.
//
// El generador buildKiNemesisJournal.mjs combina estas descripciones con el
// nombre/coste/árbol del catálogo para producir el compendio de Diario. Las
// habilidades sin entrada aquí salen con un marcador "Descripción pendiente".
//
// Condensadas a la mecánica funcional (se omiten los ejemplos narrativos largos).
// Acepta HTML simple (<p>, <ul>, <li>, <strong>, <em>...).

export const KI_SKILL_DESCRIPTIONS = {
  // ============================ HABILIDADES DEL KI ============================

  kiUse: `<p>Habilidad básica necesaria para desarrollar las demás. Permite al personaje despertar su energía interna y utilizarla inconscientemente.</p>`,

  kiControl: `<p>Otorga un control absoluto de la energía interna. El personaje es completamente consciente de su poder anímico y puede <strong>acumular su Ki</strong>. Una vez la domina, puede utilizar Técnicas de Dominio.</p>`,

  kiDetection: `<p>Detecta las energías de los seres del entorno: es consciente de que algo desprende energía cerca, aunque no puede determinar su forma, tamaño o intensidad. Penetra objetos sólidos y espacios cerrados, pero no lugares sellados con energía.</p>
<p>Cuenta como una habilidad secundaria especial: se calcula como la <strong>media entre el CM total y la habilidad de Advertir</strong>. Alcance según la dificultad conseguida:</p>
<ul><li>Rutinario: contacto físico.</li><li>Fácil: 1 m.</li><li>Media: 5 m.</li><li>Difícil: 10 m.</li><li>Muy Difícil: 20 m.</li><li>Absurdo: 50 m.</li><li>Casi Imposible: 100 m.</li><li>Imposible: 250 m.</li><li>Inhumano: 1 km (requiere Inhumanidad).</li><li>Zen: cientos de km (requiere Zen).</li></ul>`,

  erudition: `<p>Al realizar una detección, permite determinar la potencia y la forma de las energías percibidas: saber si alguien concentra Ki, si un adversario es especialmente fuerte, o reconocer el tipo de energía de un individuo concreto si se le busca específicamente.</p>`,

  combatAura: `<p>También llamada «instinto asesino». Más que una habilidad, es consecuencia del elevado poder espiritual del personaje: al exteriorizar su Presencia influye en quienes lo rodean aunque no perciban su energía (inquietud, miedo o parálisis).</p>
<p>Los afectados superan un control de RF usando solo su <strong>Presencia base</strong> (con el bono de Frialdad si la tienen). Dificultad = Presencia base + un bono según la suma de Acumulaciones: 6-8 +0, 9-10 +10, 11-13 +20, 14-16 +30, 17-22 +40, 23-27 +50, 28+ +60.</p>
<p>Según el nivel de fracaso: 0 a -19 <strong>Afectado</strong> (-10 a toda Acción); -20 a -49 <strong>Miedo</strong>; -50 a -99 <strong>Paralización</strong>; -100 o menos <strong>Desvanecimiento</strong>. No afecta a quien tenga Presencia ≤10 puntos inferior. Activarla es pasivo y gratuito; mantenerla cuesta 1 Ki genérico cada 5 Turnos. Radio en metros = Presencia/5.</p>`,

  physicalDomain: `<p>Fusiona energía y cuerpo: otorga un bono de <strong>+10 a la RF</strong> contra cualquier tipo de Daño.</p>`,

  physicalChange: `<p>Altera levemente la apariencia física (solo superficial). No cambia el sexo (solo aparentarlo) ni la altura más de 20 cm, ni la expresividad o forma de moverse (conviene combinar con Disfraz).</p>
<p>Percatarse requiere Advertir a Imposible, Buscar a Absurdo, o Detección del Ki a Difícil (a Absurdo se ve la forma real). Activar cuesta 10 Ki + 1 por minuto; mientras esté activa, -80 a la Ocultación del Ki.</p>`,

  superiorChange: `<p>Dominio absoluto del cambio: adoptar formas muy diferentes, aumentar dimensiones (hasta tamaño Grande) o reducir la altura a la mitad, e imitar formas no humanas sencillas o elementos inanimados. Coste de activación 20 Ki y mantenimiento 2 por minuto.</p>`,

  bodyMultiplication: `<p>Crea copias de sí mismo, imágenes residuales tangibles (trabajan, hablan, luchan) con su apariencia y equipo, pero sin cualidades especiales o místicas. Aplican <strong>-80 a toda Acción</strong> (-4 a Características). Las controla como Acción pasiva aun a distancia.</p>
<p>Crearlas es una Acción activa de un Turno completo (no puede hacer nada más, ni defenderse). Número = un tercio de Poder (redondeo abajo). Cada copia cuesta 4 Ki + 1 cada 5 asaltos. Una copia desaparece si pierde aunque sea 1 punto de vida; no obtiene Iniciativa mayor que su creador ni usa Técnicas/magia/psíquica (salvo Habilidades de Ki sin coste).</p>`,

  majorMultiplication: `<p>Mejora la Multiplicación de cuerpos: el coste baja a 2 Ki por copia y el número máximo simultáneo sube hasta un valor igual a Poder.</p>`,

  arcaneMultiplication: `<p>Máximo grado de la Multiplicación de cuerpos: el coste baja a 1 Ki por copia y el número máximo simultáneo sube hasta cinco veces Poder.</p>`,

  magnitude: `<p>Mejora la capacidad física de las copias: invirtiendo 3 Ki adicionales al formar una sombra, su penalizador a la Acción baja a <strong>-60</strong> (-3 a Características). Es voluntario; puede seguir creando copias sin Magnitud.</p>`,

  arcaneMagnitude: `<p>Igual que Magnitud, pero el penalizador de las sombras baja a <strong>-20</strong> (-1 a Características) invirtiendo 6 Ki adicionales al crearlas. Voluntario.</p>`,

  ageControl: `<p>Influye en el envejecimiento: envejece más lentamente y conserva sus capacidades físicas incluso de anciano. Incrementa 3-4 veces la esperanza de vida y reduce a la mitad los penalizadores físicos por edad avanzada.</p>`,

  techniqueImitation: `<p>Al presenciar o ser blanco de una Técnica, el personaje la domina de inmediato si tiene CM libre suficiente, añadiéndola a su repertorio. Coste: 10 CM menos que la original si es de 1er nivel, 20 menos de 2º, 30 menos de 3º. Las Técnicas copiadas no cuentan para el número total propio. No funciona con Técnicas que requieran Legados de Sangre.</p>`,

  forceTechniques: `<p>Incrementa los efectos de una Técnica invirtiendo más energía: hay que <strong>Acumular el doble de Ki</strong> de su coste original. Los efectos aumentan en la mitad de su valor (un +100 al ataque → +150; 5 Ataques Adicionales → 7; multiplicadores de Daño +1; RF +40). Se pueden forzar todas las Técnicas conocidas; las mantenidas solo en su momento inicial.</p>`,

  weightElimination: `<p>Afecta su masa corporal e ignora parcialmente la gravedad: durante un asalto completo puede correr por cualquier superficie (paredes, agua) hasta el máximo de su desplazamiento. Si no completa el recorrido, acaba hundiéndose. Invirtiendo 1 Ki genérico por asalto prolonga los efectos. Su peso real sigue igual a otros efectos (viento, golpes...).</p>`,

  levitation: `<p>Usa la energía física para elevarse y moverse por el aire. Cada nivel de Tipo de vuelo cuesta 1 Ki genérico. El máximo Tipo de vuelo es <strong>una cuarta parte</strong> del Tipo de movimiento (redondeo arriba). Mantenerse en el aire cuesta 1 Ki adicional por minuto.</p>`,

  objectMovement: `<p>Exterioriza su energía como prolongación del cuerpo para tocar y mover cosas a distancia. El objeto debe estar a la vista o tener una idea muy concreta de su posición. Cuesta 1 Ki por asalto por cada 5 kg de peso.</p>`,

  massMovement: `<p>Aumenta la masa que puede mover a distancia: el peso afectado sube a <strong>50 kg por Ki</strong> gastado, y puede controlar varios objetos en lugar de uno solo.</p>`,

  flight: `<p>Control completo de su masa: se mueve por el aire como por el suelo, alcanzando un Tipo de vuelo igual a su Movimiento (en lugar de un cuarto como en la Levitación). Cuesta 1 Ki genérico por cada Tipo de vuelo; mantenimiento 1 por minuto.</p>`,

  presenceExtrusion: `<p>Concentra el Ki como un aura invisible: puede tocar físicamente energía pura e intangibles (fuego, espectros, magia). Luchando con su cuerpo, daña a seres solo afectados por ataques sobrenaturales hasta <strong>el doble de su Presencia</strong> (presencia 50 → daña como arma mística de 100). También permite defenderse de efectos sobrenaturales con su habilidad de Parada.</p>`,

  energyArmor: `<p>Usa su aura como armadura espiritual contra efectos esotéricos y ataques de energía pura: concede una <strong>TA 2 natural contra Energía</strong>. Aunque cuenta como armadura, no aplica penalizadores al Turno por capas adicionales.</p>`,

  majorArmor: `<p>Aumenta la Armadura de energía hasta <strong>TA 4</strong>. Su activación no es innata: cuesta 1 Ki genérico cada 5 Turnos que se mantenga. Sin penalizadores al Turno por capas adicionales.</p>`,

  arcaneArmor: `<p>La Armadura contra Energía sube automáticamente a <strong>TA 4</strong> sin activación ni mantenimiento; puede subirla hasta TA 6 invirtiendo 1 Ki cada 5 asaltos. Sin penalizadores al Turno por capas adicionales.</p>`,

  weaponAuraExtension: `<p>Despliega energía a cualquier arma empuñada: el arma usa las Resistencias del personaje en lugar de las suyas, y extiende los poderes de Extrusión de presencia (dañar/detener energía como un artefacto místico). Aumenta <strong>+10 el Daño base</strong> del arma, +10 a su Resistencia y +5 a su rotura. También puede extenderse a la armadura.</p>`,

  elementalAttack: `<p>Dota a sus ataques de carácter elemental. Al adquirirla elige un elemento: Fuego, Aire, Agua, Tierra, Luz u Oscuridad (obligado a elegir el de su desequilibrio, si lo tiene). Fuego/Aire/Agua permiten usar como Crítico secundario Calor/Electricidad/Frío. Tierra permite atacar en la Tabla de Contundente como Crítico secundario con cualquier arma (si ya es Contundente primario, +10 al Daño base). Puede elegirse varias veces, especializándose en distintos elementos.</p>`,

  increasedDamage: `<p>Amplifica la potencia destructiva: <strong>+10 al Daño base</strong> del arma o ataque. Funciona también con proyectiles.</p>`,

  increasedReach: `<p>Agranda el tamaño efectivo de sus ataques: en Ataques en área, las armas duplican el número de blancos (Pequeñas 6, Medianas 8, Grandes 10 enemigos).</p>`,

  increasedSpeed: `<p>Usa el flujo de Ki para incrementar su velocidad y los movimientos de las armas: bono especial de <strong>+10 al Turno</strong>. Sirve también en combate desarmado.</p>`,

  kiDestruction: `<p>Proyecta su energía para destruir algo en contacto. Cuesta 1 Ki genérico: el objetivo supera una <strong>RF contra la Presencia base</strong> del personaje. Contra un ser vivo, causa daño = nivel de fracaso de la Resistencia. Contra un objeto inorgánico, si no lo supera por más de 40 queda destruido (o baja un grado de calidad). Cada Ki adicional suma +5 a la Resistencia a superar (hasta el doble de la presencia). Puede usar su habilidad de ataque para alcanzar físicamente al enemigo. Daña seres solo afectados por energía. Es un ataque: no se mantiene (se invierte Ki cada asalto).</p>`,

  energyAbsorption: `<p>Usa su energía interior como protección, absorbiendo Daño plenamente sobrenatural o energético (p.ej. una Descarga de Luz o una Técnica sobrenatural, pero NO un espadazo que solo dañe Energía). En lugar de perder vida, sacrifica 1 Ki genérico por cada 5 de Daño recibido. Es voluntario. No funciona contra Daños de efectos que obliguen a superar controles de Resistencia.</p>`,

  physicalShield: `<p>La energía residual actúa como escudo físico: los impactos sin la potencia necesaria rebotan sin causar Daño. Otorga una <strong>Barrera de Daño natural igual a su Presencia base</strong>.</p>`,

  kiTransmission: `<p>Transmite o absorbe Ki de otros. Dos individuos con esta habilidad intercambian puntos libremente (entre las mismas características de origen). El índice de transmisión por asalto es la acumulación de los personajes.</p>`,

  kiHealing: `<p>Cura <strong>2 puntos de vida por cada Ki genérico</strong> gastado, a sí mismo o a quien esté en contacto. Solo permite recuperar la mitad del Daño sufrido.</p>`,

  superiorHealing: `<p>Mejora la Curación por Ki: recupera <strong>5 puntos de vida por cada Ki genérico</strong>. Sigue sin poder recuperar más de la mitad del Daño recibido.</p>`,

  stabilize: `<p>Detiene desangramientos y saca a otros del estado de entre la vida y la muerte. Contra el desangramiento invierte 2-5 Ki genéricos según la gravedad. Para estabilizar a alguien con vida negativa, permite un nuevo control de Resistencia; cada 2 Ki adicionales dan +5 a la RF de ese control.</p>`,

  vitalSacrifice: `<p>Consume su fuerza vital para convertirla en energía física: por cada 2 puntos de vida sacrificados recupera 1 Ki de su reserva. Esos puntos cuentan como Sacrificio y se recuperan a un ritmo distinto al de otras heridas.</p>`,

  necessaryEnergyUse: `<p>Controla su energía para usar solo la cantidad requerida: <strong>multiplica por 10</strong> el tiempo que puede hacer trabajo físico/correr sin perder Cansancio (p.ej. 1 Cansancio cada 50 asaltos en vez de cada 5).</p>
<p>También permite forzar maniobras corporales gastando hasta 5 puntos de Cansancio por asalto (en vez de 2), pudiendo sumar +75 a una única acción o varios +15 a varias.</p>`,

  kiHiding: `<p>Oculta los rastros de su energía, invisible a Detección y Erudición del Ki. Cuenta como habilidad secundaria especial: media entre el CM total y Ocultarse. Quien intente localizarle con Detección hace un control enfrentado: la ocultación se resta de la detección. Acumular Ki resta 10 por cada punto empleado. También puede falsear la información de Erudición. Además, contra detecciones sobrenaturales suma la mitad de su Ocultación del Ki a la Resistencia.</p>`,

  hidingAura: `<p>Permite ocultar también el Ki de otros junto a él o en contacto, aplicando un penalizador: -40 en contacto directo, -120 a escasos metros. Cada individuo adicional añade -10. La tirada de ocultación es global (le incluye a él mismo).</p>`,

  fakeDeath: `<p>Entra en un estado de coma similar a la muerte: no se mueve pero es consciente del entorno. No respira, ni late su corazón, ni desprende energía. Descubrir que no está muerto requiere Medicina a Imposible. Recuperar el control del cuerpo al terminar requiere un Turno completo.</p>`,

  needElimination: `<p>Solo necesita comer, beber o dormir una décima parte de lo que requiere una persona normal.</p>`,

  fireImmunity: `<p>Inmunidad al calor: resistencia innata contra 5 intensidades de Fuego. Puede incrementarla invirtiendo 1 Ki genérico por cada intensidad superior a 5 (p.ej. 10 Ki para 15 intensidades), manteniéndolo cada asalto. Quien sea naturalmente vulnerable al fuego no puede elegirla.</p>`,

  coldImmunity: `<p>Inmunidad a bajas temperaturas: resistencia innata contra 5 intensidades de Frío. +1 Ki por intensidad superior a 5, manteniéndolo cada asalto. Quien sea vulnerable al frío no puede elegirla.</p>`,

  electricImmunity: `<p>Inmunidad a corrientes eléctricas: resistencia innata contra 5 intensidades de Electricidad. +1 Ki por intensidad superior a 5, manteniéndolo cada asalto. Quien sea vulnerable a la electricidad no puede elegirla.</p>`,

  penaltyElimination: `<p>Reduce a la mitad los penalizadores por cansancio o por críticos. No afecta a negativos por amputaciones u otros daños similares, ni a los de origen mágico o psíquico.</p>`,

  recovery: `<p>Usa Ki para recuperarse del agotamiento físico: 1 punto de Cansancio por cada 5 Ki genéricos. Solo 1 punto por turno.</p>`,

  restoreOthers: `<p>Permite usar Recuperación sobre otros individuos. El coste de Ki es el mismo y se mantiene el límite de 1 punto por asalto.</p>`,

  characteristicIncrease: `<p>Aumenta sus atributos físicos hasta <strong>3 grados</strong> sobre su valor original. Debe invertir tantos Ki como la cifra a alcanzar (del atributo que sube). Después pierde 1 Ki por asalto para mantenerla.</p>`,

  superiorIncrease: `<p>El Aumento de Características puede subir hasta <strong>4 puntos</strong> (en vez de 3). El coste de activación es el mismo, pero el mantenimiento baja a 1 Ki cada 10 asaltos.</p>`,

  improvisedCombatTechniques: `<p>Da acceso a la Tabla de creación de Técnicas improvisadas (explicadas en el Capítulo 5).</p>`,

  inhumanity: `<p>Permite realizar acciones físicas imposibles para otros humanos: alcanzar el nivel <strong>Inhumano</strong> en la Tabla de dificultades y sacar el máximo provecho de sus características.</p>`,

  zen: `<p>Estado de perfección completa entre cuerpo y alma. Actúa igual que la Inhumanidad, salvo que capacita al personaje para alcanzar la dificultad de <strong>Zen</strong> en sus controles y habilidades.</p>`,

  // ========================= HABILIDADES DEL NÉMESIS =========================

  nemesisUse: `<p>Base de todas las habilidades de vacío existencial y requisito previo para acceder al resto. Una vez adquirido, el personaje puede usar su CM para dominar otras habilidades del Némesis. El Némesis por sí solo no permite desarrollar Técnicas (sigue requiriendo Control del Ki).</p>`,

  voidArmor: `<p>Usa el Némesis como pantalla de vacío contra cualquier impacto: todos los ataques recibidos reducen automáticamente <strong>10 puntos su Daño base</strong>. Si el Daño llega a 0, no producen Daño alguno.</p>`,

  noht: `<p>Versión amplificada de la Armadura de vacío: amplía hasta <strong>-30</strong> el negativo al Daño base de cualquier ataque dirigido contra el personaje.</p>`,

  kiNullification: `<p>Genera un aura de frío espiritual que reduce las Acumulaciones de todos alrededor, según la suma de las Acumulaciones propias: 1-8 sin efecto, 9-12 -1, 13-16 -2, 17-20 -3, 21-24 -4, 25-27 -5, 28+ -6. Si una Acumulación afectada baja a 0, no puede usar Ki de esa Característica.</p>
<p>Activar es pasivo; cuesta 2 Ki por Turno (5 si se concentra en un único blanco). Afecta a aliados y enemigos por igual en el radio (Tabla de áreas, según Poder). No se superpone (solo el mayor). Compatible con otras anulaciones.</p>`,

  majorKiNullification: `<p>Como la Anulación de Ki, pero con mayor potencia (segunda columna de su tabla). Coste 5 Ki por Turno (10 sobre un único blanco). A máximo poder interfiere con las propias Acumulaciones, impidiendo realizar Técnicas de Ki.</p>`,

  magicNullification: `<p>Frío espiritual que interfiere las fibras de la magia: reduce el Zeon de los conjuros lanzados o activos en el radio (de -10 a -80 de Zeon, según las Acumulaciones). Si el potencial baja por debajo de su valor base de lanzamiento, el conjuro se anula; los mantenidos solo disminuyen sus efectos mientras dure (recuperan 1 Efecto por asalto al cesar).</p>
<p>Activar cuesta 2 Ki por Turno (5 sobre un único blanco). No se superpone. Un mago puede lanzar mientras la mantiene, con un negativo a la ACT igual al Zeon que reduce.</p>`,

  majorMagicNullification: `<p>Versión amplificada de la Anulación de Magia (segunda columna de su tabla, más Zeon anulado). Coste 5 Ki por asalto (10 sobre un único individuo).</p>`,

  matrixNullification: `<p>Frío espiritual que reduce el potencial de cualquier poder psíquico en el radio, innatos o usados ese asalto. Los mantenidos/innatos recuperan 10 puntos por asalto al cesar; los usados en el momento, si bajan de su valor base, no funcionan (sin Fatiga por ese fracaso). Activar cuesta 2 Ki por Turno (5 sobre un único blanco).</p>`,

  majorMatrixNullification: `<p>Versión amplificada de la Anulación de Matrices (segunda columna de su tabla). Coste 5 Ki por asalto (10 sobre un único blanco).</p>`,

  bondsNullification: `<p>Afecta la estructura de la existencia impidiendo las habilidades de convocatoria: en el área, cualquiera aplica un negativo a Convocar, Desconvocar, Atar y Controlar (según las Acumulaciones). No afecta a lazos o dominios creados con anterioridad, ni al control del convocador sobre sus criaturas.</p>`,

  voidExtrusion: `<p>Extiende el Némesis alrededor de sí: toca físicamente Energía (daña intangibles hasta el doble de su Presencia, detiene ataques inmateriales con la Parada). Además, todos sus ataques —aunque sean físicos— usan la <strong>Tabla de Energía y producen Daño por Frío</strong>. A su alrededor baja la temperatura y la luz se atenúa.</p>`,

  voidBody: `<p>Fusiona el Némesis con su cuerpo: <strong>+20 a todas sus Resistencias</strong> (físicas, mentales y mágicas), y deja de sufrir los efectos del desangramiento.</p>`,

  withoutNeeds: `<p>Carece absolutamente de cualquier necesidad física (comer, dormir). Un individuo adicto a la comida/bebida o con sueño profundo conserva la necesidad psicológica.</p>`,

  voidMovement: `<p>Se mueve a través de los bucles existenciales del Némesis: usa su <strong>Poder en lugar de Agilidad</strong> para su Tipo de Movimiento, y no requiere Inhumanidad/Zen para superar velocidad 10. Sus movimientos son extraños y caóticos; no sufre el -80 a Sigilo aunque se desplace al máximo.</p>`,

  voidForm: `<p>Sustituye su forma física por energía del Némesis, volviéndose un ente espectral: completamente intangible, solo dañable/detenible por ataques o cuerpos capaces de afectar Energía; sus golpes también se vuelven intangibles. Activarla cuesta 1 Ki + 1 cada 5 asaltos.</p>`,

  voidEssence: `<p>Se alimenta de la propia esencia de la nada: deja de sufrir penalizadores por dolor o cansancio, e ignora los negativos de Críticos que no produzcan verdaderas carencias físicas (miembros inutilizados o amputaciones).</p>`,

  oneWithNothingness: `<p>Su forma física y espiritual se funden con el Némesis: está más allá del dolor, el cansancio o el daño físico. Su energía mantiene su forma original anulando menoscabos (un brazo mutilado se mantiene; uno amputado se sustituye por energía funcional). Sobrevive mientras le queden la cabeza y algunos órganos vitales.</p>
<p>A efectos de juego, jamás recibe penalizador por causas físicas, ni siquiera por daños masivos; todos los Críticos se anulan salvo los dirigidos a puntos vulnerables. No funciona contra negativos de magia, poderes psíquicos, Magnus o Legados de Sangre.</p>`,

  voidAura: `<p>Exterioriza un frío existencial alrededor de sí: cualquier ser vivo que entre debe superar una <strong>RF contra el doble de su Presencia base</strong> o sufrir -20 a toda Acción. Quien la supere no repite hasta pasadas horas; quien falle reintenta cada 5 asaltos. No se superpone. Automática y voluntaria, sin coste.</p>`,

  undetection: `<p>El vacío que cubre su presencia lo hace muy difícil de percibir por medios sobrenaturales (mágicos, psíquicos o de Ki): obtiene un bono igual al <strong>doble de su Presencia</strong> a la RM y la RP contra detecciones mágicas/psíquicas, y quien use Detección del Ki para encontrarlo sufre un penalizador del mismo valor.</p>`,

  inhumanityNemesis: `<p>Permite realizar acciones físicas imposibles para otros humanos: alcanzar el nivel <strong>Inhumano</strong> en la Tabla de dificultades y sacar el máximo provecho de sus características.</p>`,

  zenNemesis: `<p>Estado de perfección completa entre cuerpo y alma. Actúa igual que la Inhumanidad, salvo que capacita al personaje para alcanzar la dificultad de <strong>Zen</strong> en sus controles y habilidades.</p>`
};
