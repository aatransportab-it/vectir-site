# Generates the inner pages. One page per question a town hall actually types into Google.
# Run: python _build_pages.py   (writes <slug>/index.html, robots.txt, sitemap.xml)
import json, os

SITE = "https://vectir.ro"
TODAY = "2026-10-06"

NAV = [
    ("/iluminat-festiv-laser/", "Iluminat festiv"),
    ("/alternativa-artificii/", "În loc de artificii"),
    ("/cat-costa-spectacol-laser/", "Cât costă"),
]

ORG = {
    "@type": "LocalBusiness",
    "@id": SITE + "/#firma",
    "name": "Luceafărul",
    "description": "Laser show personalizat și iluminat festiv cu laser: numele și stema orașului desenate pe clădiri.",
    "url": SITE + "/",
    "telephone": "+40741447101",
    "email": "lucian@helpix.ro",
    "image": SITE + "/img/nume.jpg",
    "address": {"@type": "PostalAddress", "addressLocality": "Petroșani", "addressRegion": "Hunedoara", "addressCountry": "RO"},
    "areaServed": {"@type": "Country", "name": "România"},
    "taxID": "52996493",
}

CONTACT = """
  <section class="contact">
    <p class="kicker">Contact</p>
    <h2>O seară de probă, înainte de orice contract.</h2>
    <p>Venim cu proiectorul la clădirea pe care o aveți în vedere și vedeți numele și stema
      localității pe propriul zid. O seară, nicio obligație. Oferta de preț vine după, pe
      clădirea aleasă.</p>
    <div class="reach">
      <a class="go" href="https://wa.me/40741447101?text={wa}" rel="noopener">Scrieți pe WhatsApp</a>
      <a href="mailto:lucian@helpix.ro?subject={subj}">lucian@helpix.ro</a>
      <a href="tel:+40741447101">+40 741 447 101</a>
    </div>
  </section>
"""

FOOT = """
  <footer>
    Luceafărul — laser show personalizat și iluminat festiv cu laser.<br>
    CUI 52996493 · J2025092166007 · Petroșani, județul Hunedoara.
  </footer>
"""

from urllib.parse import quote


