import * as THREE from 'three';

/** Deterministic, local canvas textures: the room has no external asset dependency. */
export function seededRandom(seed = 7) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function canvasTexture(width, height, draw, repeat = [1, 1]) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  return texture;
}

function speckle(context, width, height, count, light, dark, random) {
  for (let i = 0; i < count; i++) {
    const alpha = 0.015 + random() * 0.045;
    context.fillStyle = (i % 2 ? light : dark).replace('ALPHA', alpha.toFixed(3));
    const size = 0.3 + random() * 1.8;
    context.fillRect(random() * width, random() * height, size, size);
  }
}

export function createMaterials(renderer) {
  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const wood = canvasTexture(512, 512, (ctx, w, h) => {
    const random = seededRandom(71);
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#4b2e24'); gradient.addColorStop(.45, '#79513d'); gradient.addColorStop(1, '#43291f');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) {
      const x = random() * w;
      ctx.strokeStyle = `rgba(25,12,8,${0.03 + random() * .09})`;
      ctx.lineWidth = .4 + random() * 2.4;
      ctx.beginPath(); ctx.moveTo(x, 0);
      for (let y = 0; y <= h; y += 16) ctx.lineTo(x + Math.sin(y / 90 + i) * (2 + random() * 5), y);
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = 'rgba(28,13,7,.18)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(random() * w, random() * h, 12, 52, 0, 0, Math.PI * 2); ctx.stroke();
    }
    speckle(ctx, w, h, 1700, 'rgba(255,220,175,ALPHA)', 'rgba(0,0,0,ALPHA)', random);
  }, [1, 3]);

  const plaster = canvasTexture(512, 512, (ctx, w, h) => {
    const random = seededRandom(234);
    ctx.fillStyle = '#5c343d'; ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 17000, 'rgba(244,209,186,ALPHA)', 'rgba(20,4,10,ALPHA)', random);
    for (let i = 0; i < 50; i++) {
      ctx.strokeStyle = 'rgba(240,200,170,.018)'; ctx.lineWidth = 10 + random() * 28;
      ctx.beginPath(); ctx.moveTo(random() * w, random() * h); ctx.bezierCurveTo(random() * w, random() * h, random() * w, random() * h, random() * w, random() * h); ctx.stroke();
    }
  }, [2.5, 1.5]);

  const textile = canvasTexture(256, 256, (ctx, w, h) => {
    const random = seededRandom(49);
    ctx.fillStyle = '#aaa29a'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      ctx.strokeStyle = `rgba(255,255,255,${.025 + random() * .045})`;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 1); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.beginPath(); ctx.moveTo(y, 0); ctx.lineTo(y + 1, h); ctx.stroke();
    }
    speckle(ctx, w, h, 2200, 'rgba(255,255,255,ALPHA)', 'rgba(0,0,0,ALPHA)', random);
  }, [5, 5]);

  const rug = canvasTexture(1024, 768, (ctx, w, h) => {
    const random = seededRandom(945);
    ctx.fillStyle = '#342838'; ctx.fillRect(0, 0, w, h);
    const border = (inset, color, thickness) => {
      ctx.strokeStyle = color; ctx.lineWidth = thickness;
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    };
    border(24, '#90714f', 3); border(36, '#8f7352', 1); border(62, '#6f5042', 20); border(76, '#b29965', 2); border(88, '#6c5546', 2);
    for (let x = 74; x < w - 40; x += 48) {
      for (const y of [65, h - 65]) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.strokeStyle = '#a08660'; ctx.lineWidth = 2; ctx.strokeRect(-8, -8, 16, 16); ctx.restore();
      }
    }
    for (let y = 110; y < h - 60; y += 48) {
      for (const x of [65, w - 65]) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.strokeStyle = '#a08660'; ctx.lineWidth = 2; ctx.strokeRect(-8, -8, 16, 16); ctx.restore();
      }
    }
    // Subtle cloud-scroll motifs, not a flat empty rug.
    ctx.strokeStyle = 'rgba(172,138,89,.22)'; ctx.lineWidth = 3;
    for (const [x, y, rotation] of [[190,180,0],[w-190,180,Math.PI/2],[190,h-180,-Math.PI/2],[w-190,h-180,Math.PI]]) {
      ctx.save(); ctx.translate(x,y); ctx.rotate(rotation);
      ctx.beginPath(); ctx.moveTo(-65,20); ctx.bezierCurveTo(-30,-65,60,-45,45,12); ctx.bezierCurveTo(35,45,-12,40,-4,6); ctx.bezierCurveTo(-1,-8,19,-5,15,8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-70,34); ctx.lineTo(75,34); ctx.moveTo(-48,48); ctx.lineTo(47,48); ctx.stroke(); ctx.restore();
    }
    for (let y = 0; y < h; y += 2) {
      ctx.strokeStyle = `rgba(229,214,181,${.015 + random() * .025})`; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    speckle(ctx, w, h, 30000, 'rgba(234,208,160,ALPHA)', 'rgba(0,0,0,ALPHA)', random);
  });

  const paper = canvasTexture(512, 512, (ctx, w, h) => {
    const random = seededRandom(129);
    ctx.fillStyle = '#e1cda3'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 7000; i++) {
      ctx.strokeStyle = `rgba(99,72,38,${.01 + random() * .07})`; ctx.lineWidth = .4;
      const x = random() * w, y = random() * h;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 5, y + random() * 8); ctx.stroke();
    }
    const vignette = ctx.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, 370);
    vignette.addColorStop(0, 'rgba(255,255,255,0)'); vignette.addColorStop(1, 'rgba(91,44,16,.22)'); ctx.fillStyle = vignette; ctx.fillRect(0,0,w,h);
  });

  const lantern = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#ecd4a1'; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      const g = ctx.createLinearGradient(x, 0, x + 32, 0);
      g.addColorStop(0, 'rgba(76,38,17,.19)'); g.addColorStop(.5, 'rgba(255,247,211,.12)'); g.addColorStop(1, 'rgba(76,38,17,.19)'); ctx.fillStyle = g; ctx.fillRect(x, 0, 32, h);
    }
    const random = seededRandom(170); speckle(ctx,w,h,9000,'rgba(255,255,255,ALPHA)','rgba(95,62,35,ALPHA)',random);
  });

  const city = canvasTexture(1536, 768, (ctx, w, h) => {
    const random = seededRandom(443);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#080d20'); sky.addColorStop(.5, '#142639'); sky.addColorStop(.8, '#5c575b'); sky.addColorStop(1, '#b58969');
    ctx.fillStyle = sky; ctx.fillRect(0,0,w,h);
    for (let i = 0; i < 130; i++) {
      const x = random()*w, y = random()*h*.54;
      ctx.fillStyle = `rgba(215,220,223,${.1 + random()*.5})`; ctx.fillRect(x,y,random()*1.5+.3,random()*1.5+.3);
    }
    // distant mountain silhouettes
    ctx.fillStyle = '#1c2937'; ctx.beginPath(); ctx.moveTo(0,h*.65);
    for (let x=0;x<=w;x+=80) ctx.lineTo(x,h*.58+Math.sin(x*.006)*30+random()*40);
    ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.fill();
    ctx.fillStyle = '#15222c'; ctx.beginPath(); ctx.moveTo(0,h*.72);
    for (let x=0;x<=w;x+=50) ctx.lineTo(x,h*.66+Math.sin(x*.009+2)*28+random()*36);
    ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.fill();
    for (let i=0;i<110;i++) {
      const x=random()*w, bh=20+random()*140, y=h*.89-bh, bw=8+random()*22;
      ctx.fillStyle='#111a22'; ctx.fillRect(x,y,bw,bh);
      for (let wy=y+7;wy<h*.88;wy+=10) for(let wx=x+3;wx<x+bw-2;wx+=7) if(random()>.55) {
        ctx.fillStyle=random()>.3?'rgba(240,190,112,.5)':'rgba(132,168,174,.35)'; ctx.fillRect(wx,wy,2,3);
      }
    }
    const haze = ctx.createLinearGradient(0,h*.73,0,h); haze.addColorStop(0,'rgba(180,159,141,0)'); haze.addColorStop(1,'rgba(66,63,70,.65)'); ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
  });

  const radial = canvasTexture(128, 128, (ctx, w, h) => {
    const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.12,'rgba(255,250,228,.85)');g.addColorStop(.35,'rgba(241,193,126,.28)');g.addColorStop(1,'rgba(241,164,94,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  });
  radial.wrapS = radial.wrapT = THREE.ClampToEdgeWrapping;

  const smoke = canvasTexture(128, 128, (ctx,w,h) => {
    const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(235,228,213,.24)');g.addColorStop(.45,'rgba(199,202,196,.11)');g.addColorStop(1,'rgba(190,190,190,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  }); smoke.wrapS=smoke.wrapT=THREE.ClampToEdgeWrapping;

  const materials = {
    wall: new THREE.MeshStandardMaterial({ color: 0x88757a, map: plaster, roughness: .92, bumpMap: plaster, bumpScale: .035 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x917260, map: wood, roughness: .55, bumpMap: wood, bumpScale: .035 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x4b3631, map: wood, roughness: .58, bumpMap: wood, bumpScale: .025 }),
    lacquer: new THREE.MeshPhysicalMaterial({ color: 0x27191c, map: wood, roughness: .31, clearcoat: .35, clearcoatRoughness: .2 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb19356, metalness: .75, roughness: .33 }),
    agedBrass: new THREE.MeshStandardMaterial({ color: 0x80653d, metalness: .7, roughness: .45 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd1b26b, metalness: .78, roughness: .25 }),
    linen: new THREE.MeshStandardMaterial({ color: 0xb9a99c, map: textile, bumpMap: textile, bumpScale: .025, roughness: .98 }),
    plumLinen: new THREE.MeshStandardMaterial({ color: 0x694453, map: textile, bumpMap: textile, bumpScale: .032, roughness: .93 }),
    ochreLinen: new THREE.MeshStandardMaterial({ color: 0xb2925f, map: textile, bumpMap: textile, bumpScale: .025, roughness: .96 }),
    jadeLinen: new THREE.MeshStandardMaterial({ color: 0x526a60, map: textile, bumpMap: textile, bumpScale: .025, roughness: .92 }),
    rug: new THREE.MeshStandardMaterial({ map: rug, roughness: 1, bumpMap: textile, bumpScale: .028 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: 0xc6bfa8, roughness: .24, clearcoat: .45, clearcoatRoughness: .2 }),
    celadon: new THREE.MeshPhysicalMaterial({ color: 0x6f9080, roughness: .28, clearcoat: .65, clearcoatRoughness: .2 }),
    purpleCeramic: new THREE.MeshPhysicalMaterial({ color: 0x453543, roughness: .3, clearcoat: .45 }),
    blackCeramic: new THREE.MeshPhysicalMaterial({ color: 0x242323, roughness: .28, clearcoat: .4 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xf1dab1, map: paper, roughness: .9, side: THREE.DoubleSide }),
    city: new THREE.MeshBasicMaterial({ map: city, toneMapped: false }),
    lantern: new THREE.MeshStandardMaterial({ map: lantern, color: 0xffd99e, emissive: 0xf3a64f, emissiveIntensity: 1.4, roughness: .88, side: THREE.DoubleSide }),
    windowGlass: new THREE.MeshPhysicalMaterial({ color: 0x8ca5ae, transparent: true, opacity: .12, roughness: .16, metalness: .05, depthWrite: false }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3f5a42, roughness: .8, side: THREE.DoubleSide }),
    leafLight: new THREE.MeshStandardMaterial({ color: 0x617253, roughness: .8, side: THREE.DoubleSide }),
    stone: new THREE.MeshStandardMaterial({ color: 0x555151, roughness: .9 }),
    ink: new THREE.MeshStandardMaterial({ color: 0x161a1a, roughness: .82 }),
    glow: radial,
    smoke,
  };

  for (const texture of [wood, plaster, textile, rug, paper, lantern, city]) texture.anisotropy = maxAnisotropy;
  return materials;
}

export function textTexture(text, options = {}) {
  const { width = 512, height = 512, background = '#211b20', color = '#c4a367', font = 'serif', size = 250, subtitle = '', border = true, vertical = false } = options;
  const texture = canvasTexture(width, height, (ctx, w, h) => {
    ctx.fillStyle = background; ctx.fillRect(0,0,w,h);
    if (border) {
      ctx.strokeStyle=color;ctx.globalAlpha=.65;ctx.lineWidth=5;ctx.strokeRect(19,19,w-38,h-38);ctx.lineWidth=1.5;ctx.strokeRect(29,29,w-58,h-58);ctx.globalAlpha=1;
    }
    ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`500 ${size}px "Noto Serif CJK SC", "Songti SC", "SimSun", ${font}`;
    if (vertical && text.length > 1) {
      [...text].forEach((char,index)=>ctx.fillText(char,w/2,h*(index+1)/(text.length+1),w*.8));
    } else ctx.fillText(text,w/2,h*.5,w*.8);
    if (subtitle) {ctx.font=`${Math.max(16,size*.12)}px ${font}`;ctx.fillStyle=color;ctx.globalAlpha=.7;ctx.fillText(subtitle,w/2,h*.78,w*.75);}
    ctx.globalAlpha=1;
  });
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  return texture;
}

export function landscapeTexture(seed = 1) {
  const random = seededRandom(seed * 113 + 51);
  const texture = canvasTexture(768, 512, (ctx,w,h) => {
    ctx.fillStyle='#cbb895';ctx.fillRect(0,0,w,h);
    const mist=ctx.createLinearGradient(0,0,0,h);mist.addColorStop(0,'rgba(233,221,193,.7)');mist.addColorStop(.6,'rgba(192,188,163,.06)');mist.addColorStop(1,'rgba(81,91,78,.28)');ctx.fillStyle=mist;ctx.fillRect(0,0,w,h);
    for(let layer=0;layer<5;layer++) {
      ctx.fillStyle=`rgba(45,64,57,${.09+layer*.10})`;ctx.beginPath();ctx.moveTo(0,h);
      for(let x=0;x<=w;x+=30) ctx.lineTo(x,h*(.43+layer*.082)+Math.sin(x*.015+layer*2)*35+random()*55);
      ctx.lineTo(w,h);ctx.fill();
    }
    ctx.strokeStyle='rgba(39,51,43,.6)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(w*.12,h*.85);ctx.lineTo(w*.19,h*.55);ctx.stroke();
    for(let i=0;i<15;i++){const y=h*(.54+random()*.18),x=w*.19;ctx.fillStyle='rgba(45,65,45,.45)';ctx.beginPath();ctx.ellipse(x+(random()-.5)*80,y,25+random()*25,6,random()-.5,0,Math.PI*2);ctx.fill();}
    speckle(ctx,w,h,8000,'rgba(255,255,255,ALPHA)','rgba(45,35,24,ALPHA)',random);
    ctx.fillStyle='#964a35';ctx.fillRect(w*.83,h*.78,28,28);ctx.fillStyle='rgba(241,215,176,.8)';ctx.font='18px serif';ctx.fillText('静',w*.83+4,h*.78+21);
  }); texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping; return texture;
}
