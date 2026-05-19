'use client';

import { motion } from 'framer-motion';

interface TextSlideProps {
  title: string;
  body: string;
}

export default function TextSlide({ title, body }: TextSlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col items-center justify-center px-6 py-10 rounded-2xl"
      style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)' }}
    >
      <h2
        className="text-3xl md:text-4xl font-bold mb-6 text-center font-display"
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
        className="text-base md:text-lg leading-relaxed text-center max-w-2xl"
        style={{ color: 'var(--ink-2)' }}
      >
        {body}
      </p>
    </motion.div>
  );
}
