// Kalye Radio: floating player, 30s previews, queue and seek bar.
import { PLAYLIST_URL, TRACKS } from "../data/tracks.js";

(() => {
                  const $ = (id) => document.getElementById(id);
      const els = {
        panel: $('soundtrack'), vinyl: $('vinyl'), eq: $('np-eq'),
        title: $('np-title'), artist: $('np-artist'), explicit: $('np-explicit'),
        stats: $('np-stats'), seek: $('np-seek'), current: $('np-current'),
        duration: $('np-duration'), play: $('np-play'),
        playIcon: $('np-icon-play'), pauseIcon: $('np-icon-pause'),
        prev: $('np-prev'), next: $('np-next'), shuffle: $('np-shuffle'),
        repeat: $('np-repeat'), like: $('np-like'), queue: $('np-queue'),
        volume: $('np-volume'), state: $('np-state')
      };
      if (!els.panel) return;

      const pool = TRACKS.filter((t) => t.p);
      const normalize = (name) => name.trim().toLowerCase().replace(/\s+/g, ' ');
      const artistSet = (t) => new Set(t.a.split(',').map(normalize).filter(Boolean));
      const artistUniverse = new Set();
      TRACKS.forEach((t) => {
        t._a = artistSet(t);
        t._a.forEach((a) => artistUniverse.add(a));
      });
      const sharesArtist = (a, b) => {
        if (!a || !b) return false;
        for (const name of a._a) if (b._a.has(name)) return true;
        return false;
      };

      function shuffledQueue(seed) {
        const remaining = pool.filter((t) => !seed || t.id !== seed.id);
        const out = seed ? [seed] : [];
        let prev = seed || null;
        while (remaining.length) {
          const ok = remaining.filter((t) => !prev || !sharesArtist(t, prev));
          const choices = ok.length ? ok : remaining;
          const pick = choices[Math.floor(Math.random() * choices.length)];
          out.push(pick);
          remaining.splice(remaining.indexOf(pick), 1);
          prev = pick;
        }
        // Keep the queue loop clean: the last track must not share an artist with the first.
        if (out.length > 3 && sharesArtist(out[out.length - 1], out[0])) {
          for (let i = 1; i < out.length - 2; i++) {
            const candidate = out[out.length - 1];
            if (!sharesArtist(candidate, out[i - 1]) &&
                !sharesArtist(candidate, out[i + 1]) &&
                !sharesArtist(out[i], out[out.length - 2]) &&
                !sharesArtist(out[i], out[0])) {
              [out[i], out[out.length - 1]] = [out[out.length - 1], out[i]];
              break;
            }
          }
        }
        return out;
      }

      let queue = shuffledQueue();
      let index = 0;
      let playing = false;
      let repeatOn = true;
      let resumeOnVisible = false;
      let failures = 0;
      let fadeTimer = null;

      const audio = new Audio();
      audio.preload = 'auto';

      let targetVolume = 0.35;
      try {
        const stored = parseFloat(localStorage.getItem('kt-volume'));
        if (isFinite(stored)) targetVolume = Math.min(0.9, Math.max(0, stored));
      } catch (error) { /* storage unavailable */ }
      audio.volume = targetVolume;
      els.volume.value = String(Math.round(targetVolume * 100));

      const current = () => queue[index];

      function fmt(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '0:00';
        const total = Math.floor(seconds);
        return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
      }

      function esc(value) {
        return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
      }

      function paintQueue() {
        const rows = [];
        for (let offset = 1; offset <= 3; offset++) {
          const track = queue[(index + offset) % queue.length];
          if (!track) continue;
          rows.push(
            '<li class="flex items-start gap-2">' +
              '<span class="text-cyan">0' + offset + '</span>' +
              '<span class="min-w-0">' +
                '<span class="block truncate text-white/80">' + esc(track.t) + '</span>' +
                '<span class="block truncate text-[9px] uppercase tracking-[0.12em] text-gray-400">' + esc(track.a) + '</span>' +
              '</span>' +
            '</li>'
          );
        }
        els.queue.innerHTML = rows.join('');
      }

      function paint(track) {
        els.title.textContent = track.t;
        els.artist.textContent = track.a;
        els.explicit.style.visibility = track.e ? 'visible' : 'hidden';
        els.explicit.setAttribute('aria-hidden', track.e ? 'false' : 'true');
        els.like.href = 'https://open.spotify.com/track/' + track.id;
        els.like.setAttribute('aria-label', 'Open ' + track.t + ' on Spotify');
        els.current.textContent = '0:00';
        els.duration.textContent = '0:30';
        els.seek.max = '30';
        els.seek.value = '0';
        els.seek.style.setProperty('--progress', '0%');
        const miniTitle = $('kt-mini-title');
        const miniArtist = $('kt-mini-artist');
        if (miniTitle) miniTitle.textContent = track.t;
        if (miniArtist) miniArtist.textContent = track.a;
        paintQueue();
      }

      function updatePlayingUI() {
        els.panel.classList.toggle('is-playing', playing);
        els.vinyl.classList.toggle('is-spinning', playing);
        els.eq.classList.toggle('is-live', playing);
        els.state.textContent = playing ? 'Playing' : 'Paused';
        els.play.setAttribute('aria-label', playing ? 'Pause soundtrack' : 'Play soundtrack');
        els.playIcon.classList.toggle('hidden', playing);
        els.pauseIcon.classList.toggle('hidden', !playing);
        const radio = $('kalye-radio');
        if (radio) radio.classList.toggle('is-playing', playing);
        const miniPlay = $('np-mini-play');
        if (miniPlay) miniPlay.setAttribute('aria-label', playing ? 'Pause soundtrack' : 'Play soundtrack');
        const miniPlayIcon = $('np-mini-icon-play');
        const miniPauseIcon = $('np-mini-icon-pause');
        if (miniPlayIcon) miniPlayIcon.classList.toggle('hidden', playing);
        if (miniPauseIcon) miniPauseIcon.classList.toggle('hidden', !playing);
      }

      function fadeIn() {
        if (fadeTimer) clearInterval(fadeTimer);
        audio.volume = 0;
        const started = performance.now();
        fadeTimer = setInterval(() => {
          const progress = Math.min(1, (performance.now() - started) / 600);
          audio.volume = targetVolume * progress;
          if (progress === 1) { clearInterval(fadeTimer); fadeTimer = null; }
        }, 40);
      }

      function playCurrent() {
        if (!audio.src) { load(0, true); return; }
        audio.play().then(() => {
          playing = true;
          updatePlayingUI();
          fadeIn();
        }).catch(() => {
          playing = false;
          updatePlayingUI();
          if (audio.error) els.state.textContent = 'Preview unavailable';
        });
      }

      function load(nextIndex, autoplay) {
        if (!queue.length) return;
        index = (nextIndex + queue.length) % queue.length;
        const track = current();
        if (!track) return;
        audio.pause();
        audio.src = track.p;
        audio.load();
        paint(track);
        // Keep the current play state stable while switching tracks: never
        // flip to "Paused" (or "Playing") before audio.play() actually resolves.
        if (!autoplay) playing = false;
        updatePlayingUI();
        if (autoplay) playCurrent();
      }

      function togglePlay() {
        if (!audio.src) { load(0, true); return; }
        if (audio.paused) {
          playCurrent();
        } else {
          audio.pause();
          playing = false;
          updatePlayingUI();
        }
      }

      function nextTrack() {
        const wasPlaying = playing;
        if (index + 1 >= queue.length && !repeatOn && wasPlaying) {
          audio.pause();
          playing = false;
          updatePlayingUI();
          return;
        }
        load(index + 1, wasPlaying);
      }

      function previousTrack() {
        const wasPlaying = playing;
        if (audio.currentTime > 3) { audio.currentTime = 0; return; }
        load(index - 1, wasPlaying);
      }

      audio.addEventListener('timeupdate', () => {
        const total = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 30;
        const position = audio.currentTime || 0;
        els.current.textContent = fmt(position);
        els.duration.textContent = fmt(total);
        els.seek.max = String(total);
        if (document.activeElement !== els.seek) els.seek.value = String(position);
        els.seek.style.setProperty('--progress', ((position / total) * 100).toFixed(2) + '%');
      });

      audio.addEventListener('loadedmetadata', () => {
        if (isFinite(audio.duration)) els.seek.max = String(audio.duration);
      });

      audio.addEventListener('playing', () => { failures = 0; });
      audio.addEventListener('ended', nextTrack);
      audio.addEventListener('error', () => {
        failures += 1;
        playing = false;
        updatePlayingUI();
        els.state.textContent = 'Preview unavailable';
      });

      els.play.addEventListener('click', togglePlay);
      els.next.addEventListener('click', nextTrack);
      els.prev.addEventListener('click', previousTrack);

      const miniPlay = $('np-mini-play');
      if (miniPlay) miniPlay.addEventListener('click', togglePlay);

      const radio = $('kalye-radio');
      const radioPanel = $('soundtrack');
      const radioMini = $('kt-mini');
      const radioOpen = $('kt-open');
      const radioClose = $('kt-close');

      function setRadioOpen(open) {
        if (!radio || !radioPanel || !radioMini) return;
        radio.classList.toggle('is-open', open);
        radioPanel.classList.toggle('hidden', !open);
        radioMini.classList.toggle('hidden', open);
        if (radioOpen) radioOpen.setAttribute('aria-expanded', String(open));
        if (open) radioPanel.scrollTop = 0;
      }

      if (radioOpen) radioOpen.addEventListener('click', () => setRadioOpen(true));
      if (radioClose) radioClose.addEventListener('click', () => {
        setRadioOpen(false);
        if (radioOpen) radioOpen.focus();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && radio && radio.classList.contains('is-open')) {
          setRadioOpen(false);
          if (radioOpen) radioOpen.focus();
        }
      });

      els.shuffle.addEventListener('click', () => {
        const track = current();
        queue = shuffledQueue(track);
        index = 0;
        paintQueue();
      });

      els.repeat.addEventListener('click', () => {
        repeatOn = !repeatOn;
        els.repeat.classList.toggle('is-on', repeatOn);
        els.repeat.setAttribute('aria-pressed', String(repeatOn));
      });

      els.seek.addEventListener('input', () => {
        if (audio.src) audio.currentTime = Number(els.seek.value) || 0;
      });

      els.volume.addEventListener('input', () => {
        targetVolume = Math.min(0.9, Math.max(0, Number(els.volume.value) / 100));
        if (!fadeTimer) audio.volume = targetVolume;
        try { localStorage.setItem('kt-volume', String(targetVolume)); } catch (error) { /* ignore */ }
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          resumeOnVisible = playing;
          if (playing) {
            audio.pause();
            playing = false;
            updatePlayingUI();
          }
        } else if (resumeOnVisible) {
          resumeOnVisible = false;
          playCurrent();
        }
      });

      els.stats.textContent = TRACKS.length + ' tracks · ' + artistUniverse.size + ' artists';
      els.like.href = PLAYLIST_URL;
      paint(queue[0]);
      updatePlayingUI();

      if (new URLSearchParams(location.search).has('kt-debug')) {
        window.__ktDebug = {
          poolSize: pool.length,
          artists: artistUniverse.size,
          queue: () => queue.map((t) => ({ id: t.id, title: t.t, artists: t.a })),
          adjacencyViolations: () => {
            const found = [];
            for (let i = 0; i < queue.length; i++) {
              const a = queue[i];
              const b = queue[(i + 1) % queue.length];
              if (sharesArtist(a, b)) found.push(i + ':' + a.t + ' -> ' + b.t);
            }
            return found;
          },
          state: () => ({
            playing: playing,
            index: index,
            queueLength: queue.length,
            title: current().t,
            artists: current().a,
            audioPaused: audio.paused,
            audioTime: audio.currentTime,
            audioReady: audio.readyState,
            audioError: audio.error ? audio.error.code : null
          }),
          play: playCurrent,
          next: nextTrack
        };
      }
    })();
