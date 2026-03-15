import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { Atom } from "lucide-react";

export function GravityModeButton() {
  const [active, setActive] = useState(false);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bodiesRef = useRef<{ el: HTMLElement; body: Matter.Body }[]>([]);
  const originalStyles = useRef<{ el: HTMLElement; style: string; transform: string }[]>([]);

  const activateGravity = () => {
    if (active) return;
    setActive(true);

    const cards = Array.from(
      document.querySelectorAll("[data-gravity]")
    ) as HTMLElement[];

    if (cards.length === 0) {
      setTimeout(() => setActive(false), 100);
      return;
    }

    const engine = Matter.Engine.create({ gravity: { y: 1.5 } });
    engineRef.current = engine;

    const runner = Matter.Runner.create();
    runnerRef.current = runner;

    const bodies: { el: HTMLElement; body: Matter.Body }[] = [];
    originalStyles.current = [];

    const ground = Matter.Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + 25,
      window.innerWidth * 2,
      50,
      { isStatic: true }
    );
    const wallLeft = Matter.Bodies.rectangle(-25, window.innerHeight / 2, 50, window.innerHeight * 2, { isStatic: true });
    const wallRight = Matter.Bodies.rectangle(window.innerWidth + 25, window.innerHeight / 2, 50, window.innerHeight * 2, { isStatic: true });

    cards.forEach(el => {
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const body = Matter.Bodies.rectangle(x, y, rect.width, rect.height, {
        restitution: 0.4,
        friction: 0.1,
        frictionAir: 0.01,
        angle: (Math.random() - 0.5) * 0.2,
      });
      bodies.push({ el, body });
      originalStyles.current.push({
        el,
        style: el.style.cssText,
        transform: el.style.transform,
      });
      el.style.position = "fixed";
      el.style.left = `${rect.left}px`;
      el.style.top = `${rect.top}px`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      el.style.zIndex = "9999";
      el.style.margin = "0";
      el.style.transition = "none";
    });

    bodiesRef.current = bodies;
    Matter.World.add(engine.world, [...bodies.map(b => b.body), ground, wallLeft, wallRight]);
    Matter.Runner.run(runner, engine);

    const updateLoop = setInterval(() => {
      bodies.forEach(({ el, body }) => {
        el.style.left = `${body.position.x - el.offsetWidth / 2}px`;
        el.style.top = `${body.position.y - el.offsetHeight / 2}px`;
        el.style.transform = `rotate(${body.angle}rad)`;
      });
    }, 16);

    setTimeout(() => {
      clearInterval(updateLoop);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      bodies.forEach(({ el }, i) => {
        el.style.cssText = originalStyles.current[i].style;
      });
      bodiesRef.current = [];
      setActive(false);
    }, 5000);
  };

  return (
    <button
      data-testid="button-gravity-mode"
      onClick={activateGravity}
      disabled={active}
      className={`
        group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
        transition-all duration-300 border
        ${active
          ? "bg-violet-500/20 border-violet-500/40 text-violet-300 cursor-not-allowed"
          : "bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400 hover:from-violet-500/30 hover:to-purple-500/30 hover:border-violet-400/50 hover:scale-105 active:scale-95"
        }
      `}
    >
      <Atom size={16} className={active ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
      {active ? "Gravity Active..." : "Gravity Mode"}
    </button>
  );
}
