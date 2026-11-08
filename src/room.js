import * as THREE from 'three';
import { createMaterials, textTexture, landscapeTexture, seededRandom, speckle } from './materials.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, cylinder, sphere, torus, mesh, lathe, tube, rodBetween, frame, vase, cup, plantBranch, paperLantern, makeGlow } from './geometry.js';
import { createBagua } from './bagua.js';
import { WallDoor } from './wall-door.js';
import { createPropModel } from './prop-models.js';
import { readLayout, writeLayout } from './placement.js';

/** All coordinates are in metres. Open front/right walls make the room an approachable diorama. */
export class DojoRoom {
  constructor(scene, renderer) {
    this.scene=scene; this.renderer=renderer;
    this.m=createMaterials(renderer);
    this.root=new THREE.Group();scene.add(this.root);
    this.animated=[];this.lanterns=[];this.hotspotData=[];this.clickables=[];
    this.colliders=[];this.candleFlames=[];this.leaves=[];
    this.props=[];this.keepLive=new Set();this.shelfLocals=[];this.shelfOwner=null;
    this.buildArchitecture();this.buildCeiling();this.buildWindow();this.buildWindowLight();this.buildWallArt();this.buildMeditation();
    this.buildSofa();this.buildStudy();this.buildBookshelf();this.buildTeaCorner();this.buildDetails();this.buildChartObjects();this.buildAtmosphere();
    this.tagLiving();
    this.addLighting();
    this.buildSky();
    // Static merging is opt-in during profiling; animated hierarchy is the reliable default.
    // See PERFORMANCE.md for the scene budget.
    this.optimizeStaticGeometry();
  }

  materialLabel(text, options={}) {
    return new THREE.MeshStandardMaterial({map:textTexture(text,options),roughness:.8,...options.material});
  }

  region(name,position,rotation=[0,0,0]) {
    const group=new THREE.Group();group.name=name;group.position.set(...position);group.rotation.set(...rotation);this.root.add(group);return group;
  }

  collider(x,z,width,depth) {
    this.colliders.push({minX:x-width/2-.13,maxX:x+width/2+.13,minZ:z-depth/2-.13,maxZ:z+depth/2+.13});
  }

  buildArchitecture() {
    const m=this.m;
    box(this.root,new THREE.MeshStandardMaterial({color:0x16151a,roughness:.7}),[11.5,.34,9.5],[0,-.24,0],.12);
    // Individual oak boards with staggered joins and subtle tonal variation.
    const floorGeometry=new THREE.BoxGeometry(.434,.08,2.22);
    const random=seededRandom(513);
    for(let col=0;col<25;col++) {
      const x=-5.34+col*.445;
      for(let row=0;row<4;row++) {
        const mat=m.wood.clone();mat.color.setHSL(.061,.24,.40+random()*.09);
        const board=mesh(floorGeometry,mat,this.root,[x,-.015,-3.47+row*2.34+(col%2?.58:0)]);
      }
    }
    // Burgundy plaster walls; timber corresponds structurally to posts and beam bays.
    box(this.root,m.wall,[11.15,5.5,.18],[0,2.63,-4.55]);
    box(this.root,m.wall,[.18,5.5,9.15],[-5.56,2.63,0]);
    box(this.root,m.darkWood,[11.3,.17,.30],[0,.08,-4.40],.03);
    box(this.root,m.darkWood,[.3,.17,9],[-5.39,.08,0],.03);
    box(this.root,m.darkWood,[11.3,.10,.35],[0,.22,-4.39],.025);
    box(this.root,m.darkWood,[.35,.10,9],[-5.38,.22,0],.025);
    for(const x of [-5.42,-2.73,0,2.73,5.42]) {
      box(this.root,m.darkWood,[.18,5.5,.30],[x,2.63,-4.34],.02);
      // decorative pegged mortise joints
      cylinder(this.root,m.wood,.024,.028,[x,4.75,-4.17],12).rotation.x=Math.PI/2;
    }
    for(const z of [-4.4,-1.5,1.5,4.4])box(this.root,m.darkWood,[.29,5.5,.18],[-5.35,2.63,z],.02);
    box(this.root,m.darkWood,[11.3,.24,.35],[0,5.25,-4.34],.025);
    box(this.root,m.darkWood,[.35,.24,9.2],[-5.35,5.25,0],.025);
    for(const z of [-3.6,.1,3.7]) {
      box(this.root,m.darkWood,[11,.19,.22],[0,5.34,z],.025);
      // slim brass inlay gives the beams a crafted detail.
      box(this.root,m.agedBrass,[11,.012,.012],[0,5.231,z+.07]);
    }
    // Timber wall frieze: restrained repeating lattice underneath the main beam.
    for(let x=-5.05;x<5.3;x+=.47) {
      box(this.root,m.wood,[.042,.46,.06],[x,4.86,-4.22]);
      const diagonal=box(this.root,m.wood,[.34,.035,.04],[x+.18,4.86,-4.17]);diagonal.rotation.z=(Math.round(x*10)%2?.5:-.5);
    }
    box(this.root,m.darkWood,[11,.09,.12],[0,4.61,-4.19]);
    box(this.root,m.darkWood,[11,.08,.13],[0,5.09,-4.19]);
    // Embroidered rug lies under the conversation area.
    box(this.root,m.linen,[6.05,.032,4.9],[-.4,.054,.15],.015);
    box(this.root,m.rug,[5.95,.037,4.8],[-.4,.063,.15],.015);
    for(let i=0;i<65;i++) {
      const z=-2.15+i*.07;
      cylinder(this.root,m.ochreLinen,.009,.14,[-3.43,.068,z+.15],5).rotation.z=Math.PI/2;
      cylinder(this.root,m.ochreLinen,.009,.14,[2.63,.068,z+.15],5).rotation.z=Math.PI/2;
    }
  }

