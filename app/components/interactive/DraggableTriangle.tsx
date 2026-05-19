'use client';

import { useRef, useState, useCallback } from 'react';

/* SVG coordinate system
   viewBox: 0 0 300 250
   Right-angle vertex: (50, 200)   — bottom-left, fixed
   Base vertex:        (250, 200)  — bottom-right, fixed
   Hyp vertex:         (50, y)     — draggable, y in [30, 190]
*/

const RIGHT_X = 50;
const RIGHT_Y = 200;
const BASE_X = 250;
const BASE_Y = 200;
const HYP_X = 50;
const HYP_Y_MIN = 30;
const HYP_Y_MAX = 190;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function DraggableTriangle() {
  const [hypY, setHypY] = useState(80); // draggable y of hypotenuse vertex
  const dragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Derived geometry
  const opposite = RIGHT_Y - hypY;             // vertical leg
  const adjacent = BASE_X - RIGHT_X;           // horizontal leg = 200 (fixed)
  const hypotenuse = Math.sqrt(opposite ** 2 + adjacent ** 2);
  const angleRad = Math.atan2(opposite, adjacent);
  const angleDeg = (angleRad * 180) / Math.PI;

  const sinV = Math.sin(angleRad);
  const cosV = Math.cos(angleRad);
  const tanV = Math.tan(angleRad);

  /* SVG mouse helpers */
  const getSVGY = useCallback((clientY: number): number => {
    if (!svgRef.current) return hypY;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleY = 250 / rect.height;
    return (clientY - rect.top) * scaleY;
  }, [hypY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const rawY = getSVGY(e.clientY);
    const clamped = clamp(rawY, HYP_Y_MIN, HYP_Y_MAX);

    // Also enforce angle constraints (10°–80°)
    const tentativeOpp = RIGHT_Y - clamped;
    const tentativeAngle = (Math.atan2(tentativeOpp, adjacent) * 180) / Math.PI;
    if (tentativeAngle < 10) {
      // Back-compute y for 10°
      const minOpp = adjacent * Math.tan((10 * Math.PI) / 180);
      setHypY(RIGHT_Y - minOpp);
    } else if (tentativeAngle > 80) {
      const maxOpp = adjacent * Math.tan((80 * Math.PI) / 180);
      setHypY(Math.max(HYP_Y_MIN, RIGHT_Y - maxOpp));
    } else {
      setHypY(clamped);
    }
  }, [getSVGY, adjacent]);

  const handleMouseUp = () => {
    dragging.current = false;
  };

  /* Touch support */
  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    if (!svgRef.current) return;
    const touch = e.touches[0];
    const rect = svgRef.current.getBoundingClientRect();
    const scaleY = 250 / rect.height;
    const rawY = (touch.clientY - rect.top) * scaleY;
    const clamped = clamp(rawY, HYP_Y_MIN, HYP_Y_MAX);
    const tentativeOpp = RIGHT_Y - clamped;
    const tentativeAngle = (Math.atan2(tentativeOpp, adjacent) * 180) / Math.PI;
    if (tentativeAngle < 10) {
      const minOpp = adjacent * Math.tan((10 * Math.PI) / 180);
      setHypY(RIGHT_Y - minOpp);
    } else if (tentativeAngle > 80) {
      const maxOpp = adjacent * Math.tan((80 * Math.PI) / 180);
      setHypY(Math.max(HYP_Y_MIN, RIGHT_Y - maxOpp));
    } else {
      setHypY(clamped);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    dragging.current = true;
  };

  const handleTouchEnd = () => {
    dragging.current = false;
  };

  // Triangle vertices
  const A = { x: HYP_X, y: hypY };         // draggable (hypotenuse top)
  const B = { x: RIGHT_X, y: RIGHT_Y };     // right-angle (bottom-left)
  const C = { x: BASE_X, y: BASE_Y };       // base (bottom-right)

  // Right-angle symbol size
  const sq = 10;

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <svg
        ref={svgRef}
        viewBox="0 0 300 250"
        className="w-full max-w-xs md:max-w-sm rounded-xl"
        style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--line)', cursor: dragging.current ? 'grabbing' : 'default', touchAction: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Triangle fill */}
        <polygon
          points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
          fill="rgba(107,75,255,0.08)"
          stroke="none"
        />

        {/* Opposite side (vertical, left) */}
        <line x1={B.x} y1={B.y} x2={A.x} y2={A.y} stroke="var(--violet-bright)" strokeWidth="2.5" />

        {/* Adjacent side (horizontal, bottom) */}
        <line x1={B.x} y1={B.y} x2={C.x} y2={C.y} stroke="var(--cyan)" strokeWidth="2.5" />

        {/* Hypotenuse */}
        <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} stroke="var(--gold)" strokeWidth="2.5" />

        {/* Right-angle symbol */}
        <polyline
          points={`${B.x},${B.y - sq} ${B.x + sq},${B.y - sq} ${B.x + sq},${B.y}`}
          fill="none"
          stroke="var(--ink-3)"
          strokeWidth="1.5"
        />

        {/* Angle arc at A */}
        {(() => {
          const r = 22;
          // angle at vertex A: between AB (downward) and AC (to right-down)
          const ax = C.x - A.x;
          const ay = C.y - A.y;
          const bx = B.x - A.x;
          const by = B.y - A.y;
          const startAngle = Math.atan2(by, bx);
          const endAngle = Math.atan2(ay, ax);
          const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
          const x1 = A.x + r * Math.cos(startAngle);
          const y1 = A.y + r * Math.sin(startAngle);
          const x2 = A.x + r * Math.cos(endAngle);
          const y2 = A.y + r * Math.sin(endAngle);
          return (
            <path
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          );
        })()}

        {/* θ label near A */}
        <text x={A.x + 26} y={A.y + 14} fill="var(--gold)" fontSize="11" fontFamily="JetBrains Mono, monospace">θ</text>

        {/* Side labels */}
        {/* Opposite — left of the vertical leg */}
        <text
          x={B.x - 12}
          y={(A.y + B.y) / 2 + 4}
          fill="var(--violet-bright)"
          fontSize="9"
          textAnchor="middle"
          transform={`rotate(-90, ${B.x - 12}, ${(A.y + B.y) / 2 + 4})`}
        >
          Opposite
        </text>

        {/* Adjacent — below the horizontal leg */}
        <text x={(B.x + C.x) / 2} y={B.y + 16} fill="var(--cyan)" fontSize="9" textAnchor="middle">
          Adjacent
        </text>

        {/* Hypotenuse — along the slant */}
        {(() => {
          const mx = (A.x + C.x) / 2;
          const my = (A.y + C.y) / 2;
          const angle = (Math.atan2(C.y - A.y, C.x - A.x) * 180) / Math.PI;
          return (
            <text
              x={mx + 14}
              y={my - 4}
              fill="var(--gold)"
              fontSize="9"
              textAnchor="middle"
              transform={`rotate(${angle}, ${mx + 14}, ${my - 4})`}
            >
              Hypotenuse
            </text>
          );
        })()}

        {/* Draggable vertex circle */}
        <circle
          cx={A.x}
          cy={A.y}
          r={8}
          fill="var(--violet)"
          stroke="var(--violet-bright)"
          strokeWidth="2"
          style={{ cursor: 'grab' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
      </svg>

      {/* Live readout */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-xs md:max-w-sm text-center text-sm">
        <div
          className="rounded-lg py-2 px-1"
          style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--line)' }}
        >
          <div style={{ color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>θ</div>
          <div style={{ color: 'var(--ink-1)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
            {angleDeg.toFixed(1)}°
          </div>
        </div>
        <div
          className="rounded-lg py-2 px-1"
          style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--line)' }}
        >
          <div style={{ color: 'var(--violet-bright)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>sin θ</div>
          <div style={{ color: 'var(--ink-1)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
            {sinV.toFixed(3)}
          </div>
        </div>
        <div
          className="rounded-lg py-2 px-1"
          style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--line)' }}
        >
          <div style={{ color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>cos θ</div>
          <div style={{ color: 'var(--ink-1)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
            {cosV.toFixed(3)}
          </div>
        </div>
        <div
          className="rounded-lg py-2 px-1"
          style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--line)' }}
        >
          <div style={{ color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>tan θ</div>
          <div style={{ color: 'var(--ink-1)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
            {tanV > 99 ? '∞' : tanV.toFixed(3)}
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
        Drag the <span style={{ color: 'var(--violet-bright)' }}>purple vertex</span> to change the angle
      </p>
    </div>
  );
}
