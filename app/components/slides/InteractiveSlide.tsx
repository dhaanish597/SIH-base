'use client';

import { motion } from 'framer-motion';
import DraggableTriangle from '@/app/components/interactive/DraggableTriangle';

interface InteractiveSlideProps {
  title: string;
  body: string;
  animationData: { type: string };
}

export default function InteractiveSlide({ title, body, animationData }: InteractiveSlideProps) {
  const renderInteractive = () => {
    switch (animationData.type) {
      case 'DraggableTriangle':
        return <DraggableTriangle />;
      default:
        return null;
    }
  };

  const interactive = renderInteractive();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col items-center justify-center px-6 py-8 gap-5 rounded-2xl"
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

      <p
        className="text-sm md:text-base leading-relaxed text-center max-w-xl"
        style={{ color: 'var(--ink-2)' }}
      >
        {body}
      </p>

      {interactive ? (
        <div className="w-full flex flex-col items-center">
          {interactive}
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
          (Interactive type &quot;{animationData.type}&quot; not yet implemented)
        </p>
      )}
    </motion.div>
  );
}
