import * as THREE from 'three';
import { textTexture } from './materials.js';

/** A deliberately constructed bagua medallion, including the two taiji halves and eight trigrams. */
export function createBagua() {
  const texture=textTexture('',{width:1536,height:1536,border:false});
  const ctx=texture.image.getContext('2d'), w=texture.image.width, h=texture.image.height;
  ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);
  const grad=ctx.createRadialGradient(0,0,0,0,0,w/2);grad.addColorStop(0,'#2e2830');grad.addColorStop(.68,'#373039');grad.addColorStop(1,'#1c1a21');
  ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,w/2,0,Math.PI*2);ctx.fill();
  const circle=(r,color,width=2)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();};
  circle(742,'#a3844c',5);circle(728,'#8c7045',2);circle(685,'#705839',2);circle(560,'#8c7045',3);circle(480,'#584731',2);circle(268,'#b29357',4);
  // Small engraved ticks and compass directions.
  ctx.strokeStyle='#b19561';ctx.lineWidth=3;
  for(let i=0;i<64;i++){ctx.save();ctx.rotate(i/64*Math.PI*2);ctx.beginPath();ctx.moveTo(0,-712);ctx.lineTo(0,i%8===0?-690:-702);ctx.stroke();ctx.restore();}
  const names=['乾','兑','离','震','巽','坎','艮','坤'];
  const binaries=[[1,1,1],[1,1,0],[1,0,1],[1,0,0],[0,1,1],[0,1,0],[0,0,1],[0,0,0]];
  ctx.font='48px "Noto Serif CJK SC", serif';ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=0;i<8;i++) {
    ctx.save();ctx.rotate(i/8*Math.PI*2);
    ctx.fillStyle='#ae915d';ctx.fillText(names[i],0,-642);
    for(let line=0;line<3;line++) {
      const y=-592+line*30;
      ctx.fillStyle='#a98b56';
      if(binaries[i][line])ctx.fillRect(-75,y-6,150,12);
      else {ctx.fillRect(-75,y-6,65,12);ctx.fillRect(10,y-6,65,12);}
    }
    ctx.restore();
  }
  // Four directional inscriptions.
  ctx.font='34px "Noto Serif CJK SC",serif';ctx.fillStyle='#745e3f';
  ctx.fillText('天',0,-415);ctx.fillText('地',0,415);ctx.fillText('阴',-410,0);ctx.fillText('阳',410,0);
  // Proper continuous S-shaped taijitu halves.
  const r=246;
  ctx.save();ctx.rotate(-.28);
  ctx.beginPath();ctx.moveTo(0,-r);ctx.arc(0,0,r,-Math.PI/2,Math.PI/2,false);ctx.arc(0,r/2,r/2,Math.PI/2,-Math.PI/2,true);ctx.arc(0,-r/2,r/2,Math.PI/2,3*Math.PI/2,false);ctx.closePath();
  ctx.fillStyle='#d5c8a8';ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=6;ctx.fill();
  ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(0,-r);ctx.arc(0,0,r,-Math.PI/2,Math.PI/2,false);ctx.arc(0,r/2,r/2,Math.PI/2,-Math.PI/2,true);ctx.arc(0,-r/2,r/2,Math.PI/2,3*Math.PI/2,false);ctx.closePath();ctx.strokeStyle='#847759';ctx.lineWidth=2;ctx.stroke();
  // Upper white dot is dark; lower dark half dot is ivory.
  ctx.fillStyle='#29242b';ctx.beginPath();ctx.arc(0,-r/2,31,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d5c8a8';ctx.beginPath();ctx.arc(0,r/2,31,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.restore();texture.needsUpdate=true;
  return texture;
}
