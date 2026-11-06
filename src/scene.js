import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DojoRoom } from './room.js';
import { InnerJourney } from './inner-journey.js';
import { ELEMENT_THEMES } from './bazi.js';

export class SanctuaryScene {
  constructor({container,onHotspot,onHover,onWalkChange,onError,onMilestone,onPassage}) {
    this.container=container;this.onHotspot=onHotspot;this.onHover=onHover;this.onWalkChange=onWalkChange;this.onError=onError;
    this.onMilestone=onMilestone;this.onPassage=onPassage;this.passing=false;
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
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.0;
    this.renderer.domElement.setAttribute('aria-label','DAORA interactive 3D sanctuary. Drag to rotate, scroll to zoom, or select the floating hotspots.');
    this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.tabIndex=0;container.append(this.renderer.domElement);
    const pmrem=new THREE.PMREMGenerator(this.renderer);
    const roomEnvironment=new RoomEnvironment();
    this.environmentTarget=pmrem.fromScene(roomEnvironment,.035);
    this.scene.environment=this.environmentTarget.texture;this.scene.environmentIntensity=.24;
    roomEnvironment.dispose();pmrem.dispose();
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.dampingFactor=.055;this.controls.rotateSpeed=.36;this.controls.zoomSpeed=.64;this.controls.panSpeed=.4;
    this.controls.minDistance=4.35;this.controls.maxDistance=21;
    this.controls.minPolarAngle=.36;this.controls.maxPolarAngle=Math.PI*.47;
    this.controls.minAzimuthAngle=-.76;this.controls.maxAzimuthAngle=1.12;
    this.controls.enablePan=false;this.controls.target.set(0,1.05,-.4);
    this.room=new DojoRoom(this.scene,this.renderer);
    this.inner=new InnerJourney(this.environmentTarget.texture);
    this.setLandingCamera(true);
    this.bindEvents();this.resize();
    this.renderer.setAnimationLoop(()=>this.tick());
    this.renderer.domElement.dataset.sceneReady='true';
  }

  setLandingCamera(immediate=false) {
    this.mode='landing';this.room.setHotspotsVisible(false);
    this.controls.minDistance=4.35;this.controls.maxDistance=21;
    this.controls.minPolarAngle=.36;this.controls.maxPolarAngle=Math.PI*.47;
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
    this.controls.minPolarAngle=.36;this.controls.maxPolarAngle=Math.PI*.47;
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
    this.inner.setTheme(element);
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
      if(this.mode==='walk'){this.renderer.domElement.setPointerCapture(event.pointerId);}
    });
    this.renderer.domElement.addEventListener('pointermove',event=>{
      this.setPointer(event);
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
      const moved=this.pointerDown?Math.hypot(event.clientX-this.pointerDown.x,event.clientY-this.pointerDown.y):999;
      if(moved<7&&performance.now()-(this.pointerDown?.time||0)<650) {
        this.setPointer(event);this.raycast();
      }
      this.pointerDown=null;
      if(this.renderer.domElement.hasPointerCapture(event.pointerId))this.renderer.domElement.releasePointerCapture(event.pointerId);
    });
    this.renderer.domElement.addEventListener('pointercancel',()=>{this.pointerDown=null;});
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

  updateHover() {
    if(this.mode==='landing'||this.paused||this.passing)return;
    const hit=this.findHit();
    const id=hit?.type==='hotspot'?hit.id:hit?.type==='milestone'?`milestone:${hit.id}`:hit?.type||null;
    if(id===this.hovered)return;
    this.hovered=id;this.renderer.domElement.style.cursor=id?'pointer':'grab';
    this.onHover?.(id);
  }

  raycast() {
    if(this.passing)return;
    const hit=this.findHit();if(!hit)return;
    if(hit.type==='door'&&(this.mode==='room'||this.mode==='walk')){this.beginPassage('journey');return;}
    if(hit.type==='return'&&(this.mode==='journey'||this.mode==='journey-walk')){this.beginPassage('room');return;}
    if(hit.type==='milestone'){this.onMilestone?.(hit.id);return;}
    if(this.mode==='room'&&hit.type==='hotspot'&&!this.paused){this.onHotspot?.(hit.id);this.focusHotspot(hit.id);}
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
