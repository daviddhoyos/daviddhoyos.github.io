/* ─── Navbar: dark ↔ light based on section data-theme ── */
const navbar = document.getElementById('navbar');

function getNavbarTheme() {
  const checkY = 55;
  const sections = document.querySelectorAll('[data-theme]');
  let theme = 'dark';
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= checkY && rect.bottom > checkY) {
      theme = section.dataset.theme;
    }
  });
  return theme;
}

function updateNavbar() {
  if (!navbar) return;
  const theme = getNavbarTheme();
  navbar.classList.toggle('light', theme === 'light');
  updateNavbarContrast();
}

/* ─── Navbar text contrast: detect light content underneath ──
   When the dark navbar scrolls over a light image (e.g. white
   project thumbnails), we add .over-light-content so CSS can
   switch text to near-black. Uses canvas pixel sampling for
   images and computed backgroundColor for other elements.
   ─────────────────────────────────────────────────────── */
function updateNavbarContrast() {
  // Light sections already handled by .light class — skip
  if (navbar.classList.contains('light')) {
    navbar.classList.remove('over-light-content');
    return;
  }

  const inner = navbar.querySelector('.navbar-inner');

  // Temporarily disable pointer-events on navbar so elementFromPoint
  // returns the actual page content underneath, not the pill itself.
  inner.style.pointerEvents = 'none';

  const checkY = 55;
  // Sample 6 horizontal points spread across where navbar links live
  const sampleXs = [0.15, 0.28, 0.42, 0.58, 0.72, 0.86]
    .map(r => Math.round(r * window.innerWidth));

  let isOverLight = false;

  for (const x of sampleXs) {
    const el = document.elementFromPoint(x, checkY);
    if (!el) continue;

    // Skip decorative images that are part of the dark design
    if (el.classList.contains('hero-lens') || el.classList.contains('diligent-triangle')) continue;

    if (el.tagName === 'IMG') {
      // Use canvas to sample the exact pixel under the navbar
      const brightness = samplePixelBrightness(el, x, checkY);
      if (brightness > 155) { isOverLight = true; break; }
    } else {
      // Walk up ancestors to find a solid background color
      const lum = getAncestorLuminance(el);
      if (lum > 200) { isOverLight = true; break; }
    }
  }

  inner.style.pointerEvents = '';
  navbar.classList.toggle('over-light-content', isOverLight);
}

/** Sample a single pixel of an image at viewport coords (x, y) via canvas. */
function samplePixelBrightness(img, viewX, viewY) {
  try {
    if (!img.complete || img.naturalWidth === 0) return 128;
    const rect = img.getBoundingClientRect();
    // Map viewport coords → image natural coords
    const imgX = Math.round(((viewX - rect.left) / rect.width)  * img.naturalWidth);
    const imgY = Math.round(((viewY - rect.top)  / rect.height) * img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, imgX, imgY, 1, 1, 0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a < 10) return 128; // transparent — neutral
    return 0.299 * r + 0.587 * g + 0.114 * b;
  } catch (_) {
    // CORS or tainted canvas — assume light (safe default)
    return 200;
  }
}

/** Walk up the DOM tree to find the first solid background-color luminance. */
function getAncestorLuminance(el) {
  let node = el;
  for (let i = 0; i < 12 && node && node !== document.body; i++, node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') continue;
    const m = bg.match(/[\d.]+/g);
    if (!m || m.length < 3) continue;
    const alpha = m[3] != null ? parseFloat(m[3]) : 1;
    if (alpha < 0.15) continue;
    return 0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2];
  }
  return 0; // default: dark
}

window.addEventListener('scroll', updateNavbar, { passive: true });
window.addEventListener('resize', updateNavbar, { passive: true });
updateNavbar();
requestAnimationFrame(updateNavbar);

/* ─── Scroll reveal ────────────────────────────────── */
const reveals = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('visible'));
}

/* ─── Stagger cards in grid ────────────────────────── */
document.querySelectorAll('.projects-grid').forEach(grid => {
  grid.querySelectorAll('.reveal').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.12}s`;
  });
});

/* ─── Email copy to clipboard ──────────────────────── */
const emailBtn   = document.getElementById('emailCopyBtn');
const emailToast = document.getElementById('emailToast');
let toastTimeout = null;

function showToast() {
  emailToast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => emailToast.classList.remove('visible'), 2200);
}

if (emailBtn && emailToast) {
  emailBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('daviddhoyos1@gmail.com')
      .then(showToast)
      .catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = 'daviddhoyos1@gmail.com';
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast();
      });
  });
}
