/*
 * Public copy: it shows, it does not hand over the file.
 *
 * The simulator is the sales device - type a name, watch the beam draw it, read
 * the point count and the scan angle. None of that requires a projector, and
 * the people this page is written for do not own one.
 *
 * The one person for whom "export .ild" is worth a click is a competing
 * operator with his own head, and for him it is the whole product for free.
 * The page spends its length arguing that this took months; it cannot then put
 * the output on a public button.
 *
 * Honest about what this is: the engine runs in the visitor's browser, so this
 * raises the cost from one click to unpicking a minified bundle. That stops the
 * realistic case, not a determined one. Real protection would mean not shipping
 * the generator to the browser at all.
 */
(function () {
  const LABELS = [
    'Exportă .ild', 'Export .ild', 'Exportera .ild',
    'Exportă pentru laser', 'Export for laser', 'Exportera för laser',
    'Descarcă cele 5 probe', 'Download the 5 test patterns',
  ];
  const NOTE = 'Exportul pentru proiector se livrează la comandă, împreună cu showul.';

  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

  function disarm(el) {
    if (el.dataset.disarmed) return;
    el.dataset.disarmed = '1';
    el.hidden = true;
    el.disabled = true;
    el.removeAttribute('href');
    el.removeAttribute('download');

    const note = document.createElement('p');
    note.textContent = NOTE;
    note.style.cssText = 'margin:.6rem 0;opacity:.75;font-size:.9rem';
    el.parentNode && el.parentNode.insertBefore(note, el.nextSibling);
  }

  function sweep(root) {
    const nodes = (root || document).querySelectorAll('button, a, [role="button"]');
    for (const el of nodes) if (LABELS.includes(norm(el.textContent))) disarm(el);
  }

  /* Second layer: even a button we failed to match cannot deliver the file. */
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    const name = (this.getAttribute('download') || this.getAttribute('href') || '').toLowerCase();
    if (name.includes('.ild')) return;
    return click.apply(this, arguments);
  };

  addEventListener('DOMContentLoaded', () => {
    sweep();
    new MutationObserver(() => sweep()).observe(document.body, { childList: true, subtree: true });
  });
})();
