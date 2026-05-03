'use client';

import TextSlide from '@/app/components/slides/TextSlide';
import DiagramSlide from '@/app/components/slides/DiagramSlide';
import InteractiveSlide from '@/app/components/slides/InteractiveSlide';

interface Slide {
  type: 'text' | 'diagram' | 'interactive';
  title: string;
  body: string;
  animationData?: { type: string };
}

interface SlideRendererProps {
  slide: Slide;
}

export default function SlideRenderer({ slide }: SlideRendererProps) {
  switch (slide.type) {
    case 'text':
      return <TextSlide title={slide.title} body={slide.body} />;

    case 'diagram':
      return (
        <DiagramSlide
          title={slide.title}
          body={slide.body}
          animationData={slide.animationData ?? { type: '' }}
        />
      );

    case 'interactive':
      return (
        <InteractiveSlide
          title={slide.title}
          body={slide.body}
          animationData={slide.animationData ?? { type: '' }}
        />
      );

    default:
      return (
        <TextSlide
          title={slide.title}
          body={slide.body}
        />
      );
  }
}
