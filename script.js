/* ─── Navbar: dark ↔ light based on section underneath ─── */
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
}

window.addEventListener('scroll', updateNavbar, { passive: true });
window.addEventListener('resize', updateNavbar, { passive: true });
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

/* ─── Email copy to clipboard ────────────────────── */
const emailBtn = document.getElementById('emailCopyBtn');
const emailToast = document.getElementById('emailToast');
let toastTimeout = null;

if (emailBtn && emailToast) {
  emailBtn.addEventListener('click', () => {
    navigator.clipboard.writeText('daviddhoyos1@gmail.com').then(() => {
      emailToast.classList.add('visible');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        emailToast.classList.remove('visible');
      }, 2200);
    }).catch(() => {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea');
      ta.value = 'daviddhoyos1@gmail.com';
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      emailToast.classList.add('visible');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        emailToast.classList.remove('visible');
      }, 2200);
    });
  });
}
