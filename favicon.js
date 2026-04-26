/**
 * Animated favicon — alternating "D" / "R" letters that pulse in strong orange.
 *
 * Per letter (1.5 s):
 *   - Fade in    (0.2 s)  alpha 0 -> 1
 *   - Hold       (1.0 s)  brightness, glow, and stroke thickness ramp up linearly
 *   - Fade out   (0.3 s)  alpha 1 -> 0
 *
 * No movement, just identity-style pulsing. Matches site brand orange.
 *
 * - Drawn on canvas, no image assets.
 * - Pauses while the tab is hidden.
 * - Respects prefers-reduced-motion (shows a static glowing "D" instead).
 * - Throttled to ~15 fps.
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
    const LETTER_MS = PHASE_IN + PHASE_HOLD + PHASE_OUT; // 1500
    const LETTERS = ['D', 'R'];
    const CYCLE_MS = LETTER_MS * LETTERS.length;          // 3000

    // ---- Color (strong orange) ------------------------------------------------
    const ORANGE = { r: 255, g: 90, b: 0 };               // base "strong orange"
    const ORANGE_HOT = { r: 255, g: 190, b: 110 };        // peak (brightened end)

    function lerp(a, b, t) { return a + (b - a) * t; }
    function mix(c1, c2, t) {
        return {
            r: Math.round(lerp(c1.r, c2.r, t)),
            g: Math.round(lerp(c1.g, c2.g, t)),
            b: Math.round(lerp(c1.b, c2.b, t))
        };
    }
    function rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a})`; }

    // ---- Letter styling -------------------------------------------------------
    const FONT_FAMILY = '"Outfit", system-ui, -apple-system, "Segoe UI", sans-serif';
    const FONT_PX = SIZE * 0.92;
    const FONT_WEIGHT = 900;
    const Y_NUDGE = SIZE * 0.04; // canvas baselines render slightly high; nudge down

    function setFont() {
        ctx.font = `${FONT_WEIGHT} ${FONT_PX}px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
    }

    function drawLetter(letter, alpha, intensity) {
        ctx.clearRect(0, 0, SIZE, SIZE);
        if (alpha <= 0) {
            link.href = canvas.toDataURL('image/png');
            return;
        }

        setFont();
        ctx.globalAlpha = alpha;

        // Brightness ramps the fill from base orange toward a hot peak.
        const fill = mix(ORANGE, ORANGE_HOT, intensity * 0.6);

        // Glow grows during hold.
        ctx.shadowColor = rgba(ORANGE, 1);
        ctx.shadowBlur = lerp(2, 18, intensity);

        const cx = SIZE / 2;
        const cy = SIZE / 2 + Y_NUDGE;

        ctx.fillStyle = rgba(fill, 1);
        ctx.fillText(letter, cx, cy);

        // Stroke thickens slightly during hold to reinforce the "swelling" feel.
        if (intensity > 0) {
            ctx.strokeStyle = rgba(fill, 1);
            ctx.lineJoin = 'round';
            ctx.lineWidth = lerp(0, SIZE * 0.05, intensity);
            ctx.strokeText(letter, cx, cy);
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        link.href = canvas.toDataURL('image/png');
    }

    function renderFrame(elapsed) {
        const phase = elapsed % CYCLE_MS;
        const idx = Math.floor(phase / LETTER_MS);
        const t = phase - idx * LETTER_MS; // 0..LETTER_MS within current letter
        const letter = LETTERS[idx];

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

        drawLetter(letter, alpha, intensity);
    }

    function renderStatic() {
        // For reduced-motion users: a steady, mid-glow "D".
        drawLetter('D', 1, 0.5);
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

    // Wait for "Outfit" (and other site fonts) to be ready so the favicon
    // matches the site logo's typography from the very first frame.
    function boot() {
        if (reduceMotion.matches) renderStatic();
        else startAnimation();
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(boot);
    } else {
        boot();
    }

    reduceMotion.addEventListener('change', (e) => {
        if (e.matches) stopAnimation();
        else startAnimation();
    });
})();
