import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const maxRadius = 45;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX, e.clientY);
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      setKnobPos({ x: 0, y: 0 });
      onMove({ x: 0, y: 0 });
      return;
    }

    const clampedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;

    setKnobPos({ x: kx, y: ky });
    onMove({ x: kx / maxRadius, y: ky / maxRadius });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX, e.clientY);
    };

    const handlePointerUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      setKnobPos({ x: 0, y: 0 });
      onMove({ x: 0, y: 0 });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative w-32 h-32 rounded-full bg-white/30 backdrop-blur-none border-4 border-white/60 shadow-xl touch-none flex items-center justify-center pointer-events-auto select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Base Center Dot */}
      <div className="w-4 h-4 rounded-full bg-white/40" />

      {/* Floating Joystick Thumb */}
      <div
        className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-3 border-white shadow-lg pointer-events-none transform transition-transform"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      />
    </div>
  );
};
