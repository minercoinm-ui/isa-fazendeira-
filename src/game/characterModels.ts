import * as THREE from 'three';
import { getStrawHatTexture, getDenimTexture, createContactShadowDisc } from './textures';

export interface AnimatedCharacter {
  root: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  headGroup: THREE.Group;
  nameBadge: THREE.Sprite;
  chatBubble?: THREE.Sprite;
  updateAnimation: (time: number, isMoving: boolean, speedMultiplier?: number, isaState?: string) => void;
  setChatBubble: (text: string | null) => void;
  isaAnimationState?: string;
}

// Helper to create text billboard sprite
export function createNameBadgeSprite(nickname: string, isIsa: boolean = false, level: number = 1): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 64);

  // Background pill
  ctx.fillStyle = isIsa ? 'rgba(236, 72, 153, 0.9)' : 'rgba(30, 41, 59, 0.85)';
  const radius = 20;
  ctx.beginPath();
  ctx.roundRect(16, 12, 224, 40, radius);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = isIsa ? '#fbcfe8' : '#38bdf8';
  ctx.stroke();

  // Text
  ctx.font = 'bold 22px Nunito, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const title = isIsa ? 'Isa' : nickname;
  ctx.fillText(title, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.5, 0.38, 1);
  sprite.position.y = 2.25;
  return sprite;
}

// Helper to create chat bubble sprite above head
export function createChatBubbleSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 384, 128);

  // Speech bubble box
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(16, 16, 352, 76, 24);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f59e0b';
  ctx.stroke();

  // Speech arrow tail
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(180, 92);
  ctx.lineTo(192, 114);
  ctx.lineTo(204, 92);
  ctx.fill();

  // Text inside bubble
  ctx.font = 'bold 24px Nunito, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 192, 54);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.2, 1.1, 1);
  sprite.position.y = 3.2;
  return sprite;
}

/**
 * 🌟 BUILD CHARACTER ISA (3D Articulated Model)
 * Preserves the photograph / concept identity:
 * - Curly dark hair ringlets
 * - Big dark eyes with reflections
 * - Straw farmer hat with pastel pink ribbon
 * - Pink t-shirt
 * - Blue denim dungarees / overalls with brass buckles
 * - Farmer boots
 */
