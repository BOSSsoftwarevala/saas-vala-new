import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface MarketplaceSectionDividerProps {
  label?: string;
}

// ✅ ADD: Global event constant
const MARKETPLACE_SECTION_UPDATED = 'marketplace:section-updated';

export function MarketplaceSectionDivider({ label }: MarketplaceSectionDividerProps) {
  // ✅ ADD: Local state for dynamic label updates
  const [currentLabel, setCurrentLabel] = useState(label);

  // ✅ ADD: Listen for admin section updates
  useEffect(() => {
    const handleSectionUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { sectionLabel } = customEvent.detail;
      
      console.log('[SectionDivider] Section label updated:', sectionLabel);
      
      if (sectionLabel) {
        setCurrentLabel(sectionLabel);
      }
    };

    window.addEventListener(MARKETPLACE_SECTION_UPDATED, handleSectionUpdate);
    
    return () => {
      window.removeEventListener(MARKETPLACE_SECTION_UPDATED, handleSectionUpdate);
    };
  }, []);

  // ✅ ADD: Sync with prop changes
  useEffect(() => {
    setCurrentLabel(label);
  }, [label]);

  return (
    <div className="px-4 md:px-8 my-6 flex items-center gap-4">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        style={{ transformOrigin: 'left' }}
      />
      {currentLabel && (
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap px-2">
          {currentLabel}
        </span>
      )}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        style={{ transformOrigin: 'right' }}
      />
    </div>
  );
}
