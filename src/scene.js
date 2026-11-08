import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DojoRoom } from './room.js';
import { InnerJourney } from './inner-journey.js';
import { ELEMENT_THEMES } from './bazi.js';
import { chooseSnap } from './placement.js';

export class SanctuaryScene {
  constructor({container,onHotspot,onHover,onWalkChange,onError,onMilestone,onPassage,onProp}) {
    this.container=container;this.onHotspot=onHotspot;this.onHover=onHover;this.onWalkChange=onWalkChange;this.onError=onError;
    this.onMilestone=onMilestone;this.onPassage=onPassage;this.onProp=onProp;this.passing=false;this.drag=null;this.hoveredProp=null;
    this.active=false;this.mode='landing';this.keys=new Set();this.pointer=new THREE.Vector2();this.raycaster=new THREE.Raycaster();
    this.hovered=null;this.clock=new THREE.Clock();this.elapsed=0;this.walkYaw=0;this.walkPitch=-.02;
    this.transition=null;this.paused=false;this.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.08,90);
    try {
      this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    } catch (error) {onError?.(error);throw error;}
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
    this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
    this.renderer.domElement.setAttribute('aria-label','DAORA interactive 3D sanctuary. Drag to rotate, scroll to zoom, or select the floating hotspots.');
    this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.tabIndex=0;container.append(this.renderer.domElement);
    const pmrem=new THREE.PMREMGenerator(this.renderer);
    const roomEnvironment=new RoomEnvironment();
    this.environmentTarget=pmrem.fromScene(roomEnvironment,.035);
    this.scene.environment=this.environmentTarget.texture;this.scene.environmentIntensity=.32;
    roomEnvironment.dispose();pmrem.dispose();
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.dampingFactor=.055;this.controls.rotateSpeed=.36;this.controls.zoomSpeed=.64;this.controls.panSpeed=.4;
    this.controls.minDistance=4.35;this.controls.maxDistance=21;
    this.controls.minPolarAngle=.44;this.controls.maxPolarAngle=Math.PI*.47;
    this.controls.minAzimuthAngle=-.76;this.controls.maxAzimuthAngle=1.12;
    this.controls.enablePan=false;this.controls.target.set(0,1.05,-.4);
    this.room=new DojoRoom(this.scene,this.renderer);
    this.inner=new InnerJourney(this.environmentTarget.texture);
    this.propLight=new THREE.PointLight(0xf6e2a8,0,2.2,2);
    this.scene.add(this.propLight);
    if (this.reducedMotion) this.setLandingCamera(true);
    else {
      this.camera.position.set(16.5,10.5,18);
      this.controls.target.set(0,1.4,-0.2);
      this.setLandingCamera(false);
    }
    this.bindEvents();this.resize();
    this.renderer.setAnimationLoop(()=>this.tick());
    this.renderer.domElement.dataset.sceneReady='true';
  }

  setLandingCamera(immediate=false) {
    this.mode='landing';this.room.setHotspotsVisible(false);
    this.controls.minDistance=4.35;this.controls.maxDistance=21;
    this.controls.minPolarAngle=.44;this.controls.maxPolarAngle=Math.PI*.47;
    this.controls.minAzimuthAngle=-.76;this.controls.maxAzimuthAngle=1.12;
    const mobile=innerWidth<700;
    const position=mobile?new THREE.Vector3(12,8,13):new THREE.Vector3(11.8,7.35,12.1);
    const target=mobile?new THREE.Vector3(-.5,1.65,-.4):new THREE.Vector3(-1.15,1.7,-.5);
    if(immediate){this.camera.position.copy(position);this.controls.target.copy(target);this.controls.update();}
    else this.animateCamera(position,target,1200,()=>{this.controls.enabled=true;});
    this.camera.fov=mobile?51:43;this.camera.updateProjectionMatrix();
  }

  setRoomCamera(immediate=false) {
    this.mode='room';this.room.setHotspotsVisible(true);this.keys.clear();
    const mobile=innerWidth<700;
    const target=new THREE.Vector3(-.12,1.86,-.42);
    const position=mobile?new THREE.Vector3(11.0,7.3,15.0):new THREE.Vector3(10.9,6.50,13.5);
    this.controls.minDistance=4.35;this.controls.maxDistance=21;
    this.controls.minPolarAngle=.44;this.controls.maxPolarAngle=Math.PI*.47;
    this.controls.minAzimuthAngle=-.76;this.controls.maxAzimuthAngle=1.12;
    this.camera.fov=mobile?56:44;this.camera.updateProjectionMatrix();
    if(immediate){this.camera.position.copy(position);this.controls.target.copy(target);this.controls.update();}
    else this.animateCamera(position,target,1550);
    this.active=true;
  }

  animateCamera(position,target,duration=900,onDone) {
    this.controls.enabled=false;
    this.transition={from:this.camera.position.clone(),to:position.clone(),targetFrom:this.controls.target.clone(),targetTo:target.clone(),started:performance.now(),duration:this.reducedMotion?1:duration,onDone};
  }

  resetView() {
    if(this.mode==='walk'||this.mode==='journey-walk')this.leaveWalk();
    else if(this.mode==='journey')this.enterJourney(false);
    else if(this.mode==='room')this.setRoomCamera(false);
  }

  setElementTheme(element) {
    const theme=ELEMENT_THEMES[element];if(!theme)return;
    this.element=element;
    this.scene.fog?.color.set(theme.fog);
    this.scene.background?.set(theme.background);
    this.room.lights.hemi.color.set(theme.hemi);
    this.room.lights.key.color.set(theme.key);
    this.room.lights.fill.color.set(theme.fill);
    this.room.lights.fill.intensity=theme.fillIntensity;
    this.room.lights.warm.color.set(theme.warm);
    this.room.lights.warm2.color.set(theme.warm);
    this.renderer.toneMappingExposure=theme.exposure;
    this.room.setAccent(theme.accent);
    this.inner.setTheme(element);
  }

  /**
   * A centred flight down a ring tunnel into a dark core.
   * The camera stays on the axis, speeds up, then a gold flash opens the room.
   * Skip, a safety timer, and reduced motion all land in the room.
   * hold:true parks a mid-flight frame for a screenshot.
   */
  beginTunnel(onDone, {hold=false}={}) {
    if (this.tunnelRunning) return;
    if (this.reducedMotion && !hold) {
      this.mode='room';
      onDone?.();
      return;
    }
    this.tunnelRunning=true;this.tunnelHold=hold;this.mode='tunnel';
    this.controls.enabled=false;this.transition=null;this.keys.clear();
    this.onTunnelDone=onDone;
    this.savedFog=this.scene.fog;this.savedBackground=this.scene.background;
    this.savedFov=this.camera.fov;this.savedExposure=this.renderer.toneMappingExposure;
    this.scene.fog=null;this.scene.background=new THREE.Color(0x070814);
    this.renderer.toneMappingExposure=1.28;
    this.room.root.visible=false;
    this.buildTunnel();
    this.tunnelStarted=performance.now();
    this.tunnelFrame=this.tunnelStarted;
    this.tunnelDuration=3600;
    this.streakShift=0;
    this.setTunnelProgress(hold?0.66:0);
    clearTimeout(this.tunnelSafety);
    if (!hold) this.tunnelSafety=setTimeout(()=>this.finishTunnel(), 7000);
  }

  tunnelGlowTexture() {
    if (this.glowTexture) return this.glowTexture;
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d');
    const glow=ctx.createRadialGradient(128,128,10,128,128,128);
    glow.addColorStop(0,'rgba(0,0,0,0)');
    glow.addColorStop(.22,'rgba(0,0,0,0)');
    glow.addColorStop(.34,'rgba(255,246,220,.95)');
    glow.addColorStop(.5,'rgba(232,196,130,.5)');
    glow.addColorStop(.72,'rgba(92,108,196,.32)');
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,256,256);
    this.glowTexture=new THREE.CanvasTexture(canvas);
    return this.glowTexture;
  }

  glyphTexture(char) {
    if (!this.glyphCache) this.glyphCache=new Map();
    if (this.glyphCache.has(char)) return this.glyphCache.get(char);
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,128,128);
    ctx.fillStyle='rgba(244,230,196,.95)';
    ctx.font='68px "WenQuanYi Micro Hei","Droid Sans Fallback",serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(char,64,68);
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    this.glyphCache.set(char,texture);
    return texture;
  }

  buildTunnel() {
    this.disposeTunnelMesh();
    const mobile=innerWidth<700;
    const ringCount=mobile?32:52;
    const streakCount=mobile?380:820;
    const glyphCount=mobile?16:26;
    const depth=50;
    const group=new THREE.Group();group.name='time-tunnel';
    const gold=new THREE.MeshBasicMaterial({color:0xe7c98a,transparent:true,opacity:.72,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false});
    const indigo=new THREE.MeshBasicMaterial({color:0x7d93e4,transparent:true,opacity:.5,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false});
    const segments=mobile?28:48;
    for (let i=0;i<ringCount;i++) {
      const radius=2.15+(i%4)*.08;
      const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,i%2?.012:.02,6,segments),i%2?indigo:gold);
      ring.position.z=-i*(depth/ringCount);
      ring.rotation.z=i*.11;
      group.add(ring);
    }
    const positions=new Float32Array(streakCount*2*3);
    const colors=new Float32Array(streakCount*2*3);
    for (let i=0;i<streakCount;i++) {
      const angle=i*2.399963;
      const radius=.18+(i%19)/18*2.15;
      const z=-(i*1.618%depth);
      const len=.55+(i%6)*.28;
      const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius;
      const o=i*6;
      positions[o]=x;positions[o+1]=y;positions[o+2]=z;
      positions[o+3]=x;positions[o+4]=y;positions[o+5]=z-len;
      const tint=i%3? [0.96,0.86,0.62] : [0.62,0.72,0.98];
      for (let k=0;k<2;k++) {colors[o+k*3]=tint[0];colors[o+k*3+1]=tint[1];colors[o+k*3+2]=tint[2];}
    }
    const streakGeo=new THREE.BufferGeometry();
    streakGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    streakGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const streaks=new THREE.LineSegments(streakGeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
    group.add(streaks);
    this.tunnelStreaks=streaks;this.streakBase=positions.slice();

    const coreZ=-depth-1.2;
    const hole=new THREE.Mesh(new THREE.SphereGeometry(1.15,32,24),new THREE.MeshBasicMaterial({color:0x05030c}));
    hole.position.z=coreZ;hole.renderOrder=3;group.add(hole);
    const disk=new THREE.Mesh(new THREE.RingGeometry(1.35,2.7,80),new THREE.MeshBasicMaterial({color:0xf2d7a4,side:THREE.DoubleSide,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
    disk.position.z=coreZ+.12;group.add(disk);
    const outer=new THREE.Mesh(new THREE.RingGeometry(2.15,3.15,72),new THREE.MeshBasicMaterial({color:0x8496e8,side:THREE.DoubleSide,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false}));
    outer.position.z=coreZ+.02;group.add(outer);
    const vortex=new THREE.Group();vortex.position.z=coreZ;
    for (let i=0;i<4;i++) {
      const arm=new THREE.Mesh(new THREE.TorusGeometry(1.15+i*.38,.018,6,64),new THREE.MeshBasicMaterial({color:i%2?0xd8c4ff:0xf6e2b4,transparent:true,opacity:.78,blending:THREE.AdditiveBlending,depthWrite:false}));
      arm.rotation.x=.42+i*.18;arm.rotation.y=i*.8;vortex.add(arm);
    }
    group.add(vortex);this.tunnelVortex=vortex;
    const glowMap=this.tunnelGlowTexture();
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color:0xffe7b8,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
    glow.position.z=coreZ-.4;glow.scale.set(18,18,1);glow.renderOrder=1;group.add(glow);
    const cool=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color:0x7384dc,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));
    cool.position.z=coreZ-.8;cool.scale.set(28,28,1);cool.renderOrder=0;group.add(cool);

    const glyphs='甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥✦✧';
    for (let i=0;i<glyphCount;i++) {
      const char=glyphs[i%glyphs.length];
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glyphTexture(char),transparent:true,opacity:.55,depthWrite:false,color:i%2?0xf3e2c0:0xc5cef5}));
      const angle=(i/glyphCount)*Math.PI*2;
      const radius=1.35+(i%3)*.28;
      sprite.position.set(Math.cos(angle)*radius,Math.sin(angle)*radius,-3-(i/glyphCount)*(depth-6));
      sprite.scale.set(.55,.55,1);
      group.add(sprite);
    }
    this.scene.add(group);
    this.tunnel=group;this.tunnelDepth=depth;this.tunnelCoreZ=coreZ;
  }

  advanceStreaks(rush) {
    if (!this.tunnelStreaks||!this.streakBase) return;
    const now=performance.now();
    const dt=Math.min(.05,(now-(this.tunnelFrame||now))/1000);
    this.tunnelFrame=now;
    const depth=this.tunnelDepth||50;
    this.streakShift=(this.streakShift+dt*(3+rush*32))%depth;
    const attr=this.tunnelStreaks.geometry.attributes.position;
    const base=this.streakBase;
    for (let i=0;i<attr.count;i++) {
      let z=base[i*3+2]+this.streakShift;
      if (z>1.2) z-=depth;
      attr.setXYZ(i,base[i*3],base[i*3+1],z);
    }
    attr.needsUpdate=true;
  }

  setTunnelProgress(amount) {
    if (!this.tunnel) return;
    const t=Math.min(1,Math.max(0,amount));
    this.tunnelProgress=t;
    const rush=Math.pow(t,2.15);
    const depth=this.tunnelDepth||50;
    const z=6.4-rush*(depth-1.5);
    this.camera.up.set(0,1,0);
    this.camera.position.set(0,0,z);
    this.camera.lookAt(0,0,this.tunnelCoreZ??-40);
    const mobile=innerWidth<700;
    this.camera.fov=(mobile?70:64)+rush*14;
    this.camera.updateProjectionMatrix();
    this.tunnel.rotation.z=rush*.7;
    if (this.tunnelVortex) this.tunnelVortex.rotation.z=t*9;
    if (!this.tunnelHold) this.advanceStreaks(rush);
    const veil=document.getElementById('tunnel-flash');
    if (veil) veil.style.opacity=String(t<0.86?0:Math.min(1,(t-.86)/.14));
  }

  finishTunnel() {
    if (!this.tunnelRunning && this.mode!=='tunnel') return;
    clearTimeout(this.tunnelSafety);
    const flashed=this.tunnelProgress>0.5;
    this.tunnelRunning=false;this.tunnelHold=false;
    this.disposeTunnelMesh();
    this.room.root.visible=true;
    this.scene.fog=this.savedFog||this.scene.fog;
    this.scene.background=this.savedBackground||this.scene.background;
    if (Number.isFinite(this.savedFov)) this.camera.fov=this.savedFov;
    if (Number.isFinite(this.savedExposure)) this.renderer.toneMappingExposure=this.savedExposure;
    this.camera.updateProjectionMatrix();
    if (this.element) this.setElementTheme(this.element);
    const veil=document.getElementById('tunnel-flash');
    if (veil) {
      veil.style.transition='none';
      veil.style.opacity=flashed?'1':'0';
      if (flashed) requestAnimationFrame(()=>{
        veil.style.transition='opacity .48s ease';
        veil.style.opacity='0';
      });
    }
    const done=this.onTunnelDone;this.onTunnelDone=null;
    this.mode='room';
    done?.();
  }

  skipTunnel() { this.finishTunnel(); }

  disposeTunnelMesh() {
    if (!this.tunnel) return;
    const materials=new Set();const geometries=new Set();
    this.tunnel.traverse((object)=>{
      if (object.geometry) geometries.add(object.geometry);
      const list=object.material?(Array.isArray(object.material)?object.material:[object.material]):[];
      list.forEach((material)=>materials.add(material));
    });
    geometries.forEach((geometry)=>geometry.dispose());
    materials.forEach((material)=>material.dispose());
    this.scene.remove(this.tunnel);
    this.tunnel=null;this.tunnelStreaks=null;this.tunnelVortex=null;this.streakBase=null;
  }

  enterJourney(immediate=false) {
    this.mode='journey';this.keys.clear();this.controls.enabled=false;
    this.controls.minDistance=1.8;this.controls.maxDistance=14;
    this.controls.minPolarAngle=.35;this.controls.maxPolarAngle=Math.PI*.49;
    this.controls.minAzimuthAngle=-Infinity;this.controls.maxAzimuthAngle=Infinity;
    const home=this.inner.cameraHome();
    this.camera.fov=innerWidth<700?58:48;this.camera.updateProjectionMatrix();
    if(immediate){this.camera.position.copy(home.position);this.controls.target.copy(home.target);this.controls.update();this.controls.enabled=true;this.transition=null;}
    else this.animateCamera(home.position,home.target,900);
  }

  leaveJourney(immediate=false) {
    if(this.room.wallDoor)this.room.wallDoor.opening=false;
    this.setRoomCamera(immediate);
  }

  beginPassage(direction) {
    if(this.passing)return;
    this.passing=true;this.keys.clear();this.controls.enabled=false;
    if(direction==='journey')this.room.wallDoor.open();
    this.onPassage?.('cover',direction);
    const wait=this.reducedMotion?60:direction==='journey'?860:420;
    window.setTimeout(()=>{
      if(direction==='journey')this.enterJourney(true);
      else this.leaveJourney(true);
      this.onPassage?.('reveal',direction);
      window.setTimeout(()=>{this.passing=false;},this.reducedMotion?40:680);
    },wait);
  }

  focusHotspot(id) {
    if(this.mode!=='room')return;
    const h=this.room.hotspotData.find(item=>item.id===id);if(!h)return;
    const target=h.group.position.clone();target.y=Math.max(1,target.y-.35);
    const direction=new THREE.Vector3(5.6,3.4,6.2);
    // Keep close viewpoints within the front-facing camera envelope.
    const position=target.clone().add(direction).clamp(new THREE.Vector3(-3,3.5,2),new THREE.Vector3(9,7,10));
    this.animateCamera(position,target,780);
  }

  enterWalk() {
    if(this.mode==='walk'||this.mode==='journey-walk'){this.leaveWalk();return;}
    if(this.mode==='journey'){
      this.keys.clear();this.transition=null;this.controls.enabled=false;this.mode='journey-walk';
      const direction=new THREE.Vector3();this.camera.getWorldDirection(direction);
      this.walkYaw=Math.atan2(-direction.x,-direction.z);this.walkPitch=Math.asin(THREE.MathUtils.clamp(direction.y,-1,1));
      this.camera.rotation.order='YXZ';this.camera.rotation.set(this.walkPitch,this.walkYaw,0,'YXZ');
      this.camera.position.y=1.64;this.camera.fov=64;this.camera.updateProjectionMatrix();
      this.onWalkChange?.(true);return;
    }
    if(this.mode!=='room'){this.setRoomCamera(true);}
    this.keys.clear();this.transition=null;this.controls.enabled=false;this.mode='walk';
    this.room.setHotspotsVisible(true);
    this.camera.position.set(2.1,1.64,1.15);
    this.walkYaw=1.02;this.walkPitch=.22;
    this.camera.rotation.order='YXZ';
    this.camera.rotation.set(this.walkPitch,this.walkYaw,0,'YXZ');
    this.camera.fov=64;this.camera.updateProjectionMatrix();
    this.onWalkChange?.(true);
  }

  leaveWalk() {
    const fromJourney=this.mode==='journey-walk';
    this.keys.clear();this.onWalkChange?.(false);
    if(fromJourney)this.enterJourney(false);else this.setRoomCamera(false);
  }

  bindEvents() {
    this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);
    this.renderer.domElement.addEventListener('pointerdown',event=>{
      this.pointerDown={x:event.clientX,y:event.clientY,time:performance.now(),lastX:event.clientX,lastY:event.clientY};
      this.setPointer(event);
      if(this.mode==='room'&&!this.paused&&!this.passing){
        const propHit=this.findPropHit();
        if(propHit){
          this.drag={prop:propHit.prop,x:event.clientX,y:event.clientY,moved:false};
          this.controls.enabled=false;
          try{this.renderer.domElement.setPointerCapture(event.pointerId);}catch{/* ignore */}
          return;
        }
      }
      if(this.mode==='walk'){this.renderer.domElement.setPointerCapture(event.pointerId);}
    });
    this.renderer.domElement.addEventListener('pointermove',event=>{
      this.setPointer(event);
      if(this.drag){
        const moved=Math.hypot(event.clientX-this.drag.x,event.clientY-this.drag.y);
        if(moved>6)this.drag.moved=true;
        if(this.drag.moved){
          this.raycaster.setFromCamera(this.pointer,this.camera);
          const snap=chooseSnap(this.raycaster.ray.origin,this.raycaster.ray.direction,this.room.worldShelves());
          if(snap)this.drag.prop.group.position.set(snap.x,snap.y,snap.z);
          this.paintPropGlow(this.drag.prop);
        }
        return;
      }
      if(this.mode==='walk'&&this.pointerDown) {
        this.walkYaw-=(event.clientX-this.pointerDown.lastX)*.0034;
        this.walkPitch=THREE.MathUtils.clamp(this.walkPitch-(event.clientY-this.pointerDown.lastY)*.003,-.95,.95);
        this.pointerDown.lastX=event.clientX;this.pointerDown.lastY=event.clientY;
        this.camera.rotation.set(this.walkPitch,this.walkYaw,0,'YXZ');
        this.onHover?.(null);
        return;
      }
      this.updateHover();
    });
    this.renderer.domElement.addEventListener('pointerup',event=>{
      if(this.drag){
        const drag=this.drag;this.drag=null;
        if(this.mode==='room')this.controls.enabled=true;
        if(drag.moved){this.room.rememberLayout();this.onProp?.(drag.prop,'move');}
        else this.onProp?.(drag.prop,'click');
        this.pointerDown=null;
        if(this.renderer.domElement.hasPointerCapture(event.pointerId))this.renderer.domElement.releasePointerCapture(event.pointerId);
        return;
      }
      const moved=this.pointerDown?Math.hypot(event.clientX-this.pointerDown.x,event.clientY-this.pointerDown.y):999;
      if(moved<7&&performance.now()-(this.pointerDown?.time||0)<650) {
        this.setPointer(event);this.raycast();
      }
      this.pointerDown=null;
      if(this.renderer.domElement.hasPointerCapture(event.pointerId))this.renderer.domElement.releasePointerCapture(event.pointerId);
    });
    this.renderer.domElement.addEventListener('pointercancel',()=>{this.drag=null;this.pointerDown=null;if(this.mode==='room')this.controls.enabled=true;});
    this.renderer.domElement.addEventListener('pointerleave',()=>{if(this.mode!=='walk')this.onHover?.(null);this.hovered=null;});
    window.addEventListener('keydown',event=>{
      const inputFocused=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
      if(inputFocused)return;
      if(event.key==='Escape'){if(this.mode==='walk'||this.mode==='journey-walk'){this.leaveWalk();return;}this.keys.clear();return;}
      if(this.mode!=='walk'&&this.mode!=='journey-walk')return;
      if(['w','a','s','d','W','A','S','D','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(event.key.toLowerCase())) {
        event.preventDefault();this.keys.add(event.key.toLowerCase());
      }
    });
    window.addEventListener('keyup',event=>this.keys.delete(event.key.toLowerCase()));
    window.addEventListener('blur',()=>{this.keys.clear();this.pointerDown=null;});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.keys.clear();this.clock.stop();}else this.clock.start();});
  }

  setPointer(event) {
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
  }

  findHit() {
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const roots=(this.mode==='journey'||this.mode==='journey-walk')?[this.inner.root]:[this.room.wallDoor?.root,...this.room.hotspotData.filter(h=>h.group.visible).map(h=>h.group)].filter(Boolean);
    const hits=this.raycaster.intersectObjects(roots,true);
    for(const hit of hits){
      let node=hit.object;
      while(node){
        if(node.userData?.portal==='journey')return {type:'door'};
        if(node.userData?.portal==='return')return {type:'return'};
        if(node.userData?.milestoneId)return {type:'milestone',id:node.userData.milestoneId};
        if(node.userData?.hotspot)return {type:'hotspot',id:node.userData.hotspot};
        node=node.parent;
      }
    }
    return null;
  }

  findPropHit() {
    if(!this.room?.props?.length)return null;
    if(this.mode!=='room'&&this.mode!=='walk')return null;
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.room.props.map((prop)=>prop.group),true);
    if(!hits.length)return null;
    let node=hits[0].object;
    let propId=null;
    while(node){
      if(node.userData?.propId){propId=node.userData.propId;break;}
      node=node.parent;
    }
    const prop=this.room.props.find((item)=>item.id===propId);
    return prop?{prop}:null;
  }

  paintPropGlow(prop) {
    if(!prop){this.propLight.intensity=0;this.hoveredProp=null;return;}
    const box=new THREE.Box3().setFromObject(prop.group);
    const center=box.getCenter(new THREE.Vector3());
    this.propLight.position.copy(center);
    this.propLight.intensity=this.reducedMotion?1.2:2.4;
    this.hoveredProp=prop.id;
  }

  updateHover() {
    if(this.mode==='landing'||this.mode==='tunnel'||this.paused||this.passing)return;
    const hit=this.findHit();
    const id=hit?.type==='hotspot'?hit.id:hit?.type==='milestone'?`milestone:${hit.id}`:hit?.type||null;
    if(id){
      if(id!==this.hovered){this.hovered=id;this.renderer.domElement.style.cursor='pointer';this.onHover?.(id);}
      if(this.hoveredProp){this.paintPropGlow(null);this.onProp?.(null,'hover');}
      return;
    }
    const propHit=this.findPropHit();
    const propId=propHit?.prop?.id||null;
    if(propId!==this.hoveredProp){
      this.paintPropGlow(propHit?.prop||null);
      this.onProp?.(propHit?.prop||null,'hover');
    }
    if(this.hovered){this.hovered=null;this.onHover?.(null);}
    this.renderer.domElement.style.cursor=propId?'pointer':'grab';
  }

  raycast() {
    if(this.passing||this.mode==='tunnel')return;
    const hit=this.findHit();if(!hit)return;
    if(hit.type==='door'&&(this.mode==='room'||this.mode==='walk')){this.beginPassage('journey');return;}
    if(hit.type==='return'&&(this.mode==='journey'||this.mode==='journey-walk')){this.beginPassage('room');return;}
    if(hit.type==='milestone'){this.onMilestone?.(hit.id);return;}
    if(this.mode==='room'&&hit.type==='hotspot'&&!this.paused){this.onHotspot?.(hit.id);this.focusHotspot(hit.id);return;}
    if((this.mode==='room'||this.mode==='walk')&&!this.paused){
      const propHit=this.findPropHit();
      if(propHit)this.onProp?.(propHit.prop,'click');
    }
  }

  resize() {
    this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<600?1.45:1.65));
  }

  /** Advance only physical movement (not rendering); keyboard events feed this same method. */
  walk(delta) {
    const speed=(this.keys.has('shift')?2.4:1.35)*delta;
    let forward=(this.keys.has('w')||this.keys.has('arrowup')?1:0)-(this.keys.has('s')||this.keys.has('arrowdown')?1:0);
    let right=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0);
    if(!forward&&!right)return;
    const length=Math.hypot(forward,right);forward/=length;right/=length;
    const dx=(-Math.sin(this.walkYaw)*forward+Math.cos(this.walkYaw)*right)*speed;
    const dz=(-Math.cos(this.walkYaw)*forward-Math.sin(this.walkYaw)*right)*speed;
    const allowed=this.mode==='journey-walk'?(x,z)=>this.inner.canWalkTo(x,z):(x,z)=>this.room.canWalkTo(x,z);
    const {x,z}=this.camera.position;
    if(allowed(x+dx,z))this.camera.position.x+=dx;
    if(allowed(this.camera.position.x,z+dz))this.camera.position.z+=dz;
    this.camera.position.y=1.64;
    if(this.passing)return;
    if(this.mode==='walk'&&this.room.wallDoor.containsApproach(this.camera.position.x,this.camera.position.z))this.beginPassage('journey');
    else if(this.mode==='journey-walk'&&this.inner.containsReturn(this.camera.position.x,this.camera.position.z))this.beginPassage('room');
  }

  tick() {
    const delta=Math.min(this.clock.getDelta(),.055);if(document.hidden)return;
    if(!this.reducedMotion)this.elapsed+=delta;
    if(this.mode==='tunnel'){
      if(!this.tunnelHold){
        const amount=Math.min(1,(performance.now()-this.tunnelStarted)/this.tunnelDuration);
        this.setTunnelProgress(amount);
        if(amount>=1){this.finishTunnel();return;}
      } else this.setTunnelProgress(this.tunnelProgress??0.66);
      this.renderer.render(this.scene,this.camera);
      return;
    }
    if(this.transition) {
      const t=this.transition;
      const progress=Math.min(1,(performance.now()-t.started)/t.duration);
      const eased=progress<.5?4*progress*progress*progress:1-Math.pow(-2*progress+2,3)/2;
      this.camera.position.lerpVectors(t.from,t.to,eased);this.controls.target.lerpVectors(t.targetFrom,t.targetTo,eased);
      this.camera.lookAt(this.controls.target);
      if(progress===1){this.controls.enabled=true;this.transition=null;t.onDone?.();}
    }else if(this.mode==='walk'||this.mode==='journey-walk'){if(!this.passing)this.walk(delta);}
    else this.controls.update();
    // In orbit view, prevent zooming out through the rear walls while preserving a welcoming diorama angle.
    if(this.mode!=='walk'&&this.mode!=='journey-walk')this.camera.position.y=Math.max(.6,this.camera.position.y);
    if(this.mode==='journey'||this.mode==='journey-walk'){
      this.inner.update(this.reducedMotion?0:this.elapsed);
      this.renderer.render(this.inner.scene,this.camera);
    }else{
      this.room.update(this.elapsed,this.camera);
      this.room.wallDoor?.update(this.reducedMotion?0:this.elapsed);
      this.renderer.render(this.scene,this.camera);
    }
  }
}
