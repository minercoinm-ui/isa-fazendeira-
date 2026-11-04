import * as THREE from 'three';

export interface DayNightAtmosphere {
  hour: number; // 0 to 24 (decimal)
  formattedTime: string; // e.g. "17:45"
  phaseKey: 'madrugada' | 'amanhecer' | 'manha' | 'meio_dia' | 'entardecer' | 'crepusculo' | 'noite';
  phaseLabel: string;
  phaseIcon: string;
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  fogNear: number;
  fogFar: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  sunPosition: THREE.Vector3;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  exposure: number;
  starsOpacity: number;
  lanternGlowIntensity: number;
  isNight: boolean;
}

interface LightingKeyframe {
  hour: number;
  skyHex: string;
  fogHex: string;
  fogNear: number;
  fogFar: number;
  sunHex: string;
  sunIntensity: number;
  sunPos: [number, number, number];
  hemiSkyHex: string;
  hemiGroundHex: string;
  hemiIntensity: number;
  exposure: number;
  starsOpacity: number;
  lanternGlow: number;
  phaseKey: DayNightAtmosphere['phaseKey'];
  phaseLabel: string;
  phaseIcon: string;
}

const CYCLE_KEYFRAMES: LightingKeyframe[] = [
  {
    hour: 0.0,
    skyHex: '#080d1a', // Madrugada escura
    fogHex: '#080d1a',
    fogNear: 35,
    fogFar: 75,
    sunHex: '#93c5fd', // Luz prateada da Lua
    sunIntensity: 0.38,
    sunPos: [-25, 45, -20],
    hemiSkyHex: '#1e293b',
    hemiGroundHex: '#09131f',
    hemiIntensity: 0.22,
    exposure: 1.05,
    starsOpacity: 1.0,
    lanternGlow: 1.0,
    phaseKey: 'madrugada',
    phaseLabel: 'Madrugada Estrelada',
    phaseIcon: '🌙',
  },
  {
    hour: 4.5,
    skyHex: '#0f172a',
    fogHex: '#0f172a',
    fogNear: 38,
    fogFar: 78,
    sunHex: '#93c5fd',
    sunIntensity: 0.4,
    sunPos: [-30, 40, -15],
    hemiSkyHex: '#1e293b',
    hemiGroundHex: '#0f172a',
    hemiIntensity: 0.25,
    exposure: 1.05,
    starsOpacity: 0.9,
    lanternGlow: 1.0,
    phaseKey: 'madrugada',
    phaseLabel: 'Fim da Madrugada',
    phaseIcon: '🌌',
  },
  {
    hour: 5.5,
    skyHex: '#312e81', // Primeiros raios violeta
    fogHex: '#4338ca',
    fogNear: 40,
    fogFar: 82,
    sunHex: '#fbcfe8',
    sunIntensity: 0.65,
    sunPos: [45, 10, 30],
    hemiSkyHex: '#4f46e5',
    hemiGroundHex: '#14532d',
    hemiIntensity: 0.38,
    exposure: 1.08,
    starsOpacity: 0.5,
    lanternGlow: 0.8,
    phaseKey: 'amanhecer',
    phaseLabel: 'Alvorada',
    phaseIcon: '🌄',
  },
  {
    hour: 6.5,
    skyHex: '#f472b6', // Aurora rosa-dourada
    fogHex: '#fde68a',
    fogNear: 45,
    fogFar: 88,
    sunHex: '#fbbf24',
    sunIntensity: 1.25,
    sunPos: [42, 22, 28],
    hemiSkyHex: '#fed7aa',
    hemiGroundHex: '#86efac',
    hemiIntensity: 0.55,
    exposure: 1.12,
    starsOpacity: 0.05,
    lanternGlow: 0.3,
    phaseKey: 'amanhecer',
    phaseLabel: 'Amanhecer Dourado',
    phaseIcon: '🌅',
  },
  {
    hour: 8.0,
    skyHex: '#7dd3fc', // Céu limpo da manhã
    fogHex: '#bae6fd',
    fogNear: 50,
    fogFar: 102,
    sunHex: '#fef08a',
    sunIntensity: 1.65,
    sunPos: [35, 38, 25],
    hemiSkyHex: '#bae6fd',
    hemiGroundHex: '#86efac',
    hemiIntensity: 0.72,
    exposure: 1.15,
    starsOpacity: 0.0,
    lanternGlow: 0.0,
    phaseKey: 'manha',
    phaseLabel: 'Manhã Fresca',
    phaseIcon: '☀️',
  },
  {
    hour: 12.0,
    skyHex: '#38bdf8', // Meio-dia sol a pino
    fogHex: '#7dd3fc',
    fogNear: 55,
    fogFar: 115,
    sunHex: '#ffffff',
    sunIntensity: 1.85,
    sunPos: [15, 55, 15],
    hemiSkyHex: '#bae6fd',
    hemiGroundHex: '#86efac',
    hemiIntensity: 0.78,
    exposure: 1.16,
    starsOpacity: 0.0,
    lanternGlow: 0.0,
    phaseKey: 'meio_dia',
    phaseLabel: 'Meio-Dia Ensolarado',
    phaseIcon: '🌞',
  },
  {
    hour: 15.5,
    skyHex: '#60a5fa', // Tarde ensolarada
    fogHex: '#93c5fd',
    fogNear: 52,
    fogFar: 108,
    sunHex: '#fffbeb',
    sunIntensity: 1.75,
    sunPos: [-15, 48, 20],
    hemiSkyHex: '#bae6fd',
    hemiGroundHex: '#86efac',
    hemiIntensity: 0.75,
    exposure: 1.15,
    starsOpacity: 0.0,
    lanternGlow: 0.0,
    phaseKey: 'meio_dia',
    phaseLabel: 'Tarde na Fazenda',
    phaseIcon: '🌤️',
  },
  {
    hour: 17.5,
    skyHex: '#f97316', // Entardecer dourado / Golden Hour
    fogHex: '#fdba74',
    fogNear: 45,
    fogFar: 92,
    sunHex: '#ffedd5',
    sunIntensity: 1.45,
    sunPos: [-38, 26, 12],
    hemiSkyHex: '#fdba74',
    hemiGroundHex: '#4ade80',
    hemiIntensity: 0.65,
    exposure: 1.14,
    starsOpacity: 0.0,
    lanternGlow: 0.25,
    phaseKey: 'entardecer',
    phaseLabel: 'Entardecer Dourado',
    phaseIcon: '🌇',
  },
  {
    hour: 18.5,
    skyHex: '#c026d3', // Pôr do Sol Carmesim
    fogHex: '#f43f5e',
    fogNear: 40,
    fogFar: 85,
    sunHex: '#ea580c',
    sunIntensity: 0.95,
    sunPos: [-45, 12, 5],
    hemiSkyHex: '#fb923c',
    hemiGroundHex: '#15803d',
    hemiIntensity: 0.5,
    exposure: 1.1,
    starsOpacity: 0.15,
    lanternGlow: 0.75,
    phaseKey: 'entardecer',
    phaseLabel: 'Pôr do Sol',
    phaseIcon: '🌆',
  },
  {
    hour: 19.5,
    skyHex: '#1e1b4b', // Crepúsculo / Noitinha
    fogHex: '#312e81',
    fogNear: 38,
    fogFar: 80,
    sunHex: '#818cf8',
    sunIntensity: 0.52,
    sunPos: [-35, 25, -15],
    hemiSkyHex: '#312e81',
    hemiGroundHex: '#14532d',
    hemiIntensity: 0.35,
    exposure: 1.06,
    starsOpacity: 0.7,
    lanternGlow: 1.0,
    phaseKey: 'crepusculo',
    phaseLabel: 'Crepúsculo',
    phaseIcon: '✨',
  },
  {
    hour: 21.0,
    skyHex: '#0a0f1d', // Noite estrelada
    fogHex: '#0a0f1d',
    fogNear: 35,
    fogFar: 75,
    sunHex: '#93c5fd',
    sunIntensity: 0.38,
    sunPos: [-20, 48, -25],
    hemiSkyHex: '#1e293b',
    hemiGroundHex: '#08101a',
    hemiIntensity: 0.22,
    exposure: 1.05,
    starsOpacity: 1.0,
    lanternGlow: 1.0,
    phaseKey: 'noite',
    phaseLabel: 'Noite Estrelada',
    phaseIcon: '🌙',
  },
];