export function buildIsaModel(): AnimatedCharacter {
  const root = new THREE.Group();
  root.name = 'IsaCharacter';

  // Contact shadow at ground level
  const shadow = createContactShadowDisc(0.65, 0.45);
  root.add(shadow);

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x935f37,
    roughness: 0.7,
    metalness: 0.05,
  });
  const cheekMat = new THREE.MeshBasicMaterial({
    color: 0xff8fa3,
    transparent: true,
    opacity: 0.65,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // Pink t-shirt
    roughness: 0.65,
  });
  const denimMat = new THREE.MeshStandardMaterial({
    map: getDenimTexture(),
    color: 0x2563eb,
    roughness: 0.8,
  });
  const hatMat = new THREE.MeshStandardMaterial({
    map: getStrawHatTexture(),
    color: 0xf5deb3,
    roughness: 0.85,
  });
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    roughness: 0.5,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x1f140e,
    roughness: 0.85,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x5a3825,
    roughness: 0.7,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.8,
    roughness: 0.3,
  });

  // Pelvis / Hips
  const hips = new THREE.Group();
  hips.position.y = 0.85;
  root.add(hips);

  // Torso / Overalls
  const torsoGeo = new THREE.CylinderGeometry(0.3, 0.28, 0.55, 12);
  const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
  torsoMesh.castShadow = true;
  torsoMesh.position.y = 0.28;
  hips.add(torsoMesh);

  // Overalls Bib (Front & Back)
  const bibGeo = new THREE.BoxGeometry(0.36, 0.42, 0.46);
  const bibMesh = new THREE.Mesh(bibGeo, denimMat);
  bibMesh.position.y = 0.22;
  hips.add(bibMesh);

  // Brass Buckles on Overalls
  for (const x of [-0.12, 0.12]) {
    const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 8), brassMat);
    buckle.rotation.x = Math.PI / 2;
    buckle.position.set(x, 0.38, 0.24);
    hips.add(buckle);
  }

  // Head Group (pivoted for nodding/smiling)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.65, 0);
  hips.add(headGroup);

  // Cute Rounded Head
  const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  headMesh.position.y = 0.25;
  headGroup.add(headMesh);

  // Rosy Cheeks
  for (const x of [-0.2, 0.2]) {
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.065, 12), cheekMat);
    cheek.position.set(x, 0.22, 0.29);
    cheek.rotation.y = x > 0 ? 0.3 : -0.3;
    headGroup.add(cheek);
  }

  // Sparkling Big Dark Eyes
  for (const x of [-0.11, 0.11]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(x, 0.28, 0.27);

    // Eye White
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    eyeWhite.scale.set(1, 1.2, 0.6);
    eyeGroup.add(eyeWhite);

    // Dark Pupil
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x1a0f08 })
    );
    pupil.position.z = 0.03;
    eyeGroup.add(pupil);

    // Cute Specular Catchlight
    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    glint.position.set(0.015, 0.02, 0.055);
    eyeGroup.add(glint);

    headGroup.add(eyeGroup);

    // Cute Eyebrow
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.018, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x1f140e })
    );
    brow.position.set(x, 0.38, 0.28);
    brow.rotation.z = x > 0 ? -0.1 : 0.1;
    headGroup.add(brow);
  }

  // Sweet Cartoon Smile
  const smileCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.08, 0.16, 0.3),
    new THREE.Vector3(0, 0.12, 0.32),
    new THREE.Vector3(0.08, 0.16, 0.3)
  );
  const smileGeo = new THREE.TubeGeometry(smileCurve, 8, 0.012, 6, false);
  const smileMesh = new THREE.Mesh(smileGeo, new THREE.MeshBasicMaterial({ color: 0x3d1710 }));
  headGroup.add(smileMesh);

  // Voluminous Dark Curly Hair Ringlets
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  const curlPositions = [
    // Back of head
    [0, 0.32, -0.22, 0.14],
    [-0.18, 0.28, -0.2, 0.15],
    [0.18, 0.28, -0.2, 0.15],
    [-0.26, 0.22, -0.1, 0.14],
    [0.26, 0.22, -0.1, 0.14],
    // Cheeks & Side Curls
    [-0.3, 0.18, 0.05, 0.13],
    [0.3, 0.18, 0.05, 0.13],
    [-0.28, 0.06, 0.02, 0.12],
    [0.28, 0.06, 0.02, 0.12],
    [-0.22, -0.02, 0.0, 0.11],
    [0.22, -0.02, 0.0, 0.11],
    // Forehead bang curls under hat
    [-0.15, 0.42, 0.18, 0.1],
    [0.0, 0.44, 0.2, 0.11],
    [0.15, 0.42, 0.18, 0.1],
  ];

  curlPositions.forEach(([x, y, z, r]) => {
    const curl = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), hairMat);
    curl.position.set(x, y, z);
    hairGroup.add(curl);
  });

  // Iconic Double Twist Buns / Pigtail Buns from Photo (Left & Right)
  const hairTieMat = new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.6 }); // Pastel lavender/purple
  for (const side of [-1, 1]) {
    const bunGroup = new THREE.Group();
    bunGroup.position.set(side * 0.38, 0.44, -0.05);

    // Hair tie elastics
    const tie1 = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 12), hairTieMat);
    tie1.rotation.x = Math.PI / 2;
    bunGroup.add(tie1);

    // Bubbly twist puffs
    const puff1 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), hairMat);
    puff1.position.set(side * 0.04, 0.08, 0);
    bunGroup.add(puff1);

    const puff2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), hairMat);
    puff2.position.set(side * 0.06, 0.22, 0);
    bunGroup.add(puff2);

    headGroup.add(bunGroup);
  }

  // Little Magenta Heart on Pink T-shirt Chest (from the photo!)
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0.04);
  heartShape.bezierCurveTo(0, 0.06, -0.04, 0.1, -0.06, 0.06);
  heartShape.bezierCurveTo(-0.06, 0.02, 0, -0.02, 0, -0.06);
  heartShape.bezierCurveTo(0, -0.02, 0.06, 0.02, 0.06, 0.06);
  heartShape.bezierCurveTo(0.04, 0.1, 0, 0.06, 0, 0.04);

  const heartGeo = new THREE.ShapeGeometry(heartShape);
  const heartMat = new THREE.MeshBasicMaterial({ color: 0xdb2777, side: THREE.DoubleSide });
  const heartMesh = new THREE.Mesh(heartGeo, heartMat);
  heartMesh.position.set(0, 0.45, 0.24);
  heartMesh.rotation.z = Math.PI; // Flip upright
  hips.add(heartMesh);

  // Woven Straw Sunhat
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.45, -0.02);
  hatGroup.rotation.x = -0.1; // Cute tilted angle
  headGroup.add(hatGroup);

  // Hat Brim
  const brimGeo = new THREE.CylinderGeometry(0.55, 0.58, 0.03, 16);
  const brim = new THREE.Mesh(brimGeo, hatMat);
  hatGroup.add(brim);

  // Hat Crown
  const crownGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.26, 16);
  const crown = new THREE.Mesh(crownGeo, hatMat);
  crown.position.y = 0.13;
  hatGroup.add(crown);

  // Pink Ribbon Band around crown
  const ribbonGeo = new THREE.CylinderGeometry(0.355, 0.355, 0.06, 16);
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.position.y = 0.04;
  hatGroup.add(ribbon);

  // Ribbon Bow at the back/side
  const bow = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), ribbonMat);
  bow.scale.set(1.5, 0.8, 0.6);
  bow.position.set(0.32, 0.04, 0.08);
  hatGroup.add(bow);

  // Left & Right Arms (pivoted at shoulder)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 0.46, 0);
  hips.add(leftArm);

  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.4, 8), shirtMat);
  leftArmMesh.position.y = -0.2;
  leftArm.add(leftArmMesh);

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), skinMat);
  leftHand.position.y = -0.42;
  leftArm.add(leftHand);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 0.46, 0);
  hips.add(rightArm);

  const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.4, 8), shirtMat);
  rightArmMesh.position.y = -0.2;
  rightArm.add(rightArmMesh);

  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), skinMat);
  rightHand.position.y = -0.42;
  rightArm.add(rightHand);

  // Left & Right Legs (pivoted at hip)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0, 0);
  hips.add(leftLeg);

  const leftLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.5, 8), denimMat);
  leftLegMesh.position.y = -0.25;
  leftLeg.add(leftLegMesh);

  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), bootMat);
  leftBoot.position.set(0, -0.52, 0.05);
  leftLeg.add(leftBoot);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0, 0);
  hips.add(rightLeg);

  const rightLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.5, 8), denimMat);
  rightLegMesh.position.y = -0.25;
  rightLeg.add(rightLegMesh);

  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), bootMat);
  rightBoot.position.set(0, -0.52, 0.05);
  rightLeg.add(rightBoot);

  // Floating Name Badge
  const nameBadge = createNameBadgeSprite('ISA', true, 10);
  root.add(nameBadge);

  let activeChatSprite: THREE.Sprite | undefined;

  const character: AnimatedCharacter = {
    root,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    headGroup,
    nameBadge,
    chatBubble: activeChatSprite,
    setChatBubble(text: string | null) {
      if (this.chatBubble) {
        root.remove(this.chatBubble);
        this.chatBubble.material.dispose();
        this.chatBubble = undefined;
      }
      if (text) {
        this.chatBubble = createChatBubbleSprite(text);
        root.add(this.chatBubble);
      }
    },
    updateAnimation(time: number, isMoving: boolean, speedMultiplier: number = 1, isaState?: string) {
      if (isMoving) {
        const walkFreq = 9 * speedMultiplier;
        const angle = Math.sin(time * walkFreq) * 0.55;

        leftLeg.rotation.x = angle;
        rightLeg.rotation.x = -angle;

        leftArm.rotation.x = -angle * 0.8;
        rightArm.rotation.x = angle * 0.8;

        // Subtle vertical bounce while walking
        hips.position.y = 0.85 + Math.abs(Math.sin(time * walkFreq)) * 0.08;
        headGroup.rotation.y = Math.sin(time * walkFreq * 0.5) * 0.05;
      } else if (isaState === 'jumping') {
        // Pulando de alegria!
        const jumpCycle = Math.abs(Math.sin(time * 9));
        hips.position.y = 0.85 + jumpCycle * 0.45;
        // Arms up in excitement
        leftArm.rotation.x = -0.4;
        leftArm.rotation.z = 1.8 + Math.sin(time * 9) * 0.3;
        rightArm.rotation.x = -0.4;
        rightArm.rotation.z = -1.8 - Math.sin(time * 9) * 0.3;
        headGroup.rotation.x = -0.15;
      } else if (isaState === 'clapping') {
        // Batendo palmas!
        hips.position.y = 0.85 + Math.sin(time * 6) * 0.03;
        const clapCycle = Math.sin(time * 12);
        leftArm.rotation.x = -1.2;
        leftArm.rotation.z = 0.4 + clapCycle * 0.35;
        rightArm.rotation.x = -1.2;
        rightArm.rotation.z = -0.4 - clapCycle * 0.35;
        headGroup.rotation.x = 0.1;
      } else if (isaState === 'dancing') {
        // Dançando na fazendinha!
        const danceCycle = time * 6;
        hips.position.y = 0.85 + Math.abs(Math.sin(danceCycle)) * 0.08;
        hips.rotation.z = Math.sin(danceCycle) * 0.12;
        headGroup.rotation.z = -Math.sin(danceCycle) * 0.1;
        leftArm.rotation.z = 0.5 + Math.sin(danceCycle) * 0.4;
        leftArm.rotation.x = -0.3 + Math.cos(danceCycle) * 0.3;
        rightArm.rotation.z = -0.5 - Math.sin(danceCycle) * 0.4;
        rightArm.rotation.x = -0.3 - Math.cos(danceCycle) * 0.3;
        leftLeg.rotation.x = Math.sin(danceCycle) * 0.25;
        rightLeg.rotation.x = -Math.sin(danceCycle) * 0.25;
      } else if (isaState === 'cheering') {
        // Comemorando vitória / conquista!
        hips.position.y = 0.85 + Math.sin(time * 7) * 0.08;
        leftArm.rotation.z = 2.4;
        leftArm.rotation.x = Math.sin(time * 8) * 0.25;
        rightArm.rotation.z = -2.4;
        rightArm.rotation.x = Math.sin(time * 8) * 0.25;
        headGroup.rotation.x = -0.25; // Looking up joyfully
      } else if (isaState === 'waving') {
        // Acenando calorosamente
        hips.position.y = 0.85;
        leftArm.rotation.x = 0;
        leftArm.rotation.z = 0.15;
        rightArm.rotation.z = -2.1;
        rightArm.rotation.x = Math.sin(time * 8) * 0.4;
        headGroup.rotation.y = 0.15;
      } else if (isaState === 'laughing') {
        // Rindo alegremente
        const giggle = Math.sin(time * 16) * 0.04;
        hips.position.y = 0.85 + Math.abs(giggle);
        headGroup.position.y = 0.65 + giggle;
        headGroup.rotation.x = 0.15 + giggle;
        leftArm.rotation.x = -0.9;
        leftArm.rotation.z = 0.3;
        rightArm.rotation.x = -0.9;
        rightArm.rotation.z = -0.3;
      } else if (isaState === 'surprised') {
        // Ficando surpresa!
        hips.position.y = 0.88;
        headGroup.rotation.x = -0.2;
        leftArm.rotation.x = -1.4;
        leftArm.rotation.z = 0.6;
        rightArm.rotation.x = -1.4;
        rightArm.rotation.z = -0.6;
      } else if (isaState === 'thanking') {
        // Agradecendo aos jogadores
        hips.position.y = 0.83;
        hips.rotation.x = 0.12;
        headGroup.rotation.x = 0.2;
        leftArm.rotation.x = -0.8;
        leftArm.rotation.z = 0.25;
        rightArm.rotation.x = -0.8;
        rightArm.rotation.z = -0.25;
      } else {
        // Idle natural com respiração suave
        const idleTime = time * 2;
        leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 10, 0.016);
        rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 10, 0.016);
        leftArm.rotation.x = -Math.sin(idleTime) * 0.05;
        leftArm.rotation.z = 0.1 - Math.sin(idleTime * 1.5) * 0.04;
        rightArm.rotation.x = Math.sin(idleTime) * 0.05;
        rightArm.rotation.z = -0.1 + Math.sin(idleTime * 1.5) * 0.04;
        hips.position.y = 0.85 + Math.sin(idleTime) * 0.02;
        headGroup.rotation.y = Math.sin(idleTime * 0.6) * 0.08;
      }
    },
  };

  return character;
}

