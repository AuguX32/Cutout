const clamp=x=>Math.max(0,Math.min(255,x));
export function floodSelection(data,w,h,x,y,tolerance=32,contiguous=true){
 const out=new Uint8ClampedArray(w*h*4),start=(Math.min(h-1,Math.max(0,y|0))*w+Math.min(w-1,Math.max(0,x|0)))*4,target=Array.from(data.slice(start,start+4));
 const matches=i=>Math.sqrt((data[i]-target[0])**2+(data[i+1]-target[1])**2+(data[i+2]-target[2])**2+(data[i+3]-target[3])**2)<=tolerance*2;
 const mark=n=>{out[n*4]=255;out[n*4+3]=255;};
 if(!contiguous){for(let n=0;n<w*h;n++)if(matches(n*4))mark(n);return out;}
 const seen=new Uint8Array(w*h),stack=new Int32Array(w*h);let head=0,tail=1;stack[0]=start/4;seen[start/4]=1;
 while(head<tail){const n=stack[head++];if(!matches(n*4))continue;mark(n);const xx=n%w,yy=(n/w)|0;for(const z of [xx?n-1:-1,xx<w-1?n+1:-1,yy?n-w:-1,yy<h-1?n+w:-1])if(z>=0&&!seen[z]){seen[z]=1;stack[tail++]=z;}}
 return out;
}
export function boxBlur(data,w,h,r=2){
 r=Math.max(1,Math.min(100,r|0));const a=new Float32Array(data.length),out=new Uint8ClampedArray(data.length);
 for(let y=0;y<h;y++)for(let c=0;c<4;c++){let sum=0;for(let x=-r;x<=r;x++)sum+=data[(y*w+Math.max(0,Math.min(w-1,x)))*4+c];for(let x=0;x<w;x++){a[(y*w+x)*4+c]=sum/(r*2+1);sum+=data[(y*w+Math.min(w-1,x+r+1))*4+c]-data[(y*w+Math.max(0,x-r))*4+c];}}
 for(let x=0;x<w;x++)for(let c=0;c<4;c++){let sum=0;for(let y=-r;y<=r;y++)sum+=a[(Math.max(0,Math.min(h-1,y))*w+x)*4+c];for(let y=0;y<h;y++){out[(y*w+x)*4+c]=sum/(r*2+1);sum+=a[(Math.min(h-1,y+r+1)*w+x)*4+c]-a[(Math.max(0,y-r)*w+x)*4+c];}}
 return out;
}
export function filterPixels(data,w,h,kind,amount=30){
 const out=new Uint8ClampedArray(data),a=amount/100;
 if(['blur','sharpen','highpass','edge'].includes(kind)){const blur=boxBlur(data,w,h,Math.max(1,Math.round(amount/10)));for(let i=0;i<data.length;i+=4)for(let c=0;c<3;c++)out[i+c]=kind==='blur'?blur[i+c]:kind==='sharpen'?clamp(data[i+c]+a*4*(data[i+c]-blur[i+c])):kind==='highpass'?clamp(128+data[i+c]-blur[i+c]):clamp(Math.abs(data[i+c]-blur[i+c])*5);return out;}
 if(kind==='pixelate'){const block=Math.max(2,Math.round(amount/2));for(let y=0;y<h;y+=block)for(let x=0;x<w;x+=block){const sums=[0,0,0,0];let n=0;for(let yy=y;yy<Math.min(h,y+block);yy++)for(let xx=x;xx<Math.min(w,x+block);xx++){n++;for(let c=0;c<4;c++)sums[c]+=data[(yy*w+xx)*4+c];}for(let yy=y;yy<Math.min(h,y+block);yy++)for(let xx=x;xx<Math.min(w,x+block);xx++)for(let c=0;c<4;c++)out[(yy*w+xx)*4+c]=sums[c]/n;}return out;}
 if(kind==='median'){for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let c=0;c<3;c++){const v=[];for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++)v.push(data[(yy*w+xx)*4+c]);v.sort((a,b)=>a-b);out[(y*w+x)*4+c]=v[v.length>>1];}return out;}
 let seed=123456789;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
 const lum=[];if(kind==='autolevels')for(let i=0;i<data.length;i+=4)if(data[i+3])lum.push(Math.round((data[i]+data[i+1]+data[i+2])/3));lum.sort((a,b)=>a-b);const low=lum[Math.floor(lum.length*.01)]??0,high=lum[Math.floor(lum.length*.99)]??255;
 for(let i=0;i<data.length;i+=4){let [r,g,b]=data.slice(i,i+3);const l=.2126*r+.7152*g+.0722*b;
  if(kind==='grayscale')r=g=b=l;
  else if(kind==='invert'){r=255-r;g=255-g;b=255-b;}
  else if(kind==='sepia'){[r,g,b]=[.393*r+.769*g+.189*b,.349*r+.686*g+.168*b,.272*r+.534*g+.131*b];}
  else if(kind==='threshold')r=g=b=l>amount*2.55?255:0;
  else if(kind==='posterize'){const n=Math.max(2,Math.round(amount/5));[r,g,b]=[r,g,b].map(x=>Math.round(x/255*(n-1))*255/(n-1));}
  else if(kind==='noise'){const n=(random()-.5)*amount;[r,g,b]=[r+n,g+n,b+n];}
  else if(kind==='exposure'){const k=2**((amount-50)/25);[r,g,b]=[r*k,g*k,b*k];}
  else if(kind==='gamma'){const gamma=2**((amount-50)/40);[r,g,b]=[r,g,b].map(x=>255*(x/255)**(1/gamma));}
  else if(kind==='temperature'){r+=(amount-50)*1.5;b-=(amount-50)*1.5;}
  else if(kind==='vibrance'){const k=1+a*(1-(Math.max(r,g,b)-Math.min(r,g,b))/255);[r,g,b]=[l+(r-l)*k,l+(g-l)*k,l+(b-l)*k];}
  else if(kind==='autolevels'){[r,g,b]=[r,g,b].map(x=>(x-low)*255/Math.max(1,high-low));}
  else if(kind==='vignette'){const n=i/4,x=n%w/w-.5,y=Math.floor(n/w)/h-.5,k=Math.max(0,1-(x*x+y*y)*a*2);[r,g,b]=[r*k,g*k,b*k];}
  out[i]=clamp(r);out[i+1]=clamp(g);out[i+2]=clamp(b);
 }
 return out;
}
export function compositePixels(original,changed,selection){const out=new Uint8ClampedArray(original);for(let i=0;i<out.length;i+=4){const a=selection?selection[i+3]/255:1;for(let c=0;c<4;c++)out[i+c]=original[i+c]*(1-a)+changed[i+c]*a;}return out;}
export function histogram(data){const bins=Array.from({length:4},()=>new Uint32Array(256));for(let i=0;i<data.length;i+=4)if(data[i+3]){for(let c=0;c<3;c++)bins[c][data[i+c]]++;bins[3][Math.round(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])]++;}return bins;}
// Local seeded, edge-aware region; allocating only the brush rectangle keeps
// pointer strokes independent of the document's total pixel count.
export function smartBrushSelection(data,w,h,x,y,radius,tolerance=32){
 x=Math.max(0,Math.min(w-1,x));y=Math.max(0,Math.min(h-1,y));radius=Math.max(1,Math.min(512,radius));
 const left=Math.max(0,Math.floor(x-radius-1)),top=Math.max(0,Math.floor(y-radius-1)),width=Math.min(w-left,Math.ceil(x+radius+2)-left),height=Math.min(h-top,Math.ceil(y+radius+2)-top),out=new Uint8ClampedArray(width*height*4);
 const sx=Math.floor(x),sy=Math.floor(y),seed=(sy*w+sx)*4,limit=Math.max(2,tolerance)*1.5,seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let head=0,tail=1;queue[0]=(sy-top)*width+sx-left;seen[queue[0]]=1;
 const matches=i=>{if(data[seed+3]<8)return data[i+3]<8;if(data[i+3]<8)return false;const dr=data[i]-data[seed],dg=data[i+1]-data[seed+1],db=data[i+2]-data[seed+2],dy=.299*dr+.587*dg+.114*db,cb=-.169*dr-.331*dg+.5*db,cr=.5*dr-.419*dg-.081*db;return dy*dy+cb*cb+cr*cr<=limit*limit;};
 while(head<tail){const n=queue[head++],xx=n%width,yy=Math.floor(n/width),dx=left+xx-x,dy=top+yy-y,d=Math.hypot(dx,dy);if(d>radius+.5||!matches(((top+yy)*w+left+xx)*4))continue;out[n*4]=255;out[n*4+3]=Math.min(255,Math.max(0,(radius+.5-d)*255));for(const z of [xx?n-1:-1,xx<width-1?n+1:-1,yy?n-width:-1,yy<height-1?n+width:-1])if(z>=0&&!seen[z]){seen[z]=1;queue[tail++]=z;}}
 return {x:left,y:top,width,height,data:out};
}
