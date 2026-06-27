import ABFFoundryRoll from '../../../rolls/ABFFoundryRoll.js';
import { openModDialog } from '../../../utils/dialogs/openSimpleInputDialog.js';
import { buildRollFormula } from '../../../combat/utils/buildRollFormula.js';
import { withstandPainReduction } from '../../../../utils/withstandPainReduction.js';

/**
 * "Resistir el dolor" usado EXPRESAMENTE para reducir penalizadores por dolor/
 * cansancio. Excepcion de la regla: la propia tirada NO sufre ese penalizador
 * (si lo sufriera seria pez que se muerde la cola). Consulta la Tabla 15 y FIJA la
 * reduccion (reemplaza la anterior, no acumula -> no se puede spamear).
 *
 * Una tirada normal de la secundaria (desde el panel) NO pasa por aqui y si sufre
 * el penalizador con normalidad.
 *
 * @param {object} actor
 */
export const resistPain = async actor => {
  if (!actor) return;

  const wp = actor.system?.secondaries?.vigor?.withstandPain;
  const wpBase = Number(wp?.base?.value) || 0;

  // Excepcion: la tirada de R.Dolor (al reducir) NO sufre el penalizador por DOLOR/
  // CANSANCIO ni por CARENCIAS FISICAS (ambos vienen de las mismas heridas que intenta
  // resistir); SI sufre el resto (otros base/special + lo que inyecten Active Effects
  // como Inconsciente/Desangrandose en allActions.final).
  // La secundaria es max(0, base + allActions.final) (mutateSecondariesData capa a 0).
  // Reconstruimos el valor SIN dolor/carencias desde el valor SIN CAPAR (wpBase +
  // allActions.final), NO desde wp.final: si la secundaria estaba capada a 0, sumar de
  // vuelta dolor+carencias sobre ese 0 sobreacreditaria la tirada.
  const allActions = actor.system?.general?.modifiers?.allActions ?? {};
  const allFinal = Number(allActions.final?.value) || 0; // total a la accion (con AEs)
  const painNet = Math.min(0, Number(allActions.painPenalty?.final?.value) || 0);
  const physLack = Math.min(0, Number(allActions.physicalLack?.final?.value) || 0);
  const wpClean = Math.max(0, wpBase + allFinal - painNet - physLack);

  const modRaw = await openModDialog({ title: 'Resistir el dolor' });
  if (modRaw === undefined || modRaw === null) return; // cancelar (X / Escape): no tirar
  const mod = Number(modRaw) || 0;

  const dice = actor.system.general.diceSettings;
  const die = wpBase >= 200 ? dice.abilityMasteryDie.value : dice.abilityDie.value;

  const roll = new ABFFoundryRoll(buildRollFormula(die, [wpClean, mod]), actor.system);
  await roll.evaluate({ async: true });

  const reduction = withstandPainReduction(roll.total);
  await actor.update({
    'system.general.modifiers.allActions.painReduction.value': reduction
  });

  const flavor =
    reduction > 0
      ? `Resistir el dolor (sin penalizadores) — cancela ${reduction} de penalizador por dolor/cansancio`
      : 'Resistir el dolor (sin penalizadores) — total < 80, sin reduccion';

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor
  });
};
