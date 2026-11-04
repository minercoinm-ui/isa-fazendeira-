import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildIsaModel, buildPlayerModel, AnimatedCharacter } from './characterModels';
import {
  createFarmTerrain,
  createIsaFarmhouse,
  createBigRedBarn,
  createWindmill,
  createFarmTractor,
  createFarmPlotMesh,
  createCowModel,
  createChickenModel,
  createPigModel,
  createWaterAndBridge,
  createFoliage,
  createAmbientLife,
  createMarketplaceBuilding,
  createCentralTalhoesBuilding,
  createLandPlotMesh,
  AnimatedWorldObjects,
} from './worldModels';
import {
  FarmPlot,
  CropType,
  RemotePlayer,
  FarmLand,
  NpcPurchaseTransaction,
  MarketNpcProfile,
  MARKET_PRODUCT_INFO,
} from '../types/game';
import { soundManager } from '../audio/soundManager';
import {
  DayNightAtmosphere,
  calculateAtmosphereForHour,
  getRealWorldDecimalHour,
  createCelestialStarField,
  createRusticFarmLantern,
  FarmLanternInstance,
} from './dayNightCycle';

export interface InteractionTarget {
  type: 'plot' | 'animal' | 'isa' | 'barn' | 'market' | 'land' | 'central_talhoes';
  id: string | number;
  label: string;
  icon: string;
  distance: number;
  position: THREE.Vector3;
  landData?: FarmLand;
}

export interface NpcPreferredProduct {
  productId: string;
  name: string;
  icon: string;
  category?: string;
}

// Perfis padrão oficiais cadastrados em market_npc_profiles no Supabase
export const DEFAULT_NPC_PREFERRED_PRODUCTS: Record<string, NpcPreferredProduct> = {
  'npc-antonio': {
    productId: 'corn',
    name: 'Milho Dourado',
    icon: '🌽',
    category: 'crop',
  },
  'npc-francisca': {
    productId: 'carrot',
    name: 'Cenoura Crocante',
    icon: '🥕',
    category: 'crop',
  },
  'npc-tiao': {
    productId: 'wheat',
    name: 'Trigo Dourado',
    icon: '🌾',
    category: 'grains',
  },
  'npc-benta': {
    productId: 'milk',
    name: 'Balde de Leite',
    icon: '🥛',
    category: 'product',
  },
  'npc-carlinhos': {
    productId: 'strawberry',
    name: 'Morango Silvestre',
    icon: '🍓',
    category: 'fruits',
  },
};

/**
 * Mapeia o perfil do NPC do Supabase (market_npc_profiles) para o produto e ícone procurado
 */
export function resolveNpcPreferredProduct(
  profileOrId: string | (Partial<MarketNpcProfile> & { id: string })
): NpcPreferredProduct {
  const id = typeof profileOrId === 'string' ? profileOrId : profileOrId.id;
  const fallback = DEFAULT_NPC_PREFERRED_PRODUCTS[id] || {
    productId: 'corn',
    name: 'Milho Dourado',
    icon: '🌽',
    category: 'crop',
  };

  if (typeof profileOrId === 'string') {
    return { ...fallback };
  }

  const anyProfile = profileOrId as any;
  if (anyProfile.preferred_product || anyProfile.preferred_crop) {
    const prodKey = String(anyProfile.preferred_product || anyProfile.preferred_crop).toLowerCase();
    const info = (MARKET_PRODUCT_INFO as any)[prodKey];
    if (info) {
      return {
        productId: prodKey,
        name: info.name,
        icon: info.icon,
        category: info.category,
      };
    }
  }

  const cat = String(profileOrId.preferred_category || '').toLowerCase();
  const personality = String(profileOrId.personality || '').toLowerCase();

  if (personality.includes('cenoura')) {
    return { productId: 'carrot', name: 'Cenoura Crocante', icon: '🥕', category: 'crop' };
  }
  if (personality.includes('milho')) {
    return { productId: 'corn', name: 'Milho Dourado', icon: '🌽', category: 'crop' };
  }
  if (personality.includes('leite')) {
    return { productId: 'milk', name: 'Balde de Leite', icon: '🥛', category: 'product' };
  }
  if (personality.includes('trigo') || personality.includes('soja') || cat === 'grains') {
    return { productId: 'wheat', name: 'Trigo Dourado', icon: '🌾', category: 'grains' };
  }
  if (personality.includes('morango') || cat === 'fruits') {
    return { productId: 'strawberry', name: 'Morango Silvestre', icon: '🍓', category: 'fruits' };
  }

  return { ...fallback };
}

/**
 * Desenha o balão de pensamento estilizado e minimalista (focado puramente no ícone visual do produto)
 */