export function getRealWorldDecimalHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

export function formatDecimalHour(decimalHour: number): string {
  const norm = ((decimalHour % 24) + 24) % 24;
  const hours = Math.floor(norm);
  const minutes = Math.floor((norm - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function calculateAtmosphereForHour(hourDecimal: number): DayNightAtmosphere {
  const normHour = ((hourDecimal % 24) + 24) % 24;

  // Encontrar os 2 keyframes adjacentes
  let idx1 = CYCLE_KEYFRAMES.length - 1;
  let idx2 = 0;

  for (let i = 0; i < CYCLE_KEYFRAMES.length; i++) {
    if (CYCLE_KEYFRAMES[i].hour <= normHour) {
      idx1 = i;
    }
  }
  idx2 = (idx1 + 1) % CYCLE_KEYFRAMES.length;

  const k1 = CYCLE_KEYFRAMES[idx1];
  const k2 = CYCLE_KEYFRAMES[idx2];

  let span = k2.hour - k1.hour;
  if (span <= 0) span += 24;

  let offset = normHour - k1.hour;
  if (offset < 0) offset += 24;

  const rawT = Math.min(1, Math.max(0, offset / span));
  // Curva de transição suave (Smoothstep)
  const t = rawT * rawT * (3 - 2 * rawT);

  const skyColor = new THREE.Color(k1.skyHex).lerp(new THREE.Color(k2.skyHex), t);
  const fogColor = new THREE.Color(k1.fogHex).lerp(new THREE.Color(k2.fogHex), t);
  const sunColor = new THREE.Color(k1.sunHex).lerp(new THREE.Color(k2.sunHex), t);
  const hemiSkyColor = new THREE.Color(k1.hemiSkyHex).lerp(new THREE.Color(k2.hemiSkyHex), t);
  const hemiGroundColor = new THREE.Color(k1.hemiGroundHex).lerp(new THREE.Color(k2.hemiGroundHex), t);

  const fogNear = THREE.MathUtils.lerp(k1.fogNear, k2.fogNear, t);
  const fogFar = THREE.MathUtils.lerp(k1.fogFar, k2.fogFar, t);
  const sunIntensity = THREE.MathUtils.lerp(k1.sunIntensity, k2.sunIntensity, t);
  const hemiIntensity = THREE.MathUtils.lerp(k1.hemiIntensity, k2.hemiIntensity, t);
  const exposure = THREE.MathUtils.lerp(k1.exposure, k2.exposure, t);
  const starsOpacity = THREE.MathUtils.lerp(k1.starsOpacity, k2.starsOpacity, t);
  const lanternGlowIntensity = THREE.MathUtils.lerp(k1.lanternGlow, k2.lanternGlow, t);

  const sunPos1 = new THREE.Vector3(...k1.sunPos);
  const sunPos2 = new THREE.Vector3(...k2.sunPos);
  const sunPosition = sunPos1.lerp(sunPos2, t);

  const activeKeyframe = t < 0.5 ? k1 : k2;
  const isNight = starsOpacity > 0.3 || normHour < 5.2 || normHour >= 19.8;

  return {
    hour: normHour,
    formattedTime: formatDecimalHour(normHour),
    phaseKey: activeKeyframe.phaseKey,
    phaseLabel: activeKeyframe.phaseLabel,
    phaseIcon: activeKeyframe.phaseIcon,
    skyColor,
    fogColor,
    fogNear,
    fogFar,
    sunColor,
    sunIntensity,
    sunPosition,
    hemiSkyColor,
    hemiGroundColor,
    hemiIntensity,
    exposure,
    starsOpacity,
    lanternGlowIntensity,
    isNight,
  };
}

/**
 * Cria a cúpula de estrelas celestes procedural para o céu noturno da fazendinha
 */
export function createCelestialStarField(count = 700, radius = 95): {
  points: THREE.Points;
  updateTwinkle: (time: number, baseOpacity: number) => void;
} {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Distribuição esférica no hemisfério superior
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.85 + 0.15); // Não coloca estrelas abaixo do horizonte
    const r = radius + (Math.random() - 0.5) * 8;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi); // y sempre positivo
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    phases[i] = Math.random() * Math.PI * 2;
    sizes[i] = 1.0 + Math.random() * 1.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Canvas circular suave para o ponto de estrela (sem artefatos quadrados)
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, '#e0f2fe');
  grad.addColorStop(0.8, 'rgba(186, 230, 253, 0.4)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.PointsMaterial({
    map: texture,
    size: 2.2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);

  return {
    points,
    updateTwinkle: (time: number, baseOpacity: number) => {
      if (baseOpacity <= 0.01) {
        points.visible = false;
        material.opacity = 0;
        return;
      }
      points.visible = true;
      // Cintilação suave global
      const twinkle = 0.85 + Math.sin(time * 2.5) * 0.15;
      material.opacity = THREE.MathUtils.clamp(baseOpacity * twinkle, 0, 1);
    },
  };
}

