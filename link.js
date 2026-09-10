const SIM = '/simulator/';
  const input = document.getElementById('oras');
  const go = document.getElementById('go');

  function sync() {
    const name = input.value.trim().slice(0, 40) || 'NUMELE ORAȘULUI SAU AL COMPANIEI';
    go.href = SIM + '?tur=' + encodeURIComponent(name);
  }

  input.addEventListener('focus', () => input.select());
  input.addEventListener('input', sync);
  // Enter should start it, the way any single-field form behaves.
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { sync(); go.click(); } });
  sync();
