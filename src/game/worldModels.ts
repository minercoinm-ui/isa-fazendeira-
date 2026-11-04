import * as THREE from 'three';
import {
  getGrassTexture,
  getSoilTexture,
  getRedBarnTexture,
  getWoodPlankTexture,
  getStoneTexture,
  createContactShadowDisc,
} from './textures';
import { CropType } from '../types/game';

export interface WorldProps {
  scene: THREE.Scene;
}

export interface AnimatedWorldObjects {
  windmillSails?: THREE.Group;
  cows: { root: THREE.Group; head: THREE.Group; tail: THREE.Group; id: string; name?: string }[];
  chickens: { root: THREE.Group; head: THREE.Group; id: string; name?: string }[];
  pigs: { root: THREE.Group; tail: THREE.Group; id: string; name?: string }[];
  sheep: { root: THREE.Group; head?: THREE.Group; id: string; name?: string }[];
  butterflies: { group: THREE.Group; leftWing: THREE.Mesh; rightWing: THREE.Mesh; basePos: THREE.Vector3 }[];
  clouds: THREE.Group[];
  waterMesh?: THREE.Mesh;
  smokePuffs: { mesh: THREE.Mesh; basePos: THREE.Vector3; offset: number }[];
  update: (time: number) => void;
}

// 1. TERRAIN & ENVIRONMENT
export function createFarmTerrain(scene: THREE.Scene): THREE.Mesh {
  const terrainGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
  const grassTex = getGrassTexture();
  grassTex.repeat.set(16, 16);

  const terrainMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.9,
    metalness: 0.05,
  });

  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = 0;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Distant Rolling Hills Perimeter (Ensures zero void)
  const hillsGroup = new THREE.Group();
  const hillMat = new THREE.MeshStandardMaterial({
    color: 0x5a9e32,
    roughness: 0.95,
  });

  const hillPositions = [
    [-65, 8, -60, 45, 18],
    [0, 10, -75, 60, 22],
    [65, 9, -60, 50, 20],
    [-75, 7, 0, 45, 16],
    [75, 7, 0, 45, 16],
    [-60, 8, 65, 50, 18],
    [55, 7, 65, 45, 16],
  ];

  hillPositions.forEach(([x, y, z, rx, ry]) => {
    const hillGeo = new THREE.SphereGeometry(rx, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(x, -ry * 0.4, z);
    hill.scale.set(1, ry / rx, 1);
    hillsGroup.add(hill);
  });
  scene.add(hillsGroup);

  return terrain;
}

// 2. ISA'S MAIN FARMHOUSE
export function createIsaFarmhouse(scene: THREE.Scene, posX: number, posZ: number): THREE.Group {
  const house = new THREE.Group();
  house.position.set(posX, 0, posZ);

  // House Body
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfff7ed, roughness: 0.8 }); // Warm cream
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 }); // Terracotta
  const woodMat = new THREE.MeshStandardMaterial({ map: getWoodPlankTexture(), color: 0x854d0e, roughness: 0.7 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.2, metalness: 0.8 });
  const stoneMat = new THREE.MeshStandardMaterial({ map: getStoneTexture(), roughness: 0.9 });

  // Main Block
  const bodyGeo = new THREE.BoxGeometry(7, 4.5, 6);
  const body = new THREE.Mesh(bodyGeo, wallMat);
  body.position.y = 2.25;
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  // Pitched Roof
  const roofGeo = new THREE.ConeGeometry(5.8, 3.2, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 5.8;
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.1, 1, 0.9);
  roof.castShadow = true;
  house.add(roof);

  // Stone Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.6, 0.9), stoneMat);
  chimney.position.set(2.2, 5.8, 1.2);
  chimney.castShadow = true;
  house.add(chimney);

  // Front Porch & Veranda
  const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 2.5), woodMat);
  porchFloor.position.set(0, 0.15, 3.8);
  porchFloor.receiveShadow = true;
  house.add(porchFloor);

  // Porch Pillars
  for (const x of [-2.6, -0.9, 0.9, 2.6]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.8, 8), woodMat);
    post.position.set(x, 1.55, 4.8);
    post.castShadow = true;
    house.add(post);
  }

  // Porch Awning Roof
  const awning = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.2, 2.6), roofMat);
  awning.position.set(0, 3.0, 3.8);
  awning.rotation.x = 0.12;
  awning.castShadow = true;
  house.add(awning);

  // Front Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.1), woodMat);
  door.position.set(0, 1.2, 3.02);
  house.add(door);

  // Cute Sign "Casa da Isa"
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 256;
  signCanvas.height = 64;
  const sctx = signCanvas.getContext('2d')!;
  sctx.fillStyle = '#fef3c7';
  sctx.roundRect(4, 4, 248, 56, 12);
  sctx.fill();
  sctx.strokeStyle = '#d97706';
  sctx.lineWidth = 4;
  sctx.stroke();
  sctx.font = 'bold 22px Nunito, sans-serif';
  sctx.fillStyle = '#b45309';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText('🏡 Casa da Isa', 128, 32);

  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.45),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
  );
  signMesh.position.set(0, 2.7, 3.06);
  house.add(signMesh);

  // Windows with Flower Boxes
  for (const [wx, wy, wz] of [
    [-2, 1.8, 3.02],
    [2, 1.8, 3.02],
    [-3.52, 2.2, 0],
    [3.52, 2.2, 0],
  ]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.08), windowMat);
    win.position.set(wx, wy, wz);
    if (Math.abs(wx) > 3) win.rotation.y = Math.PI / 2;
    house.add(win);

    // Flower box on front windows
    if (wz > 3) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.35), woodMat);
      box.position.set(wx, wy - 0.7, wz + 0.15);
      house.add(box);

      // Colorful flowers in box
      for (let i = 0; i < 4; i++) {
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 6, 6),
          new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xf43f5e : 0xfacc15 })
        );
        flower.position.set(wx - 0.35 + i * 0.23, wy - 0.5, wz + 0.15);
        house.add(flower);
      }
    }
  }

  scene.add(house);
  return house;
}

