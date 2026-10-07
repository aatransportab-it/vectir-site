/*
 * WhatsApp links that also work inside Facebook and Instagram.
 *
 * Their in-app browsers load wa.me as a web page and then refuse the hand-off
 * to the WhatsApp app, so the tap seems to do nothing. Inside those browsers we
 * open the app's own scheme directly; elsewhere wa.me is left alone. If the app
 * still has not opened after a moment, the visitor is told how to get out of
 * the in-app browser instead of being left with a dead button.
 */
(function () {
  const ua = navigator.userAgent || '';
  const inApp = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger/i.test(ua);
  if (!inApp) return;

  function hint(phone) {
    if (document.getElementById('waHint')) return;
    const p = document.createElement('p');
    p.id = 'waHint';
    p.innerHTML = 'Dacă WhatsApp nu s-a deschis: apăsați ⋯ sus, apoi „Deschide în browser”, și încercați din nou.'
      + (phone ? ' Sau sunați direct: <a href="tel:+' + phone + '" style="color:#F0BE45">+40 741 447 101</a>' : '');
    p.style.cssText = 'position:fixed;left:1rem;right:1rem;bottom:calc(env(safe-area-inset-bottom,0px) + 5rem);z-index:20;'
      + 'margin:0;padding:.9rem 1rem;border-radius:8px;background:#111A2E;color:#EDF1F8;border:1px solid #F0BE45;'
      + 'font:500 .95rem Archivo,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5)';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 12000);
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="https://wa.me/"]');
    if (!a) return;
    const url = new URL(a.href);
    const phone = url.pathname.replace(/\//g, '');
    const text = url.searchParams.get('text') || '';
    const scheme = 'whatsapp://send?' + (phone ? 'phone=' + phone + '&' : '') + 'text=' + encodeURIComponent(text);
    e.preventDefault();
    // Sharing (no number in the link): the phone's own share sheet is the one
    // door Facebook's browser usually leaves open, and WhatsApp is on it.
    if (!phone && navigator.share) {
      navigator.share({ text }).catch(() => {});
      return;
    }
    let left = false;
    const away = () => { left = true; };
    document.addEventListener('visibilitychange', away, { once: true });
    window.addEventListener('pagehide', away, { once: true });
    location.href = scheme;
    setTimeout(() => { if (!left && document.visibilityState === 'visible') hint(phone); }, 1600);
  }, true);
})();
