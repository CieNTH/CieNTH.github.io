/* SPA minimaliste avec hash routing + contenu JSON (partials supportés) */

const NAV_ITEMS = [
  { id: "accueil",     label: "Accueil" },
  { id: "actualites",  label: "Actualités" },
  { id: "biographie",  label: "Biographie" },
  { id: "billetterie", label: "Billetterie" },
  { id: "galerie",     label: "Galerie" },
  { id: "contact",     label: "Contact" },
];

// Éléments DOM
const navList    = document.getElementById("navList");
const content    = document.getElementById("content");
const yearSpan   = document.getElementById("year");
const menuBtn    = document.getElementById("menuToggle");
const primaryNav = document.getElementById("primaryNav");

// --- Backdrop pour flouter le fond quand le menu s'ouvre ---
let navBackdrop = document.getElementById('navBackdrop');
if (!navBackdrop) {
  navBackdrop = document.createElement('div');
  navBackdrop.id = 'navBackdrop';
  navBackdrop.className = 'nav-backdrop';
  document.body.appendChild(navBackdrop);
}

// État
let PAGES = {};
let SITE_TITLE = "Compagnie NTH";

// Petit bus de hooks (JS spécifique par page) — facultatif
const PAGE_SCRIPTS = {

  
  
  // Exemple : script spécial pour la page biographie
  biographie() {
    const root = document.querySelector('.page[data-page="biographie"]');
    if (!root) return;
    // Tu peux mettre ici des listeners spécifiques à la page biographie
    // (vide pour l’instant)
  },
 galerie() {
  const root = document.querySelector('.page[data-page="galerie"]');
  if (!root) return;

  const tiles = Array.from(root.querySelectorAll('.gallery-item'));
  const modal = document.getElementById('lightbox');
  const imgEl = modal.querySelector('.lb-image');

  // Création de la légende (texte + crédit photo)
  const captionEl = document.createElement('div');
  captionEl.className = 'lb-caption';
  const captionText = document.createElement('div');
  captionText.className = 'lb-caption-text';
  const captionCredit = document.createElement('div');
  captionCredit.className = 'lb-caption-credit';
  captionEl.appendChild(captionText);
  captionEl.appendChild(captionCredit);
  modal.appendChild(captionEl);

  const btnClose = modal.querySelector('.lb-close');
  const btnPrev  = modal.querySelector('.lb-prev');
  const btnNext  = modal.querySelector('.lb-next');

  const items = tiles.map(a => a.getAttribute('href'));
  let index = 0;

  // Convertit une valeur CSS (ex: "4vw" ou "16px") en px
const cssUnitToPx = (val) => {
  if (!val) return 0;
  val = val.trim();
  if (val.endsWith('vw')) return (parseFloat(val) / 100) * window.innerWidth;
  if (val.endsWith('vh')) return (parseFloat(val) / 100) * window.innerHeight;
  if (val.endsWith('px')) return parseFloat(val);
  return parseFloat(val) || 0;
};

// Calcule la largeur optimale de la caption pour l'image courante
const computeCaptionWidthPx = () => {
  if (!imgEl) return 0;

  const imgRect = imgEl.getBoundingClientRect();
  const imgW    = imgRect.width || 0;

  // Lis la variable CSS --lb-side-gap (ex: "4vw"), fallback 16px
  const gapVar  = getComputedStyle(document.documentElement)
                    .getPropertyValue('--lb-side-gap') || '16px';
  const sideGap = cssUnitToPx(gapVar) || 16;

  const vw      = window.innerWidth;

  // bornes et caps
  const maxByViewport = Math.max(0, vw - 2 * sideGap);  // pas plus large que l'écran - marges
  const desktopCap    = 1100;                           // cap max desktop (ajuste si besoin)
  const isDesktop     = vw >= 900;

  // plancher confortable desktop (évite une boîte trop étroite si texte court)
  const desktopFloor  = 520;                            // px, ajuste à ton goût

  // largeur de base = min(photo, viewport sans marges, cap desktop)
  let width = Math.min(imgW, maxByViewport, isDesktop ? desktopCap : maxByViewport);

  // applique le plancher sur desktop
  if (isDesktop) width = Math.max(width, Math.min(desktopFloor, maxByViewport));

  return Math.round(Math.max(0, width));
};

  /* ==========================================================
     ✅  Function to position the caption dynamically
  ========================================================== */
  // Positionne la caption 20px sous l'image ET règle sa largeur
const positionCaptionBelowImage = () => {
  if (!imgEl || !captionEl) return;

  const rect = imgEl.getBoundingClientRect();
  const top  = rect.bottom + 20; // 20 px sous l'image

  // largeur idéale calculée dynamiquement
  const w = computeCaptionWidthPx();

  // applique position + largeur, centré horizontalement
  captionEl.style.top = `${top}px`;
  captionEl.style.left = '50%';
  captionEl.style.transform = 'translateX(-50%)';
  captionEl.style.width = `${w}px`;
};

// Repositionner seulement si la lightbox est ouverte ET que la caption est visible
const safeReposition = () => {
  if (!modal.classList.contains('is-open')) return;
  if (captionEl.style.display === 'none') return;
  positionCaptionBelowImage();
};

  const show = (i) => {
  index = (i + items.length) % items.length;
  const src = items[index];

  // data-* sur la vignette
  const caption = tiles[index].dataset.caption || "";
  const credit  = tiles[index].dataset.credit  || "";

  // Si pas de caption => on cache la boîte et on ne la positionne pas
  if (!caption.trim()) {
    captionEl.style.display = "none";
  } else {
    captionEl.style.display = "block";
    captionText.textContent = caption;
    captionCredit.textContent = credit;
    captionEl.style.visibility = 'hidden'; // évite le "saut" avant placement
  }

  // Charge l'image
  imgEl.onload = () => {
    if (caption.trim()) {
      positionCaptionBelowImage();        // place exactement
      captionEl.style.visibility = 'visible';
    }
  };
  imgEl.src = src;

  // Image en cache ?
  if (imgEl.complete && imgEl.naturalWidth) {
    if (caption.trim()) {
      positionCaptionBelowImage();
      captionEl.style.visibility = 'visible';
    }
  }
};

  const open = (i) => {
    show(i);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    btnClose.focus({ preventScroll: true });
  };

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    imgEl.removeAttribute('src');
  };

  const prev = () => show(index - 1);
  const next = () => show(index + 1);

  tiles.forEach((tile, i) => {
    tile.addEventListener('click', e => {
      e.preventDefault();
      open(i);
    });
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', prev);
  btnNext.addEventListener('click', next);

  // clic sur le fond = fermer
  modal.addEventListener('click', e => {
    if (e.target === modal) close();
  });

  // clavier
  const onKey = (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  };
  document.addEventListener('keydown', onKey);

  // Reposition seulement si nécessaire
  window.addEventListener('resize', safeReposition);
  window.addEventListener('orientationchange', safeReposition);

  // nettoyage (quand on quitte la page)
  const observer = new MutationObserver(() => {
  if (!document.body.contains(root)) {
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', safeReposition);
    window.removeEventListener('orientationchange', safeReposition);
    observer.disconnect();
  }
});
  observer.observe(document.body, { childList: true, subtree: true });
  },
  /* 🔥 Nouveau : script spécifique pour la page Billetterie */
  billetterie() {
    // On récupère les éléments
    const daysEl    = document.getElementById('cd-days');
    const hoursEl   = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');
    const endEl     = document.getElementById('countdown-end');
    const gridEl    = document.querySelector('.page[data-page="billetterie"] .countdown-grid');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl || !endEl || !gridEl) return;

    // Date cible : 3 mars 2026, 12:00, heure Suisse (CET, UTC+1 à cette date)
    const target = new Date('2026-03-03T12:00:00+01:00');

    let timerId = null;

    const update = () => {
      const now = new Date();
      let diff = target - now;

      // Si la date est passée ou atteinte
      if (diff <= 0) {
        clearInterval(timerId);
        daysEl.textContent    = '0';
        hoursEl.textContent   = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';

        gridEl.style.display = 'none';
        endEl.hidden = false;
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days    = Math.floor(totalSeconds / 86400);
      const hours   = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      daysEl.textContent    = String(days);
      hoursEl.textContent   = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');
    };

    // Première mise à jour immédiate
    update();
    // Puis toutes les secondes
    timerId = setInterval(update, 1000);

    // Nettoyage quand on quitte la page (hash change)
    const observer = new MutationObserver(() => {
      const pageStillHere = document.querySelector('.page[data-page="billetterie"]');
      if (!pageStillHere) {
        clearInterval(timerId);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },
};

// Helpers
const setDocumentTitle = (pageTitle) => {
  document.title = `${pageTitle} — ${SITE_TITLE}`;
};

// --- Drawer à droite + flou du fond ---
const openMobileMenu = () => {
  if (!menuBtn) return;
  menuBtn.setAttribute("aria-expanded", "true");
  primaryNav.classList.add("open");
  document.body.classList.add("nav-open");   // empêche le scroll
  navBackdrop.classList.add("show");         // affiche le voile flou

  // Focus accessibilité : premier lien du menu
  primaryNav.querySelector('a')?.focus({ preventScroll: true });

  // ESC pour fermer (un seul coup)
  const onEsc = (e) => { if (e.key === 'Escape') closeMobileMenu(); };
  document.addEventListener('keydown', onEsc, { once: true });

  // Click sur le backdrop => fermer (un seul coup)
  navBackdrop.addEventListener('click', closeMobileMenu, { once: true });
};

const closeMobileMenu = () => {
  if (!menuBtn) return;
  menuBtn.setAttribute("aria-expanded", "false");
  primaryNav.classList.remove("open");
  document.body.classList.remove("nav-open");
  navBackdrop.classList.remove("show");

  // Rendre le focus au bouton menu
  menuBtn.focus({ preventScroll: true });
};

const toggleMobileMenu = () => {
  const expanded = menuBtn.getAttribute("aria-expanded") === "true";
  expanded ? closeMobileMenu() : openMobileMenu();
};

// Router
function getCurrentRoute(){
  const hash = window.location.hash.replace("#","");
  return hash || "accueil";
}

function buildNav(activeId){
  navList.innerHTML = "";
  NAV_ITEMS.forEach(({id,label}) => {
    const li = document.createElement("li");
    const a  = document.createElement("a");
    a.href = `#${id}`;
    a.textContent = label;
    if (id === activeId) a.setAttribute("aria-current","page");
    a.addEventListener("click", () => closeMobileMenu());
    li.appendChild(a);
    navList.appendChild(li);
  });
}

/* ----- Rendu avec support de contentUrl (partials HTML) ----- */
/* Protection anti-course : si deux navigations rapides arrivent, on ignore le rendu obsolète */
let lastRenderToken = 0;

async function renderPage(routeId){
  const token = ++lastRenderToken;

  const page = PAGES[routeId];
  buildNav(routeId);
  // Active une classe pour cibler le CSS sans :has() si besoin
document.body.classList.toggle('is-actualites', routeId === 'actualites');

  // Full-bleed pour l'accueil : supprime toute contrainte du wrapper
if (routeId === "accueil") {
  content.classList.add("home-full");
} else {
  content.classList.remove("home-full");
}

  if (!page){
    setDocumentTitle("Page introuvable");
    content.innerHTML = `
      <section class="page">
        <h1>Page introuvable</h1>
        <p>Cette section n’existe pas. <a href="#accueil">Retour à l’accueil</a>.</p>
      </section>
    `;
    // Donne le focus sans faire scroller vers le bas
    if (content && typeof content.focus === "function") {
      content.focus({ preventScroll: true });
}
  }

  setDocumentTitle(page.title || "Page");

  // Indicateur léger de chargement (optionnel)
  content.innerHTML = `
    <section class="page" data-page="${routeId}">
      <h1>${page.title}</h1>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton short"></div>
    </section>
  `;

  // Charger soit un partial HTML (contentUrl), soit du HTML inline (content)
  let innerHTML = "";
  if (page.contentUrl){
    try{
      const res = await fetch(page.contentUrl, { cache: "no-store" });
      innerHTML = res.ok ? await res.text() : "<p>(Contenu introuvable)</p>";
    }catch{
      innerHTML = "<p>(Problème de chargement)</p>";
    }
  }else{
    innerHTML = page.content || "<p>(Contenu à venir.)</p>";
  }

  // Si un autre rendu a été déclenché entre-temps, on abandonne celui-ci
  if (token !== lastRenderToken) return;

  // Si on est sur la page d'accueil, ne pas afficher le <h1>
const titleHTML = routeId === "accueil" ? "" : `<h1>${page.title}</h1>`;

content.innerHTML = `
  <section class="page" data-page="${routeId}">
    ${titleHTML}
    ${innerHTML}
  </section>
`;

  // Hook JS spécifique à la page (si défini)
  PAGE_SCRIPTS[routeId]?.();

  // Accessibilité (tu peux masquer visuellement l’outline via CSS)
  // Donne le focus sans faire scroller vers le bas
  if (content && typeof content.focus === "function") {
    content.focus({ preventScroll: true });
  }
}

async function loadPages(){
  try{
    const res = await fetch("pages.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Impossible de charger pages.json");
    const data = await res.json();

    SITE_TITLE = data.siteTitle || SITE_TITLE;

    // Adaptation des pages -> dictionnaire
    PAGES = {};
    (data.pages || []).forEach(p => { PAGES[p.id] = p; });

    // Première route
    renderPage(getCurrentRoute());
  }catch(err){
    console.error(err);
    content.innerHTML = `
      <section class="page">
        <h1>Problème de chargement</h1>
        <p>Le contenu n’a pas pu être chargé. Vérifie la présence de <code>pages.json</code>.</p>
      </section>
    `;
  }
}

// Forcer le scroll tout en haut après changement de page
window.scrollTo({
  top: 0,
  behavior: "instant"  // ou "smooth" si tu veux une transition
});

// Listeners init
window.addEventListener("hashchange", () => renderPage(getCurrentRoute()));
menuBtn?.addEventListener("click", toggleMobileMenu);
window.addEventListener("hashchange", () => {
  closeMobileMenu();                 // ferme le tiroir si ouvert
  renderPage(getCurrentRoute());
});

// Année dynamique
yearSpan.textContent = new Date().getFullYear();

// Lancement
loadPages();