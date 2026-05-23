/**
 * Toggle the editable state of every input inside a section (e.g. the whole
 * Ki Skills list or the whole Nemesis Skills list).
 *
 * The button lives in the section header; clicking it flips the `disabled`
 * attribute on every `<input>` and `<select>` inside the matching group-body,
 * and swaps the lock icon between closed / open.
 *
 * The lock state lives only in the DOM. As soon as the sheet re-renders
 * (any actor update will trigger this), the template recreates every row
 * in its default locked state. This is intentional: we want the user to
 * consciously unlock the section every time they need to edit canonical
 * names or CM costs.
 */
export function toggleAbilityLock(sheet, e) {
  const button = e.currentTarget;
  // The header is a sibling of group-body inside the same `group`.
  // Walk up to that group element and then collect its body's inputs.
  const group =
    button.closest('.common-group') ||
    button.closest('.group') ||
    button.parentElement?.parentElement;
  if (!group) return;

  const body = group.querySelector('.group-body');
  if (!body) return;

  const inputs = body.querySelectorAll('input, select');
  const wasLocked = button.classList.contains('locked');

  inputs.forEach(input => {
    input.disabled = wasLocked ? false : true;
    input.classList.toggle('disabled', !wasLocked);
  });

  button.classList.toggle('locked', !wasLocked);
  button.classList.toggle('unlocked', wasLocked);

  const icon = button.querySelector('i');
  if (icon) {
    icon.classList.toggle('fa-lock', !wasLocked);
    icon.classList.toggle('fa-lock-open', wasLocked);
  }

  e.stopPropagation();
}
