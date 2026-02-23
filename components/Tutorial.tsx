import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';

export interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'auto';
}

interface TutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ steps, onComplete, onSkip }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [position, setPosition] = useState<{ 
    top: number; 
    left: number; 
    width: number; 
    height: number;
    borderRadius: string;
  } | null>(null);
  
  const [isVisible, setIsVisible] = useState(false);
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    const updatePosition = () => {
      const element = document.getElementById(currentStep.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        // Use viewport coordinates (fixed positioning)
        setPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: style.borderRadius === '0px' ? '12px' : style.borderRadius // Fallback for square elements
        });
        setIsVisible(true);
        
        // Scroll to element if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setIsVisible(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStepIndex, currentStep.targetId]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  if (!isVisible || !position) return null;

  const isLastStep = currentStepIndex === steps.length - 1;
  
  // Positioning Logic
  let placement = currentStep.position || 'auto';
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - (position.top + position.height);
  const spaceAbove = position.top;

  if (placement === 'auto') {
    placement = spaceBelow > 250 ? 'bottom' : 'top';
  } else if (placement === 'bottom' && spaceBelow < 200) {
    placement = 'top';
  } else if (placement === 'top' && spaceAbove < 200) {
    placement = 'bottom';
  }

  const isBottom = placement === 'bottom';

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      {/* Spotlight Element (The Hole) */}
      <div 
        className="absolute transition-all duration-500 ease-out shadow-[0_0_0_9999px_rgba(15,23,42,0.85)]"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
          borderRadius: position.borderRadius,
        }}
      >
        {/* Pulsing Border Ring */}
        <div className="absolute inset-0 rounded-[inherit] ring-4 ring-blue-500/50 animate-pulse" />
      </div>

      {/* Balloon */}
      <div 
        className={`absolute left-0 right-0 mx-auto w-[90%] max-w-sm pointer-events-auto transition-all duration-500 ease-out ${
          isBottom ? 'mt-6' : '-mt-6 -translate-y-full'
        }`}
        style={{
          top: isBottom ? position.top + position.height : position.top,
        }}
      >
        <div className="bg-white rounded-2xl p-6 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300 relative">
          {/* Arrow */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 ${
              isBottom ? '-top-2' : '-bottom-2'
            }`}
          />

          <div className="flex justify-between items-start mb-3 relative z-10">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg tracking-wide">
              Dica {currentStepIndex + 1} de {steps.length}
            </span>
            <button onClick={onSkip} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          
          <h3 className="text-lg font-black text-slate-900 mb-2 relative z-10">{currentStep.title}</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed relative z-10">{currentStep.content}</p>
          
          <div className="flex items-center justify-between relative z-10">
            <button 
              onClick={onSkip}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wide"
            >
              Pular
            </button>
            
            <button 
              onClick={handleNext}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform"
            >
              {isLastStep ? 'Concluir' : 'Próximo'}
              {isLastStep ? <Check size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