  /** A coffered ceiling caps the open diorama, so orbiting high shows a finished roof, never bare beam tops. */
  buildCeiling() {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#221619';ctx.fillRect(0,0,512,512);
    // Recessed coffers: each panel steps inward with a warm rim.
    for(let px=0;px<4;px++)for(let py=0;py<4;py++) {
      const x=px*128,y=py*128;
      ctx.strokeStyle='rgba(156,118,72,.5)';ctx.lineWidth=5;ctx.strokeRect(x+7,y+7,114,114);
      ctx.strokeStyle='rgba(60,36,30,.9)';ctx.lineWidth=9;ctx.strokeRect(x+17,y+17,94,94);
      ctx.fillStyle='#1b1215';ctx.fillRect(x+24,y+24,80,80);
      ctx.strokeStyle='rgba(196,152,96,.16)';ctx.lineWidth=2;ctx.strokeRect(x+32,y+32,64,64);
    }
    const random=seededRandom(87);
    speckle(ctx,512,512,2600,'rgba(230,196,150,ALPHA)','rgba(0,0,0,ALPHA)',random);
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2.6,2.2);
    texture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
    const coffer=new THREE.MeshStandardMaterial({map:texture,roughness:.6,bumpMap:texture,bumpScale:.02});
    const slab=box(this.root,coffer,[11.6,.08,9.6],[0,5.46,0]);
    const m=this.m;
    // The roof cap overhangs like eaves; scalloped tile rows keep the top view crafted, not blank.
    const tileCanvas=document.createElement('canvas');tileCanvas.width=512;tileCanvas.height=512;
    const tc=tileCanvas.getContext('2d');
    tc.fillStyle='#37303a';tc.fillRect(0,0,512,512);
    for(let row=0;row<16;row++) {
      const y=row*32;
      const shade=tc.createLinearGradient(0,y,0,y+32);
      shade.addColorStop(0,'rgba(226,204,176,.16)');shade.addColorStop(.7,'rgba(0,0,0,.12)');shade.addColorStop(1,'rgba(0,0,0,.34)');
      tc.fillStyle=shade;tc.fillRect(0,y,512,32);
      tc.strokeStyle='rgba(16,12,16,.85)';tc.lineWidth=3;
      tc.beginPath();
      for(let x=0;x<=512;x+=32) {
        tc.moveTo(x,y+32);tc.arc(x+16,y+32,16,Math.PI,0);
      }
      tc.stroke();
      tc.strokeStyle='rgba(210,186,150,.10)';tc.lineWidth=1.5;
      tc.beginPath();
      for(let x=0;x<=512;x+=32) { tc.moveTo(x,y+30);tc.arc(x+16,y+30,14,Math.PI,0); }
      tc.stroke();
    }
    speckle(tc,512,512,2200,'rgba(224,196,158,ALPHA)','rgba(0,0,0,ALPHA)',seededRandom(203));
    const tileTexture=new THREE.CanvasTexture(tileCanvas);
    tileTexture.colorSpace=THREE.SRGBColorSpace;tileTexture.wrapS=tileTexture.wrapT=THREE.RepeatWrapping;tileTexture.repeat.set(3.2,2.6);
    tileTexture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
    const roofTile=new THREE.MeshStandardMaterial({map:tileTexture,roughness:.74,bumpMap:tileTexture,bumpScale:.03});
    const cap=box(this.root,roofTile,[11.78,.07,9.78],[0,5.56,0],.02);
    // Ridge beam with brass end caps, and a gilt eave line, so the top view reads as crafted.
    box(this.root,m.darkWood,[11.5,.11,.22],[0,5.65,0],.03);
    for(const x of [-5.68,5.68])sphere(this.root,m.brass,.07,[x,5.65,0],[1,.72,.72]);
    for(const z of [-4.86,4.86])box(this.root,m.agedBrass,[11.82,.022,.05],[0,5.53,z]);
    for(const x of [-5.86,5.86])box(this.root,m.agedBrass,[.05,.022,9.82],[x,5.53,0]);
    this.keepLive.add(slab);this.keepLive.add(cap); // keep their textures unmerged for clarity
  }

  /** Soft volumetric shaft from the lattice window, plus a warm pool where the light lands. */
  buildWindowLight() {
    const m=this.m;
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;
    const ctx=canvas.getContext('2d');
    const fade=ctx.createLinearGradient(0,0,0,256);
    fade.addColorStop(0,'rgba(255,238,205,.5)');fade.addColorStop(.55,'rgba(255,230,185,.13)');fade.addColorStop(1,'rgba(255,230,185,0)');
    ctx.fillStyle=fade;ctx.fillRect(0,0,128,256);
    // Feather the side edges so the shaft fades instead of ending in a hard line.
    const side=ctx.createLinearGradient(0,0,128,0);
    side.addColorStop(0,'rgba(0,0,0,1)');side.addColorStop(.25,'rgba(0,0,0,0)');side.addColorStop(.75,'rgba(0,0,0,0)');side.addColorStop(1,'rgba(0,0,0,1)');
    ctx.globalCompositeOperation='destination-out';ctx.fillStyle=side;ctx.fillRect(0,0,128,256);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.62,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
    const shaft=new THREE.Group();shaft.position.set(-3.9,1.75,1.62);shaft.rotation.y=.72;this.root.add(shaft);
    for(const roll of [-.16,.18]) {
      const plane=mesh(new THREE.PlaneGeometry(2.9,4.7),material,shaft,[0,0,0]);
      plane.rotation.z=.72+roll;plane.castShadow=plane.receiveShadow=false;plane.renderOrder=6;
    }
    const pool=mesh(new THREE.CircleGeometry(1.55,40),new THREE.MeshBasicMaterial({map:m.glow,color:0xe8cf9f,transparent:true,opacity:.30,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),this.root,[-2.75,.095,1.55],[-Math.PI/2,0,0]);
    pool.castShadow=pool.receiveShadow=false;pool.renderOrder=5;pool.scale.set(1,.72,1);
    this.keepLive.add(shaft);this.keepLive.add(pool);
  }

  buildWindow() {
    const m=this.m;
    // Large landscape window on the left, with layered lattice and a luminous evening horizon.
    const g=this.region('Lattice window',[-5.42,0,1.7],[0,Math.PI/2,0]);
    box(g,m.city,[3.55,2.65,.015],[0,3.23,0]);
    frame(g,m.lacquer,3.75,2.82,.22,.13,[0,3.23,.10]);
    frame(g,m.brass,3.58,2.65,.032,.022,[0,3.23,.23]);
    for(const x of [-1.20,0,1.20])box(g,m.darkWood,[.075,2.65,.16],[x,3.23,.19],.01);
    for(const y of [2.25,3.23,4.2])box(g,m.darkWood,[3.55,.07,.17],[0,y,.19],.01);
    for(let x=-1.64;x<1.7;x+=.42)box(g,m.wood,[.026,2.62,.055],[x,3.23,.23]);
    for(let y=2.02;y<4.52;y+=.42)box(g,m.wood,[3.5,.027,.055],[0,y,.24]);
    // Geometric central mullions remain readable against the landscape.
    for(const x of [-1.20,0,1.20]) {
      const d1=box(g,m.wood,[.04,1.58,.075],[x,3.27,.29]);d1.rotation.z=.78;
      const d2=d1.clone();d2.rotation.z=-.78;g.add(d2);
    }
    box(g,m.wood,[4.05,.12,.48],[0,1.79,.28],.025);
    // Heavy linen curtains with gathered folds and brass rod.
    rodBetween(g,m.brass,[-2.12,4.8,.29],[2.12,4.8,.29],.035);
    for(const side of [-1,1]) {
      for(let i=0;i<7;i++) {
        const x=side*(1.85-i*.065),zz=.22+.065*Math.sin(i*1.8);
        const pleat=cylinder(g,m.plumLinen,[.065,.095],2.75,[x,3.28,zz],12);pleat.scale.z=.9;
      }
      torus(g,m.agedBrass,.11,.018,[side*1.66,2.72,.30],[Math.PI/2,0,0]);
    }
    for(const x of [-2.12,2.12])sphere(g,m.brass,.065,[x,4.8,.29]);
    // Small window-side arrangement.
    vase(g,m.celadon,[1.25,1.86,.29],.48);plantBranch(g,m,[1.25,2.18,.29],.45,4);
    cylinder(g,m.purpleCeramic,[.22,.15],.08,[-1.25,1.86,.26]);
  }

  buildWallArt() {
    const m=this.m;
    const painting=this.region('Landscape scroll',[-3.7,3.15,-4.38]);
    box(painting,m.darkWood,[1.52,2.33,.09],[0,0,0],.025);
    frame(painting,m.brass,1.39,2.19,.035,.018,[0,0,.06]);
    const artMaterial=new THREE.MeshStandardMaterial({map:landscapeTexture(2),roughness:.95});
    box(painting,artMaterial,[1.16,1.64,.018],[0,.06,.06]);
    for(const y of [-1.12,1.12])cylinder(painting,m.lacquer,.055,1.68,[0,y,.08],24).rotation.z=Math.PI/2;
    for(const x of [-.87,.87])sphere(painting,m.brass,.065,[x,1.12,.08]);
    box(painting,m.ink,[.95,.08,.01],[0,-.74,.076]);
    tube(painting,m.ochreLinen,[[-.62,1.2,.06],[0,1.43,.06],[.62,1.2,.06]],.012);
    // The five phases are real carved wall pieces, each interactive.
    const elements=[['金','Earthly clarity'],['木','Quiet growth'],['水','Deep stillness'],['火','Gentle warmth'],['土','Grounded presence']];
    elements.forEach(([glyph,description],index)=>{
      // Mounted proud of the structural posts (whose faces sit at z=-4.19), so no post can cover a plaque.
      const group=this.region(`Five elements ${glyph}`,[-1.95+index*.92,3.42,-4.12]);
      box(group,m.lacquer,[.72,.97,.10],[0,0,0],.035);
      frame(group,m.agedBrass,.66,.91,.025,.013,[0,0,.058]);
      const material=this.materialLabel(glyph,{width:256,height:384,size:196,background:'#2c2127',color:'#d9bc85',border:false});
      box(group,material,[.60,.85,.014],[0,0,.062]);
      sphere(group,m.brass,.018,[0,-.37,.083],[1,1,.5]);
      this.addHotspot(`element-${index}`,glyph,description,[-1.95+index*.92,3.42,-3.86],{compact:true});
    });
    const calligraphy=this.region('Stillness scroll',[4.3,3.17,-4.37]);
    box(calligraphy,m.paper,[.91,2.10,.03],[0,0,.01]);
    const writing=this.materialLabel('静以养心',{width:384,height:768,size:125,background:'#d1b88d',color:'#2d3130',vertical:true,border:false});
    box(calligraphy,writing,[.77,1.85,.015],[0,0,.035]);
    for(const y of [-1.10,1.10]) {
      const roller=cylinder(calligraphy,m.lacquer,.041,1.08,[0,y,.04],24);roller.rotation.z=Math.PI/2;
      for(const x of [-.56,.56])sphere(calligraphy,m.brass,.05,[x,y,.04]);
    }
    tube(calligraphy,m.ochreLinen,[[-.35,1.13,.02],[0,1.4,.02],[.35,1.13,.02]],.010);
    // A low ledge links the wall pieces to a tiny censer.
    box(this.root,m.lacquer,[4.8,.10,.37],[0,2.56,-4.13],.025);
    lathe(this.root,m.purpleCeramic,[[.08,0],[.13,.05],[.12,.13],[.17,.14],[.15,.18],[.07,.12]],[0,2.62,-4.1]);
    for(let i=0;i<3;i++) {
      cylinder(this.root,m.ochreLinen,.007,.32,[-.06+i*.06,2.90,-4.1],7);
    }
  }

  buildMeditation() {
    const m=this.m;
    // A low bagua medallion returns the centre of the room to a calm floor, not a tower.
    const g=this.region('Bagua floor',[0,.02,-.28]);
    cylinder(g,m.darkWood,1.42,.028,[0,.02,0],72);
    cylinder(g,m.brass,1.38,.012,[0,.038,0],72);
    const baguaMaterial=new THREE.MeshStandardMaterial({map:createBagua(),roughness:.72,metalness:.06});
    const disc=mesh(new THREE.CircleGeometry(1.32,72),baguaMaterial,g,[0,.048,0],[-Math.PI/2,0,0]);
    disc.castShadow=false;
    torus(g,m.gold,1.36,.008,[0,.05,0],[Math.PI/2,0,0]);
    this.bagua=g;
    const bowl=this.region('Singing bowl',[1.35,.2,-1.15]);
    lathe(bowl,m.brass,[[.07,0],[.09,.02],[.16,.08],[.19,.17],[.20,.20],[.18,.21],[.16,.15],[.10,.06],[0,.05]]);
    torus(bowl,m.gold,.184,.012,[0,.202,0],[Math.PI/2,0,0]);
    this.wallDoor=new WallDoor(this.root,m);
    // Back wall, between the altar and the desk, beneath the element plaques.
    this.wallDoor.root.position.set(-1.15,0,-4.28);
    this.wallDoor.root.rotation.y=0;
  }

  buildSofa() {
    const m=this.m;
    const sofa=this.region('Velvet lounge',[-4.47,0,-1.24],[0,Math.PI/2,0]);
    for(const x of [-1.13,1.13])for(const z of [-.36,.34]) {
      const foot=box(sofa,m.lacquer,[.12,.28,.12],[x,.22,z],.025);foot.rotation.x=z>0?-.08:.08;foot.rotation.z=x>0?-.07:.07;
      cylinder(sofa,m.brass,[.066,.06],.055,[x,.08,z],16);
    }
    box(sofa,m.darkWood,[2.72,.20,.91],[0,.39,0],.045);
    box(sofa,m.wood,[2.76,.055,.94],[0,.29,0],.025);
    box(sofa,m.plumLinen,[2.59,.66,.26],[0,.87,-.37],.11);
    box(sofa,m.plumLinen,[2.77,.43,.90],[0,.56,0],.10);
    for(const x of [-.66,.66]) {
      box(sofa,m.linen,[1.20,.22,.72],[x,.80,.03],.10);
      box(sofa,m.plumLinen,[1.22,.55,.20],[x,1.03,-.20],.10).rotation.x=-.14;
      // piping is a very thin seam, not painted stripes.
      box(sofa,m.ochreLinen,[1.08,.012,.71],[x,.912,.035],.005);
    }
    for(const x of [-1.27,1.27]) {
      box(sofa,m.plumLinen,[.24,.63,.86],[x,.85,0],.10);
      box(sofa,m.linen,[.27,.10,.72],[x,1.17,.01],.05);
      for(const z of [-.36,.36])sphere(sofa,m.brass,.018,[x,.55,z]);
    }
    const cushion1=box(sofa,m.ochreLinen,[.45,.44,.16],[-.76,1.16,-.05],.08);cushion1.rotation.set(-.20,.13,-.19);
    const cushion2=box(sofa,m.jadeLinen,[.46,.47,.17],[.72,1.17,-.02],.08);cushion2.rotation.set(-.17,-.1,.23);
    // Linen throw draped across one end, with fringe.
    const throwGeometry=new THREE.PlaneGeometry(.61,1.52,18,30);
    const p=throwGeometry.attributes.position;
    for(let i=0;i<p.count;i++) {
      const xx=p.getX(i),yy=p.getY(i);
      p.setZ(i,.02*Math.sin(xx*48)+.008*Math.sin(yy*16));
    }
    throwGeometry.computeVertexNormals();
    const cloth=mesh(throwGeometry,new THREE.MeshStandardMaterial({...{},color:0x9f8971,map:m.linen.map,bumpMap:m.linen.bumpMap,bumpScale:.024,roughness:.97,side:THREE.DoubleSide}),sofa,[.98,1.18,.06],[-1.12,0,0]);cloth.castShadow=true;
    for(let i=0;i<14;i++)rodBetween(sofa,m.linen,[.70+i*.047,.70,.62],[.70+i*.047,.58,.67],.009);
    // tiny stitched sofa buttons
    for(const x of [-.92,-.46,0,.46,.92])sphere(sofa,m.ochreLinen,.021,[x,1.05,-.055]);
    this.collider(-4.32,-1.24,1.35,3.2);
    this.addHotspot('sofa','Lounge · 安放身心','A soft place to pause',[-3.75,1.23,-1.24]);
  }

  buildStudy() {
    const m=this.m;
    const desk=this.region('Scholar desk',[2.13,0,-3.57]);
    box(desk,m.lacquer,[2.84,.14,1.05],[0,1.15,0],.035);
    box(desk,m.brass,[2.80,.018,1.03],[0,1.073,0],.01);
    // Carved apron and four square legs.
    box(desk,m.darkWood,[2.61,.22,.85],[0,.98,0],.025);
    for(const x of [-1.18,1.18])for(const z of [-.36,.36]) {
      box(desk,m.wood,[.13,1.0,.13],[x,.51,z],.025);
      cylinder(desk,m.brass,[.070,.074],.09,[x,.13,z],16);
      box(desk,m.brass,[.012,.07,.012],[x,.96,z+.072]);
    }
    for(const z of [-.35,.35])box(desk,m.wood,[2.4,.085,.085],[0,.34,z],.015);
    for(const x of [-1.15,1.15])box(desk,m.wood,[.085,.085,.73],[x,.34,0],.015);
    // Three real drawers with inset frame and brass drop pulls.
    for(const x of [-.87,0,.87]) {
      frame(desk,m.wood,.78,.18,.026,.018,[x,.975,.44]);
      torus(desk,m.brass,.045,.008,[x,.95,.474],[0,0,0],Math.PI);
      sphere(desk,m.brass,.015,[x,.995,.475]);
    }
    // Desktop blotter and a textured hand-drawn energy chart.
    box(desk,m.plumLinen,[1.30,.012,.69],[-.12,1.226,.05],.018);
    box(desk,m.agedBrass,[1.32,.005,.70],[-.12,1.22,.05],.018);
    const chartTexture=textTexture('生辰五行',{width:768,height:512,size:74,background:'#cbb992',color:'#4b4e40',border:false,subtitle:'WOOD · WATER · FIRE · EARTH · METAL'});
    const ctx=chartTexture.image.getContext('2d');
    ctx.strokeStyle='rgba(72,67,45,.4)';ctx.lineWidth=2;ctx.beginPath();
    for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5;const b=-Math.PI/2+((i+1)%5)*Math.PI*2/5;if(i===0)ctx.moveTo(560+Math.cos(a)*100,225+Math.sin(a)*100);else ctx.lineTo(560+Math.cos(a)*100,225+Math.sin(a)*100);}ctx.closePath();ctx.stroke();
    for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5;ctx.beginPath();ctx.moveTo(560,225);ctx.lineTo(560+Math.cos(a)*100,225+Math.sin(a)*100);ctx.stroke();}
    chartTexture.needsUpdate=true;
    const chartMaterial=new THREE.MeshStandardMaterial({map:chartTexture,roughness:.94});
    box(desk,chartMaterial,[.84,.008,.53],[.01,1.244,.12]).rotation.y=-.035;
    // Closed journal, visible page edges, elastic and marker.
    const book=this.region('Journal',[1.05,1.27,-.05]);desk.add(book);book.rotation.y=.12;
    box(book,m.ochreLinen,[.43,.09,.57],[0,0,0],.015);
    box(book,m.paper,[.39,.065,.53],[0,0,0],.009);
    for(const y of [-.05,.05])box(book,m.jadeLinen,[.44,.012,.58],[0,y,0],.008);
    box(book,m.ink,[.012,.113,.58],[.14,0,0]);
    rodBetween(book,m.ochreLinen,[0,-.02,.29],[.04,-.06,.42],.008);
    // Brush rest, brushes and a polished inkstone.
    box(desk,m.blackCeramic,[.38,.056,.25],[-1.04,1.26,.11],.05);
    cylinder(desk,m.ink,.064,.018,[-1.04,1.293,.12]);
    for(let i=0;i<3;i++) {
      const brush=rodBetween(desk,m.wood,[-1.19+i*.09,1.32,-.33],[-1.15+i*.07,1.30,-.06],.012);
      cylinder(desk,m.ink,[.005,.024],.10,[-1.15+i*.07,1.30,-.015],8).rotation.x=Math.PI/2;
    }
    // Ceramic cup and desk lamp with pleated brass shade.
    cup(desk,m.celadon,[.96,1.225,.29],.88);
    cylinder(desk,m.brass,.14,.032,[-1.10,1.247,-.31]);
    rodBetween(desk,m.brass,[-1.10,1.26,-.31],[-1.10,1.86,-.31],.025);
    rodBetween(desk,m.brass,[-1.10,1.86,-.31],[-.86,2.03,-.14],.022);
    const shade=mesh(new THREE.ConeGeometry(.20,.19,32,1,true),m.agedBrass,desk,[-.81,1.98,-.10],[0,0,-.6]);
    makeGlow(desk,m,[-.70,1.84,-.06],0xf6c77a,.65,.3);
    // Matching study chair: curved back, seat pad, slender spindles.
    const chair=this.region('Study chair',[2.14,0,-2.18],[0,.12,0]);
    box(chair,m.darkWood,[.76,.09,.70],[0,.67,0],.06);
    box(chair,m.jadeLinen,[.68,.13,.62],[0,.74,0],.08);
    for(const x of [-.29,.29])for(const z of [-.26,.26])box(chair,m.wood,[.075,.68,.075],[x,.34,z],.018);
    for(const x of [-.33,.33])rodBetween(chair,m.wood,[x,.71,-.30],[x,1.56,-.35],.036);
    for(const x of [-.22,-.11,0,.11,.22])rodBetween(chair,m.wood,[x,.79,-.30],[x,1.44,-.34],.018);
    box(chair,m.wood,[.77,.17,.075],[0,1.51,-.35],.055);
    box(chair,m.brass,[.62,.012,.081],[0,1.52,-.351]);
    this.collider(2.13,-3.47,3.1,1.26);this.collider(2.14,-2.18,.88,.85);
    this.addHotspot('chart','Five elements · 五行命盘','Your personal rhythm',[2.13,1.55,-3.55]);
  }

  buildBookshelf() {
    const m=this.m;
    const g=this.region('Curio bookshelf',[4.47,0,-3.55]);
    box(g,m.lacquer,[1.44,.16,.68],[0,.20,0],.03);
    box(g,m.lacquer,[1.52,.12,.72],[0,3.5,0],.025);
    for(const x of [-.66,.66])box(g,m.darkWood,[.13,3.3,.61],[x,1.84,0],.02);
    box(g,m.wood,[1.20,3.1,.05],[0,1.85,-.29]);
    for(const y of [.33,1.10,1.87,2.64]) {
      box(g,m.darkWood,[1.37,.095,.61],[0,y,0],.015);
      box(g,m.brass,[1.27,.008,.015],[0,y+.048,.305]);
    }
    const bookColors=[0x645049,0x777562,0x374f4c,0x714953,0x927b53,0x41404c];
    for(let shelf=0;shelf<3;shelf++) {
      let x=-.55;
      for(let i=0;i<5;i++) {
        const width=.105+(i%3)*.017,height=.43+(i%2)*.14;
        const material=new THREE.MeshStandardMaterial({color:bookColors[(i+shelf*2)%bookColors.length],roughness:.86});
        const book=box(g,material,[width,height,.32],[x,shelf*.77+.40+height/2,.05],.01);
        // Paper block and gold spine bands ensure they read as books from every angle.
        box(book,m.paper,[width*.80,height*.91,.28],[0,0,.015]);
        for(const y of [-height*.35,height*.35])box(g,m.agedBrass,[width*.8,.012,.008],[x,shelf*.77+.40+height/2+y,.212]);
        x+=width+.025;
      }
    }
    // Stacked large folios, a lidded jar and a small bronze vessel.
    for(let i=0;i<3;i++)box(g,i===1?m.plumLinen:m.ochreLinen,[.46,.075,.33],[.34,2.73+i*.077,0],.012).rotation.y=(i-1)*.045;
    lathe(g,m.celadon,[[0,0],[.14,0],[.17,.15],[.17,.32],[.10,.37],[.1,.40],[0,.40]],[-.34,1.155,.02]);
    sphere(g,m.brass,.045,[-.34,1.59,.02],[1,.55,1]);
    vase(g,m.purpleCeramic,[.33,1.15,.04],.65);
    plantBranch(g,m,[.33,1.68,.04],.58,3);
    this.collider(4.47,-3.55,1.7,.95);
    this.shelfOwner=g;
    this.shelfLocals=[
      { y: 0.40, halfX: 0.58, halfZ: 0.24 },
      { y: 1.16, halfX: 0.58, halfZ: 0.24 },
      { y: 1.93, halfX: 0.58, halfZ: 0.24 },
      { y: 2.70, halfX: 0.58, halfZ: 0.24 },
    ];
  }

  buildTeaCorner() {
    const m=this.m;
    const table=this.region('Tea table',[-1.15,0,2.90],[0,.12,0]);
    box(table,m.lacquer,[2.20,.14,1.05],[0,.50,0],.065);
    box(table,m.brass,[2.14,.012,.99],[0,.576,0],.01);
    for(const x of [-.86,.86])for(const z of [-.34,.34]) {
      const leg=box(table,m.wood,[.14,.49,.14],[x,.255,z],.025);leg.rotation.z=x>0?-.05:.05;
      cylinder(table,m.brass,.075,.04,[x,.035,z],16);
    }
    // Woven bamboo tea tray, slatted for drainage.
    box(table,m.darkWood,[1.07,.055,.54],[-.30,.603,.0],.03);
    box(table,m.wood,[.99,.056,.46],[-.30,.626,.0],.018);
    for(let i=0;i<16;i++)box(table,m.agedBrass,[.027,.008,.43],[-.75+i*.061,.658,.0]);
    const potPosition=[-.33,.666,-.03];
    const pot=this.region('Yixing teapot',potPosition);table.add(pot);
    sphere(pot,m.purpleCeramic,.17,[0,.13,0],[1, .77, 1]);
    cylinder(pot,m.purpleCeramic,[.14,.11],.035,[0,.247,0]);
    sphere(pot,m.brass,.035,[0,.284,0],[1,.8,1]);
    cylinder(pot,m.purpleCeramic,[.055,.085],.10,[0,.219,0]);
    tube(pot,m.purpleCeramic,[[.13,.12,0],[.24,.16,0],[.31,.26,0]],.035);
    torus(pot,m.purpleCeramic,.125,.027,[-.13,.15,0],[0,0,0],Math.PI*1.6).rotation.z=-.9;
    const teaMaterial=new THREE.MeshPhysicalMaterial({color:0x5c2d10,roughness:.14,clearcoat:.5});
    for(const [x,z] of [[-.69,.19],[-.28,.25],[.12,.22]]) {
      cylinder(table,m.darkWood,.20,.022,[x,.602,z]);
      cup(table,m.celadon,[x,.62,z],.78);
      cylinder(table,teaMaterial,.098,.004,[x,.747,z]);
    }
    // A folded linen cloth and tea scoop.
    box(table,m.ochreLinen,[.43,.022,.36],[.70,.601,-.16],.015).rotation.y=.11;
    box(table,m.linen,[.34,.02,.28],[.70,.622,-.16],.015).rotation.y=.11;
    tube(table,m.wood,[[.57,.66,.17],[.70,.667,.30],[.89,.66,.36]],.018);
    sphere(table,m.wood,.047,[.90,.663,.36],[1,.24,1.35]);
    // Bowl with an orange and a sprig make the space feel inhabited.
    lathe(table,m.ceramic,[[.08,0],[.20,.07],[.22,.12],[.19,.13],[.07,.02]],[.68,.61,-.22]);
    sphere(table,new THREE.MeshStandardMaterial({color:0xb9763c,roughness:.72}),.083,[.69,.735,-.23]);
    this.addHotspot('tea','Tea ritual · 一盏清茶','Make space for a moment',[-1.15,.93,2.90]);

    const chair=this.region('Reading chair',[1.1,0,3.05],[0,-.47,0]);
    box(chair,m.darkWood,[1.08,.15,1.03],[0,.42,0],.06);
    box(chair,m.plumLinen,[1.10,.30,1.03],[0,.60,0],.10);
    box(chair,m.plumLinen,[1.09,1.14,.24],[0,1.16,-.44],.10).rotation.x=-.15;
    box(chair,m.linen,[.86,.19,.82],[0,.85,.03],.10);
    for(const x of [-.51,.51]) {
      box(chair,m.plumLinen,[.23,.53,1.04],[x,.82,0],.10);
      for(const z of [-.35,.35]) {
        box(chair,m.wood,[.09,.37,.10],[x,.20,z],.02).rotation.z=x>0?-.07:.07;
        cylinder(chair,m.brass,.055,.045,[x,.035,z],16);
      }
    }
    const pillow=box(chair,m.ochreLinen,[.47,.45,.16],[.15,1.07,-.19],.08);pillow.rotation.set(-.17,0,.17);
    for(const x of [-.41,.41])box(chair,m.wood,[.068,.095,1.08],[x,.69,0],.025);
    this.collider(1.1,3.05,1.55,1.6);
    // A narrow side table with an unlit-looking ember candle (which gently animates).
    const side=this.region('Reading side table',[2.70,0,2.72]);
    cylinder(side,m.lacquer,.40,.08,[0,.86,0]);
    cylinder(side,m.brass,.35,.014,[0,.907,0]);
    cylinder(side,m.wood,[.084,.11],.81,[0,.43,0]);
    cylinder(side,m.darkWood,.27,.055,[0,.03,0]);
    cylinder(side,m.ceramic,.115,.18,[-.09,1.02,.0]);
    this.addCandle(side,[-.09,1.12,0],.08);
    const closed=box(side,m.jadeLinen,[.33,.055,.43],[.12,.948,0],.009);closed.rotation.y=-.15;
    box(side,m.paper,[.30,.039,.39],[.12,.95,0]);
    this.collider(2.70,2.72,.87,.87);
  }

  buildDetails() {
    const m=this.m;
    // Element altar with a softly rotating orb and a ring of etched stone.
    const altar=this.region('Element orb altar',[-3.87,0,-3.60]);
    box(altar,m.darkWood,[1.30,.13,.76],[0,1.0,0],.035);
    box(altar,m.agedBrass,[1.27,.015,.73],[0,1.077,0]);
    for(const x of [-.47,.47])for(const z of [-.25,.25])box(altar,m.wood,[.105,.96,.105],[x,.50,z],.018);
    box(altar,m.wood,[1.1,.095,.095],[0,.30,0],.015);
    const orbGroup=new THREE.Group();orbGroup.position.set(0,1.64,0);altar.add(orbGroup);
    const orbMaterial=new THREE.MeshPhysicalMaterial({color:0xa68c92,emissive:0x876664,emissiveIntensity:.32,roughness:.12,metalness:.12,clearcoat:1,clearcoatRoughness:.08,transparent:true,opacity:.92});
    sphere(orbGroup,orbMaterial,.29,[0,0,0]);
    const ring1=torus(orbGroup,m.brass,.37,.008,[0,0,0],[0,0,.35]);
    const ring2=torus(orbGroup,m.brass,.37,.008,[0,0,0],[Math.PI/2,0,.35]);
    const ring3=torus(orbGroup,m.agedBrass,.38,.005,[0,0,0],[.65,.6,0]);
    const orbitDot=sphere(orbGroup,m.gold,.025,[.36,0,0]);
    cylinder(altar,m.brass,[.18,.26],.12,[0,1.13,0]);
    cylinder(altar,m.darkWood,.13,.28,[0,1.28,0]);
    makeGlow(altar,m,[0,1.64,0],0xcdafa0,1.45,.24);
    this.animated.push({type:'orb',object:orbGroup,ring1,ring2,ring3,orbitDot});
    cup(altar,m.ceramic,[.39,1.08,.07],.66);
    this.addCandle(altar,[-.40,1.09,0],.055);
    this.addHotspot('orb','Inner light · 心灯','Your intentions, made visible',[-3.87,1.94,-3.6]);
    this.collider(-3.87,-3.6,1.50,1.0);

    // Floor plant, varied leaves and visible stems.
    const plant=this.region('Indoor ficus',[4.46,0,2.03]);
    lathe(plant,m.ceramic,[[0,0],[.29,0],[.35,.10],[.38,.50],[.34,.57],[.30,.57],[.29,.50],[.25,.06]],[0,0,0]);
    cylinder(plant,m.ink,.30,.025,[0,.50,0]);
    plantBranch(plant,m,[0,.49,0],1.66,1);
    plantBranch(plant,m,[.06,.49,-.06],1.23,6);
    makeGlow(this.root,m,[4.2,1.10,1.9],0xf1b569,.8,.12);
    this.collider(4.46,2.03,.95,.95);

    // A small pile of books on the floor and a ceramic stool make it lived in.
    const floorBooks=this.region('Floor books',[-2.95,0,1.50],[0,-.15,0]);
    for(let i=0;i<3;i++) {
      const g=new THREE.Group();g.position.set(0,.12+i*.14,0);g.rotation.y=(i-1)*.10;floorBooks.add(g);
      box(g,i%2?m.plumLinen:m.jadeLinen,[.61,.12,.79],[0,0,0],.018);
      box(g,m.paper,[.55,.085,.73],[0,0,.006]);
      box(g,m.agedBrass,[.006,.09,.025],[.30,0,.26]);
    }
    const stool=this.region('Ceramic garden stool',[-2.75,0,2.68]);
    lathe(stool,m.celadon,[[0,0],[.31,0],[.32,.07],[.29,.26],[.33,.44],[.34,.55],[.28,.58],[0,.58]]);
    cylinder(stool,m.ceramic,.33,.075,[0,.59,0]);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;sphere(stool,m.brass,.018,[Math.cos(a)*.30,.47,Math.sin(a)*.30]);}
    this.collider(-2.75,2.68,.75,.75);

    // Circular entry lantern and three low step stones suggest an interior threshold.
    for(let i=0;i<3;i++)box(this.root,m.darkWood,[3.8,.05,.17],[-.2,.05,4.13-i*.17],.02);
    this.buildThreshold();

    const [a,b,c]=[[-3.27,4.0,-1.9],[2.91,4.03,-2.53],[4.56,4.11,1.98]];
    for(const [index,position] of [a,b,c].entries()) {
      const lantern=paperLantern(this.root,m,position,index===1?.39:.47,index===1?.58:.85);
      this.lanterns.push(lantern);
      makeGlow(this.root,m,position,0xf4ba6b,2.0,.22);
    }
    // Tiny suspended gold chimes at the window; they sway with the same quiet rhythm.
    const chimes=this.region('Window chimes',[-5.01,4.64,2.93]);
    cylinder(chimes,m.wood,.18,.035,[0,0,0]);
    for(let i=0;i<5;i++) {
      const a=i/5*Math.PI*2,x=Math.cos(a)*.10,z=Math.sin(a)*.10;
      rodBetween(chimes,m.ochreLinen,[x,0,z],[x,-.25-i*.027,z],.006);
      cylinder(chimes,m.brass,.014,.28,[x,-.38-i*.027,z],12);
    }
    sphere(chimes,m.brass,.035,[0,-.50,0]);
    this.animated.push({type:'chimes',object:chimes});

    // A standing lantern warms the open side of the room and balances the composition.
    const stand=this.region('Standing lantern',[3.95,0,-1.15]);
    lathe(stand,m.darkWood,[[0,0],[.16,0],[.10,.03],[.045,.10],[.045,.28]],[0,0,0]);
    rodBetween(stand,m.darkWood,[0,.26,0],[0,1.62,0],.032);
    rodBetween(stand,m.agedBrass,[0,1.62,0],[.26,1.78,0],.018);
    const standing=paperLantern(stand,m,[.34,1.52,0],.30,.34);
    this.lanterns.push(standing);
    makeGlow(stand,m,[.34,1.52,0],0xf4ba6b,1.6,.20);
    this.collider(3.95,-1.15,.5,.5);

    // A tall flower stand with a celadon vase brings a sprig of green to the back wall.
    const flowerStand=this.region('Flower stand',[-2.75,0,-3.8]);
    lathe(flowerStand,m.lacquer,[[0,0],[.20,0],[.22,.04],[.10,.10],[.07,.86],[.16,.92],[.17,1.0]],[0,0,0]);
    cylinder(flowerStand,m.lacquer,.19,.035,[0,1.02,0],28);
    vase(flowerStand,m.celadon,[0,1.04,0],.55);
    plantBranch(flowerStand,m,[0,1.30,0],.55,8);
    this.collider(-2.75,-3.8,.5,.5);
  }

  buildThreshold() {
    const m=this.m;
    // A partial carved screen at the far front-left reads as an entry, without hiding the room.
    const screen=this.region('Entry screen',[-5.02,0,3.63],[0,Math.PI/2,0]);
    frame(screen,m.darkWood,1.26,3.7,.11,.092,[0,1.93,0]);
    for(let x=-.50;x<=.5;x+=.25)box(screen,m.wood,[.027,3.48,.05],[x,1.94,0]);
    for(let y=.35;y<=3.55;y+=.32)box(screen,m.wood,[1.07,.027,.052],[0,y,0]);
    for(let y=.58;y<3.6;y+=.67)for(const x of [-.30,.30]) {
      const d=box(screen,m.wood,[.25,.022,.04],[x,y,.014]);d.rotation.z=Math.PI/4;
      const d2=box(screen,m.wood,[.25,.022,.04],[x+.13,y+.13,.014]);d2.rotation.z=-Math.PI/4;
    }
    box(screen,m.brass,[1.1,.012,.03],[0,3.7,.04]);
  }

  addCandle(parent,position,radius) {
    const m=this.m;
    cylinder(parent,m.brass,radius*1.3,.028,position);
    cylinder(parent,m.paper,[radius*.78,radius],.15,[position[0],position[1]+.08,position[2]]);
    const flame=new THREE.MeshBasicMaterial({color:0xffbe63});
    const glow=sphere(parent,flame,.033,[position[0],position[1]+.195,position[2]],[.55,1.6,.55]);
    const halo=makeGlow(parent,m,[position[0],position[1]+.195,position[2]],0xfdb055,.37,.5);
    this.candleFlames.push({flame:glow,halo,phase:Math.random()*Math.PI*2});
  }

  buildAtmosphere() {
    const m=this.m;
    // Gold dust is intentionally sparse, with no UI-confusing particles.
    const count=145,random=seededRandom(337),positions=new Float32Array(count*3),base=[];
    for(let i=0;i<count;i++) {
      const x=(random()-.5)*10.3,y=.5+random()*4.4,z=(random()-.5)*8.4;
      positions.set([x,y,z],i*3);base.push({x,y,z,phase:random()*Math.PI*2,speed:.05+random()*.06});
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const particles=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xe3c895,size:.022,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending}));
    this.root.add(particles);this.animated.push({type:'particles',object:particles,base});
    // Three drifting smoke wisps are translucent sprites, not opaque grey geometry.
    for(let i=0;i<10;i++) {
      const material=new THREE.SpriteMaterial({map:m.smoke,transparent:true,opacity:.19,depthWrite:false,color:0xc7c1b4});
      const sprite=new THREE.Sprite(material);sprite.position.set(i*.014,3.04+i*.095,-3.98);sprite.scale.set(.12+i*.013,.15+i*.015,1);this.root.add(sprite);
      this.animated.push({type:'smoke',object:sprite,index:i,baseY:3.04+i*.095});
    }
  }

  addLighting() {
    this.scene.background=new THREE.Color(0x161824);
    this.scene.fog=new THREE.FogExp2(0x1a1c26,.025);
    const hemi=new THREE.HemisphereLight(0x9788a6,0x40241c,.80);this.scene.add(hemi);
    const key=new THREE.DirectionalLight(0xffdcb0,1.35);key.position.set(2.8,8,5);key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;
    key.shadow.camera.near=.5;key.shadow.camera.far=25;key.shadow.normalBias=.035;key.shadow.bias=-.00012;
    this.scene.add(key);
    const fill=new THREE.DirectionalLight(0x8c9fc0,1.05);fill.position.set(-7,5,3);this.scene.add(fill);
    const warm=new THREE.PointLight(0xffb665,15,8,2);warm.position.set(-3.25,3.86,-1.88);warm.castShadow=false;this.scene.add(warm);
    const warm2=new THREE.PointLight(0xffbb72,14,7,2);warm2.position.set(2.91,3.9,-2.5);this.scene.add(warm2);
    const warm3=new THREE.PointLight(0xffb665,9.5,5,2);warm3.position.set(4.56,4.0,2);this.scene.add(warm3);
    const windowGlow=new THREE.PointLight(0x9dbbd4,9,6,2);windowGlow.position.set(-4.9,3.1,1.5);this.scene.add(windowGlow);
    // Broad spotlights pool light on the floor and desk, creating a volumetric feel.
    for(const [x,y,z,targetX,targetZ,power] of [[-3.25,4.00,-1.9,-2.1,-.6,32],[2.9,4.0,-2.5,1.4,-2.4,29],[4.55,4.1,2,3.4,1.4,21]]) {
      const spot=new THREE.SpotLight(0xffce8f,power,9,Math.PI/3.4,.62,1.5);spot.position.set(x,y,z);spot.target.position.set(targetX,0,targetZ);this.scene.add(spot,spot.target);
    }
    const orbLight=new THREE.PointLight(0xd0a4a0,2.1,2.4,2);orbLight.position.set(-3.87,1.65,-3.59);this.scene.add(orbLight);
    this.lights={hemi,key,fill,warm,warm2,warm3,windowGlow,orbLight};
  }

  /** Deep sky behind the open diorama: stars, a gold nebula, slow drift. */
  buildSky() {
    const size=1024;
    const canvas=document.createElement('canvas');
    canvas.width=size;canvas.height=size;
    const g=canvas.getContext('2d');
    g.fillStyle='#07060f';
    g.fillRect(0,0,size,size);
    const nebula=g.createRadialGradient(680,420,20,680,420,380);
    nebula.addColorStop(0,'rgba(212,176,106,0.55)');
    nebula.addColorStop(0.45,'rgba(120,72,28,0.22)');
    nebula.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=nebula;g.fillRect(0,0,size,size);
    const cool=g.createRadialGradient(240,700,10,240,700,280);
    cool.addColorStop(0,'rgba(90,110,180,0.28)');
    cool.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=cool;g.fillRect(0,0,size,size);
    const random=seededRandom(19);
    for (let i=0;i<900;i++) {
      const x=random()*size,y=random()*size,r=random()*1.4+0.2;
      g.fillStyle=`rgba(251,245,183,${0.25+random()*0.75})`;
      g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
    }
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    this.sky=new THREE.Mesh(
      new THREE.SphereGeometry(42,48,32),
      new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false}),
    );
    this.scene.add(this.sky);
    const count=420;
    const positions=new Float32Array(count*3);
    const base=[];
    const dust=seededRandom(91);
    for (let i=0;i<count;i++) {
      const radius=6+dust()*8;
      const angle=dust()*Math.PI*2;
      const y=dust()*6;
      const x=Math.cos(angle)*radius;
      const z=Math.sin(angle)*radius*0.6;
      positions.set([x,y,z],i*3);
      base.push({x,y,z,phase:dust()*Math.PI*2,speed:0.04+dust()*0.08});
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const stars=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xf6e2a8,size:0.045,transparent:true,opacity:0.85,depthWrite:false,blending:THREE.AdditiveBlending}));
    this.scene.add(stars);
    this.animated.push({type:'cosmos',object:stars,base});
    if (this.scene.fog) this.scene.fog.density=0.016;
  }

  /** Two chart objects. The glowing marker is the click target; the mesh is the thing you see. */
  buildChartObjects() {
    const m=this.m;
    const bazi=this.region('BaZi calendar',[ -2.05, 0, -0.15 ]);
    box(bazi,m.darkWood,[.72,.08,.48],[0,.78,0],.02);
    for (const x of [-.28,.28]) for (const z of [-.16,.16]) box(bazi,m.wood,[.06,.74,.06],[x,.38,z],.01);
    box(bazi,m.paper,[.46,.02,.32],[0,.83,0]);
    box(bazi,m.ink,[.02,.22,.28],[-.08,.94,.02]);
    box(bazi,m.ochreLinen,[.18,.012,.26],[.1,.845,.02],.004).rotation.y=.2;
    rodBetween(bazi,m.wood,[-.05,.86,.16],[.22,.98,.05],.012);
    cylinder(bazi,m.ink,[.008,.02],.05,[.24,.99,.04],8);
    this.addHotspot('bazi','八字 · 探索四柱与人生节律','探索四柱与人生节律',[-2.05,1.15,-0.15]);
    this.collider(-2.05,-0.15,.9,.7);

    const star=this.region('Ziwei star map',[1.35,0,.85]);
    cylinder(star,m.darkWood,.46,.08,[0,.82,0]);
    cylinder(star,m.agedBrass,.38,.02,[0,.87,0]);
    const disc=mesh(new THREE.CircleGeometry(.34,48),new THREE.MeshStandardMaterial({color:0x1a2438,roughness:.45,metalness:.35}),star,[0,.89,0],[-Math.PI/2,0,0]);
    disc.name='star-disc';
    torus(star,m.brass,.3,.008,[0,.9,0],[Math.PI/2,0,0]);
    torus(star,m.gold,.18,.006,[0,.91,0],[Math.PI/2,.4,0]);
    const random=seededRandom(71);
    for (let i=0;i<14;i++) {
      const angle=random()*Math.PI*2;
      const radius=.06+random()*.22;
      sphere(star,i%3?m.gold:m.brass,.012+random()*.01,[Math.cos(angle)*radius,.915,Math.sin(angle)*radius]);
    }
    cylinder(star,m.wood,[.07,.08],.78,[0,.4,0]);
    this.starDisc=disc;
    this.addHotspot('ziwei','紫微 · 查看十二宫与星曜关系','查看十二宫与星曜关系',[1.35,1.22,.85]);
    this.collider(1.35,.85,.95,.95);
  }

  setAccent(color) {
    const tint=new THREE.Color(color);
    for (const hotspot of this.hotspotData) {
      hotspot.ring.material.color.copy(tint);
      hotspot.halo.material.color.copy(tint);
    }
    if (this.starDisc) this.starDisc.material.color.set(0x1a2438).lerp(tint, .45);
  }

  addHotspot(id,title,description,position,options={}) {
    const bilingualTitle=title;
    const group=new THREE.Group();group.position.set(...position);this.root.add(group);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.065,.088,32),new THREE.MeshBasicMaterial({color:0xf5d9a3,transparent:true,opacity:.88,side:THREE.DoubleSide,depthTest:false}));
    group.add(ring);
    const core=new THREE.Mesh(new THREE.CircleGeometry(.021,20),new THREE.MeshBasicMaterial({color:0xfff0c6,depthTest:false}));core.position.z=.002;group.add(core);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:this.m.glow,color:0xefbe72,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false}));halo.scale.set(.47,.47,1);halo.position.z=-.01;group.add(halo);
    group.userData={hotspot:id,title:bilingualTitle,description};
    const hit=new THREE.Mesh(new THREE.SphereGeometry(.17,12,8),new THREE.MeshBasicMaterial({visible:false}));group.add(hit);
    group.traverse(child=>child.userData.hotspot=id);
    this.clickables.push(group);this.hotspotData.push({id,title:bilingualTitle,description,group,ring,core,halo,compact:options.compact,base:group.position.clone()});
  }


  setHotspotsVisible(visible) {
    this.hotspotData.forEach(h=>h.group.visible=visible);
  }

  update(seconds, camera) {
    this.hotspotData.forEach((h,index)=>{
      h.ring.quaternion.copy(camera.quaternion);h.core.quaternion.copy(camera.quaternion);
      const pulse=1+Math.sin(seconds*1.6+index)*.12;h.ring.scale.setScalar(pulse);
      h.halo.material.opacity=.26+Math.sin(seconds*1.6+index)*.09;
      h.group.position.y=h.base.y+Math.sin(seconds*.9+index)*.022;
    });
    this.lanterns.forEach(({tassel},i)=>{tassel.rotation.z=Math.sin(seconds*.65+i*1.7)*.035;tassel.rotation.x=Math.cos(seconds*.53+i)*.025;});
    this.animated.forEach(item=>{
      if(item.type==='orb') {
        item.ring1.rotation.y=seconds*.20;item.ring2.rotation.z=seconds*.13;item.ring3.rotation.x=.65+Math.sin(seconds*.3)*.15;
        item.orbitDot.position.set(Math.cos(seconds*.65)*.37,Math.sin(seconds*.65)*.37,0);
        item.object.position.y=1.64+Math.sin(seconds*1.3)*.018;
      } else if(item.type==='chimes') {
        item.object.rotation.z=Math.sin(seconds*.8)*.02;
      } else if(item.type==='particles') {
        const positions=item.object.geometry.attributes.position;
        item.base.forEach((p,i)=>{positions.setXYZ(i,p.x+Math.sin(seconds*.12+p.phase)*.18,(p.y+seconds*p.speed)%4.8+.15,p.z+Math.cos(seconds*.1+p.phase)*.14);});positions.needsUpdate=true;
      } else if(item.type==='cosmos') {
        const positions=item.object.geometry.attributes.position;
        item.base.forEach((p,i)=>{
          const angle=seconds*p.speed+p.phase;
          positions.setXYZ(i,p.x+Math.cos(angle)*0.35,p.y+Math.sin(seconds*0.2+p.phase)*0.25,p.z+Math.sin(angle)*0.35);
        });
        positions.needsUpdate=true;
      } else if(item.type==='smoke') {
        item.object.position.x=Math.sin(seconds*.55-item.index*.3)*(.035+item.index*.009);
        item.object.position.y=item.baseY+Math.sin(seconds*.3+item.index)*.027;
        item.object.material.opacity=.085+Math.sin(seconds*.5+item.index)*.022;
      }
    });
    for (const prop of this.props) {
      const strings=prop.group.userData.strings;
      if (!strings) continue;
      for (const string of strings) {
        if (!string.userData.pluck) continue;
        string.userData.pluck=Math.max(0, string.userData.pluck-0.016);
        string.position.y=0.325+Math.sin(seconds*28+string.userData.string)*string.userData.pluck;
      }
    }
    if (this.sky) this.sky.rotation.y=seconds*0.012;
    this.candleFlames.forEach(({flame,halo,phase})=>{
      flame.scale.y=1.5+Math.sin(seconds*7.7+phase)*.2;
      halo.material.opacity=.37+Math.sin(seconds*6+phase)*.09;
    });
    // Keep only a restrained natural fluctuation, avoiding a nightclub effect.
    this.lights.warm.intensity=15+Math.sin(seconds*2.2)*.18;
    this.lights.warm2.intensity=14+Math.sin(seconds*1.8+1)*.15;
  }

  /** Batch only immutable room meshes; never merge animated or interactive hierarchies. */
  optimizeStaticGeometry() {
    this.root.updateMatrixWorld(true);
    const dynamic=new Set([this.wallDoor?.root,...this.animated.map(item=>item.object),...this.lanterns.map(item=>item.tassel),...this.hotspotData.map(item=>item.group),...this.candleFlames.map(item=>item.flame),...this.keepLive]);
    const batches=new Map(),remove=[];
    const candidate=object=>{
      if(!object.isMesh||!object.geometry||Array.isArray(object.material))return false;
      if(object.material.visible===false||object.userData.hotspot)return false;
      let current=object;
      while(current&&current!==this.root){if(dynamic.has(current)||!current.visible)return false;current=current.parent;}
      const attributes=Object.entries(object.geometry.attributes).map(([name,a])=>`${name}:${a.itemSize}:${a.normalized}:${a.array.constructor.name}`).sort().join(',');
      return `${object.material.uuid}:${attributes}:${Boolean(object.geometry.index)}`;
    };
    this.root.traverse(object=>{
      const key=candidate(object);if(!key)return;
      const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);
      // BufferGeometryUtils needs exactly matching attributes + indexed state per bucket.
      if(!batches.has(key))batches.set(key,{material:object.material,geometries:[],source:[],castShadow:false,receiveShadow:false});
      const batch=batches.get(key);batch.geometries.push(geometry);batch.source.push(object);batch.castShadow ||= object.castShadow;batch.receiveShadow ||= object.receiveShadow;remove.push(object);
    });
    const mergedSources=new Set();
    let mergedCount=0,sourceCount=0;
    for(const batch of batches.values()) {
      if(batch.geometries.length<2){batch.geometries.forEach(g=>g.dispose());continue;}
      const geometry=mergeGeometries(batch.geometries,false);
      if(!geometry){console.warn('DAORA static batch skipped incompatible geometry');batch.geometries.forEach(g=>g.dispose());continue;}
      sourceCount+=batch.source.length;
      batch.source.forEach(object=>mergedSources.add(object));
      batch.geometries.forEach(g=>g.dispose());
      const object=new THREE.Mesh(geometry,batch.material);object.name='Static sanctuary detail';object.castShadow=batch.castShadow;object.receiveShadow=batch.receiveShadow;this.root.add(object);mergedCount++;
    }
    // Remove ONLY originals whose exact merge succeeded, never a skipped bucket.
    remove.forEach(object=>{if(mergedSources.has(object))object.removeFromParent();});
    this.staticBatchStats={mergedCount,sourceCount};
  }

  /** Furniture that can be touched and dragged. Walls, floor and beams stay put. */
  tagLiving() {
    const specs={
      'Velvet lounge':{id:'sofa',action:'hint',hintZh:'软榻。点一下看一句，按住可以拖到别处。',hintEn:'The lounge. Tap for a note, drag to move it.'},
      'Scholar desk':{id:'desk',action:'hint',hintZh:'书案。拖动时会贴住地面。',hintEn:'The desk. It settles on the floor when you drag it.'},
      'Study chair':{id:'study-chair',action:'hint',hintZh:'椅子。可以挪开再坐下看。',hintEn:'The chair. Move it, then look again.'},
      'Curio bookshelf':{id:'shelf',action:'book',hintZh:'架上的书可以打开，是一本答案之书。',hintEn:'The books open. This one is a book of answers.'},
      'Tea table':{id:'tea-table',action:'hint',hintZh:'茶案。拖一拖，仍贴着地面。',hintEn:'The tea table. Drag it; it stays on the floor.'},
      'Reading chair':{id:'reading-chair',action:'hint',hintZh:'读椅。',hintEn:'The reading chair.'},
      'Reading side table':{id:'side-table',action:'hint',hintZh:'边几与烛。',hintEn:'A side table and a candle.'},
      'Element orb altar':{id:'altar',action:'hint',hintZh:'心灯的台子。',hintEn:'The stand of the inner light.'},
      'Indoor ficus':{id:'ficus',action:'hint',hintZh:'一盆木。水木旺时，房间还会再添一盆。',hintEn:'A wooden plant. A strong wood or water chart adds another.'},
      'Floor books':{id:'floor-books',action:'book',hintZh:'地上的书。打开是答案之书。',hintEn:'Books on the floor. Open them for an answer.'},
      'Ceramic garden stool':{id:'stool',action:'hint',hintZh:'瓷凳。',hintEn:'A ceramic stool.'},
      'Singing bowl':{id:'bowl',action:'bowl',hintZh:'铜磬。打开声音后，点一下会响。',hintEn:'A bowl. With sound on, a tap rings it.'},
      'Window chimes':{id:'chimes',action:'hint',hintZh:'窗边的铃。',hintEn:'Chimes by the window.'},
      'Standing lantern':{id:'standing-lantern',action:'hint',hintZh:'落地的灯。可以挪到喜欢的角落。',hintEn:'A floor lantern. Move it where it feels right.'},
      'Flower stand':{id:'flower-stand',action:'hint',hintZh:'花几。一枝春色。',hintEn:'A flower stand with a sprig of green.'},
      'BaZi calendar':{id:'bazi-desk',action:'hint',hintZh:'八字的小案。光点另开命盘。',hintEn:'The small BaZi stand. The glowing mark opens the chart.'},
      'Ziwei star map':{id:'ziwei-map',action:'hint',hintZh:'紫微的星盘。光点另开十二宫。',hintEn:'The Zi Wei disc. The glowing mark opens the palaces.'},
      'Landscape scroll':{id:'painting',action:'hint',hintZh:'一幅山水。',hintEn:'A landscape scroll.'},
      'Stillness scroll':{id:'calligraphy',action:'hint',hintZh:'静的字。',hintEn:'A scroll about stillness.'},
    };
    for (const child of [...this.root.children]) {
      const spec=specs[child.name];
      if (!spec) continue;
      this.registerProp(child, spec);
    }
    this.restoreLayout();
  }

  registerProp(group, spec) {
    const record={
      id:spec.id,
      kind:spec.kind||spec.id,
      action:spec.action||'hint',
      variant:spec.variant||null,
      hintZh:spec.hintZh||'',
      hintEn:spec.hintEn||'',
      group,
      home:group.position.clone(),
    };
    group.userData.propId=record.id;
    group.traverse((child)=>{ child.userData.propId=record.id; if (spec.action==='book') child.userData.action='book'; });
    this.keepLive.add(group);
    this.props.push(record);
    return record;
  }

  worldShelves() {
    if (!this.shelfOwner) return [];
    const origin=this.shelfOwner.position;
    return this.shelfLocals.map((shelf)=>({
      y:origin.y+shelf.y,
      minX:origin.x-shelf.halfX,
      maxX:origin.x+shelf.halfX,
      minZ:origin.z-shelf.halfZ,
      maxZ:origin.z+shelf.halfZ,
    }));
  }

  restoreLayout(storage=globalThis.localStorage) {
    if (!storage) return;
    const layout=readLayout(storage);
    for (const prop of this.props) {
      const saved=layout[prop.id];
      if (!saved) continue;
      prop.group.position.set(saved.x, saved.y, saved.z);
    }
  }

  rememberLayout(storage=globalThis.localStorage) {
    if (!storage) return;
    const layout=readLayout(storage);
    for (const prop of this.props) {
      layout[prop.id]={x:prop.group.position.x,y:prop.group.position.y,z:prop.group.position.z};
    }
    try { writeLayout(layout, storage); } catch { /* private mode */ }
  }

  /**
   * Replace chart furnishings. The palette is not applied here;
   * the strongest element still reaches the room through setElementTheme.
   */
  applyFurnishings(plan, storage=globalThis.localStorage) {
    for (const prop of [...this.props]) {
      if (!String(prop.id).startsWith('furnish-')) continue;
      prop.group.removeFromParent();
      this.keepLive.delete(prop.group);
      this.props=this.props.filter((item)=>item!==prop);
    }
    const spots={
      books:[2.35,0,1.55],
      qin:[0.15,0,2.35],
      treasure:[-1.15,0,2.15],
      seal:[1.35,0,2.05],
      travel:[-0.85,0,1.15],
      plants:[-2.15,0,1.85],
      water:[1.85,0,2.45],
      scroll:[-2.55,0,0.55],
      incense:[-2.35,0,-1.6],
    };
    for (const entry of plan?.items||[]) {
      const group=createPropModel(entry.id, entry.variant);
      const spot=spots[entry.id]||[0,0,0];
      group.position.set(spot[0], spot[1], spot[2]);
      group.scale.setScalar(entry.id==='qin'?1.35:1.7);
      if (entry.id==='qin') group.rotation.y=0.5;
      this.root.add(group);
      this.registerProp(group,{
        id:`furnish-${entry.id}`,
        kind:entry.id,
        variant:entry.variant,
        action:entry.id==='qin'?'qin':entry.id==='books'?'book':'hint',
        hintZh:`${entry.labelZh}。${entry.hintZh}`,
        hintEn:`${entry.labelEn}. ${entry.hintEn}`,
      });
    }
    this.restoreLayout(storage);
  }

  pluckQin() {
    const prop=this.props.find((item)=>item.action==='qin');
    if (!prop) return;
    const strings=prop.group.userData.strings||[];
    strings.forEach((string,index)=>{
      string.position.y=0.36;
      string.userData.pluck=0.18+index*0.05;
    });
  }

  canWalkTo(x,z) {
    if(x< -5.05||x>5.04||z< -4.03||z>4.08)return false;
    return !this.colliders.some(c=>x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ);
  }
}