// 3. BIG RED CLASSIC BARN (CELEIRO)
export function createBigRedBarn(scene: THREE.Scene, posX: number, posZ: number): THREE.Group {
  const barn = new THREE.Group();
  barn.position.set(posX, 0, posZ);

  const redMat = new THREE.MeshStandardMaterial({
    map: getRedBarnTexture(),
    roughness: 0.7,
  });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const darkRoofMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
  const hayMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.9 });

  // Main Barn Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 12), redMat);
  walls.position.y = 3;
  walls.castShadow = true;
  walls.receiveShadow = true;
  barn.add(walls);

  // Gambrel Barn Roof
  const roofGeo = new THREE.CylinderGeometry(5.2, 5.2, 12.4, 6, 1, false, 0, Math.PI);
  const roof = new THREE.Mesh(roofGeo, darkRoofMat);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.position.y = 6.2;
  roof.castShadow = true;
  barn.add(roof);

  // White Trim Corner Posts
  for (const x of [-4.55, 4.55]) {
    for (const z of [-6.05, 6.05]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.25, 6.2, 0.25), whiteMat);
      trim.position.set(x, 3.1, z);
      barn.add(trim);
    }
  }

  // Large White Barn Double Doors (with iconic cross-bucks)
  const doorGeo = new THREE.BoxGeometry(3.6, 4.2, 0.2);
  const door = new THREE.Mesh(doorGeo, whiteMat);
  door.position.set(0, 2.1, 6.05);
  barn.add(door);

  // Red Insets on Doors
  for (const x of [-0.9, 0.9]) {
    const inset = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.8, 0.05), redMat);
    inset.position.set(x, 2.1, 6.16);
    barn.add(inset);
  }

  // Hay Loft Window & Hay Bale
  const loftWin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 0.2), whiteMat);
  loftWin.position.set(0, 5.8, 6.05);
  barn.add(loftWin);

  const hayBale = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.4), hayMat);
  hayBale.position.set(0, 5.4, 6.5);
  hayBale.castShadow = true;
  barn.add(hayBale);

  // Weather Vane Rooster on Cupola
  const cupola = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.4), whiteMat);
  cupola.position.set(0, 9.2, 0);
  barn.add(cupola);

  const rooster = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.6, 6),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
  );
  rooster.position.set(0, 10.1, 0);
  barn.add(rooster);

  // Hay bales stacked outside
  for (let i = 0; i < 3; i++) {
    const stackBale = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.8), hayMat);
    stackBale.position.set(-5.5, 0.45 + (i === 2 ? 0.9 : 0), -2 + i * 1.5 - (i === 2 ? 0.7 : 0));
    stackBale.rotation.y = 0.2 * i;
    stackBale.castShadow = true;
    barn.add(stackBale);
  }

  scene.add(barn);
  return barn;
}

// 4. WINDMILL (MOINHO DE VENTO)
export function createWindmill(scene: THREE.Scene, posX: number, posZ: number): { group: THREE.Group; sails: THREE.Group } {
  const windmill = new THREE.Group();
  windmill.position.set(posX, 0, posZ);

  const stoneMat = new THREE.MeshStandardMaterial({ map: getStoneTexture(), roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ map: getWoodPlankTexture(), color: 0x78350f, roughness: 0.8 });
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.9, side: THREE.DoubleSide });

  // Conical Stone Base
  const baseGeo = new THREE.CylinderGeometry(2.4, 3.4, 8, 12);
  const base = new THREE.Mesh(baseGeo, stoneMat);
  base.position.y = 4;
  base.castShadow = true;
  windmill.add(base);

  // Wooden Cap / Turret
  const capGeo = new THREE.ConeGeometry(2.6, 2.5, 12);
  const cap = new THREE.Mesh(capGeo, woodMat);
  cap.position.y = 9.2;
  cap.castShadow = true;
  windmill.add(cap);

  // Sails Hub
  const sails = new THREE.Group();
  sails.position.set(0, 8.4, 2.5);
  windmill.add(sails);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x334155 })
  );
  hub.rotation.x = Math.PI / 2;
  sails.add(hub);

  // 4 Rotating Lattice Sails
  for (let i = 0; i < 4; i++) {
    const armGroup = new THREE.Group();
    armGroup.rotation.z = (i * Math.PI) / 2;

    const spar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.2, 0.12), woodMat);
    spar.position.y = 2.6;
    armGroup.add(spar);

    const blade = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 4.4), sailMat);
    blade.position.set(0.6, 2.8, 0);
    blade.rotation.y = 0.2;
    armGroup.add(blade);

    sails.add(armGroup);
  }

  scene.add(windmill);
  return { group: windmill, sails };
}

// 5. VINTAGE FARM TRACTOR
export function createFarmTractor(scene: THREE.Scene, posX: number, posZ: number): THREE.Group {
  const tractor = new THREE.Group();
  tractor.position.set(posX, 0, posZ);

  const greenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4, metalness: 0.3 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.8, roughness: 0.3 });

  // Body Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 2.4), greenMat);
  hood.position.set(0, 1.1, 0.4);
  hood.castShadow = true;
  tractor.add(hood);

  // Driver Seat Cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 1.1), greenMat);
  cab.position.set(0, 1.25, -1.1);
  cab.castShadow = true;
  tractor.add(cab);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.7), yellowMat);
  seat.position.set(0, 1.5, -1.0);
  tractor.add(seat);

  // Steering Wheel
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 8, 16), metalMat);
  wheel.position.set(0, 1.7, -0.4);
  wheel.rotation.x = Math.PI / 3;
  tractor.add(wheel);

  // Smokestack Pipe
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), metalMat);
  pipe.position.set(0.4, 2.0, 1.0);
  tractor.add(pipe);

  // Large Rear Tires
  for (const x of [-0.95, 0.95]) {
    const rearTire = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.5, 16), tireMat);
    rearTire.rotation.z = Math.PI / 2;
    rearTire.position.set(x, 1.0, -1.1);
    rearTire.castShadow = true;
    tractor.add(rearTire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.52, 12), yellowMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(x, 1.0, -1.1);
    tractor.add(rim);
  }

  // Small Front Tires
  for (const x of [-0.75, 0.75]) {
    const frontTire = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 14), tireMat);
    frontTire.rotation.z = Math.PI / 2;
    frontTire.position.set(x, 0.55, 1.3);
    frontTire.castShadow = true;
    tractor.add(frontTire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.37, 10), yellowMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(x, 0.55, 1.3);
    tractor.add(rim);
  }

  scene.add(tractor);
  return tractor;
}

