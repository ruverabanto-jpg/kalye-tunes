// Header, mobile menu, active nav, scroll progress, toast, share, back-to-top.
(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const header = document.getElementById('site-header');
      const progress = document.getElementById('scroll-progress');
      const menuToggle = document.getElementById('menu-toggle');
      const mobileMenu = document.getElementById('mobile-menu');
      const menuLabel = document.getElementById('menu-label');
      const mainContent = document.getElementById('main');
      const toast = document.getElementById('toast');
      const toastLabel = document.getElementById('toast-label');
      const toastMessage = document.getElementById('toast-message');
      const toastClose = document.getElementById('toast-close');
      const backTop = document.getElementById('back-top');
      const shareBtn = document.getElementById('share-btn');
      const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
      const sections = ['lineup', 'advocacy', 'hosts', 'updates', 'guide', 'tickets']
        .map((id) => document.getElementById(id))
        .filter(Boolean);

      let menuOpen = false;
      let lastFocused = null;
      let toastTimer;

      /* ---------- Scroll UI: header state, progress, back-to-top, active nav ---------- */
      function updateActiveNav() {
        const marker = window.innerHeight * 0.38;
        let currentSection = null;

        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          if (rect.top <= marker && rect.bottom > marker) currentSection = section.id;
        });

        navLinks.forEach((link) => {
          if (currentSection !== null && link.dataset.nav === currentSection) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      }

      function updateScrollUI() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const percent = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;

        header.classList.toggle('scrolled', scrollTop > 24);
        progress.style.width = Math.min(100, Math.max(0, percent)) + '%';
        backTop.classList.toggle('is-visible', scrollTop > 640);
        updateActiveNav();
      }

      let scrollTicking = false;
      window.addEventListener('scroll', () => {
        if (!scrollTicking) {
          window.requestAnimationFrame(() => {
            updateScrollUI();
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      }, { passive: true });

      window.addEventListener('resize', updateScrollUI, { passive: true });
      updateScrollUI();

      /* ---------- Mobile menu (focus trap + scroll lock) ---------- */
      const getMenuFocusables = () => Array.from(
        mobileMenu.querySelectorAll('a[href], button:not([disabled])')
      ).filter((el) => el.offsetParent !== null);

      function setMenu(open) {
        if (open === menuOpen) return;
        menuOpen = open;

        document.body.classList.toggle('menu-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        menuLabel.textContent = open ? 'Close' : 'Menu';
        mobileMenu.setAttribute('aria-hidden', String(!open));

        if (open) {
          lastFocused = document.activeElement;
          mobileMenu.removeAttribute('inert');
          mainContent.inert = true;
          const focusables = getMenuFocusables();
          if (focusables.length) focusables[0].focus({ preventScroll: true });
        } else {
          mobileMenu.setAttribute('inert', '');
          mainContent.inert = false;
          if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus({ preventScroll: true });
          }
          lastFocused = null;
        }
      }

      menuToggle.addEventListener('click', () => setMenu(!menuOpen));

      mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenu(false));
      });

      document.addEventListener('keydown', (event) => {
        if (!menuOpen) return;

        if (event.key === 'Escape') {
          event.preventDefault();
          setMenu(false);
          return;
        }

        if (event.key === 'Tab') {
          const focusables = getMenuFocusables();
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      });

      window.addEventListener('resize', () => {
        if (menuOpen && window.innerWidth >= 1024) setMenu(false);
      }, { passive: true });

      /* ---------- Smooth scrolling with sticky-header offset ---------- */
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
          const hash = anchor.getAttribute('href');
          if (!hash || hash === '#') return;

          const target = document.querySelector(hash);
          if (!target) return;

          event.preventDefault();

          if (menuOpen) setMenu(false);

          const offset = hash === '#home' ? 0 : (window.innerWidth >= 768 ? 78 : 66);
          const top = target.getBoundingClientRect().top + window.scrollY - offset;

          window.scrollTo({
            top: Math.max(0, top),
            behavior: reduceMotion ? 'auto' : 'smooth'
          });

          if (hash === '#main') target.focus({ preventScroll: true });

          if (history.pushState) history.pushState(null, '', hash);
        });
      });

      /* ---------- Scroll reveal ---------- */
      const revealItems = document.querySelectorAll('.reveal');

      if ('IntersectionObserver' in window && !reduceMotion) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

        revealItems.forEach((item) => revealObserver.observe(item));
      } else {
        revealItems.forEach((item) => item.classList.add('is-visible'));
      }

      /* ---------- Toast ---------- */
      function showToast(message, label) {
        window.clearTimeout(toastTimer);
        toastMessage.textContent = message;
        toastLabel.textContent = label || 'System message';
        toast.classList.add('is-visible');
        toastTimer = window.setTimeout(() => {
          toast.classList.remove('is-visible');
        }, 5600);
      }


      toastClose.addEventListener('click', () => {
        window.clearTimeout(toastTimer);
        toast.classList.remove('is-visible');
      });

      /* ---------- Share (QOL) ---------- */
      if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
          const shareData = {
            title: 'Kalye Tunes 2026 — UP Fair Wednesday',
            text: 'Isang gabi ng hiphop at OPM para sa maralitang lungsod. Apr 15, 2026 · UP Diliman Sunken Garden.',
            url: window.location.href
          };

          try {
            if (navigator.share) {
              await navigator.share(shareData);
              return;
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(window.location.href);
              showToast('Page link copied. Send it to your barkada.', 'Link copied');
              return;
            }
            throw new Error('Clipboard unavailable');
          } catch (error) {
            if (error && error.name === 'AbortError') return;
            showToast('Copy this link: ' + window.location.href, 'Share');
          }
        });
      }

      /* ---------- Back to top (QOL) ---------- */
      backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        mainContent.focus({ preventScroll: true });
      });

      /* ---------- Floating radio reveal ----------
         On phones/tablets the fixed player would sit on top of the hero details,
         so it only fades in once the poster has been scrolled past; desktop keeps
         it on screen from the start. The player markup is parsed after this
         script, so wait for the document to be ready. */
      document.addEventListener('DOMContentLoaded', () => {
        const player = document.getElementById('kalye-radio');
        if (!player) return;
        const compact = window.matchMedia('(max-width: 1023px)');
        let queued = false;
        const syncReveal = () => {
          queued = false;
          player.classList.toggle('is-revealed', !compact.matches || window.scrollY > window.innerHeight * 0.45);
        };
        const queueSync = () => {
          if (queued) return;
          queued = true;
          window.requestAnimationFrame(syncReveal);
        };
        window.addEventListener('scroll', queueSync, { passive: true });
        window.addEventListener('resize', queueSync);
        if (compact.addEventListener) compact.addEventListener('change', queueSync);
        syncReveal();
      }, { once: true });
    })();
