import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildPlayerModel, AnimatedCharacter } from '../game/characterModels';

interface Avatar3DPreviewProps {
  avatarId: string;
  width?: number;
  height?: number;
  interactive?: boolean;
}

export const Avatar3DPreview: React.FC<Avatar3DPreviewProps> = ({
  avatarId,
  width = 240,
  height = 280,
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const [webglError, setWebglError] = React.useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animId = 0;

    try {
      // 1. Scene & Camera
      const scene = new THREE.Scene();
      scene.background = null; // Transparent background

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
      camera.position.set(0, 1.35, 3.4);
      camera.lookAt(0, 0.9, 0);

      // 2. Renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mountRef.current.appendChild(renderer.domElement);

      // 3. Lighting
      const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
      keyLight.position.set(3, 4, 3);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.0);
      fillLight.position.set(-3, 2, -2);
      scene.add(fillLight);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      scene.add(ambientLight);

      // 4. Character Model
      const char: AnimatedCharacter = buildPlayerModel(avatarId, '', 1);
      char.nameBadge.visible = false; // Hide billboard nameplate in preview
      scene.add(char.root);

      // 5. Animation Loop
      const clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Slow gentle auto-rotation if not manually dragging
        if (!isDraggingRef.current) {
          rotationRef.current += 0.008;
        }
        char.root.rotation.y = rotationRef.current;

        // Subtle breathing idle
        char.updateAnimation(elapsedTime, false);

        renderer?.render(scene, camera);
      };
      animate();
    } catch (err) {
      console.warn('Avatar3DPreview WebGL unavailable:', err);
      setWebglError(true);
    }

    // 6. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      if (renderer) {
        try {
          renderer.dispose();
          if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
            mountRef.current.removeChild(renderer.domElement);
          }
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [avatarId, width, height]);

  // Pointer drag to spin 360 degrees
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !interactive) return;
    const deltaX = e.clientX - startXRef.current;
    startXRef.current = e.clientX;
    rotationRef.current += deltaX * 0.02;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  if (webglError) {
    return (
      <div
        className="relative flex flex-col items-center justify-center select-none bg-amber-100/50 rounded-xl p-4 text-center"
        style={{ width, height }}
      >
        <span className="text-6xl mb-2 animate-bounce">🧑‍🌾</span>
        <span className="text-xs font-black text-amber-950 uppercase">Visualização 2D</span>
        <span className="text-[10px] text-amber-700 font-bold mt-1">Pronto para jogar</span>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
      style={{ width, height }}
      title="Arraste para girar em 360°"
    >
      <div className="absolute bottom-2 text-[10px] text-amber-800/80 font-black bg-amber-100/80 px-2 py-0.5 rounded-full pointer-events-none border border-amber-300">
        ↻ Arraste para Girar 360°
      </div>
    </div>
  );
};
