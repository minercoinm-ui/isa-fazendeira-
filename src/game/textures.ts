import * as THREE from 'three';

// Cache generated textures so we don't recreate them repeatedly
const textureCache = new Map<string, THREE.CanvasTexture>();

function createProceduralTexture(
  name: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  if (textureCache.has(name)) {
    return textureCache.get(name)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(name, texture);
  return texture;
}

// 1. Lush Cartoon Grass
export function getGrassTexture(): THREE.CanvasTexture {
  return createProceduralTexture('grass', 256, 256, (ctx) => {
    // Base vibrant green
    ctx.fillStyle = '#6ab838';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle grass blades and variations
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const length = 4 + Math.random() * 6;
      ctx.strokeStyle = Math.random() > 0.5 ? '#7bc944' : '#5ba32e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 3, y - length);
      ctx.stroke();
    }

    // Cute scattered daisy dots
    for (let i = 0; i < 18; i++) {
      const cx = Math.random() * 256;
      const cy = Math.random() * 256;
      // White petals
      ctx.fillStyle = '#ffffff';
      for (let p = 0; p < 5; p++) {
        const ang = (p * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * 2.5, cy + Math.sin(ang) * 2.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Yellow center
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// 2. Rich Loam Tilled Soil
export function getSoilTexture(watered: boolean): THREE.CanvasTexture {
  const name = watered ? 'soil_watered' : 'soil_dry';
  return createProceduralTexture(name, 128, 128, (ctx) => {
    ctx.fillStyle = watered ? '#3d2516' : '#5c3d28';
    ctx.fillRect(0, 0, 128, 128);

    // Furrow lines
    for (let y = 8; y < 128; y += 16) {
      ctx.fillStyle = watered ? '#2a180d' : '#452b1b';
      ctx.fillRect(0, y, 128, 6);
    }

    // Soil crumbs / pebble specks
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#24140b' : '#6b4931';
      ctx.beginPath();
      ctx.arc(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// 3. Red Barn Wood Planks
export function getRedBarnTexture(): THREE.CanvasTexture {
  return createProceduralTexture('red_barn', 256, 256, (ctx) => {
    ctx.fillStyle = '#b32c25';
    ctx.fillRect(0, 0, 256, 256);

    // Vertical plank lines
    for (let x = 0; x < 256; x += 32) {
      ctx.fillStyle = '#8f1e18';
      ctx.fillRect(x, 0, 2, 256);
      ctx.fillStyle = '#c73a32';
      ctx.fillRect(x + 2, 0, 2, 256);
    }
  });
}

// 4. White Trim / Warm Wood
export function getWoodPlankTexture(): THREE.CanvasTexture {
  return createProceduralTexture('wood_plank', 128, 128, (ctx) => {
    ctx.fillStyle = '#d99859';
    ctx.fillRect(0, 0, 128, 128);

    for (let y = 0; y < 128; y += 32) {
      ctx.fillStyle = '#9e6732';
      ctx.fillRect(0, y, 128, 2);
    }

    // Wood rings / grain
    ctx.strokeStyle = '#b87c42';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * 128, Math.random() * 128, 20, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

// 5. Straw Hat Texture
export function getStrawHatTexture(): THREE.CanvasTexture {
  return createProceduralTexture('straw_hat', 128, 128, (ctx) => {
    ctx.fillStyle = '#e8c56e';
    ctx.fillRect(0, 0, 128, 128);

    // Cross-hatch weave
    ctx.strokeStyle = '#c49e47';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 128; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 128);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(128, i);
      ctx.stroke();
    }
  });
}

// 6. Denim Overalls Texture
export function getDenimTexture(): THREE.CanvasTexture {
  return createProceduralTexture('denim', 128, 128, (ctx) => {
    ctx.fillStyle = '#39639c';
    ctx.fillRect(0, 0, 128, 128);

    // Fine denim twill diagonal pattern
    ctx.strokeStyle = '#2b4d7c';
    ctx.lineWidth = 1;
    for (let i = -128; i < 256; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 128, 128);
      ctx.stroke();
    }
  });
}

// 7. Stone / Cobblestone for Windmill & Chimney
export function getStoneTexture(): THREE.CanvasTexture {
  return createProceduralTexture('stone', 128, 128, (ctx) => {
    ctx.fillStyle = '#8f9296';
    ctx.fillRect(0, 0, 128, 128);

    // Mortar lines & rounded stones
    ctx.fillStyle = '#737579';
    for (let y = 0; y < 128; y += 16) {
      for (let x = 0; x < 128; x += 24) {
        const ox = (y % 32 === 0) ? 0 : 12;
        ctx.strokeRect((x + ox) % 128, y, 22, 14);
      }
    }
  });
}

// 8. Soft Radial Contact Shadow Disc
export function createContactShadowDisc(radius: number = 0.6, opacity: number = 0.4): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, `rgba(15, 25, 10, ${opacity})`);
  gradient.addColorStop(0.7, `rgba(15, 25, 10, ${opacity * 0.4})`);
  gradient.addColorStop(1, 'rgba(15, 25, 10, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02; // avoid z-fighting
  mesh.renderOrder = 1;
  return mesh;
}
