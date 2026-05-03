'use client';

import { motion } from 'framer-motion';

interface DiagramSlideProps {
  title: string;
  body: string;
  animationData: { type: string };
}

/* ------------------------------------------------------------------ */
/* Static right-triangle SVG — 300×200 viewBox                         */
/* ------------------------------------------------------------------ */
function RightTriangleDiagram() {
  // Vertices
  const A = { x: 50, y: 30 };    // top of triangle (angle θ here)
  const B = { x: 50, y: 170 };   // right-angle vertex (bottom-left)
  const C = { x: 250, y: 170 };  // base vertex (bottom-right)
  const sq = 12;                  // right-angle symbol size

  return (
    <svg
      viewBox="0 0 300 200"
      className="w-full max-w-xs md:max-w-sm"
      style={{ overflow: 'visible' }}
      aria-label="Right triangle diagram showing opposite, adjacent, and hypotenuse sides"
    >
      {/* Fill */}
      <polygon
        points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
        fill="rgba(107,75,255,0.07)"
        stroke="none"
      />

      {/* Opposite (vertical, violet) */}
      <line x1={B.x} y1={B.y} x2={A.x} y2={A.y} stroke="var(--violet-bright)" strokeWidth="2.5" />

      {/* Adjacent (horizontal, cyan) */}
      <line x1={B.x} y1={B.y} x2={C.x} y2={C.y} stroke="var(--cyan)" strokeWidth="2.5" />

      {/* Hypotenuse (gold) */}
      <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} stroke="var(--gold)" strokeWidth="2.5" />

      {/* Right-angle symbol at B */}
      <polyline
        points={`${B.x},${B.y - sq} ${B.x + sq},${B.y - sq} ${B.x + sq},${B.y}`}
        fill="none"
        stroke="var(--ink-3)"
        strokeWidth="1.5"
      />

      {/* θ label at A */}
      <text x={A.x + 14} y={A.y + 18} fill="var(--gold)" fontSize="13" fontFamily="JetBrains Mono, monospace" fontWeight="700">
        θ
      </text>

      {/* Side labels (cyan for clarity) */}
      {/* Opposite — rotated, left of vertical */}
      <text
        x={B.x - 16}
        y={(A.y + B.y) / 2 + 4}
        fill="var(--cyan)"
        fontSize="10"
        textAnchor="middle"
        transform={`rotate(-90, ${B.x - 16}, ${(A.y + B.y) / 2 + 4})`}
      >
        Opposite
      </text>

      {/* Adjacent — below horizontal */}
      <text x={(B.x + C.x) / 2} y={B.y + 18} fill="var(--cyan)" fontSize="10" textAnchor="middle">
        Adjacent
      </text>

      {/* Hypotenuse — along slant, offset outward */}
      {(() => {
        const mx = (A.x + C.x) / 2;
        const my = (A.y + C.y) / 2;
        const angle = (Math.atan2(C.y - A.y, C.x - A.x) * 180) / Math.PI;
        return (
          <text
            x={mx + 16}
            y={my - 6}
            fill="var(--cyan)"
            fontSize="10"
            textAnchor="middle"
            transform={`rotate(${angle}, ${mx + 16}, ${my - 6})`}
          >
            Hypotenuse
          </text>
        );
      })()}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* DiagramSlide                                                         */
/* ------------------------------------------------------------------ */
export default function DiagramSlide({ title, body, animationData }: DiagramSlideProps) {
  const renderDiagram = () => {
    switch (animationData.type) {
      case 'RightTriangleDiagram':
        return <RightTriangleDiagram />;
      default:
        return null;
    }
  };

  const diagram = renderDiagram();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col items-center justify-center px-6 py-8 gap-6 rounded-2xl"
      style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)' }}
    >
      <h2
        className="text-2xl md:text-3xl font-bold text-center font-display"
        style={{
          fontFamily: "'Bowlby One', 'Orbitron', sans-serif",
          background: 'linear-gradient(135deg, var(--violet-bright) 0%, var(--cyan) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {title}
      </h2>

      {diagram ? (
        <div
          className="rounded-xl p-4 w-full max-w-xs md:max-w-sm"
          style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--line)' }}
        >
          {diagram}
        </div>
      ) : null}

      <p
        className="text-sm md:text-base leading-relaxed text-center max-w-xl"
        style={{ color: 'var(--ink-2)' }}
      >
        {body}
      </p>

      {!diagram && (
        <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
          (Diagram type &quot;{animationData.type}&quot; not yet implemented)
        </p>
      )}
    </motion.div>
  );
}