import { AVATAR_CATALOG } from '../types/game';

/**
 * 🧑 BUILD PLAYER AVATAR MODEL (Suporta os 12 Avatares Oficiais em 3D)
 */
export function buildPlayerModel(avatarType: string = 'leo', nickname: string = 'Fazendeiro', level: number = 1): AnimatedCharacter {
  const root = new THREE.Group();
  root.name = `Player_${nickname}`;

  const shadow = createContactShadowDisc(0.6, 0.4);
  root.add(shadow);

  // Find avatar definition from catalog
  const def = AVATAR_CATALOG.find((a) => a.id === avatarType) || AVATAR_CATALOG[0];

  const skinMat = new THREE.MeshStandardMaterial({ color: def.skinColor, roughness: 0.7 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: def.shirtColor, roughness: 0.65 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: def.pantsColor, roughness: 0.8 });
  const hairMat = new THREE.MeshStandardMaterial({ color: def.hairColor, roughness: 0.85 });
  const hatMat = new THREE.MeshStandardMaterial({ color: def.hatColor, roughness: 0.7 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });

  // Pelvis / Hips
  const hips = new THREE.Group();
  hips.position.y = 0.8;
  root.add(hips);

  // Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.55, 10), shirtMat);
  torso.position.y = 0.28;
  torso.castShadow = true;
  hips.add(torso);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.65, 0);
  hips.add(headGroup);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), skinMat);
  headMesh.position.y = 0.22;
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Big expressive eyes
  for (const x of [-0.09, 0.09]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x111827 })
    );
    eye.position.set(x, 0.24, 0.25);
    headGroup.add(eye);

    const eyeHighlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    eyeHighlight.position.set(x - 0.01, 0.25, 0.28);
    headGroup.add(eyeHighlight);
  }

  // Rosy cheeks
  for (const x of [-0.14, 0.14]) {
    const blush = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.5 })
    );
    blush.position.set(x, 0.18, 0.23);
    headGroup.add(blush);
  }

  // Smile
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI * 0.8),
    new THREE.MeshBasicMaterial({ color: 0x881337 })
  );
  smile.rotation.x = Math.PI * 0.9;
  smile.position.set(0, 0.16, 0.26);
  headGroup.add(smile);

  // Hair Generation based on hairstyle
  if (def.hairStyle === 'curly') {
    // Curls: multiple afro/curly puff spheres
    for (let i = 0; i < 9; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), hairMat);
      const angle = (i / 9) * Math.PI * 2;
      puff.position.set(Math.cos(angle) * 0.24, 0.35 + (i % 2) * 0.05, Math.sin(angle) * 0.22);
      headGroup.add(puff);
    }
  } else if (def.hairStyle === 'pigtails') {
    const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), hairMat);
    hairBase.position.set(0, 0.26, -0.04);
    headGroup.add(hairBase);

    // Left and right pigtails
    for (const dir of [-1, 1]) {
      const pigtail = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), hairMat);
      pigtail.position.set(dir * 0.32, 0.24, -0.05);
      headGroup.add(pigtail);

      const tie = new THREE.Mesh(
        new THREE.TorusGeometry(0.05, 0.015, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0xec4899 })
      );
      tie.position.set(dir * 0.28, 0.25, -0.05);
      headGroup.add(tie);
    }
  } else if (def.hairStyle === 'braids') {
    const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), hairMat);
    hairBase.position.set(0, 0.26, -0.04);
    headGroup.add(hairBase);

    // Two braids hanging down
    for (const dir of [-1, 1]) {
      for (let b = 0; b < 3; b++) {
        const braidLink = new THREE.Mesh(new THREE.SphereGeometry(0.08 - b * 0.015, 6, 6), hairMat);
        braidLink.position.set(dir * 0.25, 0.12 - b * 0.1, 0.08);
        headGroup.add(braidLink);
      }
    }
  } else if (def.hairStyle === 'wavy') {
    const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 10), hairMat);
    hairTop.position.set(0, 0.26, -0.05);
    headGroup.add(hairTop);
  } else {
    // Standard short boy hair
    const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), hairMat);
    hairTop.position.set(0, 0.28, -0.04);
    headGroup.add(hairTop);
  }

  // Hat / Accessory Generation
  if (def.hatType === 'straw') {
    const hat = new THREE.Group();
    hat.position.set(0, 0.44, 0);

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.04, 14), hatMat);
    hat.add(brim);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.2, 12), hatMat);
    crown.position.y = 0.1;
    hat.add(crown);

    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.29, 0.3, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0xdc2626 })
    );
    band.position.y = 0.03;
    hat.add(band);

    headGroup.add(hat);
  } else if (def.hatType === 'cap') {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 12), hatMat);
    cap.position.set(0, 0.42, 0);
    headGroup.add(cap);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.2), hatMat);
    visor.position.set(0, 0.38, 0.24);
    headGroup.add(visor);
  } else if (def.hatType === 'bow') {
    const bow = new THREE.Group();
    bow.position.set(0.18, 0.45, 0.05);

    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), hatMat);
    bow.add(knot);

    const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 6), hatMat);
    wingL.rotation.z = Math.PI / 2;
    wingL.position.x = -0.06;
    bow.add(wingL);

    const wingR = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 6), hatMat);
    wingR.rotation.z = -Math.PI / 2;
    wingR.position.x = 0.06;
    bow.add(wingR);

    headGroup.add(bow);
  }

  // Limbs
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.33, 0.44, 0);
  hips.add(leftArm);
  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.38, 8), shirtMat);
  leftArmMesh.position.y = -0.19;
  leftArm.add(leftArmMesh);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.33, 0.44, 0);
  hips.add(rightArm);
  const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.38, 8), shirtMat);
  rightArmMesh.position.y = -0.19;
  rightArm.add(rightArmMesh);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.14, 0, 0);
  hips.add(leftLeg);
  const leftLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.48, 8), pantsMat);
  leftLegMesh.position.y = -0.24;
  leftLeg.add(leftLegMesh);
  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.24), bootMat);
  leftBoot.position.set(0, -0.48, 0.04);
  leftLeg.add(leftBoot);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.14, 0, 0);
  hips.add(rightLeg);
  const rightLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.48, 8), pantsMat);
  rightLegMesh.position.y = -0.24;
  rightLeg.add(rightLegMesh);
  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.24), bootMat);
  rightBoot.position.set(0, -0.48, 0.04);
  rightLeg.add(rightBoot);

  // Name Badge
  const nameBadge = createNameBadgeSprite(nickname, false, level);
  root.add(nameBadge);

  const character: AnimatedCharacter = {
    root,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    headGroup,
    nameBadge,
    setChatBubble(text: string | null) {
      if (this.chatBubble) {
        root.remove(this.chatBubble);
        this.chatBubble.material.dispose();
        this.chatBubble = undefined;
      }
      if (text) {
        this.chatBubble = createChatBubbleSprite(text);
        root.add(this.chatBubble);
      }
    },
    updateAnimation(time: number, isMoving: boolean, speedMultiplier: number = 1) {
      if (isMoving) {
        const walkFreq = 9 * speedMultiplier;
        const angle = Math.sin(time * walkFreq) * 0.55;

        leftLeg.rotation.x = angle;
        rightLeg.rotation.x = -angle;

        leftArm.rotation.x = -angle * 0.8;
        rightArm.rotation.x = angle * 0.8;

        hips.position.y = 0.8 + Math.abs(Math.sin(time * walkFreq)) * 0.08;
      } else {
        const idleTime = time * 2;
        leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 10, 0.016);
        rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 10, 0.016);
        leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, 0, 10, 0.016);
        rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, 0, 10, 0.016);
        hips.position.y = 0.8 + Math.sin(idleTime) * 0.015;
      }
    },
  };

  return character;
}

