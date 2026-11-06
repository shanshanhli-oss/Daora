import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mesh(geometry, material, parent, position = [0,0,0], rotation = [0,0,0]) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position); object.rotation.set(...rotation);
  object.castShadow = true; object.receiveShadow = true;
  if (parent) parent.add(object);
  return object;
}

export function box(parent, material, size, position, radius = 0) {
  const geometry = radius > 0
    ? new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map(v => v / 2.01)))
    : new THREE.BoxGeometry(...size);
  return mesh(geometry, material, parent, position);
}

export function cylinder(parent, material, radii, height, position, segments = 32) {
  const [top, bottom = top] = Array.isArray(radii) ? radii : [radii, radii];
  return mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material, parent, position);
}

export function sphere(parent, material, radius, position, scale = [1,1,1]) {
  const object = mesh(new THREE.SphereGeometry(radius, 28, 18), material, parent, position);
  object.scale.set(...scale); return object;
}

export function torus(parent, material, radius, tube, position, rotation = [0,0,0], arc = Math.PI * 2) {
  return mesh(new THREE.TorusGeometry(radius, tube, 8, 72, arc), material, parent, position, rotation);
}

export function lathe(parent, material, points, position = [0,0,0], segments = 40) {
  return mesh(new THREE.LatheGeometry(points.map(([x,y])=>new THREE.Vector2(x,y)), segments), material, parent, position);
}

export function tube(parent, material, points, radius = .025, position = [0,0,0]) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve, 42, radius, 8, false), material, parent, position);
}

export function rodBetween(parent, material, start, end, radius = .03) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const delta = b.clone().sub(a);
  const object = mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),10),material,parent);
  object.position.copy(a.add(b).multiplyScalar(.5));
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  return object;
}

export function frame(parent, material, width, height, depth, thickness, position = [0,0,0]) {
  const group = new THREE.Group(); group.position.set(...position); parent?.add(group);
  box(group,material,[width,thickness,depth],[0,height/2-thickness/2,0],.015);
  box(group,material,[width,thickness,depth],[0,-height/2+thickness/2,0],.015);
  box(group,material,[thickness,height-2*thickness,depth],[-width/2+thickness/2,0,0],.015);
  box(group,material,[thickness,height-2*thickness,depth],[width/2-thickness/2,0,0],.015);
  return group;
}

export function vase(parent, material, position, scale = 1) {
  return lathe(parent,material,[[0,0],[.18,0],[.24,.08],[.29,.35],[.25,.55],[.11,.66],[.105,.82],[.15,.84]],position,48).scale.setScalar(scale);
}

export function cup(parent, material, position, scale = 1) {
  const object = lathe(parent,material,[[0,0],[.095,0],[.11,.025],[.145,.15],[.155,.18],[.14,.19],[.13,.15],[.085,.04],[0,.04]],position,32);
  object.scale.setScalar(scale);
  torus(object,material,.105,.018,[0,-.035,0],[Math.PI/2,0,0]);
  return object;
}

export function plantBranch(parent, materials, origin, height = 1.6, seed = 0) {
  const [x,y,z] = origin;
  const points = [[x,y,z],[x+.06*Math.sin(seed),y+height*.35,z-.05],[x-.08,y+height*.7,z+.04],[x+.1,y+height,z-.08]];
  tube(parent,materials.wood,points,.025);
  const leafGeometry = new THREE.SphereGeometry(1,12,8);
  for(let i=0;i<8;i++) {
    const theta=seed+i*2.399, t=.23+i*.095;
    const px=x+Math.sin(i*.9)*.07, py=y+height*t, pz=z;
    const reach=.28+.12*Math.sin(i*2);
    const tip=[px+Math.cos(theta)*reach,py+.16,pz+Math.sin(theta)*reach];
    rodBetween(parent,materials.darkWood,[px,py,pz],tip,.009);
    const leaf=mesh(leafGeometry,i%3?materials.leaf:materials.leafLight,parent,[tip[0],tip[1],tip[2]]);
    leaf.scale.set(.15,.035,.30); leaf.rotation.set(.15, -theta, .35);
    if(i>4) {
      const other=mesh(leafGeometry,materials.leaf,parent,[px-Math.cos(theta)*reach*.7,py+.17,pz-Math.sin(theta)*reach*.7]);
      other.scale.set(.13,.03,.26);other.rotation.y=-theta;
    }
  }
}

export function paperLantern(parent, materials, position, radius = .5, hanging = 1.4) {
  const group=new THREE.Group();group.position.set(...position);parent.add(group);
  cylinder(group,materials.darkWood,.025,hanging,[0,hanging/2+radius*.8,0],10);
  const body=mesh(new THREE.SphereGeometry(radius,40,24),materials.lantern,group,[0,0,0]);body.scale.y=1.15;
  for(let i=-4;i<=4;i++) {
    const y=i*radius*.22, r=radius*Math.sqrt(Math.max(0,1-(y/(radius*1.15))**2));
    torus(group,materials.agedBrass,r,.005,[0,y,0],[Math.PI/2,0,0]);
  }
  cylinder(group,materials.darkWood,radius*.35,.08,[0,radius*1.13,0]);
  cylinder(group,materials.darkWood,radius*.35,.08,[0,-radius*1.13,0]);
  const tassel=new THREE.Group();tassel.position.y=-radius*1.16;group.add(tassel);
  cylinder(tassel,materials.agedBrass,.014,.22,[0,-.11,0],8);
  sphere(tassel,materials.brass,.055,[0,-.24,0],[1,.65,1]);
  for(let i=0;i<12;i++) {
    const a=i/12*Math.PI*2;
    cylinder(tassel,materials.ochreLinen,.009,.30,[Math.cos(a)*.025,-.41,Math.sin(a)*.025],5);
  }
  return { group, body, tassel };
}

export function makeGlow(parent, materials, position, color = 0xe3b26e, scale = .8, opacity = .5) {
  const material=new THREE.SpriteMaterial({map:materials.glow,color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false});
  const sprite=new THREE.Sprite(material);sprite.position.set(...position);sprite.scale.set(scale,scale,1);parent.add(sprite);return sprite;
}
