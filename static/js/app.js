/**
 * app.js — Client-side JavaScript for EcoByte
 * All UI interactions: nav toggle, flash auto-dismiss, helpers
 * No framework — pure vanilla JavaScript
 */

// ── Mobile navigation toggle ──────────────────────────────────
function toggleNav() {
  const links  = document.getElementById('navLinks');
  const toggle = document.getElementById('navToggle');
  const isOpen = links.classList.toggle('open');
  toggle.textContent = isOpen ? '✕' : '☰';
}

// Close nav when clicking outside
document.addEventListener('click', function(e) {
  const links  = document.getElementById('navLinks');
  const toggle = document.getElementById('navToggle');
  if (!links || !toggle) return;
  if (!links.contains(e.target) && !toggle.contains(e.target)) {
    links.classList.remove('open');
    toggle.textContent = '☰';
  }
});

// ── Auto-dismiss flash messages after 5 seconds ───────────────
document.addEventListener('DOMContentLoaded', function() {
  const flashes = document.querySelectorAll('.flash');
  flashes.forEach(function(flash, i) {
    setTimeout(function() {
      flash.style.opacity    = '0';
      flash.style.transform  = 'translateX(30px)';
      flash.style.transition = 'all 0.4s ease';
      setTimeout(function() { flash.remove(); }, 400);
    }, 4000 + i * 500);
  });
});

// ── Utility: format Indian rupees ─────────────────────────────
function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });
}

// ── Utility: debounce (used in report.html inline script) ─────
function debounce(fn, ms) {
  let timer;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

// ── Table search / filter (generic) ──────────────────────────
function filterTable(inputId, tableId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    const rows  = document.querySelectorAll('#' + tableId + ' tbody tr');
    rows.forEach(function(row) {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

// ── Confirm destructive actions ───────────────────────────────
function confirmAction(msg) {
  return window.confirm(msg || 'Are you sure?');
}

// ── Animate a number from 0 to target ────────────────────────
function animateNumber(el, target, suffix, duration) {
  duration = duration || 1200;
  const startTime = performance.now();
  function update(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);  // ease-out cubic
    el.textContent = Math.floor(ease * target).toLocaleString() + (suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── On DOM ready ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

  // Attach table search if present
  filterTable('adminSearch', 'adminTable');

  // Add a subtle entrance animation to cards
  const cards = document.querySelectorAll('.card, .feature-card, .camp-card, .item-row');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(function(card) {
      card.style.opacity   = '0';
      card.style.transform = 'translateY(16px)';
      card.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      observer.observe(card);
    });
  }

});
