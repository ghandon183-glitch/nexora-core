"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { templates } from "@/lib/data/templates";

const TOTAL = 20;
const MAX_SCROLL = 3000;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
type Spring = { v: number; vel: number };
const S = (v = 0): Spring => ({ v, vel: 0 });
const spring = (s: Spring, target: number, k: number, d: number, dt: number) => { s.vel += (k * (target - s.v) - d * s.vel) * dt; s.v += s.vel * dt; };

export default function Hero() {
  const t = useTranslations("Hero");
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => Array.from({ length: TOTAL }, (_, i) => templates[i % templates.length]), []);

  useEffect(() => {
    const hero = heroRef.current, stage = stageRef.current;
    if (!hero || !stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let vScroll = reduced ? MAX_SCROLL : 0;
    let returnedToTop = window.scrollY <= 2;
    let returnTopStart = performance.now();
    let mouseTarget = 0, last = performance.now(), width = hero.clientWidth, height = hero.clientHeight;
    let phase: "scatter" | "line" | "circle" = reduced ? "circle" : "scatter";
    const morph = S(reduced ? 1 : 0), rotation = S(), mouse = S();
    const scatter = items.map(() => ({ x: (Math.random() - .5) * 1500, y: (Math.random() - .5) * 1000, r: (Math.random() - .5) * 180 }));

    const cards = items.map((p) => {
      const el = document.createElement("a");
      el.className = "nx-card"; el.href = `/templates/${p.slug}`; el.setAttribute("aria-label", `${p.title} — $${p.price}`);
      el.innerHTML = `<span class="nx-card-inner"><span class="nx-face nx-front"><img src="${p.image}" alt="" loading="eager"/><span class="nx-shade"></span><span class="nx-fallback"><b>${p.title}</b><small>${p.category}</small></span></span><span class="nx-face nx-back"><small>${p.category}</small><b>${p.title}</b><em>$${p.price}</em></span></span>`;
      const img = el.querySelector("img"), fallback = el.querySelector(".nx-fallback") as HTMLElement | null;
      img?.addEventListener("error", () => { if (img && fallback) { img.style.display = "none"; fallback.style.display = "flex"; } });
      stage.appendChild(el);
      const c = { el, inner: el.querySelector(".nx-card-inner") as HTMLElement, x: S(), y: S(), r: S(), sc: S(1), o: S(1), ry: S(), hover: false };
      el.addEventListener("pointerenter", () => { c.hover = true; }); el.addEventListener("pointerleave", () => { c.hover = false; });
      return c;
    });

    const intro = hero.querySelector<HTMLElement>("[data-hero-intro]"), title = hero.querySelector<HTMLElement>("[data-hero-title]"), hint = hero.querySelector<HTMLElement>("[data-hero-hint]"), content = hero.querySelector<HTMLElement>("[data-hero-content]");

    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 2) {
        if (!returnedToTop) returnTopStart = performance.now();
        returnedToTop = true; vScroll = 600; rotation.v = 0; rotation.vel = 0;
      } else {
        returnedToTop = false;
        // Native document scrolling is fully in control. Hero only reads scrollY.
        vScroll = clamp(y * 3.75, 0, MAX_SCROLL);
      }
    };
    const onMouseMove = (e: MouseEvent) => { const r = hero.getBoundingClientRect(); mouseTarget = ((e.clientX - r.left) / r.width) * 2 - 1; };
    window.addEventListener("scroll", onScroll, { passive: true });
    hero.addEventListener("mousemove", onMouseMove, { passive: true });
    const resize = () => { width = hero.clientWidth; height = hero.clientHeight; };
    window.addEventListener("resize", resize, { passive: true });
    const ro = "ResizeObserver" in window ? new ResizeObserver(resize) : null; ro?.observe(hero);
    const lineTimer = reduced ? undefined : window.setTimeout(() => { phase = "line"; }, 500);
    const circleTimer = reduced ? undefined : window.setTimeout(() => { phase = "circle"; }, 2500);

    const frame = (now: number) => {
      const dt = clamp((now - last) / 1000, 0, 1 / 30); last = now;
      const W = width, H = height, mobile = W < 768, minDim = Math.min(W, H);
      const mt = clamp(vScroll / 600, 0, 1);
      const idle = returnedToTop && window.scrollY <= 2 ? ((now - returnTopStart) / 1000) * 14 : 0;
      const rt = returnedToTop && window.scrollY <= 2 ? idle : clamp((vScroll - 600) / 2400, 0, 1) * 360;
      if (reduced) { morph.v = mt; rotation.v = rt; mouse.v = mouseTarget * 100; } else { spring(morph, mt, 40, 20, dt); spring(rotation, rt, 40, 20, dt); spring(mouse, mouseTarget * 100, 30, 20, dt); }
      const m = clamp(morph.v, 0, 1), circleR = Math.min(minDim * .35, 350), arcR = Math.min(W, H * 1.5) * (mobile ? 1.4 : 1.1), centerY = H * (mobile ? .35 : .25) + arcR, spread = mobile ? 100 : 130, start = -90 - spread / 2, step = spread / (TOTAL - 1), bounded = clamp(rotation.v / 360, -1, 1) * spread * .8;
      cards.forEach((c, i) => {
        let tx = 0, ty = 0, tr = 0, ts = 1, op = 1;
        if (phase === "scatter") { const p = scatter[i]; tx = p.x; ty = p.y; tr = p.r; ts = .6; op = 0; }
        else if (phase === "line") { const spacing = 70; tx = i * spacing - (TOTAL * spacing) / 2; }
        else { const ca = i / TOTAL * Math.PI * 2, cx = Math.cos(ca) * circleR, cy = Math.sin(ca) * circleR, cr = ca * 180 / Math.PI + 90, aa = (start + i * step + bounded) * Math.PI / 180, ax = Math.cos(aa) * arcR + mouse.v, ay = Math.sin(aa) * arcR + centerY; tx = cx + (ax - cx) * m; ty = cy + (ay - cy) * m; tr = cr + ((start + i * step + bounded + 90) - cr) * m; ts = 1 + (mobile ? .4 : .8) * m; }
        if (reduced) { c.x.v = tx; c.y.v = ty; c.r.v = tr; c.sc.v = ts; c.o.v = op; c.ry.v = c.hover ? 180 : 0; } else { spring(c.x, tx, 40, 15, dt); spring(c.y, ty, 40, 15, dt); spring(c.r, tr, 40, 15, dt); spring(c.sc, ts, 40, 15, dt); spring(c.o, op, 40, 15, dt); spring(c.ry, c.hover ? 180 : 0, 260, 20, dt); }
        c.el.style.transform = `translate3d(${c.x.v}px,${c.y.v}px,0) rotate(${c.r.v}deg) scale(${Math.max(c.sc.v,.001)})`; c.el.style.opacity = String(clamp(c.o.v, 0, 1)); c.inner.style.transform = `rotateY(${c.ry.v}deg)`;
      });
      const introOp = phase === "circle" && m < .5 && !returnedToTop ? clamp(1 - m * 2, 0, 1) : 0;
      if (intro) intro.style.opacity = String(introOp); if (title) { title.style.opacity = String(introOp); title.style.filter = `blur(${clamp(10 - introOp * 10, 0, 10)}px)`; } if (hint) hint.style.opacity = String(introOp * .5);
      if (content) content.style.opacity = returnedToTop ? "1" : String(clamp((m - .8) / .2, 0, 1));
      requestAnimationFrame(frame);
    };
    onScroll(); requestAnimationFrame(frame);
    return () => { if (lineTimer) clearTimeout(lineTimer); if (circleTimer) clearTimeout(circleTimer); ro?.disconnect(); window.removeEventListener("resize", resize); window.removeEventListener("scroll", onScroll); hero.removeEventListener("mousemove", onMouseMove); cards.forEach((c) => c.el.remove()); };
  }, [items]);

  return <>
    <section ref={heroRef} id="top" className="nx-hero" aria-label="NEXORA premium Next.js templates">
      <div className="nx-hero-glow" aria-hidden="true"/><div className="nx-hero-ghost" aria-hidden="true">Templates</div>
      <div className="nx-hero-inner">
        <div className="nx-intro" data-hero-intro aria-hidden="true"><span className="nx-eyebrow">✦ PREMIUM NEXT.JS TEMPLATES</span><h1 data-hero-title>NE<em>X</em>ORA</h1><span className="nx-hint" data-hero-hint>✦ SCROLL TO EXPLORE</span></div>
        <div className="nx-arc-content" data-hero-content><span className="nx-eyebrow">✦ PREMIUM NEXT.JS TEMPLATES</span><h2>Build faster. <em>Launch better.</em></h2><p>{t("description")}</p><div className="nx-actions"><Link href="/templates" className="nx-btn">{t("exploreTemplates")} <span>→</span></Link><Link href="/templates" className="nx-btn nx-btn-ghost">View Collection <span>↓</span></Link></div></div>
        <div ref={stageRef} className="nx-stage" aria-label="NEXORA template cards"/>
      </div>
    </section>
    <style jsx global>{`
      .nx-hero{position:relative;width:100%;height:100vh;height:100svh;background:#180f05;color:#f6efe1;overflow:hidden}.nx-hero:before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:radial-gradient(115% 90% at 50% 50%,transparent 45%,rgba(8,4,0,.68) 100%)}.nx-hero-glow{position:absolute;inset:-12%;z-index:0;pointer-events:none;background:radial-gradient(46% 38% at 50% 45%,rgba(201,154,82,.17),transparent 70%),radial-gradient(30% 26% at 82% 86%,rgba(140,92,36,.13),transparent 70%)}.nx-hero-ghost{position:absolute;left:-2vw;bottom:-4vw;z-index:0;font:300 italic clamp(120px,22vw,340px)/1 Georgia,serif;white-space:nowrap;color:transparent;-webkit-text-stroke:1px rgba(246,239,225,.05);pointer-events:none}.nx-hero-inner{position:relative;z-index:4;width:100%;height:100%;perspective:1000px}.nx-intro,.nx-arc-content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none;padding:20px}.nx-intro{z-index:1}.nx-eyebrow{font:500 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.34em;color:#d9b06c}.nx-intro h1{font:500 clamp(3.6rem,12vw,9rem)/.95 Georgia,serif;letter-spacing:-.04em;margin:18px 0 0;color:#f6efe1}.nx-intro h1 em,.nx-arc-content h2 em{font-style:italic;color:#d9b06c}.nx-hint{margin-top:26px;font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.32em;color:#a89878}.nx-arc-content{z-index:5;justify-content:flex-start;padding-top:clamp(84px,10%,140px)}.nx-arc-content h2{font:400 clamp(2rem,4.5vw,3.4rem)/1.12 Georgia,serif;letter-spacing:-.02em;margin:16px 0 0}.nx-arc-content p{max-width:560px;margin:16px 0 0;font:400 14.5px/1.75 ui-sans-serif,system-ui,sans-serif;color:#b6a888}.nx-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:26px;pointer-events:auto}.nx-btn{display:inline-flex;align-items:center;gap:10px;border-radius:999px;padding:15px 28px;background:#b98a45;color:#1b1002;border:1px solid transparent;font:600 14px/1 ui-sans-serif,system-ui,sans-serif;transition:.35s}.nx-btn:hover{background:#d9b06c;transform:translateY(-2px);box-shadow:0 18px 40px -16px rgba(185,138,69,.55)}.nx-btn-ghost{background:transparent;color:#f6efe1;border-color:rgba(246,239,225,.3)}.nx-btn-ghost:hover{background:rgba(246,239,225,.07);border-color:rgba(246,239,225,.6);box-shadow:none}.nx-stage{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center}.nx-card{position:absolute;left:50%;top:50%;width:60px;height:85px;margin:-42.5px 0 0 -30px;cursor:pointer;will-change:transform,opacity;perspective:1000px;text-decoration:none}.nx-card-inner{position:relative;display:block;width:100%;height:100%;transform-style:preserve-3d}.nx-face{position:absolute;inset:0;display:block;overflow:hidden;border-radius:12px;backface-visibility:hidden}.nx-front{background:#241708;border:1px solid rgba(246,239,225,.18);box-shadow:0 10px 15px -3px rgba(5,3,0,.5)}.nx-front img{width:100%;height:100%;object-fit:cover}.nx-shade{position:absolute;inset:0;background:rgba(10,5,0,.12)}.nx-fallback{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:6px;background:#241708;color:#f6efe1}.nx-fallback b{font:600 9px/1.15 Georgia,serif}.nx-fallback small{margin-top:5px;font:500 6px/1 ui-monospace,monospace;color:#d9b06c;text-transform:uppercase}.nx-back{background:#1e1408;border:1px solid rgba(217,176,108,.4);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px;text-align:center;transform:rotateY(180deg);color:#f6efe1}.nx-back small{font:500 6px/1 ui-monospace,monospace;color:#d9b06c;text-transform:uppercase}.nx-back b{margin-top:5px;font:600 9px/1 Georgia,serif}.nx-back em{margin-top:5px;font:500 8.5px/1 ui-monospace,monospace;color:#d9b06c;font-style:normal}@media(max-width:767px){.nx-arc-content{padding-inline:18px}.nx-arc-content p{font-size:13px}.nx-btn{width:100%;justify-content:center}.nx-actions{width:min(360px,100%)}.nx-card{width:52px;height:74px;margin:-37px 0 0 -26px}}
    `}</style>
  </>;
}
