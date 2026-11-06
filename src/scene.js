import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DojoRoom } from './room.js';

export class SanctuaryScene {
  constructor({container,onHotspot,onHover,onWalkChange,onError}) {
    this.container=container;this.onHotspot=onHotspot;this.onHover=onHover;this.onWalkChange=onWalkChange;this.onError=onError;
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
    this.setLandingCamera(true);
    this.bindEvents();this.resize();
    this.renderer.setAnimationLoop(()=>this.tick());
    this.renderer.domElement.dataset.sceneReady='true';
  }

  setLandingCamera(immediate=false) {
    this.mode='landing';this.room.setHotspotsVisible(false);
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
    this.controls.minAzimuthAngle=-.76;this.controls.maxAzimuthAngle=1.12;
    this.controls.maxPolarAngle=Math.PI*.47;
    this.camera.fov=mobile?56:44;this.camera.updateProjectionMatrix();
    if(immediate){this.camera.position.copy(position);this.controls.target.copy(target);this.controls.update();}
    else this.animateCamera(position,target,1550);
    this.active=true;
  }

  animateCamera(position,target,duration=900,onDone) {
    this.controls.enabled=false;
    this.transition={from:this.camera.position.clone(),to:position.clone(),targetFrom:this.controls.target.clone(),targetTo:target.clone(),started:performance.now(),duration:this.reducedMotion?1:duration,onDone};
  }

  resetView() {if(this.mode==='walk')this.leaveWalk();else if(this.mode==='room')this.setRoomCamera(false);}

  focusHotspot(id) {
    if(this.mode!=='room')return;
    const h=this.room.hotspotData.find(item=>item.id===id);if(!h)return;
    const target=h.group.position.clone();target.y=Math.max(1,target.y-.35);
    if(id==='memory')target.y=2.35;
    const direction=id==='memory'?new THREE.Vector3(4.1,1.95,6.9):new THREE.Vector3(5.6,3.4,6.2);
    // Keep close viewpoints within the front-facing camera envelope.
    const position=target.clone().add(direction).clamp(new THREE.Vector3(-3,3.5,2),new THREE.Vector3(9,7,10));
    this.animateCamera(position,target,780);
  }

  enterWalk() {
    if(this.mode==='walk'){this.leaveWalk();return;}
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
    this.keys.clear();this.onWalkChange?.(false);this.setRoomCamera(false);
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
      if(this.mode!=='walk'&&moved<7&&performance.now()-(this.pointerDown?.time||0)<650) {
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
      if(event.key==='Escape'){if(this.mode==='walk'){this.leaveWalk();return;}this.keys.clear();return;}
      if(this.mode!=='walk')return;
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
    const objects=[];this.room.hotspotData.forEach(h=>{if(h.group.visible)objects.push(h.group);});
    const hits=this.raycaster.intersectObjects(objects,true);
    return hits[0]?.object?.userData.hotspot||hits[0]?.object?.parent?.userData?.hotspot||null;
  }

  updateHover() {
    if(this.mode==='landing'||this.paused)return;
    const hit=this.findHit();
    if(hit===this.hovered)return;
    this.hovered=hit;this.renderer.domElement.style.cursor=hit?'pointer':this.mode==='walk'?'grab':'grab';
    this.onHover?.(hit);
  }

  raycast() {
    if(this.paused)return;
    const id=this.findHit();
    if(id){this.onHotspot?.(id);this.focusHotspot(id);}
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
    const {x,z}=this.camera.position;
    if(this.room.canWalkTo(x+dx,z))this.camera.position.x+=dx;
    if(this.room.canWalkTo(this.camera.position.x,z+dz))this.camera.position.z+=dz;
    this.camera.position.y=1.64;
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
    }else if(this.mode==='walk')this.walk(delta);
    else this.controls.update();
    // In orbit view, prevent zooming out through the rear walls while preserving a welcoming diorama angle.
    if(this.mode!=='walk')this.camera.position.y=Math.max(.6,this.camera.position.y);
    this.room.update(this.elapsed,this.camera);
    this.room.journeyMemory?.update(this.reducedMotion?0:this.elapsed);
    this.renderer.render(this.scene,this.camera);
  }
}