// 6. FARM PLOTS (HORTA & MILHARAL)
export function createFarmPlotMesh(
  id: number,
  x: number,
  z: number,
  cropType: CropType | null,
  stage: number,
  watered: boolean
): THREE.Group {
  const plotGroup = new THREE.Group();
  plotGroup.name = `FarmPlot_${id}`;
  plotGroup.position.set(x, 0, z);

  // Tilled Soil Bed (3.2m x 3.2m)
  const soilTex = getSoilTexture(watered);
  soilTex.repeat.set(2, 2);

  const soilGeo = new THREE.BoxGeometry(3.2, 0.2, 3.2);
  const soilMat = new THREE.MeshStandardMaterial({
    map: soilTex,
    roughness: 0.95,
  });
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.y = 0.1;
  soilMesh.receiveShadow = true;
  plotGroup.add(soilMesh);

  // Wooden Perimeter Frame
  const woodMat = new THREE.MeshStandardMaterial({
    map: getWoodPlankTexture(),
    color: 0x92400e,
    roughness: 0.8,
  });

  const frameParts = [
    [0, 0.16, -1.65, 3.5, 0.22, 0.2],
    [0, 0.16, 1.65, 3.5, 0.22, 0.2],
    [-1.65, 0.16, 0, 0.2, 0.22, 3.5],
    [1.65, 0.16, 0, 0.2, 0.22, 3.5],
  ];

  frameParts.forEach(([fx, fy, fz, sx, sy, sz]) => {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), woodMat);
    plank.position.set(fx, fy, fz);
    plank.castShadow = true;
    plotGroup.add(plank);
  });

  // Plot Number Marker Post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), woodMat);
  post.position.set(-1.4, 0.55, -1.4);
  plotGroup.add(post);

  // 3D CROPS IN PLOT
  if (cropType && stage > 0) {
    const cropsSubgroup = new THREE.Group();
    cropsSubgroup.position.y = 0.2;

    const plantCoords = [
      [-0.8, -0.8],
      [0, -0.8],
      [0.8, -0.8],
      [-0.8, 0],
      [0, 0],
      [0.8, 0],
      [-0.8, 0.8],
      [0, 0.8],
      [0.8, 0.8],
    ];

    plantCoords.forEach(([px, pz]) => {
      const plant = createCropEntity(cropType, stage);
      plant.position.set(px, 0, pz);
      // Subtle organic rotation & scale variation
      plant.rotation.y = (px * 13 + pz * 7) % (Math.PI * 2);
      const sc = 0.9 + Math.abs((px + pz) * 0.1);
      plant.scale.set(sc, sc, sc);
      cropsSubgroup.add(plant);
    });

    plotGroup.add(cropsSubgroup);

    // 4. Se a plantação estiver madura (Estágio 5), adiciona indicador visual dourado de colheita pronta
    if (stage >= 5) {
      const readyGroup = new THREE.Group();
      readyGroup.position.set(0, 1.85, 0);

      // Halo dourado flutuante
      const haloGeo = new THREE.TorusGeometry(0.5, 0.04, 8, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.9,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      readyGroup.add(halo);

      // Estrela/Cristal brilhante de colheita pronta
      const starGeo = new THREE.OctahedronGeometry(0.18, 0);
      const starMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfacc15,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const star = new THREE.Mesh(starGeo, starMat);
      readyGroup.add(star);

      plotGroup.add(readyGroup);
    }
  }

  return plotGroup;
}

