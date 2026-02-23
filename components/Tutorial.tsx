import React, { useState, useEffect, useRef } from 'react';
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
  const [position, setPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    const updatePosition = () => {
      const element = document.getElementById(currentStep.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
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
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
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
  const isBottom = currentStep.position === 'bottom' || (!currentStep.position && window.innerHeight - position.top > 300);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Backdrop with hole */}
      <div className="absolute inset-0 bg-slate-900/70 transition-all duration-500" style={{
        clipPath: `polygon(
          0% 0%, 
          0% 100%, 
          100% 100%, 
          100% 0%, 
          0% 0%, 
          ${position.left}px ${position.top}px, 
          ${position.left + position.width}px ${position.top}px, 
          ${position.left + position.width}px ${position.top + position.height}px, 
          ${position.left}px ${position.top + position.height}px, 
          ${position.left}px ${position.top}px
        )`
      }} />

      {/* Highlight Border */}
      <div 
        className="absolute border-2 border-white rounded-2xl shadow-[0_0_0_4px_rgba(59,130,246,0.5)] transition-all duration-300 ease-out"
        style={{
          top: position.top - 4,
          left: position.left - 4,
          width: position.width + 8,
          height: position.height + 8,
        }}
      />

      {/* Balloon */}
      <div 
        className={`absolute left-0 right-0 mx-auto w-[90%] max-w-sm pointer-events-auto transition-all duration-500 ease-out ${
          isBottom ? 'mt-4' : '-mt-4 -translate-y-full'
        }`}
        style={{
          top: isBottom ? position.top + position.height : position.top,
          left: 0,
          right: 0
        }}
      >
        <div className="bg-white rounded-2xl p-6 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg tracking-wide">
              Dica {currentStepIndex + 1} de {steps.length}
            </span>
            <button onClick={onSkip} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          
          <h3 className="text-lg font-black text-slate-900 mb-2">{currentStep.title}</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">{currentStep.content}</p>
          
          <div className="flex items-center justify-between">
            <button 
              onClick={onSkip}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wide"
            >
              Pular Tutorial
            </button>
            
            <button 
              onClick={handleNext}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform"
            >
              {isLastStep ? 'Concluir' : 'Próximo'}
              {isLastStep ? <Check size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
          
          {/* Arrow */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 ${
              isBottom ? '-top-2' : '-bottom-2'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
