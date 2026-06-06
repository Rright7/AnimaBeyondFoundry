// GENERADO desde "Ficha Anima v8.7.0.xlsm" -> pestaña "Tablas Técnicas". No editar a mano.
// Regenerar con scripts/compendia/buildTechniqueEffectCatalog.py

export const EFFECT_CATALOG = [
  {
    id: "habilidad-de-ataque", name: "Habilidad de Ataque", category: "offensive",
    type: "action", class: "attack", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 2, "strength": 2, "power": 2, "willPower": 3}, elements: ["air", "fire", "dark"],
    tiers: [{ option: "+10", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+25", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+40", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+50", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+75", kiPrimary: 9, kiSecondary: 12, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+90", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 8, sMe: 16, sMa: 28, level: 1 }, { option: "+100", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 10, sMe: 20, sMa: 35, level: 1 }, { option: "+125", kiPrimary: 18, kiSecondary: 22, cm: 35, maint: 12, sMe: 24, sMa: 42, level: 2 }, { option: "+150", kiPrimary: 22, kiSecondary: 26, cm: 40, maint: 14, sMe: 28, sMa: 49, level: 2 }, { option: "+175", kiPrimary: 26, kiSecondary: 32, cm: 45, maint: 16, sMe: 32, sMa: 56, level: 3 }, { option: "+200", kiPrimary: 30, kiSecondary: 36, cm: 50, maint: 18, sMe: 36, sMa: 63, level: 3 }]
  },
  {
    id: "habilidad-de-ataque-completa", name: "Habilidad de Ataque Completa", category: "offensive",
    type: "round", class: "attack", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 2, "strength": 2, "power": 2, "willPower": 3}, elements: ["air", "fire", "dark"],
    tiers: [{ option: "+10", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+25", kiPrimary: 8, kiSecondary: 11, cm: 15, maint: 5, sMe: 10, sMa: 18, level: 1 }, { option: "+40", kiPrimary: 10, kiSecondary: 13, cm: 20, maint: 8, sMe: 16, sMa: 28, level: 1 }, { option: "+50", kiPrimary: 12, kiSecondary: 15, cm: 30, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "+75", kiPrimary: 18, kiSecondary: 22, cm: 50, maint: 14, sMe: 28, sMa: 49, level: 2 }, { option: "+90", kiPrimary: 24, kiSecondary: 29, cm: 60, maint: 18, sMe: 36, sMa: 63, level: 3 }, { option: "+100", kiPrimary: 28, kiSecondary: 32, cm: 70, maint: 20, sMe: 40, sMa: 70, level: 3 }]
  },
  {
    id: "ataque-predeterminado", name: "Ataque Predeterminado", category: "offensive",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"agility": 2, "dexterity": 2, "strength": 3, "willPower": 1}, elements: ["light", "dark", "earth"],
    tiers: [{ option: "Media (80)", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Difícil (120)", kiPrimary: 4, kiSecondary: 6, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Muy Difícil (140)", kiPrimary: 6, kiSecondary: 9, cm: 5, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "Absurdo (180)", kiPrimary: 8, kiSecondary: 11, cm: 10, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "Casi Imposible (240)", kiPrimary: 12, kiSecondary: 15, cm: 15, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "Imposible (280)", kiPrimary: 16, kiSecondary: 20, cm: 25, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "Inhumano (320)", kiPrimary: 20, kiSecondary: 24, cm: 35, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "Zen (440)", kiPrimary: 26, kiSecondary: 32, cm: 45, maint: 12, sMe: 24, sMa: 42, level: 3 }]
  },
  {
    id: "habilidad-de-contraataque", name: "Habilidad de Contraataque", category: "offensive",
    type: "action", class: "counter", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 2, "strength": 2, "power": 2, "willPower": 3}, elements: ["water", "air", "earth"],
    tiers: [{ option: "+10", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+25", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+40", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+50", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+75", kiPrimary: 6, kiSecondary: 9, cm: 15, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+90", kiPrimary: 9, kiSecondary: 12, cm: 20, maint: 8, sMe: 16, sMa: 28, level: 1 }, { option: "+100", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 10, sMe: 20, sMa: 35, level: 1 }, { option: "+125", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 12, sMe: 24, sMa: 42, level: 2 }, { option: "+150", kiPrimary: 18, kiSecondary: 22, cm: 35, maint: 14, sMe: 28, sMa: 49, level: 2 }, { option: "+175", kiPrimary: 22, kiSecondary: 26, cm: 40, maint: 16, sMe: 32, sMa: 56, level: 3 }, { option: "+200", kiPrimary: 26, kiSecondary: 32, cm: 45, maint: 18, sMe: 36, sMa: 63, level: 3 }]
  },
  {
    id: "maniobras-de-combate-y-apuntar", name: "Maniobras de Combate y Apuntar", category: "offensive",
    type: "action", class: "attack", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 1, "constitution": 2, "power": 2, "willPower": 2}, elements: ["air"],
    tiers: [{ option: "-10", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "-25", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "-50", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "-75", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 2 }, { option: "-100", kiPrimary: 6, kiSecondary: 9, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "-120", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 3 }]
  },
  {
    id: "maniobras-de-combate-y-apuntar-reales", name: "Maniobras de Combate y Apuntar Reales", category: "offensive",
    type: "round", class: "attack", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 1, "constitution": 2, "power": 2, "willPower": 2}, elements: ["air"],
    tiers: [{ option: "-10", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "-25", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "-50", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 2 }]
  },
  {
    id: "ataque-indirecto", name: "Ataque Indirecto", category: "offensive",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"agility": 2, "constitution": 2, "dexterity": 2, "willPower": 2}, elements: ["water", "air", "dark"],
    tiers: [{ option: "Nv 1", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Nv 2", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "Nv 3", kiPrimary: 9, kiSecondary: 12, cm: 30, maint: 6, sMe: 12, sMa: 21, level: 3 }]
  },
  {
    id: "camuflar-ataque", name: "Camuflar Ataque", category: "offensive",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"agility": 2, "constitution": 3, "dexterity": 1, "willPower": 2}, elements: ["water", "air", "dark"],
    tiers: [{ option: "Media (80)", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Difícil (120)", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Muy Difícil (140)", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Absurdo (180)", kiPrimary: 5, kiSecondary: 8, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Casi Imposible (240)", kiPrimary: 6, kiSecondary: 9, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "Imposible (280)", kiPrimary: 7, kiSecondary: 10, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "Inhumano (320)", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "Zen (440)", kiPrimary: 10, kiSecondary: 13, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 3 }]
  },
  {
    id: "habilidad-de-parada", name: "Habilidad de Parada", category: "defensive",
    type: "action", class: "defense", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 2, "strength": 2, "power": 2, "willPower": 3}, elements: ["water", "light", "earth"],
    tiers: [{ option: "+10", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+25", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+40", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+50", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+75", kiPrimary: 9, kiSecondary: 12, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+90", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 5, sMe: 10, sMa: 18, level: 1 }, { option: "+100", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 1 }, { option: "+125", kiPrimary: 18, kiSecondary: 22, cm: 35, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "+150", kiPrimary: 22, kiSecondary: 26, cm: 40, maint: 12, sMe: 24, sMa: 42, level: 2 }, { option: "+175", kiPrimary: 26, kiSecondary: 32, cm: 45, maint: 14, sMe: 28, sMa: 49, level: 3 }, { option: "+200", kiPrimary: 30, kiSecondary: 36, cm: 50, maint: 16, sMe: 32, sMa: 56, level: 3 }]
  },
  {
    id: "habilidad-de-parada-completa", name: "Habilidad de Parada Completa", category: "defensive",
    type: "round", class: "defense", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 2, "strength": 2, "power": 2, "willPower": 3}, elements: ["water", "light", "earth"],
    tiers: [{ option: "+10", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+25", kiPrimary: 6, kiSecondary: 9, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+40", kiPrimary: 9, kiSecondary: 12, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+50", kiPrimary: 12, kiSecondary: 15, cm: 35, maint: 9, sMe: 18, sMa: 32, level: 2 }, { option: "+75", kiPrimary: 18, kiSecondary: 22, cm: 50, maint: 12, sMe: 24, sMa: 42, level: 2 }, { option: "+90", kiPrimary: 26, kiSecondary: 32, cm: 65, maint: 15, sMe: 30, sMa: 53, level: 3 }, { option: "+100", kiPrimary: 30, kiSecondary: 36, cm: 75, maint: 18, sMe: 36, sMa: 63, level: 3 }]
  },
  {
    id: "habilidad-de-parada-limitada", name: "Habilidad de Parada Limitada", category: "defensive",
    type: "action", class: "defense", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 2, "strength": 2, "power": 2, "willPower": 3}, elements: ["water", "light", "earth"],
    tiers: [{ option: "+10", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+25", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+40", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+50", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+75", kiPrimary: 6, kiSecondary: 9, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+90", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+100", kiPrimary: 10, kiSecondary: 13, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+125", kiPrimary: 12, kiSecondary: 15, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "+150", kiPrimary: 16, kiSecondary: 20, cm: 35, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "+175", kiPrimary: 20, kiSecondary: 24, cm: 40, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "+200", kiPrimary: 24, kiSecondary: 29, cm: 45, maint: 14, sMe: 28, sMa: 49, level: 3 }]
  },
  {
    id: "habilidad-de-esquiva", name: "Habilidad de Esquiva", category: "defensive",
    type: "action", class: "defense", primaryCharacteristic: "agility",
    optionalCharacteristics: {"constitution": 2, "dexterity": 2, "power": 2, "willPower": 3}, elements: ["water", "air", "light"],
    tiers: [{ option: "+10", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+25", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+40", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+50", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+75", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+90", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 5, sMe: 10, sMa: 18, level: 1 }, { option: "+100", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 1 }, { option: "+125", kiPrimary: 18, kiSecondary: 22, cm: 35, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "+150", kiPrimary: 22, kiSecondary: 26, cm: 40, maint: 12, sMe: 24, sMa: 42, level: 2 }, { option: "+175", kiPrimary: 26, kiSecondary: 32, cm: 45, maint: 14, sMe: 28, sMa: 49, level: 3 }, { option: "+200", kiPrimary: 30, kiSecondary: 36, cm: 50, maint: 16, sMe: 32, sMa: 56, level: 3 }]
  },
  {
    id: "habilidad-de-esquiva-completa", name: "Habilidad de Esquiva Completa", category: "defensive",
    type: "round", class: "defense", primaryCharacteristic: "agility",
    optionalCharacteristics: {"constitution": 2, "dexterity": 2, "power": 2, "willPower": 3}, elements: ["water", "air", "light"],
    tiers: [{ option: "+10", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+25", kiPrimary: 6, kiSecondary: 9, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+40", kiPrimary: 9, kiSecondary: 12, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+50", kiPrimary: 12, kiSecondary: 15, cm: 35, maint: 9, sMe: 18, sMa: 32, level: 2 }, { option: "+75", kiPrimary: 18, kiSecondary: 22, cm: 50, maint: 12, sMe: 24, sMa: 42, level: 2 }, { option: "+90", kiPrimary: 26, kiSecondary: 32, cm: 65, maint: 15, sMe: 30, sMa: 53, level: 3 }, { option: "+100", kiPrimary: 30, kiSecondary: 36, cm: 75, maint: 18, sMe: 36, sMa: 63, level: 3 }]
  },
  {
    id: "habilidad-de-esquiva-limitada", name: "Habilidad de Esquiva Limitada", category: "defensive",
    type: "action", class: "defense", primaryCharacteristic: "agility",
    optionalCharacteristics: {"constitution": 2, "dexterity": 2, "power": 2, "willPower": 3}, elements: ["air", "light", "dark"],
    tiers: [{ option: "+10", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+25", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+40", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+50", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+75", kiPrimary: 6, kiSecondary: 9, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+90", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+100", kiPrimary: 10, kiSecondary: 13, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+125", kiPrimary: 12, kiSecondary: 15, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "+150", kiPrimary: 16, kiSecondary: 20, cm: 35, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "+175", kiPrimary: 20, kiSecondary: 24, cm: 40, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "+200", kiPrimary: 24, kiSecondary: 29, cm: 45, maint: 14, sMe: 28, sMa: 49, level: 3 }]
  },
  {
    id: "defensa-predeterminada", name: "Defensa Predeterminada", category: "defensive",
    type: "action", class: "defense", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 1, "constitution": 3, "power": 2, "willPower": 2}, elements: ["water", "light", "earth"],
    tiers: [{ option: "Media (80)", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Difícil (120)", kiPrimary: 4, kiSecondary: 6, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Muy Difícil (140)", kiPrimary: 6, kiSecondary: 9, cm: 5, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "Absurdo (180)", kiPrimary: 8, kiSecondary: 11, cm: 10, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "Casi Imposible (240)", kiPrimary: 12, kiSecondary: 15, cm: 15, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "Imposible (280)", kiPrimary: 16, kiSecondary: 20, cm: 25, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "Inhumano (320)", kiPrimary: 20, kiSecondary: 24, cm: 35, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "Zen (440)", kiPrimary: 26, kiSecondary: 32, cm: 45, maint: 12, sMe: 24, sMa: 42, level: 3 }]
  },
  {
    id: "aumento-de-dano", name: "Aumento de Daño", category: "destructive",
    type: "action", class: "attack", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 1, "dexterity": 3, "power": 2, "willPower": 1}, elements: ["fire", "earth"],
    tiers: [{ option: "+10", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+25", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+40", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+50", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+75", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+90", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+100", kiPrimary: 10, kiSecondary: 13, cm: 30, maint: 5, sMe: 10, sMa: 18, level: 1 }, { option: "+125", kiPrimary: 14, kiSecondary: 18, cm: 35, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "+150", kiPrimary: 16, kiSecondary: 20, cm: 40, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "+175", kiPrimary: 18, kiSecondary: 22, cm: 45, maint: 10, sMe: 20, sMa: 35, level: 3 }, { option: "+200", kiPrimary: 20, kiSecondary: 24, cm: 50, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "Sacrificio Vital", kiPrimary: 4, kiSecondary: 4, cm: 15, maint: 3, sMe: 6, sMa: 11, level: null }, { option: "Sacrificio Vital Doble", kiPrimary: 10, kiSecondary: 10, cm: 50, maint: 4, sMe: 8, sMa: 14, level: null }, { option: "Sacrificio de Salud", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 2, sMe: 4, sMa: 7, level: null }, { option: "Sacrificio de Características", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 2, sMe: 4, sMa: 7, level: null }, { option: "Daño Límite", kiPrimary: 12, kiSecondary: 12, cm: 30, maint: 4, sMe: 8, sMa: 14, level: null }]
  },
  {
    id: "aumento-de-dano-real", name: "Aumento de Daño Real", category: "destructive",
    type: "round", class: "attack", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 1, "dexterity": 3, "power": 2, "willPower": 2}, elements: ["fire", "earth"],
    tiers: [{ option: "+10", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+25", kiPrimary: 3, kiSecondary: 5, cm: 15, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+40", kiPrimary: 5, kiSecondary: 8, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+50", kiPrimary: 7, kiSecondary: 10, cm: 25, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "+75", kiPrimary: 10, kiSecondary: 13, cm: 35, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "+90", kiPrimary: 12, kiSecondary: 15, cm: 40, maint: 8, sMe: 16, sMa: 28, level: 3 }, { option: "+100", kiPrimary: 14, kiSecondary: 18, cm: 50, maint: 10, sMe: 20, sMa: 35, level: 3 }]
  },
  {
    id: "multiplicador-al-dano", name: "Multiplicador al Daño", category: "destructive",
    type: "action", class: "attack", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 2, "dexterity": 3, "power": 1, "willPower": 1}, elements: ["fire", "earth"],
    tiers: [{ option: "x2", kiPrimary: 10, kiSecondary: 15, cm: 25, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "x3", kiPrimary: 15, kiSecondary: 20, cm: 40, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "x4", kiPrimary: 20, kiSecondary: 30, cm: 80, maint: 12, sMe: 24, sMa: 42, level: 3 }]
  },
  {
    id: "multiplicador-al-dano-real", name: "Multiplicador al Daño Real", category: "destructive",
    type: "round", class: "attack", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 2, "dexterity": 3, "power": 1, "willPower": 1}, elements: ["fire", "earth"],
    tiers: [{ option: "x2", kiPrimary: 20, kiSecondary: 30, cm: 40, maint: 8, sMe: 16, sMa: 28, level: 1 }, { option: "x3", kiPrimary: 30, kiSecondary: 36, cm: 70, maint: 16, sMe: 32, sMa: 56, level: 2 }, { option: "x4", kiPrimary: 40, kiSecondary: 48, cm: 100, maint: 22, sMe: 44, sMa: 77, level: 3 }]
  },
  {
    id: "sustitucion-de-dano", name: "Sustitución de Daño", category: "destructive",
    type: "action", class: "attack", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 1, "dexterity": 3, "power": 2, "willPower": 2}, elements: ["fire", "earth"],
    tiers: [{ option: "50", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "100", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "120", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "150", kiPrimary: 7, kiSecondary: 10, cm: 20, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "180", kiPrimary: 9, kiSecondary: 12, cm: 25, maint: 7, sMe: 14, sMa: 25, level: 2 }, { option: "200", kiPrimary: 12, kiSecondary: 15, cm: 30, maint: 9, sMe: 18, sMa: 32, level: 3 }, { option: "250", kiPrimary: 15, kiSecondary: 19, cm: 35, maint: 12, sMe: 24, sMa: 42, level: 3 }]
  },
  {
    id: "sustitucion-de-dano-real", name: "Sustitución de Daño Real", category: "destructive",
    type: "round", class: "attack", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 1, "dexterity": 3, "power": 2, "willPower": 2}, elements: ["fire", "earth"],
    tiers: [{ option: "50", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "100", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 5, sMe: 10, sMa: 18, level: 1 }, { option: "120", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "150", kiPrimary: 12, kiSecondary: 15, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "180", kiPrimary: 15, kiSecondary: 19, cm: 40, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "200", kiPrimary: 18, kiSecondary: 22, cm: 50, maint: 12, sMe: 24, sMa: 42, level: 3 }]
  },
  {
    id: "ataque-adicional", name: "Ataque Adicional", category: "action",
    type: "action", class: "attack", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 2, "constitution": 1, "power": 3, "willPower": 3}, elements: ["water", "air"],
    tiers: [{ option: "+1", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+2", kiPrimary: 12, kiSecondary: 15, cm: 30, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+3", kiPrimary: 18, kiSecondary: 22, cm: 40, maint: 9, sMe: 18, sMa: 32, level: 1 }, { option: "+4", kiPrimary: 24, kiSecondary: 29, cm: 50, maint: 12, sMe: 24, sMa: 42, level: 2 }, { option: "+5", kiPrimary: 30, kiSecondary: 36, cm: 60, maint: 15, sMe: 30, sMa: 53, level: 3 }, { option: "Ataque Continuo", kiPrimary: 10, kiSecondary: 10, cm: 30, maint: 5, sMe: 10, sMa: 18, level: null }, { option: "Bono de Cansancio Añadido", kiPrimary: 6, kiSecondary: 6, cm: 20, maint: 2, sMe: 4, sMa: 7, level: null }, { option: "Combo: Hasta 2", kiPrimary: -3, kiSecondary: -3, cm: -10, maint: null, sMe: null, sMa: null, level: null }, { option: "Combo: 3+", kiPrimary: -6, kiSecondary: -6, cm: -20, maint: null, sMe: null, sMa: null, level: null }]
  },
  {
    id: "ataque-adicional-limitado", name: "Ataque Adicional Limitado", category: "action",
    type: "action", class: "attack", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 2, "constitution": 1, "power": 3, "willPower": 3}, elements: ["water", "air", "dark"],
    tiers: [{ option: "+1", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+2", kiPrimary: 6, kiSecondary: 9, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+3", kiPrimary: 9, kiSecondary: 12, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+4", kiPrimary: 12, kiSecondary: 15, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+5", kiPrimary: 15, kiSecondary: 19, cm: 30, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+6", kiPrimary: 18, kiSecondary: 22, cm: 40, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "+8", kiPrimary: 22, kiSecondary: 26, cm: 50, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "+10", kiPrimary: 26, kiSecondary: 32, cm: 60, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "Ataque Contínuo", kiPrimary: 10, kiSecondary: 10, cm: 30, maint: 5, sMe: 10, sMa: 18, level: null }]
  },
  {
    id: "defensas-adicionales", name: "Defensas Adicionales", category: "action",
    type: "action", class: "defense", primaryCharacteristic: "agility",
    optionalCharacteristics: {"constitution": 2, "dexterity": 1, "power": 3, "willPower": 3}, elements: ["light"],
    tiers: [{ option: "+1", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+2", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+3", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+4", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+6", kiPrimary: 5, kiSecondary: 8, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+8", kiPrimary: 6, kiSecondary: 9, cm: 25, maint: 8, sMe: 16, sMa: 28, level: 1 }, { option: "+10", kiPrimary: 7, kiSecondary: 10, cm: 30, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "Ilimitadas", kiPrimary: 8, kiSecondary: 11, cm: 35, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "Bono de Cansancio Añadido", kiPrimary: 6, kiSecondary: 6, cm: 20, maint: 2, sMe: 4, sMa: 7, level: null }]
  },
  {
    id: "acciones-adicionales", name: "Acciones Adicionales", category: "action",
    type: "round", class: "variable", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"agility": 1, "constitution": 1, "power": 3, "willPower": 2}, elements: ["air"],
    tiers: [{ option: "+1", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+2", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+3", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+4", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+5", kiPrimary: 5, kiSecondary: 8, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+6", kiPrimary: 6, kiSecondary: 9, cm: 25, maint: 8, sMe: 16, sMa: 28, level: 1 }, { option: "+8", kiPrimary: 7, kiSecondary: 10, cm: 30, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "+10", kiPrimary: 8, kiSecondary: 11, cm: 35, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "Bono de Cansancio Añadido", kiPrimary: 6, kiSecondary: 6, cm: 20, maint: 1, sMe: 2, sMa: 4, level: null }]
  },
  {
    id: "incrementar-turno", name: "Incrementar Turno", category: "reaction",
    type: "round", class: "variable", primaryCharacteristic: "agility",
    optionalCharacteristics: {"constitution": 2, "dexterity": 1, "power": 3, "willPower": 3}, elements: ["air"],
    tiers: [{ option: "+25", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+50", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+75", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+100", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+125", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "+150", kiPrimary: 10, kiSecondary: 13, cm: 30, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "+175", kiPrimary: 12, kiSecondary: 15, cm: 35, maint: 6, sMe: 12, sMa: 21, level: 3 }, { option: "+200", kiPrimary: 14, kiSecondary: 18, cm: 40, maint: 7, sMe: 14, sMa: 25, level: 3 }]
  },
  {
    id: "recuperar-accion", name: "Recuperar Acción", category: "reaction",
    type: "action", class: "variable", primaryCharacteristic: "willPower",
    optionalCharacteristics: {"agility": 2, "constitution": 2, "dexterity": 3, "power": 2}, elements: ["air", "light", "water"],
    tiers: []
  },
  {
    id: "prevision", name: "Previsión", category: "reaction",
    type: "round", class: "variable", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 2, "dexterity": 3, "strength": 1, "willPower": 1}, elements: ["air", "fire", "light"],
    tiers: [{ option: "A Mitad", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Completo", kiPrimary: 6, kiSecondary: 9, cm: 25, maint: 3, sMe: 6, sMa: 11, level: 1 }]
  },
  {
    id: "ataque-a-distancia", name: "Ataque a Distancia", category: "spatial",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"agility": 3, "constitution": 4, "dexterity": 2, "willPower": 1}, elements: ["water", "air", "fire"],
    tiers: [{ option: "5 metros", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "10 metros", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "20 metros", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "50 metros", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "100 metros", kiPrimary: 5, kiSecondary: 8, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "250 metros", kiPrimary: 6, kiSecondary: 9, cm: 25, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "500 metros", kiPrimary: 8, kiSecondary: 11, cm: 30, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "1 kilómetro", kiPrimary: 10, kiSecondary: 13, cm: 35, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "5 kilómetros", kiPrimary: 14, kiSecondary: 18, cm: 40, maint: 10, sMe: 20, sMa: 35, level: 3 }, { option: "10 kilómetros", kiPrimary: 18, kiSecondary: 22, cm: 45, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "100 kilómetros", kiPrimary: 22, kiSecondary: 26, cm: 50, maint: 14, sMe: 28, sMa: 49, level: 3 }, { option: "Proyección", kiPrimary: 4, kiSecondary: 4, cm: 10, maint: 1, sMe: 2, sMa: 4, level: null }, { option: "Estela de Destrucción", kiPrimary: 8, kiSecondary: 8, cm: 20, maint: 1, sMe: 2, sMa: 4, level: null }]
  },
  {
    id: "ataque-a-distancia-real", name: "Ataque a Distancia Real", category: "spatial",
    type: "round", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"agility": 3, "constitution": 4, "dexterity": 2, "willPower": 1}, elements: ["water", "air", "fire"],
    tiers: [{ option: "5 metros", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "10 metros", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "20 metros", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "50 metros", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 5, sMe: 10, sMa: 18, level: 1 }, { option: "100 metros", kiPrimary: 10, kiSecondary: 13, cm: 35, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "250 metros", kiPrimary: 12, kiSecondary: 15, cm: 45, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "500 metros", kiPrimary: 16, kiSecondary: 20, cm: 55, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "1 kilómetro", kiPrimary: 20, kiSecondary: 24, cm: 70, maint: 12, sMe: 24, sMa: 42, level: 3 }]
  },
  {
    id: "ataque-con-area", name: "Ataque con Área", category: "spatial",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"agility": 2, "constitution": 3, "dexterity": 2, "willPower": 1}, elements: ["fire", "light", "dark"],
    tiers: [{ option: "1 metro de radio", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "5 metros de radio", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "10 metros de radio", kiPrimary: 3, kiSecondary: 5, cm: 15, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "25 metros de radio", kiPrimary: 4, kiSecondary: 6, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "50 metros de radio", kiPrimary: 6, kiSecondary: 9, cm: 25, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "100 metros de radio", kiPrimary: 8, kiSecondary: 11, cm: 30, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "500 metros de radio", kiPrimary: 10, kiSecondary: 13, cm: 40, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "1 kilómetro de radio", kiPrimary: 12, kiSecondary: 15, cm: 50, maint: 8, sMe: 16, sMa: 28, level: 3 }, { option: "5 kilómetros de radio", kiPrimary: 16, kiSecondary: 20, cm: 60, maint: 10, sMe: 20, sMa: 35, level: 3 }, { option: "Elección de Blanco", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 1, sMe: 2, sMa: 4, level: null }]
  },
  {
    id: "ataque-con-area-real", name: "Ataque con Área Real", category: "spatial",
    type: "round", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"agility": 2, "constitution": 3, "dexterity": 2, "willPower": 1}, elements: ["fire", "light", "dark"],
    tiers: [{ option: "1 metro de radio", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 2, sMe: 4, sMa: 4, level: 1 }, { option: "5 metros de radio", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 3, sMe: 6, sMa: 6, level: 1 }, { option: "10 metros de radio", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 4, sMe: 8, sMa: 8, level: 1 }, { option: "25 metros de radio", kiPrimary: 8, kiSecondary: 11, cm: 30, maint: 5, sMe: 10, sMa: 10, level: 2 }, { option: "50 metros de radio", kiPrimary: 12, kiSecondary: 15, cm: 45, maint: 6, sMe: 12, sMa: 12, level: 2 }, { option: "100 metros de radio", kiPrimary: 16, kiSecondary: 20, cm: 65, maint: 8, sMe: 16, sMa: 16, level: 3 }, { option: "Elección de Blanco", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 1, sMe: 2, sMa: 4, level: null }]
  },
  {
    id: "parada-en-area", name: "Parada en Área", category: "spatial",
    type: "action", class: "defense", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 2, "dexterity": 2, "strength": 2, "willPower": 3}, elements: ["light", "earth", "water"],
    tiers: [{ option: "1 metro de radio", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "5 metros de radio", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "10 metros de radio", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "25 metros de radio", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "50 metros de radio", kiPrimary: 5, kiSecondary: 8, cm: 20, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "100 metros de radio", kiPrimary: 6, kiSecondary: 9, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "500 metros de radio", kiPrimary: 8, kiSecondary: 11, cm: 30, maint: 7, sMe: 14, sMa: 25, level: 3 }, { option: "1 kilómetro de radio", kiPrimary: 10, kiSecondary: 13, cm: 35, maint: 8, sMe: 16, sMa: 28, level: 3 }]
  },
  {
    id: "transporte-automatico", name: "Transporte Automático", category: "spatial",
    type: "action", class: "variable", primaryCharacteristic: "agility",
    optionalCharacteristics: {"constitution": 2, "dexterity": 2, "strength": 2, "power": 3}, elements: ["air", "light", "dark"],
    tiers: [{ option: "10 metros", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "20 metros", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "50 metros", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "100 metros", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "250 metros", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 5, sMe: 10, sMa: 18, level: 1 }, { option: "500 metros", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "1 kilómetro", kiPrimary: 10, kiSecondary: 13, cm: 30, maint: 7, sMe: 14, sMa: 25, level: 2 }, { option: "5 kilómetros", kiPrimary: 14, kiSecondary: 18, cm: 35, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "10 kilómetros", kiPrimary: 18, kiSecondary: 22, cm: 40, maint: 10, sMe: 20, sMa: 35, level: 3 }, { option: "100 kilómetros", kiPrimary: 22, kiSecondary: 26, cm: 50, maint: 12, sMe: 24, sMa: 42, level: 3 }]
  },
  {
    id: "aumentar-rotura", name: "Aumentar Rotura", category: "integrity",
    type: "round", class: "attack", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 2, "dexterity": 4, "power": 2, "willPower": 1}, elements: ["fire"],
    tiers: [{ option: "+5", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+10", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+15", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+20", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+25", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "+30", kiPrimary: 12, kiSecondary: 15, cm: 30, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "+35", kiPrimary: 14, kiSecondary: 18, cm: 35, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "+40", kiPrimary: 18, kiSecondary: 22, cm: 40, maint: 8, sMe: 16, sMa: 28, level: 3 }]
  },
  {
    id: "aumentar-entereza", name: "Aumentar Entereza", category: "integrity",
    type: "round", class: "defense", primaryCharacteristic: "constitution",
    optionalCharacteristics: {"strength": 2, "dexterity": 4, "power": 2, "willPower": 1}, elements: ["fire", "light", "earth"],
    tiers: [{ option: "+10", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+15", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+20", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+25", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+30", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "+35", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "+40", kiPrimary: 7, kiSecondary: 10, cm: 25, maint: 4, sMe: 8, sMa: 14, level: 3 }]
  },
  {
    id: "destruir-armadura", name: "Destruir Armadura", category: "integrity",
    type: "action", class: "attack", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 2, "dexterity": 2, "power": 1, "willPower": 2}, elements: ["fire", "dark"],
    tiers: [{ option: "-1 TA", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "-2 TA", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "-3 TA", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "-4 TA", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "-5 TA", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "-6 TA", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "-7 TA", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "-8 TA", kiPrimary: 10, kiSecondary: 13, cm: 30, maint: 5, sMe: 10, sMa: 18, level: 3 }, { option: "Sin Armadura", kiPrimary: 12, kiSecondary: 15, cm: 40, maint: 6, sMe: 12, sMa: 21, level: 3 }]
  },
  {
    id: "armadura", name: "Armadura", category: "integrity",
    type: "round", class: "defense", primaryCharacteristic: "constitution",
    optionalCharacteristics: {"agility": 3, "strength": 2, "power": 1, "willPower": 2}, elements: ["water", "light", "earth"],
    tiers: [{ option: "TA 1", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "TA 2", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "TA 3", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "TA 4", kiPrimary: 6, kiSecondary: 9, cm: 15, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "TA 5", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "TA 6", kiPrimary: 10, kiSecondary: 13, cm: 25, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "TA 7", kiPrimary: 12, kiSecondary: 15, cm: 30, maint: 4, sMe: 8, sMa: 14, level: 3 }, { option: "TA 8", kiPrimary: 14, kiSecondary: 18, cm: 40, maint: 5, sMe: 10, sMa: 18, level: 3 }, { option: "Inmodificable", kiPrimary: 4, kiSecondary: 4, cm: 15, maint: 2, sMe: 4, sMa: 7, level: null }, { option: "Física", kiPrimary: -1, kiSecondary: -1, cm: -5, maint: null, sMe: null, sMa: null, level: null }, { option: "Lentitud", kiPrimary: -1, kiSecondary: -1, cm: -10, maint: null, sMe: null, sMa: null, level: null }]
  },
  {
    id: "incremento-de-movimiento", name: "Incremento de Movimiento", category: "increment",
    type: "round", class: "variable", primaryCharacteristic: "agility",
    optionalCharacteristics: {"constitution": 1, "dexterity": 2, "power": 3, "willPower": 3}, elements: ["air", "fire", "light"],
    tiers: [{ option: "+1", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+2", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+3", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+4", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "+5", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 5, sMe: 10, sMa: 18, level: 3 }]
  },
  {
    id: "incremento-de-habilidad", name: "Incremento de Habilidad", category: "increment",
    type: "round", class: "variable", primaryCharacteristic: "constitution",
    optionalCharacteristics: {"agility": 2, "dexterity": 3, "power": 2, "willPower": 1}, elements: ["water", "earth", "light"],
    tiers: [{ option: "+25", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+50", kiPrimary: 4, kiSecondary: 6, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+75", kiPrimary: 6, kiSecondary: 9, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "+100", kiPrimary: 9, kiSecondary: 12, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "+125", kiPrimary: 12, kiSecondary: 15, cm: 20, maint: 5, sMe: 10, sMa: 18, level: 3 }, { option: "+150", kiPrimary: 15, kiSecondary: 19, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 3 }]
  },
  {
    id: "capacidad-incrementada-agi", name: "Capacidad Incrementada AGI", category: "increment",
    type: "action", class: "variable", primaryCharacteristic: "agility",
    optionalCharacteristics: {"constitution": 1, "power": 1, "willPower": 1}, elements: ["water", "fire", "dark"],
    tiers: [{ option: "+1", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+2", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+3", kiPrimary: 4, kiSecondary: 6, cm: 5, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+4", kiPrimary: 6, kiSecondary: 9, cm: 10, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+5", kiPrimary: 8, kiSecondary: 11, cm: 15, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "+6", kiPrimary: 10, kiSecondary: 13, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "+7", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 7, sMe: 14, sMa: 25, level: 3 }, { option: "+8", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 3 }]
  },
  {
    id: "capacidad-incrementada-fue", name: "Capacidad Incrementada FUE", category: "increment",
    type: "action", class: "variable", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 1, "power": 1, "willPower": 1}, elements: ["water", "fire", "dark"],
    tiers: [{ option: "+1", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+2", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+3", kiPrimary: 4, kiSecondary: 6, cm: 5, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+4", kiPrimary: 6, kiSecondary: 9, cm: 10, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+5", kiPrimary: 8, kiSecondary: 11, cm: 15, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "+6", kiPrimary: 10, kiSecondary: 13, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "+7", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 7, sMe: 14, sMa: 25, level: 3 }, { option: "+8", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 3 }]
  },
  {
    id: "capacidad-incrementada-des", name: "Capacidad Incrementada DES", category: "increment",
    type: "action", class: "variable", primaryCharacteristic: "dexterity",
    optionalCharacteristics: {"constitution": 1, "power": 1, "willPower": 1}, elements: ["water", "fire", "dark"],
    tiers: [{ option: "+1", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+2", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+3", kiPrimary: 4, kiSecondary: 6, cm: 5, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+4", kiPrimary: 6, kiSecondary: 9, cm: 10, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+5", kiPrimary: 8, kiSecondary: 11, cm: 15, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "+6", kiPrimary: 10, kiSecondary: 13, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "+7", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 7, sMe: 14, sMa: 25, level: 3 }, { option: "+8", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 3 }]
  },
  {
    id: "incremento-de-resistencia-fisica", name: "Incremento de Resistencia Física", category: "increment",
    type: "round", class: "variable", primaryCharacteristic: "constitution",
    optionalCharacteristics: {"dexterity": 3, "strength": 2, "power": 1, "willPower": 1}, elements: ["water", "light", "earth"],
    tiers: [{ option: "+10 RF", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+20 RF", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+30 RF", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+40 RF", kiPrimary: 6, kiSecondary: 9, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+50 RF", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "+60 RF", kiPrimary: 10, kiSecondary: 13, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "+80 RF", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 7, sMe: 14, sMa: 25, level: 3 }, { option: "+100 RF", kiPrimary: 18, kiSecondary: 22, cm: 40, maint: 8, sMe: 16, sMa: 28, level: 3 }, { option: "Incremento también a RE", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: 1, sMe: 2, sMa: 4, level: null }, { option: "Incremento también a RV", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: 1, sMe: 2, sMa: 4, level: null }]
  },
  {
    id: "incremento-de-resistencia-magica", name: "Incremento de Resistencia Mágica", category: "increment",
    type: "round", class: "variable", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 2, "dexterity": 3, "strength": 2, "willPower": 1}, elements: ["air", "fire", "light"],
    tiers: [{ option: "+10 RM", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+20 RM", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+30 RM", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+40 RM", kiPrimary: 6, kiSecondary: 9, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+50 RM", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "+60 RM", kiPrimary: 10, kiSecondary: 13, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "+80 RM", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 7, sMe: 14, sMa: 25, level: 3 }, { option: "+100 RM", kiPrimary: 18, kiSecondary: 22, cm: 40, maint: 8, sMe: 16, sMa: 28, level: 3 }]
  },
  {
    id: "incremento-de-resistencia-psiquica", name: "Incremento de Resistencia Psíquica", category: "increment",
    type: "round", class: "variable", primaryCharacteristic: "willPower",
    optionalCharacteristics: {"constitution": 2, "dexterity": 3, "strength": 2, "power": 1}, elements: ["air", "water", "light"],
    tiers: [{ option: "+10 RP", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+20 RP", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+30 RP", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+40 RP", kiPrimary: 6, kiSecondary: 9, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+50 RP", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "+60 RP", kiPrimary: 10, kiSecondary: 13, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "+80 RP", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 7, sMe: 14, sMa: 25, level: 3 }, { option: "+100 RP", kiPrimary: 18, kiSecondary: 22, cm: 40, maint: 8, sMe: 16, sMa: 28, level: 3 }]
  },
  {
    id: "habilidades-perceptivas", name: "Habilidades Perceptivas", category: "increment",
    type: "round", class: "variable", primaryCharacteristic: "power",
    optionalCharacteristics: {"agility": 4, "constitution": 4, "dexterity": 4, "willPower": 1}, elements: ["water", "air", "light"],
    tiers: [{ option: "Visión Nocturna", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Visión Radial", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Visión Espiritual", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Visión de Magia", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Visión de Matrices", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Ver lo Sobrenatural", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Ver Realmente", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 2, sMe: 4, sMa: 7, level: 2 }]
  },
  {
    id: "ataque-capaz-de-danar-energia", name: "Ataque capaz de Dañar Energía", category: "varied",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 2, "dexterity": 3, "strength": 3, "willPower": 1}, elements: ["fire", "light", "dark"],
    tiers: []
  },
  {
    id: "ataque-elemental", name: "Ataque Elemental", category: "varied",
    type: "round", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 2, "dexterity": 3, "strength": 3, "willPower": 1}, elements: [],
    tiers: [{ option: "Aire", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Agua", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Fuego", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Tierra", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Luz", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Oscuridad", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }]
  },
  {
    id: "armas-fisicas-de-ki", name: "Armas Físicas de Ki", category: "varied",
    type: "round", class: "variable", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 1, "dexterity": 3, "strength": 2, "willPower": 1}, elements: ["light", "dark", "earth"],
    tiers: [{ option: "+0", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+5", kiPrimary: 4, kiSecondary: 6, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+10", kiPrimary: 6, kiSecondary: 9, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+15", kiPrimary: 8, kiSecondary: 11, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "+20", kiPrimary: 10, kiSecondary: 13, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 3 }, { option: "Arma de Proyectil", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 1, sMe: 2, sMa: 4, level: null }, { option: "1 Arma Adicional", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: 1, sMe: 2, sMa: 4, level: null }, { option: "De 2 a 3 Armas Adicionales", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 2, sMe: 4, sMa: 7, level: null }, { option: "De 4 a 10 Armas Adicionales", kiPrimary: 4, kiSecondary: 4, cm: 15, maint: 3, sMe: 6, sMa: 11, level: null }, { option: "Armas Adicionales Ilimitadas", kiPrimary: 6, kiSecondary: 6, cm: 20, maint: 4, sMe: 8, sMa: 14, level: null }]
  },
  {
    id: "ataque-sobrenatural", name: "Ataque Sobrenatural", category: "varied",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 2, "dexterity": 3, "strength": 3, "willPower": 1}, elements: ["light", "dark"],
    tiers: []
  },
  {
    id: "absorcion-de-ki", name: "Absorción de Ki", category: "varied",
    type: "action", class: "defense", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 3, "dexterity": 4, "strength": 3, "willPower": 1}, elements: ["water", "air", "earth"],
    tiers: [{ option: "Hasta 5 Ki", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Hasta 10 Ki", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Hasta 15 Ki", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "Hasta 20 Ki", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "Hasta 25 Ki", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "Sin Límite", kiPrimary: 10, kiSecondary: 13, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 3 }]
  },
  {
    id: "apresamiento", name: "Apresamiento", category: "varied",
    type: "action", class: "attack", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 2, "dexterity": 1, "power": 2, "willPower": 2}, elements: ["earth"],
    tiers: [{ option: "FUE 4", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "FUE 6", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "FUE 8", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "FUE 10", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "FUE 12", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 5, sMe: 10, sMa: 18, level: 1 }, { option: "FUE 14", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "FUE 16", kiPrimary: 10, kiSecondary: 13, cm: 30, maint: 7, sMe: 14, sMa: 25, level: 2 }, { option: "FUE 18", kiPrimary: 14, kiSecondary: 18, cm: 35, maint: 8, sMe: 16, sMa: 28, level: 3 }, { option: "FUE 20", kiPrimary: 18, kiSecondary: 22, cm: 40, maint: 10, sMe: 20, sMa: 35, level: 3 }, { option: "Presa Existencial", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: 1, sMe: 2, sMa: 4, level: null }]
  },
  {
    id: "choque-fisico", name: "Choque Físico", category: "varied",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 1, "dexterity": 3, "strength": 1, "willPower": 1}, elements: ["water", "light", "earth"],
    tiers: []
  },
  {
    id: "acumulacion", name: "Acumulación", category: "varied",
    type: "round", class: "defense", primaryCharacteristic: "constitution",
    optionalCharacteristics: {"dexterity": 3, "strength": 3, "power": 3, "willPower": 1}, elements: ["earth"],
    tiers: [{ option: "100 PV", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "200 PV", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "300 PV", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "400 PV", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "600 PV", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "800 PV", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 5, sMe: 10, sMa: 18, level: 1 }, { option: "1.000 PV", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "1.200 PV", kiPrimary: 18, kiSecondary: 22, cm: 35, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "1.500 PV", kiPrimary: 22, kiSecondary: 26, cm: 40, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "Regeneración 100", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: 1, sMe: 2, sMa: 4, level: null }, { option: "Regeneración 250", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 2, sMe: 4, sMa: 7, level: null }, { option: "Regeneración 500", kiPrimary: 4, kiSecondary: 4, cm: 15, maint: 3, sMe: 6, sMa: 11, level: null }]
  },
  {
    id: "espejismo", name: "Espejismo", category: "varied",
    type: "round", class: "variable", primaryCharacteristic: "willPower",
    optionalCharacteristics: {"agility": 2, "dexterity": 3, "constitution": 3, "power": 1}, elements: ["water", "dark"],
    tiers: [{ option: "1 Imagen", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "2 Imágenes", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "4 Imágenes", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "6 Imágenes", kiPrimary: 6, kiSecondary: 9, cm: 10, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "10 Imágenes", kiPrimary: 8, kiSecondary: 11, cm: 15, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "15 Imágenes", kiPrimary: 10, kiSecondary: 13, cm: 20, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "20 Imágenes", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "25 Imágenes", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "Indetección Media (80)", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Indetección Difícil (120)", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Indetección Muy Difícil (140)", kiPrimary: 3, kiSecondary: 3, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Indetección Absurdo (180)", kiPrimary: 4, kiSecondary: 4, cm: 15, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Indetección Casi Imposible (240)", kiPrimary: 5, kiSecondary: 5, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "Indetección Imposible (280)", kiPrimary: 6, kiSecondary: 6, cm: 20, maint: 3, sMe: 6, sMa: 11, level: 2 }, { option: "Indetección Inhumano (320)", kiPrimary: 7, kiSecondary: 7, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "Indetección Zen (440)", kiPrimary: 8, kiSecondary: 8, cm: 30, maint: 4, sMe: 8, sMa: 14, level: 3 }, { option: "Modificación de Aspecto", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Ilusión Fantasmal RP 140", kiPrimary: 3, kiSecondary: 3, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Ilusión Fantasmal RP 180", kiPrimary: 4, kiSecondary: 4, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "Ilusión Fantasmal RP 240", kiPrimary: 6, kiSecondary: 6, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }]
  },
  {
    id: "escudo-de-energia", name: "Escudo de Energía", category: "varied",
    type: "round", class: "defense", primaryCharacteristic: "power",
    optionalCharacteristics: {"agility": 3, "constitution": 2, "dexterity": 3, "strength": 2}, elements: ["water", "light"],
    tiers: [{ option: "100 PV", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "200 PV", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "300 PV", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "400 PV", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "500 PV", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "800 PV", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "1.000 PV", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "1.250 PV", kiPrimary: 18, kiSecondary: 22, cm: 35, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "1.500 PV", kiPrimary: 22, kiSecondary: 26, cm: 40, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "2.000 PV", kiPrimary: 26, kiSecondary: 32, cm: 45, maint: 14, sMe: 28, sMa: 49, level: 3 }, { option: "Regeneración 100", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: 1, sMe: 2, sMa: 4, level: null }, { option: "Regeneración 250", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 2, sMe: 4, sMa: 7, level: null }, { option: "Regeneración 500", kiPrimary: 4, kiSecondary: 4, cm: 15, maint: 3, sMe: 6, sMa: 11, level: null }]
  },
  {
    id: "estados-sobrenaturales", name: "Estados Sobrenaturales", category: "varied",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 4, "dexterity": 4, "strength": 4, "willPower": 1}, elements: ["light", "dark"],
    tiers: [{ option: "RF 40", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "RF 60", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "RF 80", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "RF 100", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "RF 120", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "RF 140", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 5, sMe: 10, sMa: 18, level: 2 }, { option: "RF 160", kiPrimary: 14, kiSecondary: 18, cm: 35, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "RF 180", kiPrimary: 20, kiSecondary: 24, cm: 50, maint: 8, sMe: 16, sMa: 28, level: 3 }, { option: "RF 200", kiPrimary: 28, kiSecondary: 32, cm: 80, maint: 10, sMe: 20, sMa: 35, level: 3 }, { option: "Estado añadido: Ceguera", kiPrimary: 6, kiSecondary: 6, cm: 15, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Coma", kiPrimary: 14, kiSecondary: 14, cm: 40, maint: null, sMe: null, sMa: null, level: 2 }, { option: "Estado añadido: Control", kiPrimary: 14, kiSecondary: 14, cm: 40, maint: null, sMe: null, sMa: null, level: 2 }, { option: "Estado añadido: Daño", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Doble Daño", kiPrimary: 5, kiSecondary: 5, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Dolor", kiPrimary: 3, kiSecondary: 3, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Dolor Extremo", kiPrimary: 6, kiSecondary: 6, cm: 15, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Drenaje de Vida", kiPrimary: 8, kiSecondary: 8, cm: 15, maint: null, sMe: null, sMa: null, level: 2 }, { option: "Estado añadido: Drenaje de Ki", kiPrimary: 8, kiSecondary: 8, cm: 20, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Fascinación", kiPrimary: 6, kiSecondary: 6, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Ilusión", kiPrimary: 7, kiSecondary: 7, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Ilusión Fantasmal", kiPrimary: 11, kiSecondary: 11, cm: 20, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Ilusión Mayor", kiPrimary: 9, kiSecondary: 9, cm: 15, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Inconsciencia", kiPrimary: 12, kiSecondary: 12, cm: 35, maint: null, sMe: null, sMa: null, level: 2 }, { option: "Estado añadido: Miedo", kiPrimary: 3, kiSecondary: 3, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Muerte", kiPrimary: 20, kiSecondary: 20, cm: 50, maint: null, sMe: null, sMa: null, level: 3 }, { option: "Estado añadido: Paralización Parcial", kiPrimary: 6, kiSecondary: 6, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Paralización Total", kiPrimary: 12, kiSecondary: 12, cm: 20, maint: null, sMe: null, sMa: null, level: 2 }, { option: "Estado añadido: Pen. a la Acción Mayor", kiPrimary: 4, kiSecondary: 4, cm: 5, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Pen. a la Acción Menor", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Reducción de Car.", kiPrimary: 5, kiSecondary: 5, cm: 15, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Reducción de una Car.", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Reducción de RF", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Reducción de RP", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Estado añadido: Terror", kiPrimary: 6, kiSecondary: 6, cm: 15, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Condición: Conseguir dar un ataque", kiPrimary: 0, kiSecondary: 0, cm: 0, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Condición: Conseguir dar un Beso", kiPrimary: 1, kiSecondary: 1, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Condición: Contacto Físico", kiPrimary: 2, kiSecondary: 2, cm: 5, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Condición: Contacto Visual Mutuo", kiPrimary: 8, kiSecondary: 8, cm: 15, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Condición: Contacto Visual (Un Blanco)", kiPrimary: 12, kiSecondary: 12, cm: 30, maint: null, sMe: null, sMa: null, level: 2 }, { option: "Condición: Contacto Visual (Varios)", kiPrimary: 16, kiSecondary: 16, cm: 40, maint: null, sMe: null, sMa: null, level: 3 }, { option: "Condición: Por el Aire", kiPrimary: 20, kiSecondary: 20, cm: 50, maint: null, sMe: null, sMa: null, level: 3 }, { option: "Condición: Por Sonido (Un Blanco)", kiPrimary: 13, kiSecondary: 13, cm: 35, maint: null, sMe: null, sMa: null, level: 2 }, { option: "Condición: Por Sonido (Varios Blancos)", kiPrimary: 18, kiSecondary: 18, cm: 45, maint: null, sMe: null, sMa: null, level: 3 }, { option: "Condición: Por Superficie", kiPrimary: 12, kiSecondary: 12, cm: 30, maint: null, sMe: null, sMa: null, level: 2 }, { option: "Condición: Por Toda Superficie", kiPrimary: 18, kiSecondary: 18, cm: 45, maint: null, sMe: null, sMa: null, level: 3 }, { option: "Distancia: 1 metro", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Distancia: 5 metros", kiPrimary: 3, kiSecondary: 3, cm: 5, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Distancia: 10 metros", kiPrimary: 5, kiSecondary: 5, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Distancia: 25 metros", kiPrimary: 8, kiSecondary: 8, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Distancia: 50 metros", kiPrimary: 12, kiSecondary: 12, cm: 15, maint: null, sMe: null, sMa: null, level: 2 }, { option: "Distancia: 100 metros", kiPrimary: 15, kiSecondary: 15, cm: 20, maint: null, sMe: null, sMa: null, level: 2 }, { option: "Distancia: 150 metros", kiPrimary: 20, kiSecondary: 20, cm: 25, maint: null, sMe: null, sMa: null, level: 3 }, { option: "Distancia: 500 metros", kiPrimary: 25, kiSecondary: 25, cm: 30, maint: null, sMe: null, sMa: null, level: 3 }]
  },
  {
    id: "impacto", name: "Impacto", category: "varied",
    type: "action", class: "attack", primaryCharacteristic: "strength",
    optionalCharacteristics: {"constitution": 2, "dexterity": 3, "power": 1, "willPower": 1}, elements: ["fire", "earth"],
    tiers: [{ option: "FUE 4", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "FUE 6", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "FUE 8", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "FUE 10", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "FUE 12", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 5, sMe: 10, sMa: 18, level: 1 }, { option: "FUE 14", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "FUE 16", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 7, sMe: 14, sMa: 25, level: 2 }, { option: "FUE 18", kiPrimary: 10, kiSecondary: 13, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 3 }, { option: "FUE 20", kiPrimary: 12, kiSecondary: 15, cm: 35, maint: 10, sMe: 20, sMa: 35, level: 3 }, { option: "Atraer", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }]
  },
  {
    id: "interrupcion", name: "Interrupción", category: "varied",
    type: "action", class: "attack", primaryCharacteristic: "willPower",
    optionalCharacteristics: {"constitution": 3, "dexterity": 3, "strength": 2, "power": 1}, elements: ["water", "air", "light"],
    tiers: [{ option: "RF = Daño", kiPrimary: 1, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "RF = Daño +20", kiPrimary: 2, kiSecondary: 4, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "RF = Daño +40", kiPrimary: 4, kiSecondary: 6, cm: 15, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "RF = Daño +60", kiPrimary: 6, kiSecondary: 9, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "RF = Daño +80", kiPrimary: 8, kiSecondary: 11, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 2 }, { option: "RF = Daño +100", kiPrimary: 12, kiSecondary: 15, cm: 30, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "RF = Daño +120", kiPrimary: 16, kiSecondary: 20, cm: 35, maint: 10, sMe: 20, sMa: 35, level: 3 }, { option: "Interrumpe Ki", kiPrimary: 2, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Interrumpe Magia", kiPrimary: 2, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Interrumpe Psíquica", kiPrimary: 2, kiSecondary: 2, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }]
  },
  {
    id: "intangibilidad", name: "Intangibilidad", category: "varied",
    type: "round", class: "variable", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 3, "dexterity": 3, "strength": 3, "willPower": 1}, elements: ["water", "light", "dark"],
    tiers: [{ option: "Presencia Simple", kiPrimary: 1, kiSecondary: 1, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "Presencia Extendida", kiPrimary: 3, kiSecondary: 3, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Fusión", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }]
  },
  {
    id: "marca", name: "Marca", category: "varied",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 2, "dexterity": 3, "strength": 3, "willPower": 1}, elements: ["air", "light", "dark"],
    tiers: [{ option: "Menor", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Mayor", kiPrimary: 10, kiSecondary: 13, cm: 25, maint: 4, sMe: 8, sMa: 14, level: 2 }, { option: "Permanencia Prolongada", kiPrimary: 4, kiSecondary: 4, cm: 10, maint: null, sMe: null, sMa: null, level: 1 }, { option: "Permanencia Eterna", kiPrimary: 10, kiSecondary: 10, cm: 30, maint: 2, sMe: 4, sMa: 7, level: 1 }]
  },
  {
    id: "potenciar-critico", name: "Potenciar Crítico", category: "varied",
    type: "action", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 2, "dexterity": 2, "strength": 1, "willPower": 1}, elements: ["fire", "earth"],
    tiers: [{ option: "+10", kiPrimary: 2, kiSecondary: 4, cm: 5, maint: 1, sMe: 2, sMa: 4, level: 1 }, { option: "+25", kiPrimary: 3, kiSecondary: 5, cm: 5, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+40", kiPrimary: 4, kiSecondary: 6, cm: 10, maint: 3, sMe: 6, sMa: 11, level: 1 }, { option: "+50", kiPrimary: 5, kiSecondary: 8, cm: 15, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+75", kiPrimary: 8, kiSecondary: 11, cm: 20, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+90", kiPrimary: 12, kiSecondary: 15, cm: 25, maint: 8, sMe: 16, sMa: 28, level: 1 }, { option: "+100", kiPrimary: 14, kiSecondary: 18, cm: 30, maint: 10, sMe: 20, sMa: 35, level: 1 }, { option: "+125", kiPrimary: 18, kiSecondary: 22, cm: 35, maint: 12, sMe: 24, sMa: 42, level: 2 }, { option: "+150", kiPrimary: 22, kiSecondary: 26, cm: 40, maint: 14, sMe: 28, sMa: 49, level: 2 }, { option: "+175", kiPrimary: 26, kiSecondary: 32, cm: 45, maint: 16, sMe: 32, sMa: 56, level: 3 }, { option: "+200", kiPrimary: 30, kiSecondary: 36, cm: 50, maint: 18, sMe: 36, sMa: 63, level: 3 }, { option: "Crítico Automático", kiPrimary: 8, kiSecondary: 8, cm: 30, maint: 4, sMe: 8, sMa: 14, level: 1 }]
  },
  {
    id: "potenciar-critico-real", name: "Potenciar Crítico Real", category: "varied",
    type: "round", class: "attack", primaryCharacteristic: "power",
    optionalCharacteristics: {"constitution": 2, "dexterity": 2, "strength": 1, "willPower": 1}, elements: ["fire", "earth"],
    tiers: [{ option: "+10", kiPrimary: 3, kiSecondary: 5, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "+25", kiPrimary: 5, kiSecondary: 8, cm: 20, maint: 4, sMe: 8, sMa: 14, level: 1 }, { option: "+40", kiPrimary: 7, kiSecondary: 9, cm: 25, maint: 6, sMe: 12, sMa: 21, level: 1 }, { option: "+50", kiPrimary: 9, kiSecondary: 12, cm: 35, maint: 8, sMe: 16, sMa: 28, level: 2 }, { option: "+75", kiPrimary: 12, kiSecondary: 15, cm: 50, maint: 10, sMe: 20, sMa: 35, level: 2 }, { option: "+90", kiPrimary: 16, kiSecondary: 20, cm: 60, maint: 12, sMe: 24, sMa: 42, level: 3 }, { option: "+100", kiPrimary: 18, kiSecondary: 22, cm: 65, maint: 14, sMe: 28, sMa: 49, level: 3 }, { option: "Crítico Automático", kiPrimary: 8, kiSecondary: 8, cm: 30, maint: 4, sMe: 8, sMa: 14, level: 1 }]
  },
  {
    id: "reflectar-el-ataque", name: "Reflectar el Ataque", category: "varied",
    type: "action", class: "defense", primaryCharacteristic: "power",
    optionalCharacteristics: {"agility": 3, "dexterity": 3, "strength": 3, "willPower": 1}, elements: ["water", "light", "dark"],
    tiers: [{ option: "Elección de Blanco", kiPrimary: 2, kiSecondary: 2, cm: 10, maint: 2, sMe: 4, sMa: 7, level: 1 }, { option: "Reflectar Habilidades Esotéricas", kiPrimary: 4, kiSecondary: 4, cm: 20, maint: 1, sMe: 2, sMa: 4, level: 1 }]
  },
];

export const DISADVANTAGE_CATALOG = [
  {
    id: "agotamiento", name: "Agotamiento", class: "any",
    options: [{ option: "-2 Cansancio", cmReduction: -5, level: 1 }, { option: "-4 Cansancio", cmReduction: -10, level: 1 }, { option: "-6 Cansancio", cmReduction: -15, level: 2 }]
  },
  {
    id: "atadura-elemental", name: "Atadura Elemental", class: "any",
    options: [{ option: "A Un Elemento", cmReduction: -15, level: 1 }, { option: "A Dos Elementos", cmReduction: -10, level: 1 }]
  },
  {
    id: "ataque-especializado", name: "Ataque Especializado", class: "attack",
    options: [{ option: "Parada", cmReduction: -10, level: 1 }, { option: "Esquiva", cmReduction: -10, level: 1 }, { option: "Acumulación", cmReduction: -10, level: 1 }]
  },
  {
    id: "atada-a-un-arma", name: "Atada A Un Arma", class: "any",
    options: [{ option: "Genérica", cmReduction: -5, level: 1 }, { option: "Única", cmReduction: -10, level: 1 }]
  },
  {
    id: "circunstancia-limite", name: "Circunstancia Límite", class: "any",
    options: [{ option: "Mitad de PV", cmReduction: -10, level: 1 }, { option: "Una 1/4 de PV", cmReduction: -15, level: 1 }, { option: "PV Negativos", cmReduction: -25, level: 2 }, { option: "Recibir Daño", cmReduction: -10, level: 1 }]
  },
  {
    id: "circunstancia-de-combate", name: "Circunstancia De Combate", class: "attack",
    options: [{ option: "Circunstancia De Combate", cmReduction: -5, level: 1 }]
  },
  {
    id: "compleja", name: "Compleja", class: "any",
    options: [{ option: "Compleja", cmReduction: -5, level: 2 }]
  },
  {
    id: "condicion", name: "Condición", class: "any",
    options: [{ option: "Desenvainar", cmReduction: -5, level: 1 }, { option: "En Vuelo", cmReduction: -5, level: 1 }, { option: "En Carga", cmReduction: -5, level: 1 }, { option: "Montado", cmReduction: -5, level: 1 }, { option: "Diurno", cmReduction: -10, level: 1 }, { option: "Nocturno", cmReduction: -10, level: 1 }, { option: "Terreno Determinado", cmReduction: -10, level: 1 }, { option: "Un Momento Concreto", cmReduction: -20, level: 2 }]
  },
  {
    id: "dano-reducido", name: "Daño Reducido", class: "attack",
    options: [{ option: "Ningún Daño", cmReduction: -20, level: 1 }, { option: "Mitad de Daño", cmReduction: -10, level: 1 }]
  },
  {
    id: "defensa-especializada", name: "Defensa Especializada", class: "defense",
    options: [{ option: "Físicos", cmReduction: -5, level: 1 }, { option: "Proyectiles", cmReduction: -10, level: 1 }, { option: "Técnicas Ki", cmReduction: -10, level: 1 }, { option: "Conjuros", cmReduction: -15, level: 1 }, { option: "Psíquica", cmReduction: -15, level: 1 }]
  },
  {
    id: "exterminador", name: "Exterminador", class: "attack",
    options: [{ option: "Seres Humanoides", cmReduction: -5, level: 1 }, { option: "Una Clase de Ser", cmReduction: -10, level: 1 }, { option: "Un Ser Determinado", cmReduction: -30, level: 2 }]
  },
  {
    id: "exceso-de-energia", name: "Exceso De Energía", class: "any",
    options: [{ option: "Exceso De Energía", cmReduction: -15, level: 1 }]
  },
  {
    id: "perdida-del-arma", name: "Pérdida Del Arma", class: "any",
    options: [{ option: "Pérdida Del Arma", cmReduction: -10, level: 1 }]
  },
  {
    id: "penalizador-a-toda-accion", name: "Penalizador A Toda Acción", class: "any",
    options: [{ option: "-50", cmReduction: -10, level: 1 }, { option: "-75", cmReduction: -15, level: 1 }, { option: "-100", cmReduction: -20, level: 2 }, { option: "-125", cmReduction: -25, level: 2 }, { option: "-150", cmReduction: -30, level: 3 }]
  },
  {
    id: "predeterminacion", name: "Predeterminación", class: "any",
    options: [{ option: "Predeterminación", cmReduction: -20, level: 2 }]
  },
  {
    id: "preparacion-previa", name: "Preparación Previa", class: "any",
    options: [{ option: "1 minuto", cmReduction: -10, level: 1 }, { option: "1 hora", cmReduction: -15, level: 1 }, { option: "1 día", cmReduction: -25, level: 2 }]
  },
  {
    id: "requerimientos-elementales", name: "Requerimientos Elementales", class: "any",
    options: [{ option: "Intensidad Menor", cmReduction: -5, level: 1 }, { option: "Intensidad Mayor", cmReduction: -10, level: 1 }]
  },
  {
    id: "sacrificio", name: "Sacrificio", class: "any",
    options: [{ option: "-25 PV", cmReduction: -5, level: 1 }, { option: "-50 PV", cmReduction: -10, level: 1 }, { option: "-75 PV", cmReduction: -15, level: 2 }, { option: "-100 PV", cmReduction: -20, level: 2 }, { option: "Completo", cmReduction: -25, level: 3 }]
  },
  {
    id: "sacrificio-de-caracteristicas", name: "Sacrificio De Características", class: "any",
    options: [{ option: "AGI", cmReduction: -30, level: 1 }, { option: "CON", cmReduction: -30, level: 1 }, { option: "DES", cmReduction: -30, level: 1 }, { option: "FUE", cmReduction: -30, level: 1 }, { option: "INT", cmReduction: -30, level: 1 }, { option: "PER", cmReduction: -30, level: 1 }, { option: "POD", cmReduction: -30, level: 1 }, { option: "VOL", cmReduction: -30, level: 1 }]
  },
  {
    id: "sin-defensa", name: "Sin Defensa", class: "attack",
    options: [{ option: "Sin Defensa", cmReduction: -15, level: 1 }]
  },
  {
    id: "sobrecarga", name: "Sobrecarga", class: "any",
    options: [{ option: "Espera de 5 asaltos", cmReduction: -5, level: 1 }, { option: "Espera de 20 asaltos", cmReduction: -10, level: 1 }]
  },
  {
    id: "tecnica-final", name: "Técnica Final", class: "any",
    options: [{ option: "Técnica Final", cmReduction: -55, level: 2 }]
  },
  {
    id: "tecnica-mantenida", name: "Técnica Mantenida", class: "any",
    options: [{ option: "Nv 1", cmReduction: -5, level: 1 }, { option: "Nv 2", cmReduction: -10, level: 2 }, { option: "Nv 3", cmReduction: -15, level: 3 }]
  },
  {
    id: "usos-limitados", name: "Usos Limitados", class: "any",
    options: [{ option: "20 Usos", cmReduction: -10, level: 1 }, { option: "10 Usos", cmReduction: -20, level: 1 }, { option: "5 Usos", cmReduction: -25, level: 2 }, { option: "3 Usos", cmReduction: -30, level: 2 }, { option: "1 Uso", cmReduction: -40, level: 3 }]
  },
];