// 3D Individual Crop Entities (5 Estágios Visuais: 1=Semente, 2=Broto, 3=Desenvolvimento, 4=Crescida, 5=Madura)
function createCropEntity(cropType: CropType, stage: number): THREE.Group {
  const group = new THREE.Group();

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.7 });
  const darkStemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  const seedEarthMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

  // ESTÁGIO 1: Semente recém-plantada (sulco de terra fofa com pequeno pontinho brotando)
  if (stage === 1) {
    const mound = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.08, 7), seedEarthMat);
    mound.position.y = 0.04;
    group.add(mound);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), stemMat);
    tip.position.y = 0.09;
    group.add(tip);
    return group;
  }

  // ESTÁGIO 2: Broto inicial (haste pequena com dois cotilédones/folhinhas abertas)
  if (stage === 2) {
    const sprout = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.2, 6), stemMat);
    sprout.position.y = 0.1;
    group.add(sprout);

    for (const side of [-1, 1]) {
      const cotyledon = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), stemMat);
      cotyledon.scale.set(1.4, 0.2, 0.7);
      cotyledon.position.set(side * 0.06, 0.18, 0);
      cotyledon.rotation.z = side * -0.4;
      group.add(cotyledon);
    }
    return group;
  }

  // ESTÁGIOS 3, 4 e 5: Específicos por Cultura
  if (cropType === 'corn') {
    // Milho: Estágio 3 = 0.6m, Estágio 4 = 1.1m, Estágio 5 = 1.6m
    const height = stage === 3 ? 0.65 : stage === 4 ? 1.15 : 1.6;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, height, 8), darkStemMat);
    stalk.position.y = height / 2;
    stalk.castShadow = true;
    group.add(stalk);

    const leafCount = stage === 3 ? 3 : stage === 4 ? 5 : 6;
    for (let l = 0; l < leafCount; l++) {
      const leafGeo = new THREE.ConeGeometry(0.12, 0.45 + stage * 0.08, 4);
      const leaf = new THREE.Mesh(leafGeo, stemMat);
      leaf.position.set(0, 0.2 + l * (height / (leafCount + 1)), 0);
      leaf.rotation.z = 0.8 * (l % 2 === 0 ? 1 : -1);
      leaf.rotation.y = l * 1.2;
      group.add(leaf);
    }

    if (stage >= 5) {
      // Espigas de milho maduras e douradas
      const cornMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
      const huskMat = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.6 });

      for (const side of [-1, 1]) {
        const cobGroup = new THREE.Group();
        cobGroup.position.set(side * 0.12, 0.85, 0);
        cobGroup.rotation.z = side * 0.45;

        const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.42, 8), cornMat);
        cobGroup.add(cob);

        const tassel = new THREE.Mesh(
          new THREE.ConeGeometry(0.04, 0.12, 4),
          new THREE.MeshBasicMaterial({ color: 0xb45309 })
        );
        tassel.position.y = 0.25;
        cobGroup.add(tassel);

        const husk = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.35, 4), huskMat);
        husk.position.y = -0.05;
        cobGroup.add(husk);

        group.add(cobGroup);
      }
    }
  } else if (cropType === 'carrot') {
    // Cenoura: Folhagem verde que cresce e, no estágio 5, raiz alaranjada despontando do solo
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
    const frondHeight = stage === 3 ? 0.35 : stage === 4 ? 0.55 : 0.65;

    for (let i = 0; i < (stage === 3 ? 3 : 5); i++) {
      const frond = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, frondHeight, 6), foliageMat);
      frond.position.set(0, frondHeight / 2, 0);
      frond.rotation.z = 0.35 * Math.cos((i * Math.PI) / 2.5);
      frond.rotation.x = 0.35 * Math.sin((i * Math.PI) / 2.5);
      group.add(frond);
    }

    if (stage >= 5) {
      const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.45, 8), carrotMat);
      carrot.rotation.x = Math.PI;
      carrot.position.y = 0.08;
      group.add(carrot);
    }
  } else if (cropType === 'tomato') {
    // Tomate: Arbusto verde ramificado e tomates vermelhos no estágio 5
    const shrubRadius = stage === 3 ? 0.3 : stage === 4 ? 0.45 : 0.55;
    const shrub = new THREE.Mesh(new THREE.SphereGeometry(shrubRadius, 8, 8), darkStemMat);
    shrub.position.y = shrubRadius;
    group.add(shrub);

    if (stage === 4) {
      // Flores amarelas / pequenos tomates verdes
      const blossomMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      for (const [bx, bz] of [[-0.2, 0.15], [0.2, -0.1]]) {
        const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), blossomMat);
        blossom.position.set(bx, shrubRadius + 0.1, bz);
        group.add(blossom);
      }
    } else if (stage >= 5) {
      const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      const tomatoPositions = [
        [-0.2, 0.4, 0.3],
        [0.25, 0.45, 0.25],
        [0.0, 0.6, -0.25],
        [-0.25, 0.35, -0.2],
        [0.15, 0.3, 0.35],
      ];
      tomatoPositions.forEach(([tx, ty, tz]) => {
        const tomato = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), redMat);
        tomato.position.set(tx, ty, tz);
        group.add(tomato);
      });
    }
  } else if (cropType === 'pumpkin') {
    // Abóbora: Ramagem rasteira e abóbora grande laranja no estágio 5
    const vineRadius = stage === 3 ? 0.22 : 0.36;
    const vine = new THREE.Mesh(new THREE.TorusGeometry(vineRadius, 0.04, 6, 12), darkStemMat);
    vine.rotation.x = Math.PI / 2;
    vine.position.y = 0.05;
    group.add(vine);

    if (stage === 4) {
      // Abóbora pequena esverdeada
      const greenPumpkinMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.7 });
      const smallPump = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), greenPumpkinMat);
      smallPump.position.set(0.1, 0.12, 0.1);
      group.add(smallPump);
    } else if (stage >= 5) {
      const pumpkinMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
      const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), pumpkinMat);
      pumpkin.scale.set(1.2, 0.85, 1.2);
      pumpkin.position.y = 0.28;
      pumpkin.castShadow = true;
      group.add(pumpkin);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 0.16, 6),
        new THREE.MeshStandardMaterial({ color: 0x3f6212 })
      );
      stem.position.y = 0.56;
      group.add(stem);
    }
  } else if (cropType === 'wheat' || cropType === 'rice') {
    // Trigo ou Arroz: Feixe de hastes douradas elegantes com espigas pendentes
    const isRice = cropType === 'rice';
    const grainColor = stage >= 5 ? (isRice ? 0xfef08a : 0xf59e0b) : 0x84cc16;
    const grainMat = new THREE.MeshStandardMaterial({ color: grainColor, roughness: 0.5 });
    const stalkH = stage === 3 ? 0.45 : stage === 4 ? 0.75 : 1.0;

    for (let s = 0; s < (stage === 3 ? 4 : 7); s++) {
      const angle = (s * Math.PI * 2) / 7;
      const dist = 0.08 + (s % 2) * 0.04;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, stalkH, 5), stemMat);
      stalk.position.set(Math.cos(angle) * dist, stalkH / 2, Math.sin(angle) * dist);
      stalk.rotation.z = Math.cos(angle) * 0.15;
      stalk.rotation.x = Math.sin(angle) * 0.15;
      group.add(stalk);

      if (stage >= 5) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 5), grainMat);
        ear.position.set(Math.cos(angle) * dist * 1.3, stalkH + 0.06, Math.sin(angle) * dist * 1.3);
        ear.rotation.z = Math.cos(angle) * 0.25;
        group.add(ear);
      }
    }
  } else if (cropType === 'soy' || cropType === 'bean') {
    // Soja ou Feijão: Leguminosa arbustiva com vagens verdes/douradas
    const bushHeight = stage === 3 ? 0.35 : stage === 4 ? 0.6 : 0.8;
    const bush = new THREE.Mesh(new THREE.SphereGeometry(bushHeight * 0.55, 8, 8), stemMat);
    bush.position.y = bushHeight * 0.5;
    group.add(bush);

    if (stage >= 5) {
      const podColor = cropType === 'soy' ? 0xd97706 : 0x166534;
      const podMat = new THREE.MeshStandardMaterial({ color: podColor, roughness: 0.5 });
      for (const [px, pz, py] of [
        [-0.15, 0.15, 0.3],
        [0.18, -0.12, 0.35],
        [0.0, 0.2, 0.45],
        [-0.12, -0.16, 0.25],
      ]) {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 6), podMat);
        pod.rotation.z = 0.5;
        pod.rotation.x = 0.3;
        pod.position.set(px, py, pz);
        group.add(pod);
      }
    }
  } else if (cropType === 'lettuce') {
    // Alface: Roseta de folhas verdes que se expandem em cabeça redonda no estágio 5
    const headScale = stage === 3 ? 0.25 : stage === 4 ? 0.42 : 0.6;
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6 });
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.5 });

    const core = new THREE.Mesh(new THREE.SphereGeometry(headScale * 0.4, 8, 8), innerMat);
    core.scale.set(1.2, 0.7, 1.2);
    core.position.y = headScale * 0.25;
    group.add(core);

    const petalCount = stage === 3 ? 4 : stage === 4 ? 6 : 8;
    for (let p = 0; p < petalCount; p++) {
      const pAngle = (p * Math.PI * 2) / petalCount;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(headScale * 0.35, 6, 6), leafMat);
      leaf.scale.set(1.1, 0.2, 1.4);
      leaf.position.set(Math.cos(pAngle) * (headScale * 0.3), headScale * 0.15, Math.sin(pAngle) * (headScale * 0.3));
      leaf.rotation.y = pAngle;
      leaf.rotation.x = 0.25;
      group.add(leaf);
    }
  } else {
    // Morango (strawberry): Folhagem baixa e morangos vermelhos no estágio 5
    const bushR = stage === 3 ? 0.25 : stage === 4 ? 0.35 : 0.42;
    const bush = new THREE.Mesh(new THREE.SphereGeometry(bushR, 8, 8), stemMat);
    bush.scale.set(1, 0.6, 1);
    bush.position.y = bushR * 0.6;
    group.add(bush);

    if (stage >= 5) {
      const berryMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
      for (const [bx, bz] of [[-0.2, 0.15], [0.2, 0.12], [0, -0.22], [0.12, 0.22]]) {
        const berry = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 6), berryMat);
        berry.position.set(bx, 0.14, bz);
        group.add(berry);
      }
    }
  }

  return group;
}

