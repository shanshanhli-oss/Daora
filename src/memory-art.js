import * as THREE from 'three';
import { seededRandom } from './materials.js';
import { box, cylinder, sphere, torus, mesh, makeGlow } from './geometry.js';

const TAU = Math.PI * 2;

function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  return texture;
}

function grain(ctx, w, h, seed, amount = 7500) {
  const random = seededRandom(seed);
  for (let i = 0; i < amount; i++) {
    ctx.fillStyle = `rgba(235,215,175,${random() * .036})`;
    ctx.fillRect(random() * w, random() * h, .5 + random(), .5 + random());
  }
}

/** Original mini-artworks, not copies of the reference or network image assets. */
export function memoryTexture(kind, index = 0, label = '') {
  return canvasTexture(640, 448, (ctx, w, h) => {
    const random = seededRandom(179 + index * 287);
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#101921'); gradient.addColorStop(1, '#483234');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    const line = (color, width = 1) => { ctx.strokeStyle = color; ctx.lineWidth = width; };
    const circle = (x, y, r, color, fill = false) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
      if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.stroke(); }
    };
    if (kind === 'landscape' || kind === 'river') {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, kind === 'river' ? '#162f42' : '#423445');
      sky.addColorStop(.52, '#c09363'); sky.addColorStop(1, '#b69e78');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      circle(455, 120, 52, 'rgba(250,220,159,.65)', true);
      ctx.fillStyle = 'rgba(249,215,150,.05)'; ctx.fillRect(380, 0, 160, 400);
      for (let layer = 0; layer < 5; layer++) {
        ctx.fillStyle = `rgba(24,42,42,${.20 + layer * .155})`;
        ctx.beginPath(); ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 18) {
          const y = h * (.42 + layer * .12) + Math.sin(x * .008 + layer * 1.6) * 43 + random() * 40;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h); ctx.fill();
      }
      if (kind === 'river') {
        ctx.beginPath(); ctx.moveTo(w * .67, h * .61); ctx.bezierCurveTo(w * .21, h * .69, w * .84, h * .81, w * .32, h);
        ctx.lineTo(w * .80, h); ctx.bezierCurveTo(w * .90, h * .84, w * .51, h * .83, w * .71, h * .61); ctx.closePath();
        ctx.fillStyle = 'rgba(134,171,169,.68)'; ctx.fill();
        for (let i = 0; i < 35; i++) {
          line(`rgba(228,205,155,${.1 + random() * .25})`);
          const y = h * .72 + random() * h * .25, x = random() * w * .5 + w * .25;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 15 + random() * 60, y); ctx.stroke();
        }
      }
      for (let i = 0; i < 7; i++) {
        const x = 80 + random() * 240, y = 83 + random() * 60;
        line('rgba(41,43,42,.58)', 2); ctx.beginPath(); ctx.arc(x - 5, y, 6, Math.PI * 1.1, Math.PI * 1.85); ctx.arc(x + 6, y, 6, Math.PI * 1.15, Math.PI * 1.9); ctx.stroke();
      }
    } else if (kind === 'map') {
      ctx.fillStyle = '#102631'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(104,153,159,.12)'; ctx.lineWidth = .7;
      for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(77,110,92,.64)' : 'rgba(62,97,92,.70)';
        ctx.beginPath(); const cx = random() * w, cy = random() * h, radius = 70 + random() * 95;
        for (let a = 0; a < TAU; a += .13) {
          const r = radius * (.56 + random() * .46), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .68;
          if (!a) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill();
      }
      const cities = [[70,329],[190,111],[276,243],[419,102],[481,269],[552,171]];
      line('#c5ab72', 2); ctx.setLineDash([4, 6]); ctx.beginPath(); cities.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke(); ctx.setLineDash([]);
      cities.forEach(([x,y],i) => { circle(x,y,4,'#e5ca8b',true);circle(x,y,10,'rgba(212,174,111,.34)');if(i===cities.length-1)circle(x,y,19,'rgba(217,172,100,.25)'); });
      for(let i=0;i<95;i++)circle(random()*w,random()*h,random()*.8+.4,'rgba(210,208,180,.6)',true);
    } else if (kind === 'neural') {
      const core = ctx.createRadialGradient(w/2,h/2,4,w/2,h/2,240);
      core.addColorStop(0,'#74504e');core.addColorStop(.35,'#293a4a');core.addColorStop(1,'#120f1b');ctx.fillStyle=core;ctx.fillRect(0,0,w,h);
      const points=[];
      for(let i=0;i<57;i++){
        const a=random()*TAU,r=20+random()*175;points.push([w/2+Math.cos(a)*r*1.28,h/2+Math.sin(a)*r*.85]);
      }
      points.forEach(([x,y],i)=>{
        points.slice(i+1).forEach(([xx,yy],j)=>{
          const distance=Math.hypot(xx-x,yy-y);
          if(distance<78){line(j%3?'rgba(103,177,180,.16)':'rgba(222,168,107,.23)',.7);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();}
        });
        circle(x,y,1.3+random()*2,i%3?'#99bcb0':'#e2b875',true);
      });
      circle(w/2,h/2,29,'rgba(232,200,139,.72)');circle(w/2,h/2,9,'#ead1a0',true);
    } else if (kind === 'calligraphy') {
      ctx.fillStyle='#1a171c';ctx.fillRect(0,0,w,h);
      for(let i=0;i<80;i++){line(`rgba(138,169,161,${random()*.12})`);ctx.beginPath();ctx.moveTo(w/2,h/2);const a=random()*TAU;ctx.lineTo(w/2+Math.cos(a)*400,h/2+Math.sin(a)*400);ctx.stroke();}
      circle(w/2,h/2,167,'rgba(193,153,92,.46)');circle(w/2,h/2,162,'rgba(110,152,140,.2)');
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='235px "Noto Serif CJK SC", serif';ctx.fillStyle='#dbc69a';ctx.fillText('归',w/2,h/2+10);
      ctx.font='16px Georgia,serif';ctx.letterSpacing='6px';ctx.fillStyle='#a58963';ctx.fillText('R  E  T  U  R  N',w/2,h-28);
      ctx.fillStyle='#985439';ctx.fillRect(w*.75,h*.71,24,24);
    } else if (kind === 'pavilion') {
      const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#182c3c');sky.addColorStop(.65,'#bd9261');sky.addColorStop(1,'#ecd2a0');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      circle(152,114,48,'rgba(249,223,164,.8)',true);
      ctx.fillStyle='#253331';ctx.fillRect(70,341,520,34);ctx.fillRect(101,287,440,35);
      for(const yy of [168,258]){
        ctx.beginPath();ctx.moveTo(128,yy+18);ctx.quadraticCurveTo(68,yy+22,63,yy+10);ctx.quadraticCurveTo(83,yy+2,112,yy+3);ctx.lineTo(192,yy-42);ctx.lineTo(450,yy-42);ctx.lineTo(528,yy+3);ctx.quadraticCurveTo(557,yy+2,579,yy+10);ctx.quadraticCurveTo(571,yy+22,514,yy+18);ctx.closePath();ctx.fill();
        ctx.fillRect(164,yy+19,311,10);
        line('#b49b63',2);ctx.beginPath();ctx.moveTo(99,yy+6);ctx.lineTo(537,yy+6);ctx.stroke();
      }
      for(const x of [173,244,321,398,470])ctx.fillRect(x,196,12,123);
      line('rgba(223,195,135,.6)',2);for(let y=367;y<h;y+=9){ctx.beginPath();ctx.moveTo(180,y);ctx.lineTo(480,y+random()*4);ctx.stroke();}
    } else if (kind === 'topography') {
      ctx.fillStyle='#233a39';ctx.fillRect(0,0,w,h);
      for(let layer=0;layer<20;layer++){
        ctx.beginPath();const r=21+layer*17;
        for(let a=0;a<=TAU+.01;a+=.04){
          const rr=r+Math.sin(a*3+layer*.08)*17+Math.cos(a*5+layer*.11)*14;
          const x=w*.53+Math.cos(a)*rr*1.30,y=h*.57+Math.sin(a)*rr*.69;
          if(!a)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.closePath();line(`rgba(197,180,128,${.13+layer*.009})`,1.1);ctx.stroke();
      }
      circle(421,260,9,'#d9b880',true);line('rgba(220,194,138,.55)');ctx.beginPath();ctx.moveTo(421,260);ctx.lineTo(474,209);ctx.stroke();
      ctx.font='14px Georgia,serif';ctx.fillStyle='#c3b48d';ctx.fillText('N',55,70);ctx.beginPath();ctx.moveTo(55,82);ctx.lineTo(55,110);ctx.stroke();
    } else if (kind === 'breath') {
      const g=ctx.createRadialGradient(w/2,h/2,10,w/2,h/2,235);g.addColorStop(0,'#897654');g.addColorStop(.22,'#534448');g.addColorStop(1,'#121b27');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      for(let i=0;i<8;i++){ctx.lineWidth=.5+i*.15;circle(w/2,h/2,36+i*20,i%2?'rgba(138,179,172,.27)':'rgba(226,195,131,.31)');}
      ctx.beginPath();ctx.moveTo(320,148);ctx.bezierCurveTo(290,138,274,156,275,179);ctx.lineTo(264,238);ctx.bezierCurveTo(208,261,181,303,181,365);ctx.lineTo(462,365);ctx.bezierCurveTo(460,303,433,260,377,238);ctx.lineTo(365,179);ctx.bezierCurveTo(366,154,348,138,320,148);line('rgba(230,203,149,.75)',2);ctx.stroke();
      circle(320,272,10,'#e6bd83',true);
      for(let i=0;i<80;i++)circle(random()*w,random()*h,random()*1.1,'rgba(225,195,142,.6)',true);
    } else if (kind === 'lotus') {
      ctx.fillStyle='#22252c';ctx.fillRect(0,0,w,h);
      line('rgba(139,160,142,.5)',3);ctx.beginPath();ctx.moveTo(315,376);ctx.bezierCurveTo(340,286,308,282,314,179);ctx.stroke();
      for(let i=0;i<13;i++){
        const a=i/13*TAU, cx=315+Math.cos(a)*51,cy=217+Math.sin(a)*20;
        ctx.save();ctx.translate(cx,cy);ctx.rotate(a+Math.PI/2);
        const petal=ctx.createLinearGradient(0,-64,0,48);petal.addColorStop(0,'#c09b84');petal.addColorStop(1,'#625457');ctx.fillStyle=petal;
        ctx.beginPath();ctx.moveTo(0,45);ctx.bezierCurveTo(-47,7,-24,-41,0,-68);ctx.bezierCurveTo(24,-41,47,7,0,45);ctx.fill();
        line('rgba(227,194,132,.43)',.8);ctx.stroke();ctx.restore();
      }
      ctx.fillStyle='#d1ad70';ctx.beginPath();ctx.ellipse(315,218,29,15,0,0,TAU);ctx.fill();
      ctx.beginPath();ctx.ellipse(180,314,76,21,-.2,0,TAU);line('#689185',1.5);ctx.stroke();
      ctx.beginPath();ctx.ellipse(437,341,89,27,.2,0,TAU);ctx.stroke();
    } else {
      const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#171c31');sky.addColorStop(.65,'#536f72');sky.addColorStop(1,'#d7ac7d');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      circle(386,182,42,'#dec793',true);
      for(let i=0;i<6;i++){
        ctx.beginPath();ctx.moveTo(0,h*.6+i*20);for(let x=0;x<=w;x+=20)ctx.lineTo(x,h*.55+i*20+Math.sin(x*.018+i)*18);ctx.lineTo(w,h);line(`rgba(29,43,50,${.11+i*.08})`,6+i*3);ctx.stroke();
      }
      for(let i=0;i<60;i++)circle(random()*w,random()*h*.6,random()*.9,'#d2d4bb',true);
    }
    // Restrained border and tiny archival numbering; no QR code, reference caption or promotional copy.
    line('rgba(238,208,153,.25)',1);ctx.strokeRect(11,11,w-22,h-22);
    ctx.font='12px Georgia, serif';ctx.fillStyle='rgba(232,206,158,.75)';ctx.fillText(label || String(index + 1).padStart(2, '0'), 25, h - 19);
    const vignette=ctx.createRadialGradient(w/2,h/2,60,w/2,h/2,410);vignette.addColorStop(0,'rgba(8,8,13,0)');vignette.addColorStop(1,'rgba(8,8,13,.27)');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
    grain(ctx,w,h,47+index,4200);
  });
}

