/*
 * WhatsApp links that also work inside Facebook and Instagram.
 *
 * Their in-app browsers on iOS block every hand-off to another app: wa.me,
 * the whatsapp:// scheme and the share sheet all do nothing there (tested on a
 * real phone, 7 Oct 2026). So inside those browsers a tap no longer pretends to
 * open WhatsApp. It copies the message - with the old textarea method, which
 * these webviews still allow - and shows a panel that says exactly what to do
 * next. For contact buttons the panel offers the number to call instead.
 * Ordinary browsers are left alone and open WhatsApp normally.
 */
(function () {
  const ua = navigator.userAgent || '';
  const inApp = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger/i.test(ua);
  if (!inApp) return;

  const PHONE_SHOWN = '+40 741 447 101';

  function copy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
    document.body.appendChild(ta);
    ta.focus();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove();
    if (!ok && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    return ok;
  }

  function panel(html) {
    const old = document.getElementById('waPanel'); if (old) old.remove();
    const d = document.createElement('div');
    d.id = 'waPanel';
    d.style.cssText = 'position:fixed;inset:0;z-index:50;background:rgba(5,7,15,.82);display:flex;align-items:flex-end;justify-content:center;padding:1rem';
    d.innerHTML = '<div style="width:100%;max-width:28rem;background:#111A2E;color:#EDF1F8;border:1px solid #F0BE45;border-radius:12px;'
      + 'padding:1.2rem 1.2rem 1rem;font:400 1rem/1.5 Archivo,system-ui,sans-serif;margin-bottom:env(safe-area-inset-bottom,0px)">'
      + html
      + '<button type="button" id="waClose" style="margin-top:1rem;width:100%;font:600 1rem Archivo,sans-serif;color:#17140A;background:#F0BE45;border:0;border-radius:999px;padding:.8rem">Am înțeles</button></div>';
    document.body.appendChild(d);
    d.addEventListener('click', (e) => { if (e.target === d || e.target.id === 'waClose') d.remove(); });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="https://wa.me/"]');
    if (!a) return;
    e.preventDefault();
    const url = new URL(a.href);
    const phone = url.pathname.replace(/\//g, '');
    const text = url.searchParams.get('text') || '';

    if (!phone) {
      const ok = copy(text);
      panel((ok
          ? '<p style="margin:0 0 .6rem"><b style="color:#F0BE45">✓ Mesajul e copiat.</b></p>'
            + '<p style="margin:0">Deschideți WhatsApp, alegeți conversația și <b>lipiți</b> mesajul (apăsați lung în câmpul de scris → Lipește).</p>'
          : '<p style="margin:0 0 .6rem">Facebook nu lasă paginile să deschidă WhatsApp. Copiați mesajul de mai jos și lipiți-l în WhatsApp:</p>')
        + '<p style="margin:.8rem 0 0;padding:.7rem;border-radius:8px;background:#0A0F1E;font-size:.9rem;user-select:all;-webkit-user-select:all;word-break:break-word">'
        + text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</p>');
    } else {
      panel('<p style="margin:0 0 .6rem">Facebook nu lasă paginile să deschidă WhatsApp.</p>'
        + '<p style="margin:0 0 .8rem">Ne găsiți direct la numărul:</p>'
        + '<a href="tel:+' + phone + '" style="display:block;text-align:center;font:600 1.3rem Archivo,sans-serif;color:#F0BE45;text-decoration:none;padding:.4rem 0">' + PHONE_SHOWN + '</a>'
        + '<p style="margin:.6rem 0 0;color:#8A94AB;font-size:.9rem">Apăsați pe număr ca să sunați, sau scrieți-ne pe WhatsApp la același număr. '
        + 'Pentru butoanele directe: ⋯ sus → „Deschide în browser”.</p>');
    }
  }, true);
})();