def page(slug, title, desc, h1, lead, body, faq, more_slugs):
    url = f"{SITE}/{slug}/"
    nav = "".join(
        f'<a href="{href}"{" aria-current=\"page\"" if href == f"/{slug}/" else ""}>{label}</a>'
        for href, label in NAV)
    faq_html = "".join(f"<div><h3>{q}</h3><p>{a}</p></div>" for q, a in faq)
    more = "".join(
        f'<a href="{href}"><b>{label}</b><span>{blurb}</span></a>'
        for href, label, blurb in MORE if href in more_slugs)
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            ORG,
            {"@type": "WebPage", "@id": url, "url": url, "name": title, "description": desc,
             "inLanguage": "ro", "dateModified": TODAY, "about": {"@id": SITE + "/#firma"}},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Luceafărul", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": h1, "item": url}]},
            {"@type": "FAQPage", "mainEntity": [
                {"@type": "Question", "name": q,
                 "acceptedAnswer": {"@type": "Answer", "text": a.replace("<strong>", "").replace("</strong>", "")}}
                for q, a in faq]},
        ],
    }
    wa = quote(f"Bună ziua. Am citit pagina „{h1}” și aș vrea detalii.")
    subj = quote(f"Luceafărul — {h1}")
    html = f"""<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:locale" content="ro_RO">
<meta property="og:site_name" content="Luceafărul">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/img/nume.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">{json.dumps(graph, ensure_ascii=False)}</script>
</head>
<body style="margin:0">

<header class="top"><div class="shell">
  <a class="home" href="/">Luce<span>a</span>fărul</a>
  <nav aria-label="Pagini">{nav}</nav>
</div></header>

<main class="shell">
  <div class="page-head">
    <h1>{h1}</h1>
    <p class="lead">{lead}</p>
  </div>
{body}
  <section>
    <p class="kicker">Întrebări</p>
    <h2>Ce ne întreabă primăriile</h2>
    <div class="faq">{faq_html}</div>
  </section>

  <section>
    <p class="kicker">Mai departe</p>
    <h2>Pe același subiect</h2>
    <div class="more">{more}
      <a href="/"><b>Fotografii de pe clădiri reale</b><span>Pagina principală: ce am proiectat până acum.</span></a>
    </div>
  </section>
{CONTACT.format(wa=wa, subj=subj)}{FOOT}
</main>
</body>
</html>
"""
    os.makedirs(slug, exist_ok=True)
    with open(os.path.join(slug, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)


MORE = [
    ("/iluminat-festiv-laser/", "Iluminat festiv cu laser",
     "Numele și stema localității pe o clădire, de la 1 decembrie până după Bobotează."),
    ("/alternativa-artificii/", "Revelion fără artificii",
     "Ce aleg orașele în locul focului și ce merge prost pe ceață."),
    ("/cat-costa-spectacol-laser/", "Cât costă un spectacol laser",
     "Sume plătite de primării în 2023–2026, din achizițiile publice."),
]

# ---------------------------------------------------------------------------
page(
    "iluminat-festiv-laser",
    "Iluminat festiv cu laser: numele și stema orașului pe clădire | Luceafărul",
    "Iluminat festiv cu laser pentru primării: numele și stema localității desenate pe o clădire, de la 1 decembrie până după Bobotează. Un proiector, fără operator, seară de probă gratuită.",
    "Iluminat festiv cu laser pentru primării",
    "Numele localității și stema ei, desenate cu laser pe o clădire din centru. Se aprinde singur "
    "în fiecare seară, de la 1 decembrie până după Bobotează, și nu lasă nimic pe fațadă.",
    """
  <section>
    <p class="kicker">Ce este</p>
    <h2>Un singur proiector, pe o singură clădire.</h2>
    <p class="lead">Luminițele de sărbători arată la fel în fiecare oraș. Un laser poate scrie ceva
      ce nu are niciun alt oraș: <strong>numele lui și stema lui</strong>, cu diacriticele corecte,
      pe primărie, pe casa de cultură sau pe clădirea din piață.</p>
    <p>Proiectorul stă pe un stâlp sau pe o clădire din față, într-o carcasă încălzită. Programul
      e scris în memoria lui: pornește seara la ora stabilită, se oprește singur noaptea și nu
      depinde de internet. Nu rămâne nimeni pe teren.</p>
    <p>Pe lângă nume și stemă se pot adăuga urări, versuri sau colinde care se derulează, un brad,
      stele, o bandă festivă pe streașină. Totul se schimbă din program, nu din echipament.</p>
  </section>

  <section>
    <p class="kicker">De ce merge într-un oraș mic</p>
    <h2>Efect mare, investiție mică.</h2>
    <p>Un oraș mic plătește de obicei între 40.000 și 170.000 de lei pe sezon pentru iluminatul
      festiv închiriat. Un proiector laser nu înlocuiește ghirlandele. Pune însă în centru un singur
      lucru pe care oamenii îl fotografiază, iar numele orașului ajunge în pozele tuturor.</p>
    <p>Nu se montează nimic pe fațadă: niciun cui, niciun cablu pe zid, nicio aprobare de la
      proprietarii clădirii pentru găuri. Consumul e de ordinul unui bec obișnuit.</p>
  </section>

  <section>
    <p class="kicker">Ce trebuie știut dinainte</p>
    <h2>Ce nu poate face un laser.</h2>
    <p><strong>Nu poate desena negru și nu umple suprafețe.</strong> Laserul desenează linii de
      lumină. O stemă se citește după blazon, linie cu linie, iar culorile închise ies luminoase.
      Asta se spune în scris înainte de contract, nu se descoperă la montaj.</p>
    <p><strong>Ceața groasă șterge desenul.</strong> O umezeală ușoară în aer face fasciculele
      frumoase; o ceață densă estompează ce e pe zid. Pentru șase săptămâni, câteva seri cu ceață
      sunt inevitabile.</p>
    <p><strong>Fasciculele nu trec peste oameni.</strong> Proiecția se face pe clădire. Traseul
      fiecărei raze se măsoară la montaj și se predă primăriei în scris.</p>
  </section>

  <section>
    <p class="kicker">Durata</p>
    <h2>Toată iarna, o săptămână sau o singură noapte.</h2>
    <p>Varianta obișnuită e sezonul întreg, de la 1 Decembrie până după Bobotează. Se poate și o
      săptămână, sau o singură noapte, de exemplu la aprinderea luminilor sau de Revelion, cu
      numărătoare inversă la miezul nopții. Drumul și montajul costă la fel indiferent de durată,
      așa că sezonul întreg iese cel mai avantajos pe seară.</p>
  </section>
""",
    [
        ("Cât costă iluminatul festiv cu laser?",
         "Fiecare ofertă se face pe clădirea aleasă, după seara de probă: depinde de durată, de numărul de proiectoare și de conținut. Cereți o ofertă pe WhatsApp sau pe email. Pagina „Cât costă un spectacol laser” arată ce au plătit alte primării."),
        ("Se poate cumpăra prin achiziție directă?",
         "Da. Valoarea e mult sub pragul de achiziție directă pentru servicii, deci nu e nevoie de licitație."),
        ("Ce se întâmplă dacă se oprește în timpul sezonului?",
         "Suntem din Petroșani. În Valea Jiului și în județul Hunedoara venim în aceeași seară. Prețul include un proiector de rezervă."),
        ("Trebuie aprobare de la proprietarii clădirii?",
         "Nu se montează nimic pe fațadă, deci nu e nevoie de lucrări. Proiectorul stă pe un suport separat. Pentru clădirile publice ajunge acordul primăriei."),
        ("Se vede și pe vreme rea?",
         "Ploaia și frigul nu opresc proiectorul, care are carcasă încălzită. Ceața foarte deasă estompează desenul în serile acelea."),
    ],
    ["/alternativa-artificii/", "/cat-costa-spectacol-laser/"],
)

# ---------------------------------------------------------------------------
page(
    "alternativa-artificii",
    "Revelion fără artificii: spectacol laser în locul focului | Luceafărul",
    "Alternativă la artificii de Revelion: spectacol laser fără zgomot, sigur pentru animale, cu numărătoare inversă și numele orașului. Ce au ales primăriile în 2026 și ce merge prost pe ceață.",
    "Revelion fără artificii: laserul în locul focului",
    "Tot mai multe orașe renunță la artificii de Revelion: pentru animale, pentru zgomot, pentru "
    "siguranță. Ce se poate pune în loc, cât ține și ce trebuie știut înainte.",
    """
  <section>
    <p class="kicker">Ce s-a întâmplat la Revelionul 2026</p>
    <h2>Orașele care au ales lasere în locul artificiilor.</h2>
    <p class="lead">La Revelionul 2026, mai multe orașe au anunțat public că renunță la focul de
      artificii: Bistrița, Satu Mare, Sfântu Gheorghe, Deva, Petroșani, Făgăraș. Altele, ca Suceava,
      au ales drone.</p>
    <p>Motivele declarate se repetă: <strong>animalele</strong> care se sperie de bubuituri,
      <strong>zgomotul</strong> pentru vârstnici și copii mici, <strong>siguranța</strong> lângă
      clădiri vechi sau stații de carburant și <strong>ceața</strong>, care ascunde o mare parte din
      artificii. La Sfântu Gheorghe, peste 80% dintre locuitori au votat într-un sondaj pentru lasere.</p>
  </section>

  <section>
    <p class="kicker">Ce putem face</p>
    <h2>Numărătoarea, numele orașului, apoi toată noaptea.</h2>
    <p>Un spectacol laser obișnuit de Revelion ține 10–15 minute: fascicule pe cer, pe muzică. Noi
      lucrăm altfel: la miezul nopții, numărătoarea inversă și „La mulți ani” se scriu pe o clădire
      din piață, urmate de numele orașului și stema lui. Apoi instalația rămâne aprinsă, opt ore la
      rând, cât ține petrecerea.</p>
    <p>Fără zgomot, fără resturi, fără risc de incendiu. Fasciculele cad pe clădire, nu peste public,
      iar traseul lor se predă în scris.</p>
  </section>

  <section>
    <p class="kicker">Ce merge prost</p>
    <h2>Ceața ajută fasciculele și strică desenul.</h2>
    <p>O umezeală ușoară face razele vizibile în aer, fără mașină de fum. Ceața deasă însă estompează
      tot ce e pe zid. La un Revelion din 2025, într-un oraș de la Dunăre, un spectacol laser de zeci
      de mii de lei a fost acoperit aproape în întregime de ceață.</p>
    <p>De aceea recomandăm o clădire apropiată de public, nu un fundal la sute de metri, și o probă
      pe clădirea reală înainte de contract.</p>
  </section>
""",
    [
        ("Este laserul periculos pentru public?",
         "Nu, dacă fasciculele nu sunt îndreptate spre oameni. Noi proiectăm pe clădiri, iar punctul cel mai de jos atins de orice rază se măsoară la montaj și se predă în scris."),
        ("Sperie laserul animalele?",
         "Nu. Laserul nu face niciun zgomot. Este motivul principal pentru care orașele îl aleg în locul artificiilor."),
        ("Cât costă un spectacol laser de Revelion?",
         "Primăriile din municipii au plătit în 2025–2026 între 35.000 și 66.000 de lei fără TVA pentru 10–15 minute cu mai multe lasere. Pentru o ofertă pe orașul dumneavoastră, scrieți-ne data și clădirea."),
        ("Se poate sincroniza cu muzica?",
         "Numărătoarea inversă se sincronizează pe miezul nopții, cu un operator la butoane. Un show care reacționează live la muzică cere echipament suplimentar și se discută separat."),
        ("Ce facem dacă e ceață?",
         "O ceață ușoară ajută. Pentru ceață deasă recomandăm o clădire aproape de public și o seară de probă înainte."),
    ],
    ["/iluminat-festiv-laser/", "/cat-costa-spectacol-laser/"],
)

# ---------------------------------------------------------------------------
page(
    "cat-costa-spectacol-laser",
    "Cât costă un spectacol laser? Prețuri plătite de primării, 2023–2026 | Luceafărul",
    "Cât costă un spectacol laser pentru o primărie: sume reale din achizițiile publice 2023–2026, de la lasere la zilele orașului la drone de Revelion. Ce influențează prețul și cum se cumpără.",
    "Cât costă un spectacol laser pentru o primărie",
    "Sume reale, din achizițiile directe publicate de primării și case de cultură în 2023–2026. "
    "Utile pentru cine scrie referatul de necesitate și are nevoie de o valoare estimată.",
    """
  <section>
    <p class="kicker">Ce s-a plătit</p>
    <h2>Sume din achizițiile publice.</h2>
    <p>Valorile de mai jos sunt intervale, fără TVA, calculate din achizițiile directe publicate în
      SEAP de primării, case de cultură și centre culturale. Nu numim furnizorii.</p>
    <div class="facts-table">
      <table>
        <thead><tr><th>Ce s-a cumpărat</th><th>Unde</th><th>Sumă (lei, fără TVA)</th></tr></thead>
        <tbody>
          <tr><td>Spectacol laser de o seară, la zilele orașului</td><td>orașe mici și mijlocii</td><td class="num">10.000 – 20.000</td></tr>
          <tr><td>Spectacol laser de Crăciun, la aprinderea luminilor</td><td>orașe și municipii</td><td class="num">15.000 – 44.000</td></tr>
          <tr><td>Spectacol laser de Revelion, 10–15 minute, 10–12 lasere</td><td>municipii</td><td class="num">35.000 – 66.000</td></tr>
          <tr><td>Lasere cu jeturi de flăcări și pirotehnie, Revelion</td><td>municipiu reședință de județ</td><td class="num">≈ 92.000</td></tr>
          <tr><td>Spectacol cu 200–300 de drone</td><td>municipii</td><td class="num">75.000 – 151.000</td></tr>
          <tr><td>Iluminat festiv închiriat, un sezon</td><td>orașe mici</td><td class="num">40.000 – 170.000</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <p class="kicker">Ce face prețul</p>
    <h2>Cinci lucruri care mută suma.</h2>
    <p><strong>Numărul de proiectoare.</strong> Un show de Revelion cu 10–12 lasere costă de câteva
      ori mai mult decât unul cu un singur proiector.</p>
    <p><strong>Conținutul.</strong> Figurile din bibliotecă sunt incluse. Numele orașului, stema și
      mesajele proprii se desenează o singură dată și rămân pentru anii următori.</p>
    <p><strong>Operatorul.</strong> O numărătoare inversă la secundă cere un om la butoane. O
      instalație care rulează singură toată iarna, nu.</p>
    <p><strong>Drumul și montajul.</strong> Costă la fel pentru o seară și pentru șase săptămâni.
      De aceea sezonul întreg iese mult mai ieftin pe seară.</p>
    <p><strong>Durata.</strong> Un spectacol de Revelion ține 10–15 minute. O instalație de iarnă
      stă aprinsă câteva ore în fiecare seară, șase săptămâni.</p>
  </section>

  <section class="price">
    <p class="kicker">Oferta</p>
    <h2>Cereți o ofertă pentru orașul dumneavoastră.</h2>
    <p>Fiecare ofertă se face pe clădirea reală: câte proiectoare, ce durată, ce conținut. Trimiteți
      data, localitatea și clădirea pe care o aveți în vedere, iar oferta vine în scris, cu tot ce
      include. Înainte de orice contract, o seară de probă pe zidul dumneavoastră.</p>
  </section>

  <section>
    <p class="kicker">Cum se cumpără</p>
    <h2>Achiziție directă, fără licitație.</h2>
    <p>Toate sumele de mai sus sunt sub pragul de achiziție directă pentru servicii (270.120 lei
      fără TVA), așa că primăria sau casa de cultură cumpără direct, pe baza unui referat de
      necesitate și a unei oferte. Achizițiile pentru sărbători se fac de obicei între sfârșitul lui
      octombrie și sfârșitul lui noiembrie, așa că oferta se cere din octombrie.</p>
  </section>
""",
    [
        ("Cât costă un spectacol laser pentru o seară?",
         "Între 10.000 și 20.000 de lei fără TVA pentru o seară la zilele orașului, după achizițiile publicate de primării. Spectacolele mari de Revelion, cu 10–12 lasere, au costat între 35.000 și 66.000 de lei."),
        ("Cât costă un spectacol cu drone?",
         "Spectacolele cu 200–300 de drone cumpărate de municipii în 2024–2026 au costat între 75.000 și 151.000 de lei fără TVA, pentru 8–10 minute."),
        ("Trebuie licitație pentru un spectacol laser?",
         "Nu, dacă valoarea e sub pragul de achiziție directă pentru servicii, de 270.120 lei fără TVA. Toate spectacolele laser cumpărate de primării pe care le-am găsit au fost sub acest prag."),
        ("De ce e mai ieftin un sezon întreg pe seară?",
         "Pentru că drumul, montajul și demontajul se plătesc o singură dată. Seara a doua și a patruzecea costă aproape nimic în plus."),
        ("Ce include oferta voastră?",
         "Aparatul, conținutul, consumabilele, deplasarea, montajul, demontajul, omul la butoane când e nevoie și un proiector de rezervă. Totul se trece în ofertă, fără costuri separate."),
    ],
    ["/iluminat-festiv-laser/", "/alternativa-artificii/"],
)

# ---------------------------------------------------------------------------
with open("robots.txt", "w", encoding="utf-8") as f:
    f.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")

urls = ["/"] + [h for h, _ in NAV]
with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for u in urls:
        f.write(f"  <url><loc>{SITE}{u}</loc><lastmod>{TODAY}</lastmod></url>\n")
    f.write("</urlset>\n")
print("ok", urls)
