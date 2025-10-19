import React, { useEffect, useRef } from 'react';

// Animated cursor with a dot and a trailing ring. Respects prefers-reduced-motion.
// Hides default cursor only on fine pointers (e.g., mouse) via CSS in index.css
export default function AnimatedCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let rafId;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    };

    const animate = () => {
      // Lerp ring towards mouse for trailing effect
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      rafId = requestAnimationFrame(animate);
    };

    const onDown = () => {
      ring.style.transition = 'transform 0.05s ease-out, width 0.2s, height 0.2s, opacity 0.2s';
      ring.style.width = '36px';
      ring.style.height = '36px';
      dot.style.transform += ' scale(0.8)';
    };
    const onUp = () => {
      ring.style.width = '44px';
      ring.style.height = '44px';
    };

    // Hover cues for clickable elements
    const onMouseOver = (e) => {
      const target = e.target;
      if (!target) return;
      const isInteractive = ['A', 'BUTTON'].includes(target.tagName) || target.getAttribute('role') === 'button' || target.tabIndex >= 0;
      if (isInteractive) {
        ring.style.opacity = '0.9';
        ring.style.background = 'rgba(255, 215, 0, 0.12)';
      }
    };
    const onMouseOut = () => {
      ring.style.opacity = '0.65';
      ring.style.background = 'transparent';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mouseout', onMouseOut);

    animate();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Hidden by prefers-reduced-motion in CSS */}
      <div ref={dotRef} className="animated-cursor-dot" />
      <div ref={ringRef} className="animated-cursor-ring" />
    </>
  );
}