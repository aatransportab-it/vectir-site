/*
 * The field is a lead, not a toy.
 *
 * A visitor who has just watched his own name drawn is the warmest he will ever
 * be. The button carries that exact name into the message, so the first thing we
 * read is what he wants to see on his wall.
 */
const WA = 'https://wa.me/40741447101?text=';
  const input = document.getElementById('oras');
  const go = document.getElementById('go');

  function sync() {
    const name = input.value.trim().slice(0, 40) || 'NUMELE ORAȘULUI SAU AL COMPANIEI';
    go.href = WA + encodeURIComponent(
      'Bună ziua. Aș vrea o previzualizare cu „' + name + '” proiectat.');
  }

  input.addEventListener('focus', () => input.select());
  input.addEventListener('input', sync);
  // Enter should send it, the way any single-field form behaves.
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { sync(); go.click(); } });
  sync();
