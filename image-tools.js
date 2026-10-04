import {dilateBinary,planarFillPixels} from './context-fill.js';
export const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export const image=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Image illisible.'));i.src=src;});
export const blob=c=>new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('L’image est trop grande pour être exportée.')),'image/png'));
export const normalize=(rgba,size=1024,engine='birefnet')=>{const n=size*size,out=new Float32Array(n*3),mean=[.485,.456,.406],sd=[.229,.224,.225];let max=255;if(['u2netp','u2net','human','silueta'].includes(engine)){max=1;for(let p=0;p<rgba.length;p+=4)max=Math.max(max,rgba[p],rgba[p+1],rgba[p+2]);}for(let p=0;p<n;p++)for(let c=0;c<3;c++)out[c*n+p]=engine==='anime'?rgba[p*4+c]/255:(rgba[p*4+c]/max-mean[c])/sd[c];return out;};
export async function segment(source,progress,engine='isnet'){
 if(engine==='isnet'){
  const {removeBackground}=await import('@imgly/background-removal');
  const result=await removeBackground(await blob(source),{model:'isnet_quint8',device:'cpu',publicPath:new URL('/models/',location.href).href,progress:()=>progress('IS-Net analyse les contours…'),output:{format:'image/png'}});
  const i=await image(URL.createObjectURL(result)),c=canvas(source.width,source.height);c.getContext('2d').drawImage(i,0,0);URL.revokeObjectURL(i.src);return c;
 }
 if(!window.cutoutDesktop)throw Error('Ce modèle est disponible dans l’application locale.');
 const size=['u2netp','silueta','human','u2net'].includes(engine)?320:1024;
 const small=canvas(size,size);small.getContext('2d').drawImage(source,0,0,size,size);
 progress('Analyse locale · '+engine+'…');
 const output=await window.cutoutDesktop.segment({engine,inputs:[normalize(small.getContext('2d').getImageData(0,0,size,size).data,size,engine).buffer]});
 const values=new Float32Array(output.data);if(values.length!==size*size)throw Error('Taille du masque inattendue.');
 let min=Infinity,max=-Infinity;if(output.mode==='range')for(const v of values){min=Math.min(min,v);max=Math.max(max,v);}
 const rgba=small.getContext('2d').createImageData(size,size);
 for(let p=0;p<values.length;p++){let v=values[p];if(output.mode==='logits')v=1/(1+Math.exp(-v));if(output.mode==='range')v=(v-min)/Math.max(1e-6,max-min);rgba.data[p*4]=255;rgba.data[p*4+1]=255;rgba.data[p*4+2]=255;rgba.data[p*4+3]=Math.round(Math.max(0,Math.min(1,v))*255);}
 small.getContext('2d').putImageData(rgba,0,0);
 const result=canvas(source.width,source.height),ctx=result.getContext('2d');ctx.drawImage(source,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(small,0,0,result.width,result.height);return result;
}
let upscaler;
export async function enlarge(source,factor,progress){
  if(source.width*source.height*factor*factor>24000000||Math.max(source.width,source.height)*factor>8192)throw Error('Le résultat dépasserait 24 mégapixels ou 8 192 px de côté. Choisissez un facteur plus petit ou une image plus petite.');
  if(!upscaler){const [{default:Upscaler},{default:model},tf]=await Promise.all([import('upscaler'),import('@upscalerjs/esrgan-slim/2x'),import('@tensorflow/tfjs')]);try{await tf.setBackend('webgl');}catch{await tf.setBackend('cpu');}await tf.ready();upscaler=new Upscaler({model:{...model,path:new URL('/models/esrgan/model.json',location.href).href}});await upscaler.ready;}
  let result=source;
  const passes=Math.log2(factor);
  for(let step=0;step<passes;step++){
    // Feed opaque RGB to the network and resample alpha separately, preserving cutouts.
    const rgb=canvas(result.width,result.height),ctx=rgb.getContext('2d');const pix=result.getContext('2d').getImageData(0,0,result.width,result.height);for(let p=3;p<pix.data.length;p+=4)pix.data[p]=255;ctx.putImageData(pix,0,0);
    const output=await upscaler.upscale(rgb,{patchSize:64,padding:8,awaitNextFrame:true,progress:p=>progress(`Agrandissement IA : passe ${step+1}/${passes} · ${Math.round(p*100)} %`)});
    const i=await image(output);const next=canvas(result.width*2,result.height*2);next.getContext('2d').drawImage(i,0,0);
    const alpha=canvas(next.width,next.height);alpha.getContext('2d').drawImage(result,0,0,alpha.width,alpha.height);
    const a=alpha.getContext('2d').getImageData(0,0,alpha.width,alpha.height),r=next.getContext('2d').getImageData(0,0,next.width,next.height);for(let p=3;p<r.data.length;p+=4)r.data[p]=a.data[p];next.getContext('2d').putImageData(r,0,0);result=next;
  }
  return result;
}
let cvPromise;
export function opencv(){return cvPromise??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('/runtime/opencv.js',location.href).href;script.onload=async()=>{try{const cv=await window.cv;if(!cv?.inpaint)throw Error('Le moteur de remplissage est indisponible.');resolve(cv);}catch(e){reject(e);}};script.onerror=()=>reject(Error('Le moteur de remplissage ne peut pas être chargé.'));document.head.append(script);});}
export async function fill(source,selection,progress,engine='migan',margin=10){
  if(engine==='context'){const fast=contextualPlanarFill(source,selection,margin);if(fast){progress('Fond uni / dégradé reconstruit à partir du contexte.');return fast;}progress('Fond texturé : reconstruction Big-LaMa…');return neuralFill(source,selection,progress,'biglama',margin);}
  if(['lama','migan','biglama'].includes(engine))return neuralFill(source,selection,progress,engine,margin);
  const cv=await opencv();progress('Reconstruction de la zone sélectionnée…');await new Promise(r=>setTimeout(r,30));
  const scale=Math.min(1,1600/Math.max(source.width,source.height));const w=Math.round(source.width*scale),h=Math.round(source.height*scale);
  const c=canvas(w,h);c.getContext('2d').drawImage(source,0,0,w,h);const m=canvas(w,h);m.getContext('2d').drawImage(selection,0,0,w,h);
  const pixels=m.getContext('2d').getImageData(0,0,w,h).data;const binary=new Uint8Array(w*h);let count=0;for(let p=0;p<binary.length;p++){if(pixels[p*4+3]>10){binary[p]=255;count++;}}
  if(!count)throw Error('Sélectionnez d’abord une zone à supprimer.');if(count>binary.length*.8)throw Error('Gardez une partie du fond non sélectionnée pour permettre le remplissage.');
  const mats=[];try{const src=cv.imread(c);mats.push(src);const rgb=new cv.Mat();mats.push(rgb);cv.cvtColor(src,rgb,cv.COLOR_RGBA2RGB);const mask=cv.matFromArray(h,w,cv.CV_8UC1,binary);mats.push(mask);const dst=new cv.Mat();mats.push(dst);const kernel=cv.Mat.ones(Math.max(1,Math.round(margin*scale))*2+1,Math.max(1,Math.round(margin*scale))*2+1,cv.CV_8U);mats.push(kernel);cv.dilate(mask,mask,kernel);cv.inpaint(rgb,mask,dst,5,engine==='navier'?cv.INPAINT_NS:cv.INPAINT_TELEA);cv.imshow(c,dst);const out=canvas(source.width,source.height);const ctx=out.getContext('2d');ctx.drawImage(source,0,0);const repaired=canvas(source.width,source.height),rctx=repaired.getContext('2d');rctx.drawImage(c,0,0,repaired.width,repaired.height);rctx.globalCompositeOperation='destination-in';const expanded=canvas(w,h);cv.imshow(expanded,mask);const ep=expanded.getContext('2d').getImageData(0,0,w,h);for(let i=0;i<ep.data.length;i+=4)ep.data[i+3]=ep.data[i];expanded.getContext('2d').putImageData(ep,0,0);rctx.drawImage(expanded,0,0,repaired.width,repaired.height);ctx.drawImage(repaired,0,0);return out;}finally{mats.forEach(m=>m.delete());}
}
export async function regions(cutout){
  const cv=await opencv();const scale=Math.min(1,512/Math.max(cutout.width,cutout.height));const w=Math.round(cutout.width*scale),h=Math.round(cutout.height*scale);const c=canvas(w,h);c.getContext('2d').drawImage(cutout,0,0,w,h);const rgba=c.getContext('2d').getImageData(0,0,w,h).data;const bytes=new Uint8Array(w*h);for(let i=0;i<bytes.length;i++)bytes[i]=rgba[i*4+3]>127?255:0;
  const mats=[];try{const src=cv.matFromArray(h,w,cv.CV_8UC1,bytes),labels=new cv.Mat(),stats=new cv.Mat(),centroids=new cv.Mat();mats.push(src,labels,stats,centroids);const n=cv.connectedComponentsWithStats(src,labels,stats,centroids,8,cv.CV_32S);const all=[];for(let id=1;id<n;id++){const area=stats.intAt(id,cv.CC_STAT_AREA);if(area>Math.max(20,w*h*.001)){const mask=canvas(w,h),pixels=mask.getContext('2d').createImageData(w,h);for(let p=0;p<w*h;p++)if(labels.data32S[p]===id){pixels.data[p*4]=255;pixels.data[p*4+3]=255;}mask.getContext('2d').putImageData(pixels,0,0);all.push({area,mask});}}return all.sort((a,b)=>b.area-a.area).slice(0,12);}finally{mats.forEach(m=>m.delete());}
}

