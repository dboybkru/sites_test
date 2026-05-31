// @lab/motion — пресеты длительностей/изинга для JS-анимаций (Framer Motion, GSAP и т.п.).
export const easing = [0.22, 1, 0.36, 1];
export const duration = { fast: 0.3, base: 0.6, slow: 0.9 };

export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.base, ease: easing },
};

export default { easing, duration, fadeUp };