export interface FarmLanternInstance {
  group: THREE.Group;
  light: THREE.PointLight;
  bulbMesh: THREE.Mesh;
  baseLightIntensity: number;
}

/**
 * Cria um poste de lampião rústico da fazendinha com iluminação ponto para visibilidade noturna
 */
export function createRusticFarmLantern(x: number, z: number, groundY = 0): FarmLanternInstance {
  const group = new THREE.Group();
  group.position.set(x, groundY, z);

  // Poste de madeira entalhada
  const postGeo = new THREE.CylinderGeometry(0.12, 0.16, 3.2, 8);
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.9,
  });
  const post = new THREE.Mesh(postGeo, postMat);
  post.position.y = 1.6;
  post.castShadow = true;
  post.receiveShadow = true;
  group.add(post);

  // Braço de ferro forjado
  const armGeo = new THREE.BoxGeometry(0.08, 0.08, 0.6);
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.5,
    metalness: 0.8,
  });
  const arm = new THREE.Mesh(armGeo, ironMat);
  arm.position.set(0, 3.0, 0.25);
  group.add(arm);

  // Cúpula do lampião
  const capGeo = new THREE.ConeGeometry(0.32, 0.22, 6);
  const cap = new THREE.Mesh(capGeo, ironMat);
  cap.position.set(0, 3.05, 0.5);
  group.add(cap);

  // Lâmpada de vidro âmbar brilhante
  const bulbGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.35, 8);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: new THREE.Color(0xf59e0b),
    emissiveIntensity: 0.0,
    roughness: 0.2,
    transparent: true,
    opacity: 0.92,
  });
  const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
  bulbMesh.position.set(0, 2.82, 0.5);
  group.add(bulbMesh);

  // Base do lampião
  const baseGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.06, 6);
  const baseMesh = new THREE.Mesh(baseGeo, ironMat);
  baseMesh.position.set(0, 2.62, 0.5);
  group.add(baseMesh);

  // Foco de Luz Pontual otimizado (alcance eficiente sem sobrecarregar fragment shaders)
  const light = new THREE.PointLight(0xfbbf24, 0, 12, 2);
  light.castShadow = false;
  light.position.set(0, 2.82, 0.5);
  group.add(light);

  return {
    group,
    light,
    bulbMesh,
    baseLightIntensity: 1.6,
  };
}