function doorwayTexture(index) {
  return canvasTexture(256,448,(ctx,w,h)=>{
    const gradient=ctx.createLinearGradient(0,0,w,h);
    gradient.addColorStop(0,'#fff0c8');gradient.addColorStop(.42,'#eac685');gradient.addColorStop(1,'#91604e');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    const glow=ctx.createRadialGradient(w*.60,h*.35,3,w*.60,h*.35,150);glow.addColorStop(0,'rgba(255,255,228,.98)');glow.addColorStop(1,'rgba(255,250,215,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='rgba(63,62,52,.34)';ctx.beginPath();ctx.moveTo(0,h*.74);for(let x=0;x<=w;x+=15)ctx.lineTo(x,h*.66+Math.sin(x*.07+index)*12);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
    ctx.fillStyle='rgba(67,72,58,.42)';ctx.beginPath();ctx.moveTo(0,h*.87);for(let x=0;x<=w;x+=14)ctx.lineTo(x,h*.78+Math.sin(x*.05+1)*12);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
    ctx.fillStyle='rgba(255,243,192,.85)';ctx.beginPath();ctx.arc(w*.72,h*.28,13,0,TAU);ctx.fill();
    // Light coming over a distant threshold offers depth behind the leaf.
    ctx.fillStyle='rgba(103,63,36,.35)';ctx.fillRect(0,h*.93,w,h*.07);
  });
}

export function createMemoryMaterials() {
  return {
    ivory: new THREE.MeshPhysicalMaterial({color:0xd8d3c5,roughness:.46,metalness:.01,clearcoat:.12}),
    molding: new THREE.MeshStandardMaterial({color:0xf0e8d7,roughness:.37}),
    recess: new THREE.MeshStandardMaterial({color:0x918e87,roughness:.63}),
    panel: new THREE.MeshPhysicalMaterial({color:0xbfb9aa,roughness:.5,clearcoat:.10}),
    backing: new THREE.MeshPhysicalMaterial({color:0x101019,roughness:.27,metalness:.65,clearcoat:.35}),
    bronze: new THREE.MeshStandardMaterial({color:0x957759,roughness:.3,metalness:.77}),
    luminous: new THREE.MeshBasicMaterial({color:0xffdeb0,transparent:true,opacity:.10,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}),
  };
}

export function createDoor(materials, m, index, open) {
  const group=new THREE.Group();group.name=`Memory portal ${index+1}`;
  const w=.81,h=1.44,frameWidth=.054;
  // A real opening: jambs, moulded lintel, door leaf, inset panels and small hardware.
  box(group,m.backing,[w+.08,h+.045,.10],[0,0,-.068],.008);
  const portalMaterial=new THREE.MeshBasicMaterial({map:doorwayTexture(index),color:0xffe0ad,transparent:true,opacity:1,toneMapped:false});
  const opening=box(group,portalMaterial,[w-.07,h-.07,.004],[0,0,-.005]);opening.castShadow=false;opening.receiveShadow=false;
  for(const x of [-w/2+frameWidth/2,w/2-frameWidth/2]) {
    box(group,materials.ivory,[frameWidth,h,.085],[x,0,.033],.008);
    box(group,materials.molding,[.019,h-.06,.029],[x-Math.sign(x)*.032,0,.083],.005);
  }
  box(group,materials.ivory,[w,.071,.089],[0,h/2-.035,.034],.01);
  box(group,materials.ivory,[w,.06,.084],[0,-h/2+.03,.038],.008);
  box(group,materials.molding,[w+.025,.020,.12],[0,h/2+.016,.031],.005);
  box(group,materials.bronze,[w-.075,.011,.012],[0,-h/2+.075,.057]);
  const hinge=new THREE.Group();hinge.position.set(-w/2+.07,0,.064);group.add(hinge);
  const leafWidth=w-.132,leafHeight=h-.10;
  hinge.rotation.y=open?-.52-(index%2)*.18:-.018;
  box(hinge,materials.ivory,[leafWidth,leafHeight,.048],[leafWidth/2,0,.012],.009);
  for(const x of [leafWidth*.25,leafWidth*.75])for(const [y,height] of [[.245,.47],[-.335,.375]]) {
    const width=.231;
    box(hinge,materials.recess,[width,height,.007],[x,y,.039],.005);
    box(hinge,materials.panel,[width-.014,height-.014,.012],[x,y,.046],.005);
    // Soft routed bevel around all four sides of each raised panel.
    for(const sign of [-1,1]){
      const bevel=box(hinge,materials.molding,[width+.005,.008,.007],[x,y+sign*height/2,.050]);
      const bevelSide=box(hinge,materials.molding,[.007,height,.007],[x+sign*width/2,y,.050]);
    }
  }
  box(hinge,materials.bronze,[.026,.099,.009],[leafWidth-.05,-.025,.058],.005);
  sphere(hinge,materials.bronze,.021,[leafWidth-.046,-.025,.081],[1,1,.9]);
  for(const y of [-.43,.43]){
    const pin=cylinder(hinge,materials.bronze,.008,.072,[0,y,.024],8);pin.castShadow=false;
  }
  const glow=makeGlow(group,m,[.07,0,.09],0xffd28b,1.28,open?.48:.12);glow.scale.y=1.74;
  // A very faint inward-facing light wedge evokes volume cheaply, without postprocessing.
  const beam=mesh(new THREE.PlaneGeometry(w*.70,h*.82),materials.luminous,group,[.055,0,.12]);
  beam.castShadow=false;beam.receiveShadow=false;
  const lightMaterial={portalMaterial,glow,beam,open};group.userData.lightMaterial=lightMaterial;
  return {group,lightMaterial};
}

export function createFrame(m, materials, texture, index) {
  const group=new THREE.Group();group.name=`Journey memory ${index+1}`;
  const w=index%4===0?.93:.81,h=index%4===0?.65:.56;
  box(group,materials.backing,[w+.070,h+.070,.047],[0,0,-.032],.012);
  box(group,m.paper,[w+.025,h+.025,.006],[0,0,-.003]);
  // Painted screens need no second shadow-map draw: the dark backing and frame already provide depth.
  const screenMaterial=new THREE.MeshBasicMaterial({map:texture,color:0xc3b8ac,toneMapped:true});
  const screen=box(group,screenMaterial,[w,h,.008],[0,0,.014]);screen.castShadow=false;
  box(group,m.bronze,[w+.08,.016,.062],[0,h/2+.021,.003]);
  box(group,m.bronze,[w+.08,.016,.062],[0,-h/2-.021,.003]);
  box(group,m.bronze,[.016,h+.05,.062],[-w/2-.025,0,.003]);
  box(group,m.bronze,[.016,h+.05,.062],[w/2+.025,0,.003]);
  // Clipped brass corners, subtle rather than an extra glowing neon UI.
  for(const sx of [-1,1])for(const sy of [-1,1]) {
    box(group,m.gold,[.052,.007,.016],[sx*(w/2+.01),sy*(h/2+.018),.037]);
    box(group,m.gold,[.007,.050,.016],[sx*(w/2+.021),sy*(h/2+.003),.037]);
  }
  makeGlow(group,m,[0,0,-.06],index%3===0?0x8da9bd:0xcf9d6c,1.10,.075);
  return group;
}
