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
  navbar.classList.toggle('over-light-content', isOverBrightContent());
}

/* ─── Navbar bright-content detection via getBoundingClientRect ──
   No canvas. No elementFromPoint. Just rect comparisons.

   Strategy: within dark sections there are elements that have
   bright/white content — the "More Projects" heading and the
   project card images (which may have white backgrounds).
   When any of those overlaps the navbar band we flip the text
   to dark so it stays legible.

   The navbar pill sits at roughly viewport y = 24 → 86.
   ─────────────────────────────────────────────────────── */

const NAV_Y_TOP    = 24;   // top of pill + small buffer
const NAV_Y_BOTTOM = 86;   // bottom of pill + small buffer

/**
 * Returns true when a "bright zone" element inside a dark section
 * currently intersects the navbar band.
 *
 * Bright zones (within dark sections):
 *   .more-projects-title   — large white heading, low contrast vs white navbar text
 *   .project-card-img-wrap — card images that can have white/light backgrounds
 */
function isOverBrightContent() {
  // Already showing as a light section — .light already handles text color
  if (navbar.classList.contains('light')) return false;

  const candidates = document.querySelectorAll(
    '.more-projects-title, .project-card-img-wrap'
  );

  for (const el of candidates) {
    const r = el.getBoundingClientRect();
    // Vertical overlap with the navbar band?
    if (r.bottom > NAV_Y_TOP && r.top < NAV_Y_BOTTOM) return true;
  }
  return false;
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
