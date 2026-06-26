/**
 * Mobile slide-in menu (BRIEF §11) — accessible hamburger nav for ≤860px.
 * ===========================================================================
 * Zero library. The open/close *visual* is 100% CSS (transform + opacity, see
 * layout.css `.mobile-menu`); this module only manages the accessible state:
 *   • aria-expanded on the trigger, toggled with the menu,
 *   • focus moves into the panel on open, returns to the trigger on close,
 *   • a focus trap keeps Tab within the panel while open,
 *   • Escape closes; backdrop / close button / any link tap closes,
 *   • <html> scroll is locked while open (CSS `.is-menu-open`),
 *   • crossing back to the desktop breakpoint force-closes so no state leaks.
 * It never touches the pricing odometer or the bento context lock.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function mountNav() {
  const trigger = document.querySelector('.nav__burger');
  const menu = document.getElementById('mobile-menu');
  if (!trigger || !menu) return;

  const panel = menu.querySelector('.mobile-menu__panel');
  const closeBtn = menu.querySelector('.mobile-menu__close');
  const desktop = window.matchMedia('(min-width: 861px)');
  let isOpen = false;
  let lastFocus = null;

  // Only the currently-visible focusables inside the panel (drops anything a
  // breakpoint may have hidden).
  const focusables = () =>
    Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.getClientRects().length > 0,
    );

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-label', 'Close menu');
    document.documentElement.classList.add('is-menu-open');
    if (closeBtn) closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    menu.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Open menu');
    document.documentElement.classList.remove('is-menu-open');
    document.removeEventListener('keydown', onKeydown);
    // Return focus to the trigger that owns the menu (WAI-ARIA menu-button
    // pattern). If a resize to desktop has hidden it, fall back to wherever
    // focus was before opening.
    if (trigger.offsetParent !== null) trigger.focus();
    else if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    // Wrap focus at both ends of the panel.
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  trigger.addEventListener('click', () => (isOpen ? close() : open()));

  // Backdrop, the close button, and any nav link all dismiss the menu.
  menu.addEventListener('click', (e) => {
    if (e.target.closest('[data-menu-close], [data-menu-link]')) close();
  });

  // Never let an open menu linger once we're back on the desktop layout.
  desktop.addEventListener('change', (e) => {
    if (e.matches) close();
  });
}
