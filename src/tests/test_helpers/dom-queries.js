export function getDescriptionByTermEl(el) {
  let curEl = el;

  do {
    curEl = curEl.nextElementSibling;
  } while(curEl && curEl.tagName !== 'DD');

  if(curEl) {
    return curEl;
  } else {
    throw new Error('Could not find next DD element');
  }
}