// 7. ANIMATED COWS (HOLSTEIN SPOTTED)
export function createCowModel(id: string, name: string, posX: number, posZ: number) {
  const root = new THREE.Group();
  root.position.set(posX, 0, posZ);

  const shadow = createContactShadowDisc(0.9, 0.4);
  root.add(shadow);

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.8 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.7 });
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });

  // Body Barrel
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 2.6), whiteMat);
  body.position.y = 1.4;
  body.castShadow = true;
  root.add(body);

  // Black Spots on Body
  const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.9), blackMat);
  spot1.position.set(0.81, 1.5, 0.3);
  root.add(spot1);

  const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.8), blackMat);
  spot2.position.set(-0.81, 1.4, -0.4);
  root.add(spot2);

  // Udder
  const udder = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), pinkMat);
  udder.position.set(0, 0.8, -0.4);
  root.add(udder);

  // 4 Legs
  for (const [lx, lz] of [
    [-0.6, 0.9],
    [0.6, 0.9],
    [-0.6, -0.9],
    [0.6, -0.9],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.9, 8), whiteMat);
    leg.position.set(lx, 0.45, lz);
    leg.castShadow = true;
    root.add(leg);

    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.18, 8), blackMat);
    hoof.position.set(lx, 0.09, lz);
    root.add(hoof);
  }

  // Head Group (pivoted for grazing animation)
  const head = new THREE.Group();
  head.position.set(0, 1.8, 1.3);
  root.add(head);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.1), whiteMat);
  headMesh.position.set(0, 0, 0.3);
  head.add(headMesh);

  // Snout / Muzzle
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.5), pinkMat);
  snout.position.set(0, -0.22, 0.85);
  head.add(snout);

  // Cute Nostrils & Eyes
  for (const x of [-0.26, 0.26]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), blackMat);
    eye.position.set(x, 0.18, 0.7);
    head.add(eye);

    // Horns
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), hornMat);
    horn.position.set(x, 0.58, 0.2);
    horn.rotation.z = x > 0 ? -0.3 : 0.3;
    head.add(horn);

    // Floppy Ears
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.08), whiteMat);
    ear.position.set(x * 1.5, 0.35, 0.15);
    ear.rotation.z = x > 0 ? -0.25 : 0.25;
    head.add(ear);
  }

  // Tail
  const tail = new THREE.Group();
  tail.position.set(0, 1.8, -1.3);
  const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), whiteMat);
  tailMesh.position.y = -0.4;
  tail.add(tailMesh);
  root.add(tail);

  return { root, head, tail, id, name };
}

// 8. ANIMATED CHICKENS
export function createChickenModel(id: string, name: string, posX: number, posZ: number) {
  const root = new THREE.Group();
  root.position.set(posX, 0, posZ);

  const shadow = createContactShadowDisc(0.4, 0.35);
  root.add(shadow);

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });

  // Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), whiteMat);
  body.scale.set(0.9, 1.0, 1.2);
  body.position.y = 0.45;
  body.castShadow = true;
  root.add(body);

  // Little Legs
  for (const x of [-0.12, 0.12]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), yellowMat);
    leg.position.set(x, 0.11, 0);
    root.add(leg);
  }

  // Head Group (pivoted for pecking animation)
  const head = new THREE.Group();
  head.position.set(0, 0.65, 0.3);
  root.add(head);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), whiteMat);
  head.add(headMesh);

  // Comb
  const comb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.2), redMat);
  comb.position.set(0, 0.18, 0);
  head.add(comb);

  // Beak & Wattle
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 6), yellowMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0, 0.22);
  head.add(beak);

  const wattle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), redMat);
  wattle.position.set(0, -0.08, 0.15);
  head.add(wattle);

  return { root, head, id, name };
}

// 9. ANIMATED PIGS (PORQUINHOS NA LAMA)
export function createPigModel(id: string, name: string, posX: number, posZ: number) {
  const root = new THREE.Group();
  root.position.set(posX, 0, posZ);

  const shadow = createContactShadowDisc(0.7, 0.4);
  root.add(shadow);

  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.7 });
  const darkPinkMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.6 });

  // Chubby Body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), pinkMat);
  body.scale.set(0.9, 0.85, 1.3);
  body.position.y = 0.68;
  body.castShadow = true;
  root.add(body);

  // 4 Stubby Legs
  for (const [lx, lz] of [
    [-0.38, 0.5],
    [0.38, 0.5],
    [-0.38, -0.5],
    [0.38, -0.5],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.45, 8), pinkMat);
    leg.position.set(lx, 0.22, lz);
    root.add(leg);
  }

  // Snout
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.22, 10), darkPinkMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, 0.68, 0.95);
  root.add(snout);

  // Curly Tail
  const tail = new THREE.Group();
  tail.position.set(0, 0.8, -0.9);
  const tailMesh = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12), darkPinkMat);
  tail.add(tailMesh);
  root.add(tail);

  return { root, tail, id, name };
}

