/* ─── Navbar adaptive color ──────────────────────── */
const navbar = document.getElementById('navbar');

function updateNavbar() {
  if (!navbar) return;
  const scrollY = window.scrollY;

  // Detect the background under the navbar center
  const navMidX = window.innerWidth / 2;
  const navMidY = scrollY + 53; // approx vertical center of navbar

  // Find what element is at the midpoint below navbar
  const els = document.elementsFromPoint(navMidX, navMidY);
  let isDark = true;

  for (const el of els) {
    if (el === navbar || el.closest('.navbar')) continue;

    const section = el.closest('section, header, footer, main, div[class]');
    if (!section) continue;

    const classes = section.className || '';

    // Light sections
    if (
      classes.includes('section-diligent') ||
      classes.includes('section-conduiit') ||
      classes.includes('section-mercadolibre') ||
      classes.includes('footer-contact') ||
      classes.includes('cs-page-content')
    ) {
      isDark = false;
      break;
    }

    // Dark sections
    if (
      classes.includes('hero') ||
      classes.includes('more-projects') ||
      classes.includes('footer-trusted') ||
      classes.includes('cs-page-header')
    ) {
      isDark = true;
      break;
    }
  }

  if (isDark) {
    navbar.classList.remove('light');
  } else {
    navbar.classList.add('light');
  }
}

window.addEventListener('scroll', updateNavbar, { passive: true });
window.addEventListener('resize', updateNavbar, { passive: true });
updateNavbar();

/* ─── Scroll reveal ──────────────────────────────── */
const reveals = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  reveals.forEach((el) => observer.observe(el));
} else {
  // Fallback: show all
  reveals.forEach((el) => el.classList.add('visible'));
}

/* ─── Stagger reveal within grids ───────────────── */
document.querySelectorAll('.projects-grid').forEach((grid) => {
  const cards = grid.querySelectorAll('.reveal');
  cards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.12}s`;
  });
});

/* ─── Smooth disc parallax in hero ──────────────── */
const hero = document.querySelector('.hero');
const discs = document.querySelectorAll('.disc');

if (hero && discs.length) {
  window.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (clientX - cx) / cx;
    const dy = (clientY - cy) / cy;

    discs.forEach((disc, i) => {
      const depth = (i + 1) * 6;
      disc.style.transform = `
        perspective(300px)
        rotateX(68deg)
        translate(${dx * depth}px, ${dy * depth}px)
      `;
    });
  });
}