/**
 * 🏪 BUILD 3D MARKET BUYER NPC MODEL
 * Cria comerciantes e clientes 3D que frequentam o Mercado da Fazendinha
 */
export function buildMerchantNpcModel(
  id: string,
  name: string,
  role: string,
  apronColor: number = 0x16a34a,
  icon: string = '👨‍🌾'
): THREE.Group {
  const npcGroup = new THREE.Group();
  npcGroup.name = `Merchant_${id}`;

  const shadow = createContactShadowDisc(0.7, 0.4);
  npcGroup.add(shadow);

  // Body with Apron
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.3, 0.72, 10),
    new THREE.MeshStandardMaterial({ color: apronColor, roughness: 0.7 })
  );
  body.position.y = 0.85;
  body.castShadow = true;
  npcGroup.add(body);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xeb9c68, roughness: 0.7 })
  );
  head.position.y = 1.38;
  npcGroup.add(head);

  // Big friendly eyes
  for (const x of [-0.08, 0.08]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshBasicMaterial({ color: 0x111827 }));
    eye.position.set(x, 1.4, 0.23);
    npcGroup.add(eye);
  }

  // Country Hat
  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.8 })
  );
  hat.position.set(0, 1.58, 0);
  npcGroup.add(hat);

  // Floating Nameplate
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.roundRect(8, 8, 240, 48, 16);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 20px Nunito, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${icon} ${name}`, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.4, 0.6, 1);
  sprite.position.y = 2.1;
  npcGroup.add(sprite);

  return npcGroup;
}