// 10. RIVER, POND & ARCHED WOODEN BRIDGE
export function createWaterAndBridge(scene: THREE.Scene): { water: THREE.Mesh; bridge: THREE.Group } {
  // River Curving Path
  const waterGeo = new THREE.PlaneGeometry(12, 90, 16, 32);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.15,
    metalness: 0.8,
    transparent: true,
    opacity: 0.85,
  });

  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(24, 0.05, 0);
  scene.add(water);

  // Riverbed Stones
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  for (let z = -40; z <= 40; z += 5) {
    for (const side of [-5.8, 5.8]) {
      const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.45 + Math.random() * 0.3, 6, 6), stoneMat);
      pebble.position.set(24 + side, 0.15, z + (Math.random() - 0.5) * 2);
      pebble.scale.set(1.4, 0.6, 1.2);
      scene.add(pebble);
    }
  }

  // Arched Wooden Bridge
  const bridge = new THREE.Group();
  bridge.position.set(24, 0, 0);

  const woodMat = new THREE.MeshStandardMaterial({
    map: getWoodPlankTexture(),
    color: 0x854d0e,
    roughness: 0.8,
  });

  // Arched Deck Planks
  for (let x = -7; x <= 7; x += 0.5) {
    const archY = 0.8 * Math.cos((x / 7) * (Math.PI / 2.5));
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 4.5), woodMat);
    plank.position.set(x, archY + 0.35, 0);
    plank.rotation.z = -Math.sin((x / 7) * (Math.PI / 2.5)) * 0.2;
    plank.castShadow = true;
    bridge.add(plank);
  }

  // Bridge Handrails
  for (const z of [-2.1, 2.1]) {
    for (let x = -6.5; x <= 6.5; x += 2.2) {
      const archY = 0.8 * Math.cos((x / 7) * (Math.PI / 2.5));
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8), woodMat);
      post.position.set(x, archY + 0.9, z);
      bridge.add(post);
    }

    const railCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-7, 0.8, z),
      new THREE.Vector3(0, 1.9, z),
      new THREE.Vector3(7, 0.8, z)
    );
    const railGeo = new THREE.TubeGeometry(railCurve, 16, 0.08, 6, false);
    const rail = new THREE.Mesh(railGeo, woodMat);
    bridge.add(rail);
  }

  scene.add(bridge);
  return { water, bridge };
}

// 11. TREES, APPLE ORCHARD & FOLIAGE
export function createFoliage(scene: THREE.Scene) {
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
  const darkLeafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
  const appleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });

  // Function to build a fluffy cartoon tree
  function buildTree(x: number, z: number, isApple: boolean = false, scale: number = 1) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.set(scale, scale, scale);

    const shadow = createContactShadowDisc(1.4 * scale, 0.4);
    tree.add(shadow);

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 3.2, 8), woodMat);
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    tree.add(trunk);

    // Foliage Puffs
    const puffPositions = [
      [0, 3.8, 0, 1.6],
      [-0.6, 3.4, 0.4, 1.2],
      [0.6, 3.5, -0.4, 1.3],
      [0.3, 4.4, 0.3, 1.1],
    ];

    puffPositions.forEach(([px, py, pz, r], idx) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), idx % 2 === 0 ? leafMat : darkLeafMat);
      puff.position.set(px, py, pz);
      puff.castShadow = true;
      tree.add(puff);

      // Red Apples if in orchard
      if (isApple && idx < 3) {
        for (let a = 0; a < 3; a++) {
          const apple = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), appleMat);
          const ang = (a * Math.PI * 2) / 3;
          apple.position.set(px + Math.cos(ang) * (r * 0.9), py - 0.2, pz + Math.sin(ang) * (r * 0.9));
          tree.add(apple);
        }
      }
    });

    scene.add(tree);
  }

  // Orchard Trees (across river)
  const orchard = [
    [34, -10],
    [42, -10],
    [34, 4],
    [42, 4],
  ];
  orchard.forEach(([x, z]) => buildTree(x, z, true, 1.1));

  // Perimeter Trees
  const perimeterTrees = [
    [-30, -28],
    [-22, -32],
    [-10, -35],
    [6, -34],
    [22, -32],
    [-35, 12],
    [-34, 25],
    [-20, 34],
    [2, 36],
    [28, 32],
  ];
  perimeterTrees.forEach(([x, z], i) => buildTree(x, z, false, 0.9 + (i % 3) * 0.15));
}

// 12. FLUTTERING BUTTERFLIES & CLOUDS
export function createAmbientLife(scene: THREE.Scene) {
  const butterflies: AnimatedWorldObjects['butterflies'] = [];
  const clouds: THREE.Group[] = [];
  const smokePuffs: AnimatedWorldObjects['smokePuffs'] = [];

  // Butterflies
  const wingColors = [0x38bdf8, 0xf472b6, 0xfacc15, 0xa855f7];
  for (let i = 0; i < 6; i++) {
    const bGroup = new THREE.Group();
    const basePos = new THREE.Vector3(-12 + i * 5, 1.4, -6 + (i % 3) * 6);
    bGroup.position.copy(basePos);

    const wingMat = new THREE.MeshBasicMaterial({
      color: wingColors[i % wingColors.length],
      side: THREE.DoubleSide,
    });

    const wingGeo = new THREE.PlaneGeometry(0.18, 0.18);
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.x = -0.09;
    bGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.x = 0.09;
    bGroup.add(rightWing);

    scene.add(bGroup);
    butterflies.push({ group: bGroup, leftWing, rightWing, basePos });
  }

  // Floating Clouds
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
  });

  for (let c = 0; c < 5; c++) {
    const cloud = new THREE.Group();
    cloud.position.set(-50 + c * 26, 22 + (c % 2) * 4, -40 + c * 18);

    for (let p = 0; p < 5; p++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(3.5 + Math.random() * 2, 8, 8),
        cloudMat
      );
      puff.position.set(p * 2.8 - 5.6, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2);
      cloud.add(puff);
    }

    scene.add(cloud);
    clouds.push(cloud);
  }

  // Chimney Smoke Puffs
  const smokeMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.6 });
  const chimneyBase = new THREE.Vector3(-15 + 2.2, 7.8, -18 + 1.2);
  for (let s = 0; s < 4; s++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.35 + s * 0.15, 6, 6), smokeMat);
    puff.position.copy(chimneyBase);
    scene.add(puff);
    smokePuffs.push({ mesh: puff, basePos: chimneyBase.clone(), offset: s * 1.2 });
  }

  return { butterflies, clouds, smokePuffs };
}

