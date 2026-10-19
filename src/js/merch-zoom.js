// Merchandise magnifier.
// A circular lens follows the pointer over each merch figure and shows the
// design at 2.6x. Also works with tap (touch) and keyboard (focus + arrows).

const MAX_ZOOM = 2.6;

export function initMerchZoom() {
  const figures = document.querySelectorAll("figure.merch-zoom");
  if (!figures.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smooth = reduceMotion ? 1 : 0.38;

  figures.forEach((figure) => {
    if (figure.dataset.zoomReady === "true") return;
    const img = figure.querySelector("img");
    if (!img) return;
    figure.dataset.zoomReady = "true";

    const lens = document.createElement("span");
    lens.className = "merch-zoom-lens";
    lens.setAttribute("aria-hidden", "true");
    const scale = document.createElement("span");
    scale.className = "merch-zoom-scale";
    scale.textContent = `${MAX_ZOOM.toFixed(1)}×`;
    lens.appendChild(scale);

    figure.append(lens);
    figure.setAttribute("tabindex", "0");
    figure.setAttribute("aria-label", `Magnify ${img.alt || "this merchandise design"}`);
    figure.setAttribute("aria-describedby", "merch-zoom-help");

    let active = false;
    let touchHeld = false;
    let rect = null;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let raf = 0;
    let hideTimer = 0;
    let factor = MAX_ZOOM;

    const sizeFor = () => {
      const width = rect ? rect.width : figure.getBoundingClientRect().width;
      return Math.round(Math.max(132, Math.min(196, width * 0.37)));
    };

    const paint = () => {
      raf = 0;
      if (!active || !rect) return;

      x += (targetX - x) * smooth;
      y += (targetY - y) * smooth;

      const size = lens.offsetWidth;
      const half = size / 2;
      const cx = Math.max(0, Math.min(rect.width, x));
      const cy = Math.max(0, Math.min(rect.height, y));

      lens.style.transform = `translate3d(${cx - half}px, ${cy - half}px, 0)`;

      const bgW = rect.width * factor;
      const bgH = rect.height * factor;
      const bgX = Math.max(rect.width - bgW, Math.min(0, -(cx * factor - half)));
      const bgY = Math.max(rect.height - bgH, Math.min(0, -(cy * factor - half)));
      lens.style.backgroundPosition = `${bgX}px ${bgY}px`;

      raf = requestAnimationFrame(paint);
    };

    const show = (clientX, clientY) => {
      window.clearTimeout(hideTimer);
      rect = figure.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      if (!active) {
        active = true;
        x = targetX = px;
        y = targetY = py;
        const size = sizeFor();
        // never upscale the mockup more than ~12%: keeps the lens crisp
        const natural = img.naturalWidth || 900;
        factor = Math.max(1.8, Math.min(MAX_ZOOM, (natural / Math.max(1, rect.width)) * 1.12));
        scale.textContent = `${factor.toFixed(1)}×`;
        lens.style.width = `${size}px`;
        lens.style.height = `${size}px`;
        lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
        lens.style.backgroundSize = `${rect.width * factor}px ${rect.height * factor}px`;
        figure.classList.add("is-zooming");
        if (!raf) raf = requestAnimationFrame(paint);
      } else {
        targetX = px;
        targetY = py;
      }
    };

    const hide = () => {
      active = false;
      figure.classList.remove("is-zooming");
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const scheduleHide = (delay = 2200) => {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (!touchHeld) hide();
      }, delay);
    };

    // Mouse: follow on enter/move, hide on leave.
    figure.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") show(event.clientX, event.clientY);
    });
    figure.addEventListener("pointermove", (event) => {
      if (!active) return;
      if (event.pointerType === "mouse" || touchHeld) show(event.clientX, event.clientY);
    });
    figure.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") hide();
    });

    // Touch: tap to pin the lens, drag to move, auto-hide afterwards.
    figure.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      touchHeld = true;
      show(event.clientX, event.clientY);
      scheduleHide(3200);
    });
    figure.addEventListener("pointerup", (event) => {
      if (event.pointerType === "mouse") return;
      touchHeld = false;
      scheduleHide();
    });
    figure.addEventListener("pointercancel", () => {
      touchHeld = false;
      scheduleHide();
    });

    // Keyboard: focus shows the lens, arrows pan, Escape closes.
    figure.addEventListener("focus", () => {
      // A pointer/tap already placed the lens where the user pointed.
      if (active) return;
      rect = figure.getBoundingClientRect();
      show(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    figure.addEventListener("blur", hide);
    figure.addEventListener("keydown", (event) => {
      if (!active) return;
      if (event.key === "Escape") {
        hide();
        figure.blur();
        return;
      }
      const step = 14;
      const moves = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      targetX = Math.max(0, Math.min(rect.width, targetX + move[0]));
      targetY = Math.max(0, Math.min(rect.height, targetY + move[1]));
    });

    const onScroll = () => {
      if (!active) return;
      // Keyboard focus can scroll the card into view — keep the lens alive and
      // re-measure; pointer/touch lenses should disappear when the page moves.
      if (document.activeElement === figure) {
        rect = figure.getBoundingClientRect();
        return;
      }
      hide();
    };

    window.addEventListener("resize", hide);
    window.addEventListener("scroll", onScroll, { passive: true });
  });
}
