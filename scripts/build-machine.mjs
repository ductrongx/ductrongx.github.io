import * as k from './vendor/iso-kit.mjs';
import {writeFileSync} from 'node:fs';
const P=k.fitProjection(k.boxCorners({x:-145,y:-82,w:290,d:164,r:8},-18,140),600,390,{pad:20,azimuth:42});
const parts=[];
const slab=(x,y,w,d,z,h,tone='mid',r=2)=>parts.push(k.solidSvg(k.slabOf({x,y,w,d,r},z,h,P,8,1),{tone}));
for(const x of [-125,125])for(const y of [-62,62])slab(x-8,y-8,16,16,-18,10,'lo');
slab(-145,-82,290,164,-8,8,'mid',8);
slab(-134,-70,268,140,0,2,'lo',4);
for(const x of [-130,130])for(const y of [-67,67]) parts.push(k.dotsSvg([[...k.iso([x,y,3],P)]],.9,{tone:'hi'}));
for(const y of [-42,42]) {slab(-120,y-3,240,6,8,7,'hi');for(const x of [-120,120])slab(x-7,y-7,14,14,2,6,'mid');}
for(let n=0;n<25;n++)slab(-112+n*9,57,1, n%5===0?8:4,2,.5,'hi',0);
for(const x of [-65,65]){slab(x-5,-58,10,116,3,4,'hi');slab(x-5,-58,10,10,7,80,'mid');slab(x-5,48,10,10,7,80,'mid');}
slab(-70,-58,140,10,87,8,'hi');slab(-70,48,140,10,87,8,'hi');
slab(-46,-46,92,92,77,10,'lo');slab(-35,-35,70,70,87,12,'mid');
for(let i=0;i<8;i++)slab(-28+i*8,-26,3,52,99,2,'lo');
slab(86,-28,42,56,3,5,'mid');slab(86,-28,42,3,8,12,'hi');slab(125,-28,3,56,8,12,'mid');
const overhead=parts.splice(39).join('');const staticBody=parts.join('');parts.length=0;
slab(-112,-28,45,56,18,3,'hi');
for(let i=0;i<4;i++)slab(-105,-19+i*10,28-i*3,1,21,.3,'lo',0);
const svg=k.figureSvg({width:600,height:390,label:'Máy đọc mẫu isometric — minh họa quy trình AI',body:staticBody+'<g data-carriage>'+parts.join('')+'</g>'+overhead});
writeFileSync(new URL('../src/components/machine.svg',import.meta.url),svg);