// 13. MERCADO DA FAZENDINHA (3D PHYSICAL MARKETPLACE BUILDING)
export function createMarketplaceBuilding(scene: THREE.Scene, posX: number, posZ: number): THREE.Group {
  const market = new THREE.Group();
  market.name = 'MarketplaceBuilding';
  market.position.set(posX, 0, posZ);

  const woodMat = new THREE.MeshStandardMaterial({
    map: getWoodPlankTexture(),
    color: 0x92400e,
    roughness: 0.8,
  });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  const redAwningMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
  const whiteAwningMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });

  // Wooden Deck Platform
  const floor = new THREE.Mesh(new THREE.BoxGeometry(7, 0.25, 5), woodMat);
  floor.position.set(0, 0.125, 0);
  floor.receiveShadow = true;
  market.add(floor);

  // 4 Corner Pillars
  for (const [px, pz] of [
    [-3.2, -2.2],
    [3.2, -2.2],
    [-3.2, 2.2],
    [3.2, 2.2],
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.4, 8), woodMat);
    post.position.set(px, 1.7, pz);
    post.castShadow = true;
    market.add(post);
  }

  // Striped Canopy Awning (Roof)
  const awningWidth = 7.4;
  const numStripes = 14;
  const stripeWidth = awningWidth / numStripes;

  for (let s = 0; s < numStripes; s++) {
    const isRed = s % 2 === 0;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(stripeWidth, 0.08, 5.2),
      isRed ? redAwningMat : whiteAwningMat
    );
    stripe.position.set(-awningWidth / 2 + (s + 0.5) * stripeWidth, 3.45, 0);
    stripe.rotation.x = 0.08;
    stripe.castShadow = true;
    market.add(stripe);
  }

  // Colorful Billboard Sign: "MERCADO DA FAZENDINHA"
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 384;
  signCanvas.height = 96;
  const sctx = signCanvas.getContext('2d')!;
  sctx.fillStyle = '#fef08a';
  sctx.roundRect(6, 6, 372, 84, 16);
  sctx.fill();
  sctx.strokeStyle = '#b45309';
  sctx.lineWidth = 5;
  sctx.stroke();

  sctx.font = 'bold 36px Nunito, sans-serif';
  sctx.fillStyle = '#78350f';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText('MERCADO', 192, 48);

  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.9),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
  );
  signMesh.position.set(0, 3.85, 2.65);
  market.add(signMesh);

  // Front Service Counter
  const counter = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.05, 0.9), counterMat);
  counter.position.set(0, 0.65, 1.2);
  counter.castShadow = true;
  market.add(counter);

  // Wooden Shelves at the back
  const backShelf = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.2, 0.5), counterMat);
  backShelf.position.set(0, 1.35, -1.8);
  backShelf.castShadow = true;
  market.add(backShelf);

  // Crates with Produce on counter and floor
  const crateMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
  const redProduceMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const orangeProduceMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
  const yellowCornMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });

  // Crate of Apples/Tomatoes
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.6), crateMat);
  crate1.position.set(-1.6, 1.35, 1.2);
  market.add(crate1);
  for (let i = 0; i < 4; i++) {
    const produce = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), redProduceMat);
    produce.position.set(-1.8 + (i % 2) * 0.25, 1.55, 1.1 + Math.floor(i / 2) * 0.2);
    market.add(produce);
  }

  // Crate of Carrots
  const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.6), crateMat);
  crate2.position.set(1.6, 1.35, 1.2);
  market.add(crate2);
  for (let i = 0; i < 3; i++) {
    const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 6), orangeProduceMat);
    carrot.position.set(1.5 + i * 0.18, 1.55, 1.2);
    carrot.rotation.x = Math.PI / 3;
    market.add(carrot);
  }

  // Sack of Corn on floor
  const sack = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.9 }));
  sack.scale.set(1, 1.3, 0.9);
  sack.position.set(-2.4, 0.7, 0);
  market.add(sack);

  const cornTop = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.4, 6), yellowCornMat);
  cornTop.position.set(-2.4, 1.35, 0);
  market.add(cornTop);

  // Friendly Shopkeeper NPC "Seu Zé"
  const shopkeeper = new THREE.Group();
  shopkeeper.position.set(0, 0.25, 0.1);

  // Body with Green Apron
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.3, 0.7, 10),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 })
  );
  body.position.y = 0.85;
  shopkeeper.add(body);

  // Head with mustache and straw hat
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xeb9c68, roughness: 0.7 })
  );
  head.position.y = 1.35;
  shopkeeper.add(head);

  // Mustache
  const stache = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.06, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x451a03 })
  );
  stache.position.set(0, 1.28, 0.24);
  shopkeeper.add(stache);

  // Hat
  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.8 })
  );
  hat.position.set(0, 1.55, 0);
  shopkeeper.add(hat);

  market.add(shopkeeper);

  // Additional 3D Buyer NPCs stationed at the market
  const buyer1 = new THREE.Group(); // Seu Antônio
  buyer1.position.set(-2.8, 0.2, 1.2);
  const b1Body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.68, 8), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
  b1Body.position.y = 0.8;
  buyer1.add(b1Body);
  const b1Head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd49b6a }));
  b1Head.position.y = 1.3;
  buyer1.add(b1Head);
  const b1Hat = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 8), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  b1Hat.position.y = 1.48;
  buyer1.add(b1Hat);
  market.add(buyer1);

  const buyer2 = new THREE.Group(); // Dona Francisca
  buyer2.position.set(2.8, 0.2, 1.2);
  const b2Body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.68, 8), new THREE.MeshStandardMaterial({ color: 0x9333ea }));
  b2Body.position.y = 0.8;
  buyer2.add(b2Body);
  const b2Head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf5c396 }));
  b2Head.position.y = 1.3;
  buyer2.add(b2Head);
  const b2Scarf = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.08, 6, 8), new THREE.MeshStandardMaterial({ color: 0xf43f5e }));
  b2Scarf.position.set(0, 1.38, 0);
  buyer2.add(b2Scarf);
  market.add(buyer2);

  scene.add(market);
  return market;
}