export function renderThoughtBubbleCanvas(
  ctx: CanvasRenderingContext2D,
  product: { name: string; icon: string; category?: string }
) {
  ctx.clearRect(0, 0, 256, 256);

  // 1. Sombra suave para destacar no cenário 3D sem poluição
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  // 2. Pontos trailing conectando à cabeça do NPC
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(128, 222, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(128, 202, 7.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Bolha principal circular, suave e aconchegante
  ctx.beginPath();
  ctx.arc(128, 122, 68, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. Contorno âmbar suave e delicado
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(128, 222, 4.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(128, 202, 7.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(128, 122, 68, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Preenchimento interno límpido com suave gradiente quente
  const grad = ctx.createRadialGradient(128, 114, 10, 128, 122, 68);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#fefce8');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 122, 66, 0, Math.PI * 2);
  ctx.fill();

  // 6. Ícone do produto em destaque visual limpo, nítido e centralizado
  ctx.font = '66px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(product.icon || '🌾', 128, 124);
}

/**
 * Cria o sprite Three.js com textura de Canvas dinâmico para o balão de pensamento
 */
export function createThoughtBubble(product: NpcPreferredProduct): {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  renderThoughtBubbleCanvas(ctx, product);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0, 0, 1);
  sprite.position.set(0, 2.95, 0);
  sprite.visible = false;

  return { sprite, canvas, texture };
}

export interface BuyerNpcActor {
  id: string;
  name: string;
  avatar: string;
  character: AnimatedCharacter;
  homePos: THREE.Vector3;
  stallPos: THREE.Vector3;
  stallOffset: number;
  state: 'idle' | 'walking_to_stall' | 'buying' | 'leaving';
  stateTime: number;
  currentRotation: number;
  activeTx?: NpcPurchaseTransaction;
  // Sistema dinâmico de balão de pensamento (Supabase)
  preferredProduct: NpcPreferredProduct;
  thoughtBubbleSprite?: THREE.Sprite;
  thoughtBubbleCanvas?: HTMLCanvasElement;
  thoughtBubbleTexture?: THREE.CanvasTexture;
  bubbleCurrentScale: number;
  bubbleTargetScale: number;
  bubbleBobOffset: number;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean;
  private animFrameId: number = 0;
  private container: HTMLElement;

  // Characters
  public isaCharacter: AnimatedCharacter;
  public localPlayer: AnimatedCharacter;
  public remotePlayers: Map<string, AnimatedCharacter> = new Map();

  // 5 Autonomous NPC Buyers (market_npc_profiles)
  public buyerNpcs: Map<string, BuyerNpcActor> = new Map();
  private marketShelvesGroup: THREE.Group = new THREE.Group();

  // ☀️ Ciclo Dinâmico de Iluminação e Dia/Noite 24h
  public sunLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  public starField!: { points: THREE.Points; updateTwinkle: (time: number, opacity: number) => void };
  public farmLanterns: FarmLanternInstance[] = [];
  public simulatedHour: number | null = null;
  public currentAtmosphere: DayNightAtmosphere;
  public onAtmosphereChange?: (atmosphere: DayNightAtmosphere) => void;
  private lastAtmosphereNotifyMinute: number = -1;

  // World Meshes
  private plotMeshes: Map<number, THREE.Group> = new Map();
  private animatedWorld: AnimatedWorldObjects;
  private interactionRing: THREE.Mesh;

  // Interaction State
  public currentTarget: InteractionTarget | null = null;
  public onInteractionChange?: (target: InteractionTarget | null) => void;
  public onPlayerMove?: (x: number, y: number, z: number, rotation: number, isMoving: boolean) => void;

  // Player Kinematics
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 2);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public playerRotation: number = 0;
  public isMoving: boolean = false;
  private moveSpeed: number = 7.0;

  // Camera Settings
  public cameraMode: 'follow' | 'isometric' | 'orbit' = 'follow';
  public cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 9.5, 12);
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3();

  // Controls State
  private keys: Record<string, boolean> = {};
  public joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  private clock: THREE.Clock = new THREE.Clock();
  private interactionThrottleTimer: number = 0;

  // Interactive Coordinates (16 Talhões na Horta Central com Corredores de Circulação)
  public plotCoords: { id: number; x: number; z: number; pos: THREE.Vector3 }[] = [
    // Central 16 plots (IDs 0..15)
    { id: 0, x: -5.4, z: -3.8, pos: new THREE.Vector3(-5.4, 0, -3.8) },
    { id: 1, x: -2.0, z: -3.8, pos: new THREE.Vector3(-2.0, 0, -3.8) },
    { id: 2, x: -5.4, z: -0.4, pos: new THREE.Vector3(-5.4, 0, -0.4) },
    { id: 3, x: -2.0, z: -0.4, pos: new THREE.Vector3(-2.0, 0, -0.4) },
    { id: 4, x: -5.4, z: 3.0, pos: new THREE.Vector3(-5.4, 0, 3.0) },
    { id: 5, x: -2.0, z: 3.0, pos: new THREE.Vector3(-2.0, 0, 3.0) },
    { id: 6, x: -5.4, z: 6.4, pos: new THREE.Vector3(-5.4, 0, 6.4) },
    { id: 7, x: -2.0, z: 6.4, pos: new THREE.Vector3(-2.0, 0, 6.4) },
    { id: 8, x: 2.0, z: -3.8, pos: new THREE.Vector3(2.0, 0, -3.8) },
    { id: 9, x: 5.4, z: -3.8, pos: new THREE.Vector3(5.4, 0, -3.8) },
    { id: 10, x: 2.0, z: -0.4, pos: new THREE.Vector3(2.0, 0, -0.4) },
    { id: 11, x: 5.4, z: -0.4, pos: new THREE.Vector3(5.4, 0, -0.4) },
    { id: 12, x: 2.0, z: 3.0, pos: new THREE.Vector3(2.0, 0, 3.0) },
    { id: 13, x: 5.4, z: 3.0, pos: new THREE.Vector3(5.4, 0, 3.0) },
    { id: 14, x: 2.0, z: 6.4, pos: new THREE.Vector3(2.0, 0, 6.4) },
    { id: 15, x: 5.4, z: 6.4, pos: new THREE.Vector3(5.4, 0, 6.4) },

    // Expansão 1: Horta Leste (IDs 16..19)
    { id: 16, x: 8.8, z: -3.8, pos: new THREE.Vector3(8.8, 0, -3.8) },
    { id: 17, x: 12.2, z: -3.8, pos: new THREE.Vector3(12.2, 0, -3.8) },
    { id: 18, x: 8.8, z: -0.4, pos: new THREE.Vector3(8.8, 0, -0.4) },
    { id: 19, x: 12.2, z: -0.4, pos: new THREE.Vector3(12.2, 0, -0.4) },

    // Expansão 2: Canteiros do Riacho (IDs 20..23)
    { id: 20, x: 8.8, z: 3.0, pos: new THREE.Vector3(8.8, 0, 3.0) },
    { id: 21, x: 12.2, z: 3.0, pos: new THREE.Vector3(12.2, 0, 3.0) },
    { id: 22, x: 8.8, z: 6.4, pos: new THREE.Vector3(8.8, 0, 6.4) },
    { id: 23, x: 12.2, z: 6.4, pos: new THREE.Vector3(12.2, 0, 6.4) },

    // Expansão 3: Horta Nobre do Pomar (IDs 24..27)
    { id: 24, x: -8.8, z: -3.8, pos: new THREE.Vector3(-8.8, 0, -3.8) },
    { id: 25, x: -12.2, z: -3.8, pos: new THREE.Vector3(-12.2, 0, -3.8) },
    { id: 26, x: -8.8, z: -0.4, pos: new THREE.Vector3(-8.8, 0, -0.4) },
    { id: 27, x: -12.2, z: -0.4, pos: new THREE.Vector3(-12.2, 0, -0.4) },

    // Expansão 4: Grande Safra da Isa (IDs 28..31)
    { id: 28, x: -5.4, z: -7.2, pos: new THREE.Vector3(-5.4, 0, -7.2) },
    { id: 29, x: -2.0, z: -7.2, pos: new THREE.Vector3(-2.0, 0, -7.2) },
    { id: 30, x: 2.0, z: -7.2, pos: new THREE.Vector3(2.0, 0, -7.2) },
    { id: 31, x: 5.4, z: -7.2, pos: new THREE.Vector3(5.4, 0, -7.2) },
  ];

  public animalCoords = [
    { id: 'cow-1', name: 'Mimosa', type: 'cow', x: 13, z: 8, pos: new THREE.Vector3(13, 0, 8) },
    { id: 'cow-2', name: 'Estrela', type: 'cow', x: 17, z: 12, pos: new THREE.Vector3(17, 0, 12) },
    { id: 'chicken-1', name: 'Pipa', type: 'chicken', x: -14, z: -6, pos: new THREE.Vector3(-14, 0, -6) },
    { id: 'chicken-2', name: 'Carijó', type: 'chicken', x: -16, z: -9, pos: new THREE.Vector3(-16, 0, -9) },
    { id: 'pig-1', name: 'Baconzinho', type: 'pig', x: -7, z: 17, pos: new THREE.Vector3(-7, 0, 17) },
  ];

  public isaPosition = new THREE.Vector3(-8.5, 0, -11.5);
  public barnPosition = new THREE.Vector3(15, 0, -14);
  public marketPosition = new THREE.Vector3(-12, 0, 5);
  public centralTalhoesPosition = new THREE.Vector3(8, 0, -6);
  public lands: FarmLand[] = [];
  public landMeshes: Map<string, THREE.Group> = new Map();
  private _landPositions: Map<string, THREE.Vector3> = new Map();
  private _remoteLerpVec = new THREE.Vector3();
  public currentIsaState: string = 'idle';

  public setIsaAnimationState(state: string) {
    this.currentIsaState = state;
  }

  constructor(container: HTMLElement, playerAvatar: string, playerNickname: string, playerLevel: number) {
    this.container = container;

    // Detect Software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param) || '');
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Atmosphere & Scene
    this.currentAtmosphere = calculateAtmosphereForHour(getRealWorldDecimalHour());
    this.scene = new THREE.Scene();
    this.scene.background = this.currentAtmosphere.skyColor.clone();
    this.scene.fog = new THREE.Fog(
      this.currentAtmosphere.fogColor.clone(),
      this.currentAtmosphere.fogNear,
      this.currentAtmosphere.fogFar
    );

    // 2. Camera with safe aspect ratio
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    this.camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      180
    );
    this.camera.position.set(0, 16, 20);
    this.cameraLookTarget.copy(this.playerPos);

    // 3. Renderer with safe creation
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !this.isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      this.renderer = new THREE.WebGLRenderer({ antialias: false });
    }

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.currentAtmosphere.exposure;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment & Dynamic Lighting
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch (e) {
      console.warn('PMREM environment initialization skipped:', e);
    }

    // Dynamic Sun / Moon Directional Light
    this.sunLight = new THREE.DirectionalLight(
      this.currentAtmosphere.sunColor.clone(),
      this.currentAtmosphere.sunIntensity
    );
    this.sunLight.position.copy(this.currentAtmosphere.sunPosition);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 512;
    this.sunLight.shadow.mapSize.height = 512;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 120;
    const d = 32;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // Dynamic Sky / Ground Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(
      this.currentAtmosphere.hemiSkyColor.clone(),
      this.currentAtmosphere.hemiGroundColor.clone(),
      this.currentAtmosphere.hemiIntensity
    );
    this.scene.add(this.hemiLight);

    // Campo de Estrelas Procedural na abóbada celeste
    this.starField = createCelestialStarField();
    this.scene.add(this.starField.points);

    // Lampiões Rústicos nos Pontos Principais da Fazenda (Iluminação Noturna Acolhedora)
    const lanternCoords = [
      { x: -11.5, z: -14.5 }, // Alpendre da Casa da Isa
      { x: 11.5, z: -16.0 },  // Celeiro Vermelho
      { x: -9.0, z: 5.0 },    // Feira e Mercado de Vendas
      { x: 6.0, z: -4.5 },    // Central de Talhões
      { x: -0.5, z: -0.5 },   // Cruzamento dos Talhões e Horta
      { x: 15.0, z: 0.5 },    // Entrada da Ponte e Rio
    ];

    for (const pos of lanternCoords) {
      const lantern = createRusticFarmLantern(pos.x, pos.z, 0);
      this.farmLanterns.push(lantern);
      this.scene.add(lantern.group);
    }

    // 5. Build World Geometry
    createFarmTerrain(this.scene);
    createIsaFarmhouse(this.scene, -15, -18);
    createBigRedBarn(this.scene, 15, -20);
    const windmillObj = createWindmill(this.scene, -25, 12);
    createFarmTractor(this.scene, 4, -14);
    createMarketplaceBuilding(this.scene, -12, 5);
    createCentralTalhoesBuilding(this.scene, 8, -6);
    createWaterAndBridge(this.scene);
    createFoliage(this.scene);
    const ambientLife = createAmbientLife(this.scene);

    // Animals
    const cows = [
      createCowModel('cow-1', 'Mimosa', 13, 8),
      createCowModel('cow-2', 'Estrela', 17, 12),
    ];
    cows.forEach((c) => this.scene.add(c.root));

    const chickens = [
      createChickenModel('chicken-1', 'Pipa', -14, -6),
      createChickenModel('chicken-2', 'Carijó', -16, -9),
    ];
    chickens.forEach((ch) => this.scene.add(ch.root));

    const pigs = [createPigModel('pig-1', 'Baconzinho', -7, 17)];
    pigs.forEach((p) => this.scene.add(p.root));

    this.animatedWorld = {
      windmillSails: windmillObj.sails,
      cows,
      chickens,
      pigs,
      sheep: [],
      butterflies: ambientLife.butterflies,
      clouds: ambientLife.clouds,
      smokePuffs: ambientLife.smokePuffs,
      update: (time: number) => {
        // Windmill rotation
        if (windmillObj.sails) {
          windmillObj.sails.rotation.z += 0.012;
        }

        // Cow head grazing
        cows.forEach((cow, i) => {
          cow.head.rotation.x = Math.sin(time * 1.5 + i) * 0.15 + 0.1;
          cow.tail.rotation.z = Math.sin(time * 3 + i) * 0.3;
        });

        // Chickens pecking
        chickens.forEach((chk, i) => {
          chk.head.rotation.x = Math.abs(Math.sin(time * 5 + i * 2)) * 0.4;
          chk.root.position.x = chk.root.position.x + Math.sin(time * 0.5 + i) * 0.003;
        });

        // Pigs wiggling
        pigs.forEach((pig, i) => {
          pig.tail.rotation.z = Math.sin(time * 6 + i) * 0.5;
        });

        // Butterflies flapping
        ambientLife.butterflies.forEach((b, i) => {
          const flap = Math.sin(time * 22 + i) * 0.8;
          b.leftWing.rotation.y = flap;
          b.rightWing.rotation.y = -flap;
          b.group.position.x = b.basePos.x + Math.sin(time * 1.2 + i) * 2;
          b.group.position.z = b.basePos.z + Math.cos(time * 1.2 + i) * 2;
          b.group.position.y = b.basePos.y + Math.sin(time * 3 + i) * 0.4;
        });

        // Clouds drifting
        ambientLife.clouds.forEach((cloud) => {
          cloud.position.x += 0.02;
          if (cloud.position.x > 80) cloud.position.x = -80;
        });

        // Smoke puffs
        ambientLife.smokePuffs.forEach((puff) => {
          const t = (time + puff.offset) % 3;
          puff.mesh.position.y = puff.basePos.y + t * 1.4;
          puff.mesh.position.x = puff.basePos.x + Math.sin(t * 2) * 0.3;
          puff.mesh.scale.setScalar(1 + t * 0.8);
          (puff.mesh.material as THREE.Material).opacity = Math.max(0, 0.7 - t * 0.22);
        });
      },
    };

    // 6. Interactive Ground Ring Indicator
    const ringGeo = new THREE.RingGeometry(1.2, 1.4, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.interactionRing = new THREE.Mesh(ringGeo, ringMat);
    this.interactionRing.rotation.x = -Math.PI / 2;
    this.interactionRing.position.y = 0.08;
    this.interactionRing.visible = false;
    this.scene.add(this.interactionRing);

    // 7. Characters Setup
    // Isa
    this.isaCharacter = buildIsaModel();
    this.isaCharacter.root.position.copy(this.isaPosition);
    this.isaCharacter.root.rotation.y = Math.PI / 6; // Facing welcome angle
    this.scene.add(this.isaCharacter.root);

    // Local Player
    this.localPlayer = buildPlayerModel(playerAvatar, playerNickname, playerLevel);
    this.localPlayer.root.position.copy(this.playerPos);
    this.scene.add(this.localPlayer.root);

    // Dynamic Market Shelves Attached to Marketplace
    this.marketShelvesGroup.position.copy(this.marketPosition);
    this.scene.add(this.marketShelvesGroup);

    // 5 Autonomous Buyer NPCs (Registered in market_npc_profiles)
    const buyersConfig: { id: string; name: string; avatar: string; homePos: [number, number, number]; stallOffset: number }[] = [
      { id: 'npc-antonio', name: 'Seu Antônio', avatar: 'bento', homePos: [-7.0, 0, 11.5], stallOffset: -1.2 },
      { id: 'npc-francisca', name: 'Dona Francisca', avatar: 'aninha', homePos: [-16.5, 0, 11.0], stallOffset: -0.6 },
      { id: 'npc-tiao', name: 'Tião dos Grãos', avatar: 'kaua', homePos: [-7.0, 0, 3.5], stallOffset: 0.0 },
      { id: 'npc-benta', name: 'Dona Benta', avatar: 'mel', homePos: [-16.0, 0, 3.5], stallOffset: 0.6 },
      { id: 'npc-carlinhos', name: 'Carlinhos das Frutas', avatar: 'davi', homePos: [-9.5, 0, 13.5], stallOffset: 1.2 },
    ];

    buyersConfig.forEach((cfg) => {
      const char = buildPlayerModel(cfg.avatar, cfg.name, 5);
      const homeVec = new THREE.Vector3(...cfg.homePos);
      char.root.position.copy(homeVec);
      const initRot = Math.atan2(this.marketPosition.x - homeVec.x, this.marketPosition.z - homeVec.z);
      char.root.rotation.y = initRot;
      this.scene.add(char.root);

      // Balão de pensamento dinâmico com o produto procurado (Supabase)
      const preferredProduct = resolveNpcPreferredProduct(cfg.id);
      const { sprite, canvas, texture } = createThoughtBubble(preferredProduct);
      char.root.add(sprite);

      this.buyerNpcs.set(cfg.id, {
        id: cfg.id,
        name: cfg.name,
        avatar: cfg.avatar,
        character: char,
        homePos: homeVec,
        stallPos: new THREE.Vector3(this.marketPosition.x + cfg.stallOffset, 0, this.marketPosition.z + 2.5),
        stallOffset: cfg.stallOffset,
        state: 'idle',
        stateTime: 0,
        currentRotation: initRot,
        preferredProduct,
        thoughtBubbleSprite: sprite,
        thoughtBubbleCanvas: canvas,
        thoughtBubbleTexture: texture,
        bubbleCurrentScale: 0,
        bubbleTargetScale: 0,
        bubbleBobOffset: Math.random() * Math.PI * 2,
      });
    });

    // 8. Event Listeners
    this.setupInputs();
    window.addEventListener('resize', this.onResize);

    // 9. Start Game Loop
    this.startLoop();
  }

  // Farm Plots Rendering & Updates
  public updatePlotMeshes(plots: FarmPlot[]) {
    plots.forEach((plot) => {
      const coord = this.plotCoords.find((c) => c.id === plot.id);
      if (!coord) return;

      if (this.plotMeshes.has(plot.id)) {
        const oldMesh = this.plotMeshes.get(plot.id)!;
        this.scene.remove(oldMesh);
      }

      const newMesh = createFarmPlotMesh(
        plot.id,
        coord.x,
        coord.z,
        plot.cropType,
        plot.stage,
        plot.watered
      );
      this.scene.add(newMesh);
      this.plotMeshes.set(plot.id, newMesh);
    });
  }

  // Update Expandable Lands 3D Meshes
  public updateLands(lands: FarmLand[], currentUserId: string) {
    this.lands = lands;
    this._landPositions.clear();
    lands.forEach((land) => {
      this._landPositions.set(land.id, new THREE.Vector3(land.x, 0, land.z + land.depth / 2 + 0.3));

      if (this.landMeshes.has(land.id)) {
        const oldMesh = this.landMeshes.get(land.id)!;
        this.scene.remove(oldMesh);
      }

      const isMine = land.ownerId === currentUserId;
      const mesh = createLandPlotMesh(
        land.id,
        land.code || 'TALHÃO',
        land.name,
        land.categoryLabel || 'Talhão Agrícola',
        land.x,
        land.z,
        land.width,
        land.depth,
        land.price,
        land.status,
        land.ownerName,
        isMine,
        land.plotsCount || 4
      );
      this.scene.add(mesh);
      this.landMeshes.set(land.id, mesh);
    });
  }

  // Allow live hot-swapping player avatar
  public changeLocalPlayerAvatar(avatarType: string, nickname: string, level: number = 1) {
    this.scene.remove(this.localPlayer.root);
    const newChar = buildPlayerModel(avatarType, nickname, level);
    newChar.root.position.copy(this.playerPos);
    newChar.root.rotation.y = this.playerRotation;
    this.scene.add(newChar.root);
    this.localPlayer = newChar;
  }

  // Synchronize Remote Multiplayer Players
  public updateRemotePlayer(p: RemotePlayer) {
    if (!this.remotePlayers.has(p.id)) {
      const remote = buildPlayerModel(p.avatar || 'leo', p.nickname, 1);
      remote.root.position.set(p.x, p.y, p.z);
      remote.root.rotation.y = p.rotation;
      this.scene.add(remote.root);
      this.remotePlayers.set(p.id, remote);
    } else {
      const remote = this.remotePlayers.get(p.id)!;
      // Smooth interpolation to new position (reusing lerp vector without heap allocations)
      this._remoteLerpVec.set(p.x, p.y, p.z);
      remote.root.position.lerp(this._remoteLerpVec, 0.35);
      remote.root.rotation.y = THREE.MathUtils.damp(remote.root.rotation.y, p.rotation, 15, 0.016);
      remote.updateAnimation(this.clock.getElapsedTime(), p.isMoving);

      if (p.message && Date.now() - p.message.time < 6000) {
        remote.setChatBubble(p.message.text);
      } else {
        remote.setChatBubble(null);
      }
    }
  }

  public removeRemotePlayer(id: string) {
    if (this.remotePlayers.has(id)) {
      const remote = this.remotePlayers.get(id)!;
      this.scene.remove(remote.root);
      this.remotePlayers.delete(id);
    }
  }

  // 🌾 Sincroniza perfis cadastrados no Supabase (market_npc_profiles) para os balões de pensamento
  public updateNpcProfiles(profiles: MarketNpcProfile[]) {
    if (!profiles || !Array.isArray(profiles)) return;
    for (const p of profiles) {
      const actor = this.buyerNpcs.get(p.id) || Array.from(this.buyerNpcs.values()).find((a) => a.name === p.name);
      if (actor) {
        actor.preferredProduct = resolveNpcPreferredProduct(p);
        if (!actor.activeTx) {
          this.updateNpcThoughtBubble(actor, actor.preferredProduct);
        }
      }
    }
  }

  // 💭 Atualiza dinamicamente a textura do balão de pensamento do NPC
  public updateNpcThoughtBubble(actor: BuyerNpcActor, product: NpcPreferredProduct) {
    if (!actor.thoughtBubbleCanvas || !actor.thoughtBubbleTexture) return;
    const ctx = actor.thoughtBubbleCanvas.getContext('2d');
    if (!ctx) return;
    renderThoughtBubbleCanvas(ctx, product);
    actor.thoughtBubbleTexture.needsUpdate = true;
  }

  // 🏪 Aciona o Fluxo Visual 3D de Compra do NPC (Confirmado pelo Banco/Servidor)
  public triggerNpcPurchase(tx: NpcPurchaseTransaction) {
    const actor = this.buyerNpcs.get(tx.npc_id) || Array.from(this.buyerNpcs.values())[0];
    if (!actor) return;

    actor.activeTx = tx;
    actor.state = 'walking_to_stall';
    actor.stateTime = 0;

    // Atualiza o balão de pensamento especificamente com o item adquirido
    this.updateNpcThoughtBubble(actor, {
      productId: tx.product_id,
      name: tx.product_name,
      icon: tx.icon,
    });

    actor.character.setChatBubble(`👀 Procurando ${tx.product_name}...`);
  }

  // 🧺 Atualiza as Prateleiras Físicas 3D de Acordo com o Estoque Real (market_inventory)
  public updateMarketShelves(listings: Array<any>) {
    while (this.marketShelvesGroup.children.length > 0) {
      const obj = this.marketShelvesGroup.children[0];
      this.marketShelvesGroup.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
    }

    const activeListings = (listings || []).filter((l) => (l.quantity || 0) > 0);
    if (activeListings.length === 0) {
      const emptyCanvas = document.createElement('canvas');
      emptyCanvas.width = 256;
      emptyCanvas.height = 64;
      const ctx = emptyCanvas.getContext('2d')!;
      ctx.fillStyle = '#fef3c7';
      ctx.roundRect(4, 4, 248, 56, 10);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = 'bold 20px Nunito, sans-serif';
      ctx.fillStyle = '#78350f';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧺 Prateleiras Vazias', 128, 32);

      const tex = new THREE.CanvasTexture(emptyCanvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sprite.position.set(0, 1.8, 1.2);
      sprite.scale.set(1.8, 0.45, 1);
      this.marketShelvesGroup.add(sprite);
      return;
    }

    const slotOffsets = [
      { x: -1.4, y: 1.3, z: 1.2 },
      { x: 0.0, y: 1.3, z: 1.2 },
      { x: 1.4, y: 1.3, z: 1.2 },
      { x: -1.0, y: 1.9, z: -1.6 },
      { x: 1.0, y: 1.9, z: -1.6 },
    ];

    activeListings.slice(0, 5).forEach((listing, idx) => {
      const slot = slotOffsets[idx];
      const itemGroup = new THREE.Group();
      itemGroup.position.set(slot.x, slot.y, slot.z);

      // Crate box
      const crateMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.5), crateMat);
      crate.position.y = 0.12;
      itemGroup.add(crate);

      // Produce items inside crate
      const colorMap: Record<string, number> = {
        corn: 0xfacc15,
        carrot: 0xf97316,
        tomato: 0xef4444,
        egg: 0xfef08a,
        milk: 0xffffff,
        wheat: 0xfef08a,
        soy: 0xa3e635,
        bean: 0x78350f,
        strawberry: 0xf43f5e,
        pumpkin: 0xf97316,
      };
      const prodColor = colorMap[listing.productId] || 0x22c55e;
      const prodMat = new THREE.MeshStandardMaterial({ color: prodColor, roughness: 0.5 });

      const countToShow = Math.min(listing.quantity, 4);
      for (let c = 0; c < countToShow; c++) {
        const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), prodMat);
        pMesh.position.set(-0.15 + (c % 2) * 0.3, 0.28, -0.1 + Math.floor(c / 2) * 0.2);
        itemGroup.add(pMesh);
      }

      // Price and stock tag
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 192;
      tagCanvas.height = 64;
      const tctx = tagCanvas.getContext('2d')!;
      tctx.fillStyle = '#ffffff';
      tctx.roundRect(4, 4, 184, 56, 12);
      tctx.fill();
      tctx.lineWidth = 3;
      tctx.strokeStyle = '#f59e0b';
      tctx.stroke();
      tctx.font = 'bold 20px Nunito, sans-serif';
      tctx.fillStyle = '#1e293b';
      tctx.textAlign = 'center';
      tctx.textBaseline = 'middle';
      tctx.fillText(`${(listing.productName || listing.productId).slice(0, 10)}`, 96, 22);
      tctx.font = 'bold 18px Nunito, sans-serif';
      tctx.fillStyle = '#b45309';
      tctx.fillText(`${listing.quantity}x • ${listing.pricePerUnit}🪙`, 96, 44);

      const tagTex = new THREE.CanvasTexture(tagCanvas);
      const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthTest: false }));
      tagSprite.scale.set(0.9, 0.3, 1);
      tagSprite.position.set(0, 0.65, 0);
      itemGroup.add(tagSprite);

      this.marketShelvesGroup.add(itemGroup);
    });
  }

  // 🚶 Simulação de Movimentação e Ciclo de Compra dos NPCs Autônomos
  private updateBuyerNpcs(delta: number, time: number) {
    for (const actor of this.buyerNpcs.values()) {
      // 💭 Balão de pensamento dinâmico: verificar se o NPC entrou na área de barraca
      const currentPos = actor.character.root.position;
      const distToMarket = Math.hypot(currentPos.x - this.marketPosition.x, currentPos.z - this.marketPosition.z);
      const distToStall = Math.hypot(currentPos.x - actor.stallPos.x, currentPos.z - actor.stallPos.z);
      const inStallZone =
        distToMarket <= 5.2 ||
        distToStall <= 3.2 ||
        actor.state === 'buying' ||
        (actor.state === 'walking_to_stall' && distToMarket <= 6.2);

      if (actor.thoughtBubbleSprite) {
        if (inStallZone) {
          actor.thoughtBubbleSprite.visible = true;
          actor.bubbleTargetScale = 1.15;
        } else {
          actor.bubbleTargetScale = 0;
        }

        actor.bubbleCurrentScale = THREE.MathUtils.lerp(
          actor.bubbleCurrentScale,
          actor.bubbleTargetScale,
          Math.min(1, delta * 8.5)
        );

        if (actor.bubbleCurrentScale < 0.02 && actor.bubbleTargetScale === 0) {
          actor.thoughtBubbleSprite.visible = false;
        } else {
          actor.thoughtBubbleSprite.scale.set(actor.bubbleCurrentScale, actor.bubbleCurrentScale, 1);
          const bob = Math.sin(time * 3.2 + actor.bubbleBobOffset) * 0.08;
          actor.thoughtBubbleSprite.position.y = 2.95 + bob;
        }
      }

      if (actor.state === 'idle') {
        actor.character.updateAnimation(time, false);
        actor.character.root.rotation.y = actor.currentRotation;
      } else if (actor.state === 'walking_to_stall') {
        const pos = actor.character.root.position;
        const target = actor.stallPos;
        const dx = target.x - pos.x;
        const dz = target.z - pos.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.35) {
          actor.state = 'buying';
          actor.stateTime = 0;
          actor.character.root.position.set(target.x, 0, target.z);
          actor.currentRotation = 0;
          actor.character.root.rotation.y = 0;
          soundManager.playCoin();
          if (actor.activeTx) {
            actor.character.setChatBubble(`🛒 Comprei ${actor.activeTx.quantity}x ${actor.activeTx.product_name}!`);
          }
        } else {
          const speed = 3.6;
          const normX = dx / dist;
          const normZ = dz / dist;
          pos.x += normX * speed * delta;
          pos.z += normZ * speed * delta;
          const targetRot = Math.atan2(normX, normZ);
          actor.currentRotation = THREE.MathUtils.damp(actor.currentRotation, targetRot, 12, delta);
          actor.character.root.rotation.y = actor.currentRotation;
          actor.character.updateAnimation(time, true, 0.9);
        }
      } else if (actor.state === 'buying') {
        actor.stateTime += delta;
        const bounce = Math.sin(time * 8) * 0.06;
        actor.character.root.position.y = Math.max(0, bounce);
        actor.character.leftArm.rotation.x = -1.2 + Math.sin(time * 6) * 0.3;
        actor.character.rightArm.rotation.x = -1.2 - Math.sin(time * 6) * 0.3;
        actor.character.headGroup.rotation.x = 0.15;

        if (actor.stateTime >= 3.5) {
          actor.state = 'leaving';
          actor.stateTime = 0;
          actor.character.root.position.y = 0;
          actor.character.setChatBubble('👋 Muito obrigado! Até logo!');
        }
      } else if (actor.state === 'leaving') {
        actor.stateTime += delta;
        if (actor.stateTime > 2.2) {
          actor.character.setChatBubble(null);
        }

        const pos = actor.character.root.position;
        const target = actor.homePos;
        const dx = target.x - pos.x;
        const dz = target.z - pos.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.35) {
          actor.state = 'idle';
          actor.stateTime = 0;
          actor.character.root.position.set(target.x, 0, target.z);
          actor.currentRotation = Math.atan2(this.marketPosition.x - target.x, this.marketPosition.z - target.z);
          actor.character.root.rotation.y = actor.currentRotation;
          actor.character.setChatBubble(null);
          actor.activeTx = undefined;
          // Restaura o produto preferido original do perfil do Supabase
          this.updateNpcThoughtBubble(actor, actor.preferredProduct);
        } else {
          const speed = 3.2;
          const normX = dx / dist;
          const normZ = dz / dist;
          pos.x += normX * speed * delta;
          pos.z += normZ * speed * delta;
          const targetRot = Math.atan2(normX, normZ);
          actor.currentRotation = THREE.MathUtils.damp(actor.currentRotation, targetRot, 12, delta);
          actor.character.root.rotation.y = actor.currentRotation;
          actor.character.updateAnimation(time, true, 0.8);
        }
      }
    }
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.joystickVector = { x: 0, y: 0 };
    });
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private checkInteractions() {
    let closestTarget: InteractionTarget | null = null;
    let minDistance = 3.6; // Max interaction distance
    const px = this.playerPos.x;
    const pz = this.playerPos.z;

    // Check Farm Plots (reusing preallocated pos)
    for (const p of this.plotCoords) {
      if (!this.plotMeshes.has(p.id)) continue;
      const dist = Math.hypot(px - p.x, pz - p.z);
      if (dist < minDistance) {
        minDistance = dist;
        closestTarget = {
          type: 'plot',
          id: p.id,
          label: `Talhão #${p.id + 1}`,
          icon: '🌱',
          distance: dist,
          position: p.pos,
        };
      }
    }

    // Check Animals (reusing preallocated pos)
    for (const a of this.animalCoords) {
      const dist = Math.hypot(px - a.x, pz - a.z);
      if (dist < minDistance) {
        minDistance = dist;
        closestTarget = {
          type: 'animal',
          id: a.id,
          label: a.name,
          icon: a.type === 'cow' ? '🐮' : a.type === 'chicken' ? '🐔' : '🐷',
          distance: dist,
          position: a.pos,
        };
      }
    }

    // Check Isa
    const isaDist = Math.hypot(px - this.isaPosition.x, pz - this.isaPosition.z);
    if (isaDist < minDistance) {
      minDistance = isaDist;
      closestTarget = {
        type: 'isa',
        id: 'isa',
        label: 'Isa',
        icon: '🌟',
        distance: isaDist,
        position: this.isaPosition,
      };
    }

    // Check Barn Door
    const barnDist = Math.hypot(px - this.barnPosition.x, pz - this.barnPosition.z);
    if (barnDist < minDistance) {
      minDistance = barnDist;
      closestTarget = {
        type: 'barn',
        id: 'barn',
        label: 'Celeiro',
        icon: '📦',
        distance: barnDist,
        position: this.barnPosition,
      };
    }

    // Check Marketplace
    const marketDist = Math.hypot(px - this.marketPosition.x, pz - this.marketPosition.z);
    if (marketDist < 4.2 && marketDist < minDistance) {
      minDistance = marketDist;
      closestTarget = {
        type: 'market',
        id: 'market',
        label: 'Mercado',
        icon: '🏪',
        distance: marketDist,
        position: this.marketPosition,
      };
    }

    // Check Central de Talhões
    const centralDist = Math.hypot(px - this.centralTalhoesPosition.x, pz - this.centralTalhoesPosition.z);
    if (centralDist < 4.5 && centralDist < minDistance) {
      minDistance = centralDist;
      closestTarget = {
        type: 'central_talhoes',
        id: 'central-talhoes',
        label: 'Terras',
        icon: '🗺️',
        distance: centralDist,
        position: this.centralTalhoesPosition,
      };
    }

    // Check Expandable Lands (reusing preallocated cached pos)
    for (const land of this.lands) {
      const landPos = this._landPositions.get(land.id);
      const sx = land.x;
      const sz = land.z + land.depth / 2 + 0.3;
      const landDist = Math.hypot(px - sx, pz - sz);
      if (landDist < 4.2 && landDist < minDistance) {
        minDistance = landDist;
        closestTarget = {
          type: 'land',
          id: land.id,
          label: land.status === 'owned' ? 'Meu Terreno' : `Comprar (${land.price} 🪙)`,
          icon: '🗺️',
          distance: landDist,
          position: landPos || this.centralTalhoesPosition,
          landData: land,
        };
      }
    }

    if (
      (!this.currentTarget && closestTarget) ||
      (this.currentTarget && !closestTarget) ||
      (this.currentTarget && closestTarget && this.currentTarget.id !== closestTarget.id)
    ) {
      this.currentTarget = closestTarget;
      this.onInteractionChange?.(closestTarget);

      if (closestTarget) {
        this.interactionRing.position.set(
          closestTarget.position.x,
          0.08,
          closestTarget.position.z
        );
        this.interactionRing.visible = true;
      } else {
        this.interactionRing.visible = false;
      }
    }

    // Pulse interaction ring
    if (this.interactionRing.visible) {
      const pulse = 1.0 + Math.sin(this.clock.getElapsedTime() * 6) * 0.12;
      this.interactionRing.scale.set(pulse, pulse, pulse);
    }
  }

  private updateMovement(delta: number) {
    let moveX = 0;
    let moveZ = 0;

    // Keyboard (WASD & Arrows)
    if (this.keys['w'] || this.keys['arrowup']) moveZ -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveZ += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    // Mobile Virtual Joystick
    if (Math.abs(this.joystickVector.x) > 0.05 || Math.abs(this.joystickVector.y) > 0.05) {
      moveX += this.joystickVector.x;
      moveZ += this.joystickVector.y;
    }

    const inputLength = Math.hypot(moveX, moveZ);
    this.isMoving = inputLength > 0.1;

    if (this.isMoving) {
      // Normalize input
      const normX = moveX / inputLength;
      const normZ = moveZ / inputLength;

      // Target rotation towards movement
      const targetAngle = Math.atan2(normX, normZ);
      this.playerRotation = THREE.MathUtils.damp(this.playerRotation, targetAngle, 16, delta);

      // Velocity
      const speed = this.moveSpeed * Math.min(inputLength, 1.0);
      this.playerVelocity.set(normX * speed, 0, normZ * speed);

      // Move player position
      this.playerPos.x += this.playerVelocity.x * delta;
      this.playerPos.z += this.playerVelocity.z * delta;

      // Clamp inside farm boundary
      this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, -45, 45);
      this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, -45, 45);

      // Footstep sound tick
      if (Math.random() < 0.15) {
        soundManager.playFootstep();
      }

      this.onPlayerMove?.(
        this.playerPos.x,
        this.playerPos.y,
        this.playerPos.z,
        this.playerRotation,
        true
      );
    } else {
      this.playerVelocity.set(0, 0, 0);
      this.onPlayerMove?.(
        this.playerPos.x,
        this.playerPos.y,
        this.playerPos.z,
        this.playerRotation,
        false
      );
    }

    // Sync player 3D mesh
    this.localPlayer.root.position.copy(this.playerPos);
    this.localPlayer.root.rotation.y = this.playerRotation;
    this.localPlayer.updateAnimation(this.clock.getElapsedTime(), this.isMoving);

    // Isa idle animation and greeting
    this.isaCharacter.updateAnimation(this.clock.getElapsedTime(), false, 1, this.currentIsaState);

    // Camera follow with silky exponential damping
    const targetCamX = this.playerPos.x + this.cameraOffset.x;
    const targetCamY = this.playerPos.y + this.cameraOffset.y;
    const targetCamZ = this.playerPos.z + this.cameraOffset.z;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 6, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 6, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 6, delta);

    this.cameraLookTarget.x = THREE.MathUtils.damp(this.cameraLookTarget.x, this.playerPos.x, 8, delta);
    this.cameraLookTarget.y = THREE.MathUtils.damp(this.cameraLookTarget.y, this.playerPos.y + 1.2, 8, delta);
    this.cameraLookTarget.z = THREE.MathUtils.damp(this.cameraLookTarget.z, this.playerPos.z, 8, delta);

    this.camera.lookAt(this.cameraLookTarget);
  }

  // ☀️ Ajusta ou reseta o horário simulado (null = horário real do mundo)
  public setSimulatedHour(hour: number | null) {
    this.simulatedHour = hour;
    const targetHour = hour !== null ? hour : getRealWorldDecimalHour();
    this.currentAtmosphere = calculateAtmosphereForHour(targetHour);
    this.applyAtmosphere(this.currentAtmosphere, true);
    this.onAtmosphereChange?.(this.currentAtmosphere);
  }

  public getAtmosphereInfo(): DayNightAtmosphere {
    return this.currentAtmosphere;
  }

  private applyAtmosphere(atmo: DayNightAtmosphere, immediate = false) {
    if (immediate) {
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.copy(atmo.skyColor);
      }
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.copy(atmo.fogColor);
        this.scene.fog.near = atmo.fogNear;
        this.scene.fog.far = atmo.fogFar;
      }
      if (this.sunLight) {
        this.sunLight.color.copy(atmo.sunColor);
        this.sunLight.intensity = atmo.sunIntensity;
        this.sunLight.position.copy(atmo.sunPosition);
      }
      if (this.hemiLight) {
        this.hemiLight.color.copy(atmo.hemiSkyColor);
        this.hemiLight.groundColor.copy(atmo.hemiGroundColor);
        this.hemiLight.intensity = atmo.hemiIntensity;
      }
      if (this.renderer) {
        this.renderer.toneMappingExposure = atmo.exposure;
      }
      for (const lantern of this.farmLanterns) {
        lantern.light.intensity = lantern.baseLightIntensity * atmo.lanternGlowIntensity;
        if (lantern.bulbMesh && lantern.bulbMesh.material instanceof THREE.MeshStandardMaterial) {
          lantern.bulbMesh.material.emissiveIntensity = atmo.lanternGlowIntensity * 1.8;
        }
      }
    }
  }

  private updateDayNightCycle(delta: number, time: number) {
    const targetHour = this.simulatedHour !== null ? this.simulatedHour : getRealWorldDecimalHour();
    const targetAtmo = calculateAtmosphereForHour(targetHour);

    // Atualiza dados na atmosfera atual
    this.currentAtmosphere.hour = targetAtmo.hour;
    this.currentAtmosphere.formattedTime = targetAtmo.formattedTime;
    this.currentAtmosphere.phaseKey = targetAtmo.phaseKey;
    this.currentAtmosphere.phaseLabel = targetAtmo.phaseLabel;
    this.currentAtmosphere.phaseIcon = targetAtmo.phaseIcon;
    this.currentAtmosphere.isNight = targetAtmo.isNight;
    this.currentAtmosphere.starsOpacity = targetAtmo.starsOpacity;
    this.currentAtmosphere.lanternGlowIntensity = targetAtmo.lanternGlowIntensity;

    // Transição suave (lerp) das cores celestes e neblina do horizonte
    const lerpSpeed = Math.min(delta * 4.0, 1.0);

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(targetAtmo.skyColor, lerpSpeed);
    }
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.lerp(targetAtmo.fogColor, lerpSpeed);
      this.scene.fog.near = THREE.MathUtils.damp(this.scene.fog.near, targetAtmo.fogNear, 5, delta);
      this.scene.fog.far = THREE.MathUtils.damp(this.scene.fog.far, targetAtmo.fogFar, 5, delta);
    }

    // Luz Direcional (Sol dourado de dia / Lua prateada de noite)
    if (this.sunLight) {
      this.sunLight.color.lerp(targetAtmo.sunColor, lerpSpeed);
      this.sunLight.intensity = THREE.MathUtils.damp(this.sunLight.intensity, targetAtmo.sunIntensity, 5, delta);
      this.sunLight.position.lerp(targetAtmo.sunPosition, lerpSpeed);
    }

    // Luz Hemisférica (Céu e Solo)
    if (this.hemiLight) {
      this.hemiLight.color.lerp(targetAtmo.hemiSkyColor, lerpSpeed);
      this.hemiLight.groundColor.lerp(targetAtmo.hemiGroundColor, lerpSpeed);
      this.hemiLight.intensity = THREE.MathUtils.damp(this.hemiLight.intensity, targetAtmo.hemiIntensity, 5, delta);
    }

    // Exposição da câmera
    if (this.renderer) {
      this.renderer.toneMappingExposure = THREE.MathUtils.damp(
        this.renderer.toneMappingExposure,
        targetAtmo.exposure,
        5,
        delta
      );
    }

    // Estrelas cintilantes no céu
    if (this.starField) {
      this.starField.updateTwinkle(time, targetAtmo.starsOpacity);
    }

    // Lampiões rústicos da fazenda (acendem ao anoitecer)
    for (const lantern of this.farmLanterns) {
      lantern.light.intensity = THREE.MathUtils.damp(
        lantern.light.intensity,
        lantern.baseLightIntensity * targetAtmo.lanternGlowIntensity,
        6,
        delta
      );
      if (lantern.bulbMesh && lantern.bulbMesh.material instanceof THREE.MeshStandardMaterial) {
        lantern.bulbMesh.material.emissiveIntensity = THREE.MathUtils.damp(
          lantern.bulbMesh.material.emissiveIntensity,
          targetAtmo.lanternGlowIntensity * 1.8,
          6,
          delta
        );
      }
    }

    // Notificar HUD quando o minuto mudar
    const currentMinute = Math.floor(targetHour * 60);
    if (currentMinute !== this.lastAtmosphereNotifyMinute) {
      this.lastAtmosphereNotifyMinute = currentMinute;
      this.onAtmosphereChange?.(this.currentAtmosphere);
    }
  }

  private startLoop() {
    const tick = () => {
      const rawDt = this.clock.getDelta();
      const delta = Math.min(rawDt, 0.05);
      const time = this.clock.getElapsedTime();

      this.updateMovement(delta);

      // Otimização: verificação de proximidade a 10Hz (a cada 100ms) poupa ciclos de CPU
      this.interactionThrottleTimer += delta;
      if (this.interactionThrottleTimer >= 0.1) {
        this.interactionThrottleTimer = 0;
        this.checkInteractions();
      }

      this.animatedWorld.update(time);
      this.updateBuyerNpcs(delta, time);
      this.updateDayNightCycle(delta, time);

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);

    // Limpar recursos Three.js dos balões de pensamento
    for (const actor of this.buyerNpcs.values()) {
      if (actor.thoughtBubbleTexture) {
        actor.thoughtBubbleTexture.dispose();
      }
      if (actor.thoughtBubbleSprite) {
        if (actor.thoughtBubbleSprite.material) {
          actor.thoughtBubbleSprite.material.dispose();
        }
        actor.character.root.remove(actor.thoughtBubbleSprite);
      }
    }

    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
