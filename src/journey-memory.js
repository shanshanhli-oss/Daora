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
function memoryTexture(kind, index = 0) {
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
    ctx.font='12px Georgia, serif';ctx.fillStyle='rgba(232,206,158,.75)';ctx.fillText(`${String(index+1).padStart(2,'0')}  /  旅程记忆`,25,h-19);
    const vignette=ctx.createRadialGradient(w/2,h/2,60,w/2,h/2,410);vignette.addColorStop(0,'rgba(8,8,13,0)');vignette.addColorStop(1,'rgba(8,8,13,.27)');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
    grain(ctx,w,h,47+index,4200);
  });
}

function floorTexture() {
  return canvasTexture(1536,1536,(ctx,w,h)=>{
    const c=w/2;
    const background=ctx.createRadialGradient(c,c,10,c,c,c);
    background.addColorStop(0,'#0d1119');background.addColorStop(.38,'#151923');background.addColorStop(.74,'#211b23');background.addColorStop(1,'#0e1016');ctx.fillStyle=background;ctx.fillRect(0,0,w,h);
    const circle=(radius,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(c,c,radius,0,TAU);ctx.stroke();};
    circle(741,'#8f734e',3);circle(724,'rgba(167,135,84,.30)',2);circle(639,'rgba(165,136,92,.17)',2);circle(523,'rgba(154,131,95,.13)',1);circle(231,'rgba(164,136,88,.23)',2);
    const colors=['#b2bdaf','#84a7b4','#bd9d6a','#ba887c','#9a83a2'];
    const elements=['金','水','土','木','火'];
    for(let i=0;i<128;i++){
      const a=i/128*TAU,inside=i%8===0?684:701;
      ctx.strokeStyle=i%8===0?'rgba(200,165,101,.42)':'rgba(180,157,110,.2)';ctx.lineWidth=i%8===0?2:1;
      ctx.beginPath();ctx.moveTo(c+Math.cos(a)*inside,c+Math.sin(a)*inside);ctx.lineTo(c+Math.cos(a)*716,c+Math.sin(a)*716);ctx.stroke();
    }
    for(let i=0;i<5;i++){
      const a=-Math.PI/2+i/5*TAU;
      const next=a+TAU/5;
      ctx.save();ctx.translate(c,c);ctx.rotate(a);
      ctx.strokeStyle=colors[i];ctx.globalAlpha=.38;ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(0,-625);ctx.lineTo(0,-490);ctx.lineTo(49,-447);ctx.lineTo(49,-334);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-24,-411);ctx.lineTo(-24,-340);ctx.stroke();
      ctx.lineWidth=1.5;circle(-0,-479,12,colors[i]);
      ctx.globalAlpha=1;
      ctx.fillStyle=colors[i];ctx.font='42px "Noto Serif CJK SC",serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(elements[i],0,-557);
      ctx.font='11px Georgia,serif';ctx.fillStyle='rgba(200,184,145,.52)';ctx.fillText(['CLARITY','FLOW','GROUND','GROWTH','WARMTH'][i],0,-676);
      ctx.strokeStyle='rgba(192,162,104,.15)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,575,-.275,.275);ctx.stroke();
      ctx.restore();
      const na=a+(TAU/5)*.5;
      circle(c+Math.cos(na)*260,c+Math.sin(na)*260,5,colors[i],true);
      circle(c+Math.cos(na)*260,c+Math.sin(na)*260,13,'rgba(185,153,95,.18)');
    }
    // A quiet central yin-yang/rosette, largely covered by the tower's dark centre.
    circle(172,'rgba(198,169,110,.30)',2);
    for(let i=0;i<8;i++){ctx.save();ctx.translate(c,c);ctx.rotate(i/8*TAU);ctx.fillStyle='rgba(161,140,103,.24)';ctx.beginPath();ctx.ellipse(0,-80,18,58,.18,0,TAU);ctx.fill();ctx.restore();}
    circle(c,c,10,'rgba(225,198,138,.45)',true);
    // Reflected light streaks are a material treatment, not a real-time second scene render.
    ctx.save();ctx.translate(c,c);ctx.scale(1,.29);ctx.globalAlpha=.075;
    const reflected=ctx.createLinearGradient(-650,0,650,0);reflected.addColorStop(0,'rgba(145,174,176,0)');reflected.addColorStop(.4,'rgba(148,174,178,.65)');reflected.addColorStop(.6,'rgba(226,184,114,.65)');reflected.addColorStop(1,'rgba(226,184,114,0)');
    ctx.fillStyle=reflected;ctx.fillRect(-600,-360,1250,720);ctx.restore();
    grain(ctx,w,h,99,11500);
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

function createMaterials() {
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

function createDoor(materials, m, index, open) {
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

function createFrame(m, materials, texture, index) {
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

export class JourneyMemory {
  constructor(parent, materials, {position=[0,.06,-.42]}={}) {
    this.root=new THREE.Group();this.root.name='旅程记忆 · Journey Memory';this.root.position.set(...position);parent.add(this.root);
    this.materials=materials;this.m=materials;this.memoryMaterials=createMaterials();this.floaters=[];this.doorLights=[];
    this.motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion=this.motionPreference.matches;
    this.motionPreference.addEventListener('change',event=>{this.reducedMotion=event.matches;});
    this.buildFloor();this.buildTower();this.buildRisingLight();
  }

  buildFloor() {
    const m=this.m,memoryMaterials=this.memoryMaterials;
    cylinder(this.root,memoryMaterials.backing,1.86,.075,[0,.015,0],96);
    cylinder(this.root,m.bronze,1.825,.018,[0,.056,0],96);
    const texture=floorTexture();
    const floorMaterial=new THREE.MeshPhysicalMaterial({map:texture,color:0xc3bbb0,metalness:.81,roughness:.19,clearcoat:1,clearcoatRoughness:.09,envMapIntensity:.8,emissiveMap:texture,emissive:0xae9067,emissiveIntensity:.13});
    const floor=mesh(new THREE.CircleGeometry(1.81,96),floorMaterial,this.root,[0,.069,0],[-Math.PI/2,0,0]);floor.castShadow=false;floor.receiveShadow=true;this.floorMaterial=floorMaterial;
    
    torus(this.root,m.gold,1.798,.011,[0,.077,0],[Math.PI/2,0,0]);
    torus(this.root,m.bronze,1.85,.008,[0,.008,0],[Math.PI/2,0,0]);
    // Five small inlaid stones echo the five phases, not a dense circuit board.
    const colors=[0xc5bfa5,0x819a7a,0x87a8b2,0xbd8a69,0xa38a6c];
    for(let i=0;i<5;i++) {
      const a=-Math.PI/2+i/5*TAU;
      const stoneMaterial=new THREE.MeshPhysicalMaterial({color:colors[i],metalness:.65,roughness:.20,emissive:colors[i],emissiveIntensity:.12});
      sphere(this.root,stoneMaterial,.038,[Math.sin(a)*1.61,.079,Math.cos(a)*1.61],[1,.3,1]);
      makeGlow(this.root,m,[Math.sin(a)*1.61,.097,Math.cos(a)*1.61],colors[i],.19,.3);
    }
  }

  buildTower() {
    const m=this.m,mm=this.memoryMaterials;
    const random=seededRandom(498);
    const pattern=['door','landscape','map','door','neural','door','calligraphy','river','topography','pavilion','door','breath','lotus','horizon','door'];
    const helix=new THREE.Group();helix.name='Slowly orbiting memory helix';this.root.add(helix);this.helix=helix;
    pattern.forEach((kind,index)=>{
      const theta=.20+index*.91;
      const radius=1.02+Math.sin(index*.68)*.105;
      const float=new THREE.Group();float.name=`Memory fragment ${index+1}`;
      float.position.set(Math.sin(theta)*radius,1.09+index*.251,Math.cos(theta)*radius);
      float.rotation.set(Math.sin(index*1.1)*.048,theta+Math.sin(index)*.095,Math.sin(index*1.43)*.079);
      helix.add(float);
      let content;
      if(kind==='door') {
        content=createDoor(mm,m,index,index%2===0||index===6||index===12);
        float.add(content.group);this.doorLights.push(content.lightMaterial);
      } else {
        const type=kind==='screen'?'neural':kind;
        content=createFrame(m,mm,memoryTexture(type,index),index);float.add(content);
      }
      this.floaters.push({object:float,y:float.position.y,z:float.rotation.z,phase:random()*TAU,speed:.55+random()*.22});
    });
    // A central dark column is a subtle occluder, not a heavy physical pillar.
    const voidMaterial=new THREE.MeshStandardMaterial({color:0x080910,roughness:.98,transparent:true,opacity:.25,depthWrite:false});
    cylinder(helix,voidMaterial,[.20,.37],3.85,[0,2.39,0],40);
    // Three delicate golden memories trace the void, visually tying the fragments together.
    for(let thread=0;thread<3;thread++) {
      const points=[];
      for(let i=0;i<120;i++){
        const t=i/119,a=t*TAU*1.55+thread*TAU/3+.20;
        points.push(new THREE.Vector3(Math.sin(a)*(.71+Math.sin(t*4)*.08),.55+t*4.17,Math.cos(a)*(.71+Math.sin(t*4)*.08)));
      }
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:thread===1?0x7e9e9c:0xc0a373,transparent:true,opacity:thread===1?.16:.24,depthWrite:false}));helix.add(line);
    }
    makeGlow(helix,m,[0,.44,0],0xe3b475,1.1,.27);
    const memoryLight=new THREE.PointLight(0xffc683,5.7,4.8,2);memoryLight.position.set(0,1.5,.1);this.root.add(memoryLight);this.memoryLight=memoryLight;
    const upperLight=new THREE.PointLight(0xbcc4b1,3.0,4.0,2);upperLight.position.set(0,3.62,0);this.root.add(upperLight);this.upperLight=upperLight;
    const spot=new THREE.SpotLight(0xffd8a1,6,5.8,Math.PI/3,.83,1.7);spot.position.set(0,4.75,0);spot.target.position.set(0,.07,0);this.root.add(spot,spot.target);
  }

  buildRisingLight() {
    const random=seededRandom(1138),count=66,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
    this.particleSeeds=[];
    const gold=new THREE.Color(0xe0bd81),pale=new THREE.Color(0xa5b6b2);
    for(let i=0;i<count;i++) {
      const a=random()*TAU,r=.17+random()*.81,y=random()*4.5;
      this.particleSeeds.push({a,r,y,speed:.035+random()*.085});
      positions.set([Math.cos(a)*r,y,Math.sin(a)*r],i*3);
      const color=i%3?gold:pale;colors.set([color.r,color.g,color.b],i*3);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const material=new THREE.PointsMaterial({color:0xffffff,vertexColors:true,size:.057,map:this.m.glow,transparent:true,opacity:.59,depthWrite:false,blending:THREE.AdditiveBlending});
    this.particles=new THREE.Points(geometry,material);this.particles.name='Ascending journey light';this.root.add(this.particles);
  }

  update(seconds) {
    this.helix.rotation.y=this.reducedMotion?.22:seconds*.023;
    this.floorMaterial.emissiveIntensity=this.reducedMotion?.13:.13+Math.sin(seconds*.56)*.025;
    this.floaters.forEach(({object,y,z,phase,speed})=>{
      object.position.y=y+(this.reducedMotion?0:Math.sin(seconds*speed+phase)*.038);
      object.rotation.z=z+(this.reducedMotion?0:Math.sin(seconds*.4+phase)*.018);
    });
    this.doorLights.forEach((light,index)=>{
      const pulse=this.reducedMotion?0:Math.sin(seconds*.85+index*1.73);
      light.glow.material.opacity=(light.open?.41:.09)+pulse*(light.open?.07:.025);
      light.portalMaterial.color.setRGB(1,.91+pulse*.035,.77+pulse*.065);
    });
    this.memoryLight.intensity=this.reducedMotion?5.7:5.7+Math.sin(seconds*1.05)*.5;
    this.upperLight.intensity=this.reducedMotion?3.0:3.0+Math.sin(seconds*.77+.7)*.35;
    const positions=this.particles.geometry.attributes.position;
    this.particleSeeds.forEach(({a,r,y,speed},index)=>{
      const height=this.reducedMotion?y:(y+seconds*speed)%4.7,angle=this.reducedMotion?a:a+seconds*.052;
      positions.setXYZ(index,Math.cos(angle)*r,this.reducedMotion?height:height+.15,Math.sin(angle)*r);
    });
    positions.needsUpdate=true;
  }
}