// 14. CENTRAL DE TALHÕES (3D Pavilhão Administrativo de Terras)
export function createCentralTalhoesBuilding(scene: THREE.Scene, posX: number, posZ: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Central_Talhoes_Building';
  group.position.set(posX, 0, posZ);

  // Deck de madeira rústica
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 0.25, 5),
    new THREE.MeshStandardMaterial({ map: getWoodPlankTexture(), color: 0xa16207, roughness: 0.8 })
  );
  deck.position.y = 0.12;
  deck.receiveShadow = true;
  group.add(deck);

  // Colunas de eucalipto
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  const pillarPositions = [
    [-3, -2.2],
    [3, -2.2],
    [-3, 2.2],
    [3, 2.2],
  ];
  pillarPositions.forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 8), pillarMat);
    pillar.position.set(px, 1.7, pz);
    pillar.castShadow = true;
    group.add(pillar);
  });

  // Teto / Cobertura estilosa
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.5, 1.4, 4),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 })
  );
  roof.position.y = 3.9;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Placa Principal em Alta Definição: CENTRAL DE TALHÕES
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const ctx = signCanvas.getContext('2d')!;
  ctx.fillStyle = '#065f46';
  ctx.roundRect(8, 8, 496, 112, 24);
  ctx.fill();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.font = 'bold 32px Nunito, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🗺️ CENTRAL DE TALHÕES', 256, 44);

  ctx.font = 'bold 20px Nunito, sans-serif';
  ctx.fillStyle = '#fde047';
  ctx.fillText('Adquira Terras Agrícolas & Cultive', 256, 84);

  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const signBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.9),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
  );
  signBoard.position.set(0, 3.1, 2.22);
  group.add(signBoard);

  // Balcão de atendimento e mapas
  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.0, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
  );
  desk.position.set(0, 0.65, 0.5);
  desk.castShadow = true;
  group.add(desk);

  // Mapa aberto no balcão
  const parchment = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.04, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 })
  );
  parchment.position.set(0, 1.18, 0.5);
  group.add(parchment);

  // Atendente Dona Cida
  const clerk = new THREE.Group();
  clerk.position.set(0, 0.15, -0.3);
  const clerkBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.28, 0.7, 10),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 })
  );
  clerkBody.position.y = 0.85;
  clerk.add(clerkBody);
  const clerkHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xf5c396, roughness: 0.7 })
  );
  clerkHead.position.y = 1.35;
  clerk.add(clerkHead);
  const clerkHat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.8 })
  );
  clerkHat.position.set(0, 1.55, 0);
  clerk.add(clerkHat);
  group.add(clerk);

  scene.add(group);
  return group;
}

// 15. EXPANDABLE LAND PLOTS (3D VISUAL TALHÕES)
export function createLandPlotMesh(
  id: string,
  code: string,
  name: string,
  categoryLabel: string,
  x: number,
  z: number,
  width: number,
  depth: number,
  price: number,
  status: 'available' | 'owned' | 'locked',
  ownerName: string | null,
  isOwnedByCurrentPlayer: boolean,
  plotsCount: number = 4
): THREE.Group {
  const landGroup = new THREE.Group();
  landGroup.name = `Land_${id}`;
  landGroup.position.set(x, 0, z);

  const halfW = width / 2;
  const halfD = depth / 2;

  // Boundary Fence Posts & Rails
  const fenceMat = new THREE.MeshStandardMaterial({
    color: isOwnedByCurrentPlayer ? 0xf59e0b : status === 'owned' ? 0x64748b : 0xca8a04,
    roughness: 0.7,
  });

  // Corner Posts
  const corners = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [-halfW, halfD],
    [halfW, halfD],
  ];

  corners.forEach(([cx, cz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), fenceMat);
    post.position.set(cx, 0.6, cz);
    post.castShadow = true;
    landGroup.add(post);

    if (isOwnedByCurrentPlayer) {
      const finial = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 })
      );
      finial.position.set(cx, 1.25, cz);
      landGroup.add(finial);
    }
  });

  // Boundary Lines / Rails
  const rails = [
    [0, 0.7, -halfD, width, 0.08, 0.08],
    [0, 0.7, halfD, width, 0.08, 0.08],
    [-halfW, 0.7, 0, 0.08, 0.08, depth],
    [halfW, 0.7, 0, 0.08, 0.08, depth],
  ];

  rails.forEach(([rx, ry, rz, sx, sy, sz]) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), fenceMat);
    rail.position.set(rx, ry, rz);
    landGroup.add(rail);
  });

  // Interior Soil Beds if Owned
  if (status === 'owned' || isOwnedByCurrentPlayer) {
    const soilMat = new THREE.MeshStandardMaterial({ map: getSoilTexture(false), color: 0x5c3a21, roughness: 0.9 });
    const rows = 2;
    const cols = Math.max(2, Math.floor(plotsCount / 2));
    const stepX = (width - 4) / Math.max(1, cols - 1);
    const stepZ = (depth - 4) / Math.max(1, rows - 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = -(width - 4) / 2 + c * stepX;
        const pz = -(depth - 4) / 2 + r * stepZ;
        const bed = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 1.4), soilMat);
        bed.position.set(px, 0.08, pz);
        bed.receiveShadow = true;
        landGroup.add(bed);

        // Little green sprout if owned
        const sprout = new THREE.Mesh(
          new THREE.ConeGeometry(0.08, 0.25, 5),
          new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6 })
        );
        sprout.position.set(px, 0.25, pz);
        landGroup.add(sprout);
      }
    }
  }

  // Interactive Signpost at Front Center
  const signGroup = new THREE.Group();
  signGroup.position.set(0, 0, halfD + 0.3);
  landGroup.add(signGroup);

  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), fenceMat);
  signPost.position.y = 0.7;
  signGroup.add(signPost);

  // Sign Board Canvas
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 256;
  signCanvas.height = 128;
  const ctx = signCanvas.getContext('2d')!;

  ctx.fillStyle = isOwnedByCurrentPlayer ? '#fef3c7' : status === 'owned' ? '#f1f5f9' : '#fef08a';
  ctx.roundRect(6, 6, 244, 116, 16);
  ctx.fill();
  ctx.strokeStyle = isOwnedByCurrentPlayer ? '#d97706' : '#94a3b8';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (isOwnedByCurrentPlayer) {
    ctx.font = 'bold 24px Nunito, sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText(code, 128, 45);
    ctx.font = 'bold 18px Nunito, sans-serif';
    ctx.fillStyle = '#15803d';
    ctx.fillText('Minha Área', 128, 85);
  } else if (status === 'owned') {
    ctx.font = 'bold 22px Nunito, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(code, 128, 45);
    ctx.font = 'bold 18px Nunito, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(ownerName || 'Fazendeiro', 128, 85);
  } else {
    ctx.font = 'bold 22px Nunito, sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText(code, 128, 45);
    ctx.font = 'bold 20px Nunito, sans-serif';
    ctx.fillStyle = '#15803d';
    ctx.fillText(`${price} 🪙`, 128, 85);
  }

  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.8),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
  );
  board.position.set(0, 1.25, 0.05);
  signGroup.add(board);

  return landGroup;
}
