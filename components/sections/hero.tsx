"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { templates } from "@/lib/data/templates";

const TOTAL = 20;
const MAX_SCROLL = 3000;
const LINE_AT = 500;
const CIRCLE_AT = 2500;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

type Spring = { v: number; vel: number };
const spring = (s: Spring, target: number, k: number, d: number, dt: number) => {
  s.vel += (k * (target - s.v) - d * s.vel) * dt;
  s.v += s.vel * dt;
};

const S = (v = 0): Spring => ({ v, vel: 0 });

export default function Hero() {
  const t = useTranslations("Hero");
  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const items = useMemo(
    () => Array.from({ length: TOTAL }, (_, i) => templates[i % templates.length]),
    [],
  );

  useEffect(() => {
    const hero = heroRef.current;
    const stage = stageRef.current;
    if (!hero || !stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let phase: "scatter" | "line" | "circle" = reduced ? "circle" : "scatter";
    let vScroll = reduced ? 600 : 0;
    let released = reduced;
    let navOverride = false;
    let returnedToTop = reduced;
    let returnTopStart = performance.now();
    let mouseTarget = 0;
    let lastTime = performance.now();
    let touchY = 0;
    let width = hero.clientWidth;
    let height = hero.clientHeight;

    const morph = S(reduced ? 1 : 0);
    const rotation = S(0);
    const mouse = S(0);

    const scatter = items.map(() => ({
      x: (Math.random() - 0.5) * 1500,
      y: (Math.random() - 0.5) * 1000,
      rotation: (Math.random() - 0.5) * 180,
      scale: 0.6,
      opacity: 0,
    }));

    const cards = items.map((p) => {
      const el = document.createElement("a");
      el.className = "nx-card";
      el.href = `/templates/${p.slug}`;
      el.setAttribute("aria-label", `${p.title} — $${p.price}`);
      el.innerHTML = `
        <span class="nx-card-inner">
          <span class="nx-face nx-front">
            <img src="${p.image}" alt="" loading="eager" decoding="async" />
            <span class="nx-shade"></span>
            <span class="nx-fallback"><b>${p.title}</b><small>${p.category}</small></span>
          </span>
          <span class="nx-face nx-back">
            <small>${p.category}</small><b>${p.title}</b><em>$${p.price}</em>
          </span>
        </span>`;

      const img = el.querySelector("img");
      const fallback = el.querySelector(".nx-fallback") as HTMLElement | null;
      if (img && fallback) {
        img.addEventListener("error", () => {
          img.style.display = "none";
          fallback.style.display = "flex";
        });
      }

      stage.appendChild(el);
      const card = {
        el,
        inner: el.querySelector(".nx-card-inner") as HTMLElement,
        sx: S(),
        sy: S(),
        sr: S(),
        ss: S(1),
        so: S(1),
        ry: S(),
        hover: false,
      };

      el.addEventListener("pointerenter", () => (card.hover = true));
      el.addEventListener("pointerleave", () => (card.hover = false));
      return card;
    });

    const introMain = hero.querySelector<HTMLElement>("[data-hero-intro]");
    const introTitle = hero.querySelector<HTMLElement>("[data-hero-title]");
    const introHint = hero.querySelector<HTMLElement>("[data-hero-hint]");
    const arcContent = hero.querySelector<HTMLElement>("[data-hero-content]");

    const setVScroll = (v: number) => {
      vScroll = clamp(v, 0, MAX_SCROLL);
      released = vScroll >= MAX_SCROLL - 0.5;
    };

    const resetTopPresentation = () => {
      // Restore the cards to a visible, animated arc after returning from
      // the rest of the page. The old 360deg endpoint pushed them off-screen.
      returnedToTop = true;
      returnTopStart = performance.now();
      setVScroll(600);
      rotation.v = 0;
      rotation.vel = 0;
    };

    const onScroll = () => {
      if (navOverride) return;
      if (window.scrollY <= 2 && released) resetTopPresentation();
      if (!released && window.scrollY > 0) window.scrollTo({ top: 0, behavior: "auto" });
    };

    const onWheel = (event: WheelEvent) => {
      const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const atTop = window.scrollY <= 2;
      if (
        atTop &&
        !released &&
        !navOverride &&
        ((dy > 0 && vScroll < MAX_SCROLL) || (dy < 0 && vScroll > 0))
      ) {
        event.preventDefault();
        setVScroll(vScroll + dy);
        returnedToTop = false;
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (window.scrollY > 2 || released || navOverride) return;
      const y = event.touches[0]?.clientY ?? touchY;
      const delta = touchY - y;
      touchY = y;
      if ((delta > 0 && vScroll < MAX_SCROLL) || (delta < 0 && vScroll > 0)) {
        event.preventDefault();
        setVScroll(vScroll + delta * 1.6);
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      mouseTarget = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    };

    const onAnchorClick = () => {
      navOverride = true;
      setVScroll(MAX_SCROLL);
      window.setTimeout(() => {
        navOverride = false;
      }, 120);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    hero.addEventListener("wheel", onWheel, { passive: false });
    hero.addEventListener("touchstart", onTouchStart, { passive: true });
    hero.addEventListener("touchmove", onTouchMove, { passive: false });
    hero.addEventListener("mousemove", onMouseMove, { passive: true });

    const anchors = Array.from(document.querySelectorAll('a[href^="#"]'));
    anchors.forEach((a) => a.addEventListener("click", onAnchorClick));

    const resize = () => {
      width = hero.clientWidth;
      height = hero.clientHeight;
    };
    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(hero);
    window.addEventListener("resize", resize, { passive: true });

    const lineTimer = reduced ? undefined : window.setTimeout(() => (phase = "line"), LINE_AT);
    const circleTimer = reduced ? undefined : window.setTimeout(() => (phase = "circle"), CIRCLE_AT);

    const frame = (now: number) => {
      const dt = clamp((now - lastTime) / 1000, 0, 1 / 30);
      lastTime = now;
      const W = width;
      const H = height;
      const minDim = Math.min(W, H);
      const mobile = W < 768;

      const morphTarget = clamp(vScroll / 600, 0, 1);
      // After the first morph, the page is released. At the top the arc
      // becomes a living loop instead of remaining at the old endpoint.
      const idleRotation =
        returnedToTop && window.scrollY <= 2 ? ((now - returnTopStart) / 1000) * 14 : 0;
      const rotationTarget =
        returnedToTop && window.scrollY <= 2
          ? idleRotation
          : clamp((vScroll - 600) / (MAX_SCROLL - 600), 0, 1) * 360;

      if (reduced) {
        morph.v = morphTarget;
        rotation.v = rotationTarget;
        mouse.v = mouseTarget * 100;
      } else {
        spring(morph, morphTarget, 40, 20, dt);
        spring(rotation, rotationTarget, 40, 20, dt);
        spring(mouse, mouseTarget * 100, 30, 20, dt);
      }

      const m = clamp(morph.v, 0, 1);
      const circleR = Math.min(minDim * 0.35, 350);
      const baseR = Math.min(W, H * 1.5);
      const arcR = baseR * (mobile ? 1.4 : 1.1);
      const centerY = H * (mobile ? 0.35 : 0.25) + arcR;
      const spread = mobile ? 100 : 130;
      const startA = -90 - spread / 2;
      const stepA = spread / (TOTAL - 1);
      const progress = clamp(rotation.v / 360, -1, 1);
      const bounded = progress * spread * 0.8;

      cards.forEach((card, i) => {
        let tx = 0;
        let ty = 0;
        let tr = 0;
        let ts = 1;
        let opacity = 1;

        if (phase === "scatter") {
          const p = scatter[i];
          tx = p.x;
          ty = p.y;
          tr = p.rotation;
          ts = p.scale;
          opacity = p.opacity;
        } else if (phase === "line") {
          const spacing = 70;
          const totalW = TOTAL * spacing;
          tx = i * spacing - totalW / 2;
          ty = 0;
          tr = 0;
          ts = 1;
        } else {
          const circleAngle = (i / TOTAL) * 360;
          const circleRad = (circleAngle * Math.PI) / 180;
          const cx = Math.cos(circleRad) * circleR;
          const cy = Math.sin(circleRad) * circleR;
          const circleRotation = circleAngle + 90;
          const arcAngle = startA + i * stepA + bounded;
          const arcRad = (arcAngle * Math.PI) / 180;
          const ax = Math.cos(arcRad) * arcR + mouse.v;
          const ay = Math.sin(arcRad) * arcR + centerY;
          tx = lerp(cx, ax, m);
          ty = lerp(cy, ay, m);
          tr = lerp(circleRotation, arcAngle + 90, m);
          ts = lerp(1, mobile ? 1.4 : 1.8, m);
        }

        if (reduced) {
          card.sx.v = tx;
          card.sy.v = ty;
          card.sr.v = tr;
          card.ss.v = ts;
          card.so.v = opacity;
          card.ry.v = card.hover ? 180 : 0;
        } else {
          spring(card.sx, tx, 40, 15, dt);
          spring(card.sy, ty, 40, 15, dt);
          spring(card.sr, tr, 40, 15, dt);
          spring(card.ss, ts, 40, 15, dt);
          spring(card.so, opacity, 40, 15, dt);
          spring(card.ry, card.hover ? 180 : 0, 260, 20, dt);
        }

        card.el.style.transform = `translate3d(${card.sx.v.toFixed(2)}px,${card.sy.v.toFixed(2)}px,0) rotate(${card.sr.v.toFixed(2)}deg) scale(${Math.max(card.ss.v, 0.001).toFixed(4)})`;
        card.el.style.opacity = clamp(card.so.v, 0, 1).toFixed(3);
        card.inner.style.transform = `rotateY(${card.ry.v.toFixed(2)}deg)`;
      });

      const introOn = phase === "circle" && m < 0.5 && !returnedToTop;
      const introOpacity = introOn ? clamp(1 - m * 2, 0, 1) : 0;
      const hintOpacity = introOn ? clamp(0.5 - m, 0, 1) : 0;
      if (introMain) introMain.style.opacity = introOpacity.toFixed(3);
      if (introTitle) {
        introTitle.style.opacity = introOpacity.toFixed(3);
        introTitle.style.filter = `blur(${clamp(10 - introOpacity * 10, 0, 10).toFixed(2)}px)`;
      }
      if (introHint) introHint.style.opacity = hintOpacity.toFixed(3);

      const contentOpacity = clamp((m - 0.8) / 0.2, 0, 1);
      if (arcContent) {
        arcContent.style.opacity = returnedToTop ? "1" : contentOpacity.toFixed(3);
        arcContent.style.transform = returnedToTop
          ? "translateY(0)"
          : `translateY(${((1 - contentOpacity) * 20).toFixed(2)}px)`;
      }

      requestAnimationFrame(frame);
    };

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(frame);

    return () => {
      if (lineTimer) window.clearTimeout(lineTimer);
      if (circleTimer) window.clearTimeout(circleTimer);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      hero.removeEventListener("wheel", onWheel);
      hero.removeEventListener("touchstart", onTouchStart);
      hero.removeEventListener("touchmove", onTouchMove);
      hero.removeEventListener("mousemove", onMouseMove);
      anchors.forEach((a) => a.removeEventListener("click", onAnchorClick));
      cards.forEach((card) => card.el.remove());
    };
  }, [items]);

  return (
    <>
      <section ref={heroRef} id="top" className="nx-hero" aria-label="NEXORA premium Next.js templates">
        <div className="nx-hero-glow" aria-hidden="true" />
        <div className="nx-hero-ghost" aria-hidden="true">Templates</div>
        <div className="nx-hero-inner">
          <div className="nx-intro" data-hero-intro aria-hidden="true">
            <span className="nx-eyebrow">✦ PREMIUM NEXT.JS TEMPLATES</span>
            <h1 data-hero-title>NE<em>X</em>ORA</h1>
            <span className="nx-hint" data-hero-hint>✦ SCROLL TO EXPLORE</span>
          </div>
          <div className="nx-arc-content" data-hero-content>
            <span className="nx-eyebrow">✦ PREMIUM NEXT.JS TEMPLATES</span>
            <h2>Build faster. <em>Launch better.</em></h2>
            <p>{t("description")}</p>
            <div className="nx-actions">
              <Link href="/templates" className="nx-btn">{t("exploreTemplates")} <span>→</span></Link>
              <Link href="/templates" className="nx-btn nx-btn-ghost">View Collection <span>↓</span></Link>
            </div>
          </div>
          <div ref={stageRef} className="nx-stage" aria-label="NEXORA template cards" />
        </div>
      </section>

      <style jsx global>{`
        .nx-hero{position:relative;width:100%;height:100vh;height:100svh;background:#180f05;color:#f6efe1;overflow:hidden;overscroll-behavior:none}
        .nx-hero:before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:radial-gradient(115% 90% at 50% 50%,transparent 45%,rgba(8,4,0,.68) 100%)}
        .nx-hero-glow{position:absolute;inset:-12%;z-index:0;pointer-events:none;background:radial-gradient(46% 38% at 50% 45%,rgba(201,154,82,.17),transparent 70%),radial-gradient(30% 26% at 82% 86%,rgba(140,92,36,.13),transparent 70%),radial-gradient(26% 22% at 12% 16%,rgba(120,80,32,.11),transparent 70%)}
        .nx-hero-ghost{position:absolute;left:-2vw;bottom:-4vw;z-index:0;font:300 italic clamp(120px,22vw,340px)/1 Georgia,serif;letter-spacing:-.02em;white-space:nowrap;color:transparent;-webkit-text-stroke:1px rgba(246,239,225,.05);pointer-events:none;user-select:none}
        .nx-hero-inner{position:relative;z-index:4;width:100%;height:100%;perspective:1000px}
        .nx-intro,.nx-arc-content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none;padding:20px}
        .nx-intro{z-index:1}
        .nx-eyebrow{font:500 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.34em;color:#d9b06c}
        .nx-intro h1{font:500 clamp(3.6rem,12vw,9rem)/.95 Georgia,serif;letter-spacing:-.04em;margin:18px 0 0;color:#f6efe1;transition:opacity .2s ease,filter .2s ease}
        .nx-intro h1 em,.nx-arc-content h2 em{font-style:italic;color:#d9b06c}
        .nx-hint{margin-top:26px;font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.32em;color:#a89878}
        .nx-arc-content{z-index:5;justify-content:flex-start;padding-top:clamp(84px,10%,140px)}
        .nx-arc-content h2{font:400 clamp(2rem,4.5vw,3.4rem)/1.12 Georgia,serif;letter-spacing:-.02em;margin:16px 0 0}
        .nx-arc-content p{max-width:560px;margin:16px 0 0;font:400 14.5px/1.75 ui-sans-serif,system-ui,sans-serif;color:#b6a888}
        .nx-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:26px;pointer-events:auto}
        .nx-btn{display:inline-flex;align-items:center;gap:10px;border-radius:999px;padding:15px 28px;background:#b98a45;color:#1b1002;border:1px solid transparent;font:600 14px/1 ui-sans-serif,system-ui,sans-serif;transition:transform .35s cubic-bezier(.22,1,.36,1),background .35s,box-shadow .35s}
        .nx-btn:hover{background:#d9b06c;transform:translateY(-2px);box-shadow:0 18px 40px -16px rgba(185,138,69,.55)}
        .nx-btn-ghost{background:transparent;color:#f6efe1;border-color:rgba(246,239,225,.3)}
        .nx-btn-ghost:hover{background:rgba(246,239,225,.07);border-color:rgba(246,239,225,.6);box-shadow:none}
        .nx-stage{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center}
        .nx-card{position:absolute;left:50%;top:50%;width:60px;height:85px;margin:-42.5px 0 0 -30px;cursor:pointer;will-change:transform,opacity;perspective:1000px;text-decoration:none}
        .nx-card-inner{position:relative;display:block;width:100%;height:100%;transform-style:preserve-3d;will-change:transform}
        .nx-face{position:absolute;inset:0;display:block;overflow:hidden;border-radius:12px;backface-visibility:hidden;-webkit-backface-visibility:hidden}
        .nx-front{background:#241708;border:1px solid rgba(246,239,225,.18);box-shadow:0 10px 15px -3px rgba(5,3,0,.5),0 4px 6px -4px rgba(5,3,0,.4)}
        .nx-card:hover .nx-front{border-color:rgba(217,176,108,.55);box-shadow:0 14px 30px -8px rgba(5,3,0,.6),0 0 0 1px rgba(217,176,108,.35),0 12px 34px -12px rgba(185,138,69,.45)}
        .nx-front img{width:100%;height:100%;object-fit:cover}
        .nx-shade{position:absolute;inset:0;background:rgba(10,5,0,.12);transition:background .25s}
        .nx-card:hover .nx-shade{background:transparent}
        .nx-fallback{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:6px;background:#241708;color:#f6efe1}
        .nx-fallback b{font:600 9px/1.15 Georgia,serif}
        .nx-fallback small{margin-top:5px;font:500 6px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#d9b06c;text-transform:uppercase}
        .nx-back{background:#1e1408;border:1px solid rgba(217,176,108,.4);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px;text-align:center;transform:rotateY(180deg);color:#f6efe1}
        .nx-back small{font:500 6px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:#d9b06c;text-transform:uppercase;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .nx-back b{margin-top:5px;font:600 9px/1 Georgia,serif;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .nx-back em{margin-top:5px;font:500 8.5px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;color:#d9b06c;font-style:normal}
        @media(max-width:767px){.nx-arc-content{padding-inline:18px}.nx-arc-content p{font-size:13px}.nx-btn{width:100%;justify-content:center}.nx-actions{width:min(360px,100%)}.nx-card{width:52px;height:74px;margin:-37px 0 0 -26px}}
        @media(prefers-reduced-motion:reduce){.nx-card,.nx-btn{transition:none!important}}
      `}</style>
    </>
  );
}
