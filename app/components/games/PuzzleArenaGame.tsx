'use client';

type Props = { grade?: number; onExit: () => void };

export default function PuzzleArenaGame({ onExit }: Props) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--ink-3)' }}>
      <div style={{ fontSize: 48 }}>🧩</div>
      <div style={{ fontFamily: 'var(--f-hud)', fontSize: 18, color: 'var(--ink-1)' }}>PUZZLE ARENA</div>
      <div style={{ fontSize: 13 }}>Coming soon</div>
      <button onClick={onExit} style={{ marginTop: 12, padding: '10px 24px', background: 'var(--cyan)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--f-hud)', fontSize: 12, cursor: 'pointer' }}>
        ← EXIT
      </button>
    </div>
  );
}
