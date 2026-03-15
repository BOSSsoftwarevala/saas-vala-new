import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  ctaText?: string;
  ctaAction?: () => void;
}

const defaultSlides: HeroSlide[] = [
  {
    id: 'offer-1',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop',
    title: '🔥 ALL SOFTWARE — ONLY $5',
    subtitle: 'Get full source code, APK, license key & 30-day access. 2000+ products available.',
    badge: 'MEGA SALE',
    badgeColor: 'from-red-500 to-orange-500',
  },
  {
    id: 'offer-2',
    image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=400&fit=crop',
    title: '🏥 Healthcare Software Suite',
    subtitle: 'Hospital ERP, Clinic Manager, Lab System, Telemedicine — all ready to deploy.',
    badge: 'NEW LAUNCH',
    badgeColor: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'offer-3',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop',
    title: '📚 Education & E-Learning',
    subtitle: 'School ERP, LMS, Coaching Center — Google Classroom & Moodle clones included.',
    badge: 'TOP RATED',
    badgeColor: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'offer-4',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=400&fit=crop',
    title: '🏠 Real Estate & Property CRM',
    subtitle: 'Broker suite, rental management, listing portal — all white-label ready.',
    badge: 'HOT',
    badgeColor: 'from-purple-500 to-pink-500',
  },
  {
    id: 'offer-5',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=400&fit=crop',
    title: '🎉 Festival Offer — Extra 20% OFF',
    subtitle: 'Limited time — buy any 3 software and get 1 FREE. Use code: FESTIVAL2026',
    badge: 'LIMITED',
    badgeColor: 'from-amber-500 to-yellow-500',
  },
];

interface HeroBannerSliderProps {
  slides?: HeroSlide[];
  autoPlayInterval?: number;
}

export function HeroBannerSlider({ slides = defaultSlides, autoPlayInterval = 5000 }: HeroBannerSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, autoPlayInterval);
    return () => clearInterval(timer);
  }, [paused, next, autoPlayInterval]);

  const slide = slides[current];

  return (
    <div
      className="relative rounded-2xl overflow-hidden mx-4 md:mx-8 mb-6 group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background image with smooth crossfade */}
      <div className="relative h-[200px] sm:h-[280px] md:h-[360px] lg:h-[420px] w-full">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-in-out',
              i === current ? 'opacity-100' : 'opacity-0'
            )}
          >
            <img
              src={s.image}
              alt={s.title}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ))}

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 z-10">
          {slide.badge && (
            <span
              className={cn(
                'inline-flex w-fit items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-3',
                'bg-gradient-to-r shadow-lg',
                slide.badgeColor || 'from-primary to-blue-600'
              )}
            >
              {slide.badge}
            </span>
          )}
          <h2
            className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white mb-2 leading-tight max-w-2xl"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            {slide.title}
          </h2>
          <p
            className="text-sm sm:text-base md:text-lg text-white/80 max-w-xl leading-relaxed"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
          >
            {slide.subtitle}
          </p>
        </div>
      </div>

      {/* Left/Right arrows */}
      <button
        onClick={prev}
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 z-20',
          'h-10 w-10 rounded-full flex items-center justify-center',
          'bg-black/40 backdrop-blur-sm border border-white/10',
          'text-white hover:bg-white/20 transition-all',
          'opacity-0 group-hover:opacity-100'
        )}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 z-20',
          'h-10 w-10 rounded-full flex items-center justify-center',
          'bg-black/40 backdrop-blur-sm border border-white/10',
          'text-white hover:bg-white/20 transition-all',
          'opacity-0 group-hover:opacity-100'
        )}
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === current
                ? 'w-8 bg-white'
                : 'w-2 bg-white/40 hover:bg-white/60'
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
