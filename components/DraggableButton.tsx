import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';

interface DraggableButtonProps {
  onClick: () => void;
}

export const DraggableButton: React.FC<DraggableButtonProps> = ({ onClick }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number, hasMoved: boolean } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialize = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Try again in next frame if not ready
        requestAnimationFrame(initialize);
        return;
      }
      
      setPosition({ 
        x: rect.width - 60, 
        y: rect.height - 160 
      });
      setIsInitialized(true);
    };

    initialize();

    const handleResize = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setPosition(prev => {
        const midPoint = rect.width / 2;
        const snapX = prev.x > midPoint ? rect.width - 60 : 12;
        const snapY = Math.max(12, Math.min(rect.height - 60, prev.y));
        return { x: snapX, y: snapY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y,
      hasMoved: false
    };
    setIsDragging(true);
  };

  const handleMove = React.useCallback((e: TouchEvent | MouseEvent) => {
    if (!dragRef.current || !wrapperRef.current) return;
    
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.hasMoved = true;
    }
    
    const rect = wrapperRef.current.getBoundingClientRect();
    const minX = 12;
    const maxX = rect.width - 60;
    const minY = 12;
    const maxY = rect.height - 60;
    
    const newX = Math.max(minX, Math.min(maxX, dragRef.current.initialX + dx));
    const newY = Math.max(minY, Math.min(maxY, dragRef.current.initialY + dy));
    
    setPosition({ x: newX, y: newY });
  }, []);

  const handleEnd = React.useCallback(() => {
    if (!dragRef.current || !wrapperRef.current) return;
    
    setIsDragging(false);
    
    const rect = wrapperRef.current.getBoundingClientRect();
    const midPoint = rect.width / 2;
    
    setPosition(prev => {
      const snapX = prev.x > midPoint ? rect.width - 60 : 12;
      return { ...prev, x: snapX };
    });
    
    setTimeout(() => {
      dragRef.current = null;
    }, 0);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    } else {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const handleClick = () => {
    if (dragRef.current?.hasMoved) return;
    onClick();
  };

  return (
    <div ref={wrapperRef} className="fixed inset-0 max-w-md mx-auto pointer-events-none z-[100]">
      <button
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        onClick={handleClick}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          touchAction: 'none',
          visibility: isInitialized ? 'visible' : 'hidden'
        }}
        className={`absolute top-0 left-0 pointer-events-auto bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-100 text-blue-600 transition-all duration-300 ${isDragging ? 'scale-105 transition-none' : 'active:scale-95'}`}
      >
        <Settings size={24} />
      </button>
    </div>
  );
};