export function contextualPlanarFill(source,selection,margin=10){
 const w=source.width,h=source.height,mask=selection.getContext('2d').getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1,count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[(y*w+x)*4+3]>10){count++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(!count)throw Error('Peignez ou sélectionnez la zone à effacer.');if(count>w*h*.8)throw Error('Gardez une partie du fond non sélectionnée.');const pad=Math.max(20,margin+16);x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(w,x1+pad+1);y1=Math.min(h,y1+pad+1);const cw=x1-x0,ch=y1-y0,local=new Uint8Array(cw*ch);for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)local[y*cw+x]=mask[((y+y0)*w+x+x0)*4+3]>10?1:0;const expanded=dilateBinary(local,cw,ch,margin),pixels=source.getContext('2d').getImageData(x0,y0,cw,ch),filled=planarFillPixels(pixels.data,expanded,cw,ch);if(!filled)return null;pixels.data.set(filled);const out=canvas(w,h);out.getContext('2d').drawImage(source,0,0);out.getContext('2d').putImageData(pixels,x0,y0);return out;
}
async function neuralFill(source,selection,progress,engine,margin){
 if(!window.cutoutDesktop)throw Error('Le modèle IA nécessite l’application locale.');
 const w=source.width,h=source.height,pix=selection.getContext('2d').getImageData(0,0,w,h).data,binaryFull=new Uint8Array(w*h);let x0=w,y0=h,x1=-1,y1=-1,count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pix[(y*w+x)*4+3]>10){binaryFull[y*w+x]=1;count++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(!count)throw Error('Peignez ou sélectionnez la zone à effacer.');if(count>w*h*.8)throw Error('Gardez une partie du fond non sélectionnée.');const expanded=dilateBinary(binaryFull,w,h,margin),maskCanvas=canvas(w,h),maskPixels=maskCanvas.getContext('2d').createImageData(w,h);for(let p=0;p<expanded.length;p++){maskPixels.data[p*4]=255;maskPixels.data[p*4+3]=expanded[p]?255:0;}maskCanvas.getContext('2d').putImageData(maskPixels,0,0);const pad=Math.max(64,Math.max(x1-x0,y1-y0)*.8)+margin;x0=Math.max(0,Math.floor(x0-pad));y0=Math.max(0,Math.floor(y0-pad));x1=Math.min(w,Math.ceil(x1+pad+1));y1=Math.min(h,Math.ceil(y1+pad+1));const box={x:x0,y:y0,w:x1-x0,h:y1-y0},size=512,n=size*size,c=canvas(size,size),m=canvas(size,size),scale=Math.min(size/box.w,size/box.h),dw=box.w*scale,dh=box.h*scale,dx=(size-dw)/2,dy=(size-dh)/2,ctx=c.getContext('2d');
 // Replicate edge colours into padding, preserving the source aspect ratio.
 ctx.drawImage(source,box.x,box.y,box.w,box.h,dx,dy,dw,dh);if(dx>0){ctx.drawImage(source,box.x,box.y,1,box.h,0,dy,dx,dh);ctx.drawImage(source,box.x+box.w-1,box.y,1,box.h,dx+dw,dy,dx,dh);}if(dy>0){ctx.drawImage(c,0,dy,512,1,0,0,512,dy);ctx.drawImage(c,0,dy+dh-1,512,1,0,dy+dh,512,dy);}m.getContext('2d').drawImage(maskCanvas,box.x,box.y,box.w,box.h,dx,dy,dw,dh);
 const rgba=ctx.getImageData(0,0,size,size).data,sel=m.getContext('2d').getImageData(0,0,size,size).data,Constructor=engine==='migan'?Uint8Array:Float32Array,rgb=new Constructor(n*3),binary=new Constructor(n);for(let p=0;p<n;p++){const hole=sel[p*4+3]>10;binary[p]=engine==='migan'?(hole?0:255):(hole?1:0);for(let ch=0;ch<3;ch++)rgb[ch*n+p]=rgba[p*4+(engine==='lama'?2-ch:ch)]/(engine==='migan'?1:255);}
 progress(engine==='biglama'?'Big-LaMa : reconstruction du fond…':engine==='migan'?'MI-GAN : remplissage rapide…':'LaMa : reconstruction…');const output=await window.cutoutDesktop.segment({engine,inputs:[rgb.buffer,binary.buffer]}),values=output.type==='uint8'?new Uint8Array(output.data):new Float32Array(output.data);if(values.length!==n*3)throw Error('Sortie du modèle inattendue.');const data=ctx.createImageData(size,size);for(let p=0;p<n;p++){for(let ch=0;ch<3;ch++)data.data[p*4+ch]=Math.max(0,Math.min(255,values[(engine==='lama'?2-ch:ch)*n+p]));data.data[p*4+3]=255;}ctx.putImageData(data,0,0);const repaired=canvas(w,h),rctx=repaired.getContext('2d');rctx.drawImage(c,dx,dy,dw,dh,box.x,box.y,box.w,box.h);rctx.globalCompositeOperation='destination-in';rctx.drawImage(maskCanvas,0,0);const out=canvas(w,h);out.getContext('2d').drawImage(source,0,0);out.getContext('2d').drawImage(repaired,0,0);return out;
}
