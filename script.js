/* ─── Navbar: dark ↔ light based on section underneath ─── */
const navbar = document.getElementById('navbar');

function getNavbarTheme() {
  // The center point just below the navbar pill (~55px from top of viewport)
  const checkY = 55;

  // Walk through all sectioned elements with data-theme
  const sections = document.querySelectorAll('[data-theme]');
  let theme = 'dark'; // default (page starts dark)

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
}

window.addEventListener('scroll', updateNavbar, { passive: true });
window.addEventListener('resize', updateNavbar, { passive: true });
// Run on load and after a tick (lets layout settle)
updateNavbar();
requestAnimationFrame(updateNavbar);

/* ─── Scroll reveal ──────────────────────────────── */
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

/* ─── Stagger cards in grid ──────────────────────── */
document.querySelectorAll('.projects-grid').forEach(grid => {
  grid.querySelectorAll('.reveal').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.12}s`;
  });
});
