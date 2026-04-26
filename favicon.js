/**
 * Animated favicon — cycles through 5 SVG shapes that pulse in strong orange.
 *
 * Per shape (1.5 s):
 *   - Fade in    (0.2 s)  alpha 0 -> 1
 *   - Hold       (1.0 s)  glow and brightness ramp up linearly
 *   - Fade out   (0.3 s)  alpha 1 -> 0
 *
 * - Drawn on canvas, SVG sources loaded as <img>.
 * - Pauses while the tab is hidden.
 * - Respects prefers-reduced-motion (shows a static glowing shape1 instead).
 * - Throttled to ~15 fps.
 *
 * Note: when running from file:// some browsers may block canvas.toDataURL()
 * after drawing same-origin SVGs. Serve the site over a local HTTP server
 * (e.g. `python -m http.server`) if the favicon stops updating.
 */
(function () {
    'use strict';

    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }

    const SIZE = 64; // canvas resolution; browser scales to 16/32 favicon size
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    // ---- Timing ---------------------------------------------------------------
    const PHASE_IN = 200;
    const PHASE_HOLD = 1000;
    const PHASE_OUT = 300;
    const SHAPE_MS = PHASE_IN + PHASE_HOLD + PHASE_OUT; // 1500
    const SHAPE_SRCS = [
        'shape1.svg',
        'shape2.svg',
        'shape3.svg',
        'shape4.svg',
        'shape5.svg'
    ];
    const CYCLE_MS = SHAPE_MS * SHAPE_SRCS.length;

    // ---- Color (matches site brand orange) ------------------------------------
    const ORANGE = 'rgba(255, 90, 0, 1)';

    function lerp(a, b, t) { return a + (b - a) * t; }

    // ---- Preload images -------------------------------------------------------
    const images = SHAPE_SRCS.map(src => {
        const img = new Image();
        img.src = src;
        return img;
    });

    function imagesReady() {
        return Promise.all(images.map(img =>
            img.complete && img.naturalWidth
                ? Promise.resolve()
                : new Promise(res => {
                    img.onload = res;
                    img.onerror = res;
                })
        ));
    }

    function drawShape(img, alpha, intensity) {
        ctx.clearRect(0, 0, SIZE, SIZE);
        if (alpha <= 0 || !img || !img.naturalWidth) {
            try { link.href = canvas.toDataURL('image/png'); } catch (_) { }
            return;
        }

        ctx.globalAlpha = alpha;
        ctx.shadowColor = ORANGE;
        ctx.shadowBlur = lerp(2, 18, intensity);

        // Brightness ramps up during hold for the same "swelling" feel.
        if ('filter' in ctx) {
            ctx.filter = `brightness(${(1 + intensity * 0.4).toFixed(2)})`;
        }

        ctx.drawImage(img, 0, 0, SIZE, SIZE);

        if ('filter' in ctx) ctx.filter = 'none';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        try { link.href = canvas.toDataURL('image/png'); } catch (_) { }
    }

    function renderFrame(elapsed) {
        const safe = Math.max(0, elapsed);
        const phase = safe % CYCLE_MS;
        const idx = Math.floor(phase / SHAPE_MS) % SHAPE_SRCS.length;
        const t = phase - idx * SHAPE_MS; // 0..SHAPE_MS within current shape
        const img = images[idx];

        let alpha, intensity;
        if (t < PHASE_IN) {
            alpha = t / PHASE_IN;
            intensity = 0;
        } else if (t < PHASE_IN + PHASE_HOLD) {
            alpha = 1;
            intensity = (t - PHASE_IN) / PHASE_HOLD; // 0 -> 1 linearly
        } else {
            alpha = 1 - (t - PHASE_IN - PHASE_HOLD) / PHASE_OUT;
            intensity = 1; // glow stays at peak as it fades out
        }

        drawShape(img, alpha, intensity);
    }

    function renderStatic() {
        // For reduced-motion users: a steady, mid-glow shape1.
        drawShape(images[0], 1, 0.5);
    }

    // ---- Main loop ------------------------------------------------------------
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animating = false;

    function startAnimation() {
        if (animating) return;
        animating = true;

        const FPS = 15;
        const FRAME_MS = 1000 / FPS;
        const startTime = performance.now();
        let lastFrame = 0;

        function loop(now) {
            if (!animating) return;
            if (document.hidden) {
                requestAnimationFrame(loop);
                return;
            }
            if (now - lastFrame >= FRAME_MS) {
                lastFrame = now;
                renderFrame(now - startTime);
            }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    function stopAnimation() {
        animating = false;
        renderStatic();
    }

    imagesReady().then(() => {
        if (reduceMotion.matches) renderStatic();
        else startAnimation();
    });

    reduceMotion.addEventListener('change', (e) => {
        if (e.matches) stopAnimation();
        else startAnimation();
    });
})();
