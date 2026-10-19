// Artist spotlight carousel.
import { ARTISTS } from "../data/artists.js";

(function () {
  var artists = ARTISTS;
  var root = document.getElementById('spotlight');
  var grid = document.getElementById('spot-grid');
  var dotsWrap = document.getElementById('spot-dots');
  var status = document.getElementById('spot-status');
  var progress = document.getElementById('spot-progress');
  var prev = document.getElementById('spot-prev');
  var next = document.getElementById('spot-next');
  var toggle = document.getElementById('spot-toggle');
  var region = root ? root.querySelector('[role="region"]') : null;
  if (!root || !grid || !dotsWrap || !artists.length) return;

  var AUTO_MS = 7000;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var noPortrait = { JLEM: true, Vitrum: true, Siklaban: true };
  var order = buildOrder();
  var slides = [];
  var index = 0;
  var per = 3;
  var auto = !reduce.matches;
  var hoverPaused = false;
  var inView = false;
  var elapsed = 0;
  var ticker = null;
  var preloaded = {};

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function buildOrder() {
    var portraits = [];
    var missing = [];
    artists.forEach(function (artist) {
      (noPortrait[artist.name] ? missing : portraits).push(artist);
    });
    shuffle(portraits);
    shuffle(missing);
    var result = portraits.slice();
    var gap = Math.max(2, Math.floor(result.length / (missing.length + 1)));
    missing.forEach(function (artist, i) {
      var pos = Math.min(result.length, gap * (i + 1) + i);
      result.splice(pos, 0, artist);
    });
    return result;
  }

  function perView() {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  }

  function chunk(list, size) {
    var out = [];
    for (var i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    return out;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Picture sources negotiate AVIF/WebP per browser; preload the AVIF sibling so
  // the carousel warms the same URL its <picture> will render.
  function modernSrc(src) {
    return src.replace(/\.(jpe?g|png)$/i, '.avif');
  }

  function mediaPicture(src, alt, width, height, loading) {
    var base = src.replace(/\.(jpe?g|png)$/i, '');
    return '<picture class="contents">' +
      '<source type="image/avif" srcset="' + esc(base) + '.avif" />' +
      '<source type="image/webp" srcset="' + esc(base) + '.webp" />' +
      '<img src="' + esc(src) + '" alt="' + esc(alt) + '" width="' + width + '" height="' + height + '" loading="' + loading + '" decoding="async" />' +
      '</picture>';
  }

  function card(artist) {
    var tracks = artist.tracks && artist.tracks.length
      ? artist.tracks.join(' · ')
      : 'Kalye Class of 2026';
    return '' +
      '<article class="spot-card">' +
        '<div class="spot-media">' +
          mediaPicture(artist.img, 'Artist spotlight: ' + artist.name, 720, 720, 'lazy') +
          '<div class="spot-name">' +
            '<p class="spot-genre">' + esc(artist.genre) + '</p>' +
            '<h4>' + esc(artist.name) + '</h4>' +
          '</div>' +
        '</div>' +
        '<div class="spot-body">' +
          '<p class="spot-bio">' + esc(artist.bio) + '</p>' +
          '<p class="spot-track"><span>On the Kalye Radio playlist</span><br />' + esc(tracks) + '</p>' +
        '</div>' +
      '</article>';
  }

  function rangeLabel(slideIndex) {
    var start = 0;
    for (var i = 0; i < slideIndex; i++) start += slides[i].length;
    var end = start + slides[slideIndex].length;
    return slides[slideIndex].length === 1
      ? 'Artist ' + (start + 1) + ' of ' + artists.length
      : 'Artists ' + (start + 1) + '–' + end + ' of ' + artists.length;
  }

  function updateDots() {
    var buttons = dotsWrap.querySelectorAll('.spot-dot');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-current', i === index ? 'true' : 'false');
    }
  }

  function renderDots() {
    dotsWrap.innerHTML = '';
    slides.forEach(function (slide, i) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'spot-dot';
      button.setAttribute('aria-label', rangeLabel(i));
      button.setAttribute('aria-current', i === index ? 'true' : 'false');
      button.addEventListener('click', function () {
        go(i);
      });
      dotsWrap.appendChild(button);
    });
  }

  function render() {
    var slide = slides[index] || [];
    grid.className = 'spot-grid spot-grid-' + Math.min(per, slide.length);
    grid.innerHTML = slide.map(card).join('');
    if (status) status.textContent = rangeLabel(index);
    updateDots();
    preloadNext();
  }

  function preloadNext() {
    if (!slides.length) return;
    var upcoming = slides[(index + 1) % slides.length] || [];
    upcoming.forEach(function (artist) {
      if (preloaded[artist.img]) return;
      preloaded[artist.img] = true;
      var image = new Image();
      image.src = modernSrc(artist.img);
    });
  }

  function preloadAll() {
    slides.forEach(function (slide) {
      slide.forEach(function (artist) {
        if (preloaded[artist.img]) return;
        preloaded[artist.img] = true;
        var image = new Image();
        image.src = modernSrc(artist.img);
      });
    });
  }

  function resetProgress() {
    elapsed = 0;
    if (progress) progress.style.width = '0%';
  }

  function go(target) {
    if (!slides.length) return;
    index = ((target % slides.length) + slides.length) % slides.length;
    resetProgress();
    render();
  }

  function updateToggle() {
    if (!toggle) return;
    toggle.textContent = auto ? 'Pause auto' : 'Play auto';
    toggle.setAttribute('aria-pressed', auto ? 'false' : 'true');
    toggle.setAttribute('aria-label', auto ? 'Pause automatic artist spotlight' : 'Play automatic artist spotlight');
  }

  function build(keepArtist) {
    var current = keepArtist || (slides[index] ? slides[index][0] : null);
    per = perView();
    slides = chunk(order, per);
    var found = -1;
    if (current) {
      for (var i = 0; i < slides.length; i++) {
        if (slides[i].indexOf(current) !== -1) { found = i; break; }
      }
    }
    index = found >= 0 ? found : 0;
    renderDots();
    render();
  }

  function startTicker() {
    if (ticker) return;
    ticker = window.setInterval(function () {
      if (!auto || hoverPaused || !inView || document.hidden) return;
      elapsed += 100;
      if (progress) progress.style.width = Math.min(100, (elapsed / AUTO_MS) * 100) + '%';
      if (elapsed >= AUTO_MS) {
        elapsed = 0;
        if (progress) progress.style.width = '0%';
        go(index + 1);
      }
    }, 100);
  }

  function manualGo(delta) {
    resetProgress();
    go(index + delta);
  }

  if (prev) prev.addEventListener('click', function () { manualGo(-1); });
  if (next) next.addEventListener('click', function () { manualGo(1); });
  if (toggle) toggle.addEventListener('click', function () {
    auto = !auto;
    resetProgress();
    updateToggle();
  });

  root.addEventListener('mouseenter', function () { hoverPaused = true; });
  root.addEventListener('mouseleave', function () { hoverPaused = false; });
  root.addEventListener('focusin', function () { hoverPaused = true; });
  root.addEventListener('focusout', function (event) {
    if (!root.contains(event.relatedTarget)) hoverPaused = false;
  });

  if (region) {
    region.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); manualGo(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); manualGo(1); }
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) preloadAll();
    }, { threshold: 0.15 }).observe(root);
  } else {
    inView = true;
  }

  if (window.matchMedia) {
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', function (event) {
        auto = !event.matches;
        updateToggle();
        resetProgress();
      });
    }
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      var current = slides[index] ? slides[index][0] : null;
      build(current);
      resetProgress();
    }, 150);
  });

  build(null);
  updateToggle();
  startTicker();
  if (inView) preloadAll();

  window.__spotDebug = {
    artists: artists.length,
    slideCount: function () { return slides.length; },
    current: function () { return index; },
    auto: function () { return auto; },
    next: function () { manualGo(1); }
  };
})();
