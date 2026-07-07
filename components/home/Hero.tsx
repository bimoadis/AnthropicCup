"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CopyAddress from "@/components/CopyAddress";

const STATEMENTS = [
  { quote: "\u201CArgentina will repeat.\u201D", prob: 17.5, delta: 0.8 },
  { quote: "\u201CGermany dominates.\u201D", prob: 9.1, delta: 0.5 },
  { quote: "\u201CEngland breaks the curse.\u201D", prob: 12.8, delta: 0.2 },
  { quote: "\u201CFrance dominates.\u201D", prob: 15.2, delta: 0.4 },
  { quote: "Everyone has a prediction.", prob: null, delta: 0 },
  { quote: "A billion opinions.", prob: null, delta: 0 },
  { quote: "One probability.", prob: null, delta: 0, italic: true },
] as const;

export default function Hero() {
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const pin = pinRef.current;
    if (!pin) return;

    if (reduced) {
      pin
        .querySelectorAll<HTMLElement>(".hero-statement")
        .forEach((el) => (el.style.display = "none"));
      const reveal = pin.querySelector<HTMLElement>(".hero-reveal");
      if (reveal) {
        reveal.style.opacity = "1";
        reveal.style.visibility = "visible";
      }
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const statements = gsap.utils.toArray<HTMLElement>(".hero-statement");
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: "+=" + (statements.length + 1.6) * 520,
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
        },
      });

      statements.forEach((el) => {
        tl.fromTo(
          el,
          { autoAlpha: 0, y: 34, filter: "blur(6px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power2.out" }
        );
        tl.to(
          el,
          { autoAlpha: 0, y: -30, filter: "blur(6px)", duration: 0.55, ease: "power2.in" },
          "+=0.35"
        );
      });

      tl.fromTo(
        ".hero-reveal .mark",
        { autoAlpha: 0, y: 40, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.0, ease: "power3.out" }
      );
      tl.set(".hero-reveal", { autoAlpha: 1 }, "<");
      tl.fromTo(
        ".hero-reveal .hero-ca",
        { autoAlpha: 0, y: -10 },
        { autoAlpha: 1, y: 0, duration: 0.5 },
        "-=0.8"
      );
      tl.fromTo(".hero-reveal .sub", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.45");
      tl.fromTo(".hero-reveal .tag", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 }, "-=0.2");
      tl.fromTo(".hero-reveal .cta-row", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.15");
      tl.to({}, { duration: 0.6 }); // hold before unpin

      gsap.to(".scroll-hint", {
        autoAlpha: 0,
        scrollTrigger: { trigger: pin, start: "top top", end: "+=300", scrub: true },
      });
    }, pin);

    // Probability chips drift gently while the hero is alive
    const chips = pin.querySelectorAll<HTMLElement>("[data-drift]");
    const drift = window.setInterval(() => {
      chips.forEach((b) => {
        const base = parseFloat(b.dataset.drift || "0");
        const v = base + (Math.random() - 0.5) * 0.4;
        b.textContent = v.toFixed(1) + "%";
      });
    }, 3000);

    return () => {
      ctx.revert();
      window.clearInterval(drift);
    };
  }, []);

  return (
    <header className="hero" id="top">
      <div className="hero-pin" ref={pinRef}>
        <div className="hero-frame" aria-hidden="true" />

        {STATEMENTS.map((s, i) => (
          <div className="hero-statement" key={i}>
            <p className="quote">{"italic" in s && s.italic ? <em>{s.quote}</em> : s.quote}</p>
            {s.prob !== null && (
              <span className="chip mono">
                Market says <b data-drift={s.prob}>{s.prob.toFixed(1)}%</b>{" "}
                <span className={`dir ${s.delta >= 0 ? "up" : "down"}`}>
                  {s.delta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(s.delta).toFixed(1)}
                </span>
              </span>
            )}
          </div>
        ))}

        <div className="hero-reveal">
          <CopyAddress variant="hero" />
          <h1 className="mark">
            Anthropos <em>Cup</em>
          </h1>
          <p className="sub">The prediction market for World Cup 2026.</p>
          <p className="tag">The Market Behind the Narrative</p>
          <div className="cta-row">
            <Link className="btn" href="/markets">
              Explore live markets
            </Link>
            <Link className="btn ghost" href="/#how">
              How it works
            </Link>
          </div>
        </div>

        <div className="scroll-hint">Scroll</div>
      </div>
    </header>
  );
}
