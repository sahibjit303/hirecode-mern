import { useRef, useEffect } from "react";

/* Shared single IntersectionObserver for all FadeUp instances */
const observedMap = new WeakMap();
let sharedObserver = null;

function getObserver() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.opacity = 1;
          e.target.style.transform = "translateY(0)";
          sharedObserver.unobserve(e.target);
          observedMap.delete(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  return sharedObserver;
}

export default function FadeUp({ children, delay = 0, style = {} }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = getObserver();
    observedMap.set(el, true);
    obs.observe(el);
    return () => {
      if (observedMap.has(el)) {
        obs.unobserve(el);
        observedMap.delete(el);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: "translateY(22px)",
        transition: `opacity .6s ${delay}s ease, transform .6s ${delay}s ease`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
