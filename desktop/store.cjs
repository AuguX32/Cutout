const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const MAX_BYTES = 260 * 1024 * 1024;
const emptyState = () => ({version:1, updatedAt:null, session:null});
function validate(state) {
  if (!state || state.version !== 1 || (state.updatedAt !== null && typeof state.updatedAt !== 'string')) throw Error('Format JSON invalide.');
  if (state.session !== null) {
    const s=state.session;
    if(s.documentId!==undefined&&(typeof s.documentId!=='string'||s.documentId.length>64))throw Error('Identifiant document invalide.');
    if(s.documents!==undefined){if(!Array.isArray(s.documents)||s.documents.length>7)throw Error('Maximum huit documents.');const ids=new Set([s.documentId]);for(const d of s.documents){if(!d||d.documents!==undefined||typeof d.documentId!=='string'||ids.has(d.documentId))throw Error('Document invalide.');ids.add(d.documentId);validate({version:1,updatedAt:null,session:d});}}
    if(s.documentOrder!==undefined&&(!Array.isArray(s.documentOrder)||s.documentOrder.length>8||s.documentOrder.some(x=>typeof x!=='string'||x.length>64)))throw Error('Ordre des documents invalide.');
    if (!s || typeof s.name !== 'string' || s.name.length>255 || !['image/png','image/jpeg','image/webp'].includes(s.type)) throw Error('Image invalide.');
    if (typeof s.source !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(s.source) || s.source.length>21*1024*1024) throw Error('Image source invalide.');
    if (s.tool !== undefined && !['cutout','upscale','erase','compose'].includes(s.tool)) throw Error('Outil invalide.');
    if (s.project !== undefined) validateProject(s.project);
    if (s.result !== null && (typeof s.result !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(s.result) || s.result.length>134*1024*1024)) throw Error('Résultat invalide.');
  }
  return state;
}
function validateProject(p) {
  const color = x => x === null || (typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x));
  const data = x => x === null || (typeof x === 'string' && x.length < 134*1024*1024 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]*={0,2}$/.test(x));
  const number = x => typeof x === 'number' && Number.isFinite(x);
  if (!p || !color(p.background) || !data(p.backgroundImage) || !Array.isArray(p.layers) || p.layers.length>30) throw Error('Composition invalide.');
  const ids = new Set();let bases=0;
  for (const l of p.layers) {
    if (!l || typeof l.id !== 'string' || l.id.length>64 || ids.has(l.id) || !['base','image','text','gradient'].includes(l.kind) || !number(l.x) || !number(l.y) || Math.abs(l.x)>1000000 || Math.abs(l.y)>1000000 || !number(l.scale) || l.scale<=0 || l.scale>1000 || !number(l.rotation) || Math.abs(l.rotation)>180 || !number(l.opacity) || l.opacity<0 || l.opacity>1) throw Error('Calque invalide.');
    ids.add(l.id);
    for(const k of ['visible','locked','italic','flipX','flipY','maskDisabled','shadowEnabled'])if(l[k]!==undefined&&typeof l[k]!=='boolean')throw Error('Propriété du calque invalide.');
    for(const k of ['brightness','contrast','saturation'])if(l[k]!==undefined&&(!number(l[k])||l[k]<0||l[k]>200))throw Error('Réglage invalide.');
    if(l.kind==='base'&&++bases>1)throw Error('Plusieurs images principales.');
    if(['base','gradient'].includes(l.kind)&&(!number(l.width)||!number(l.height)||l.width<=0||l.height<=0||l.width>25000||l.height>25000))throw Error('Dimensions du calque invalides.');
    if(l.maskData!==undefined&&!data(l.maskData))throw Error('Masque de calque invalide.');
    if(l.blend!==undefined&&!['source-over','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'].includes(l.blend))throw Error('Mode de fusion invalide.');
    if(l.name!==undefined&&(typeof l.name!=='string'||l.name.length>255))throw Error('Nom du calque invalide.');
    if(l.gradient!==undefined&&l.gradient!==null){const g=l.gradient;if(!g||!color(g.start)||!color(g.end)||g.start===null||g.end===null||!['x1','y1','x2','y2','mid'].every(k=>number(g[k]))||Math.abs(g.x1)>10000||Math.abs(g.y1)>10000||Math.abs(g.x2)>10000||Math.abs(g.y2)>10000||g.mid<.01||g.mid>.99)throw Error('Dégradé invalide.');}
    if(l.kind==='gradient'&&!l.gradient)throw Error('Dégradé absent.');
    if(l.textBackground!==undefined&&(!color(l.textBackground)))throw Error('Fond de texte invalide.');
    if(l.padding!==undefined&&(!number(l.padding)||l.padding<0||l.padding>100))throw Error('Marge de texte invalide.');
    if(l.weight!==undefined&&![400,600,800].includes(l.weight))throw Error('Graisse invalide.');

    if(l.kind==='image' && (!data(l.data) || l.data===null || !number(l.width) || !number(l.height) || l.width<=0 || l.height<=0 || l.width>25000 || l.height>25000 || typeof l.name!=='string' || l.name.length>255)) throw Error('Image du calque invalide.');
    if(l.textEffect!==undefined&&!['none','stair','wave','arch','flag','skew','perspective'].includes(l.textEffect))throw Error('Effet texte invalide.');
    for(const [k,min,max]of [['effectAmount',-100,100],['letterSpacing',-20,100],['outlineWidth',0,30],['shadowBlur',0,40],['shadowX',-100,100],['shadowY',-100,100]])if(l[k]!==undefined&&(!number(l[k])||l[k]<min||l[k]>max))throw Error('Paramètre texte invalide.');
    for(const k of ['outlineColor','shadowColor'])if(l[k]!==undefined&&(!color(l[k])||l[k]===null))throw Error('Couleur texte invalide.');
    if(l.kind==='text' && (typeof l.text!=='string' || l.text.length>500 || !['Syne','Manrope','Georgia','Arial','Courier New','Trebuchet MS'].includes(l.font) || !color(l.color) || l.color===null || !number(l.fontSize) || l.fontSize<=0 || l.fontSize>25000)) throw Error('Texte invalide.');
  }
}
async function atomicWrite(filename, content) {
  await fs.mkdir(path.dirname(filename), {recursive:true,mode:0o700});
  const temp=filename+'.'+randomUUID()+'.tmp';
  let handle;
  try {
    handle=await fs.open(temp,'wx',0o600);
    await handle.writeFile(content,'utf8');
    await handle.sync();
    await handle.close(); handle=null;
    await fs.rename(temp,filename);
    // Persist the directory entry too on systems supporting directory fsync.
    let dir;
    try {dir=await fs.open(path.dirname(filename),'r'); await dir.sync();}
    catch(e) {if(process.platform!=='win32' || !['EPERM','EISDIR','EINVAL','EACCES'].includes(e.code)) throw e;}
    finally {await dir?.close();}
  } finally {await handle?.close(); await fs.rm(temp,{force:true});}
}
class JsonStore {
  constructor(filename) {this.filename=filename; this.queue=Promise.resolve();}
  async readFile(filename) {
    const stat=await fs.stat(filename); if(stat.size>MAX_BYTES) throw Error('Fichier JSON trop volumineux.');
    return validate(JSON.parse(await fs.readFile(filename,'utf8')));
  }
  async read() {
    await this.queue;
    try {return {state:await this.readFile(this.filename),recovered:false};}
    catch(error) {
      if(error.code==='ENOENT') return {state:emptyState(),recovered:false};
      try {return {state:await this.readFile(this.filename+'.bak'),recovered:true};}
      catch {throw Error('La sauvegarde JSON est illisible. Elle a été conservée sur votre appareil.');}
    }
  }
  write(state) {
    validate(state);
    // Snapshot before enqueueing: callers cannot mutate an in-flight save.
    const content=JSON.stringify(state,null,2); if(Buffer.byteLength(content)>MAX_BYTES) throw Error('Sauvegarde trop volumineuse.');
    const operation=this.queue.then(async()=>{
      let previous;
      try {previous=await this.readFile(this.filename);}
      catch(e) {if(e.code!=='ENOENT') {
        // Preserve any corrupt primary before replacing it. Never replace a valid backup with corrupt data.
        try {await fs.copyFile(this.filename,this.filename+'.corrupt-'+Date.now());} catch(copyError) {if(copyError.code!=='ENOENT') throw copyError;}
      }}
      if(previous)await atomicWrite(this.filename+'.bak',JSON.stringify(previous,null,2));
      await atomicWrite(this.filename,content);
      return {saved:true};
    });
    this.queue=operation.catch(()=>{});
    return operation;
  }
}
module.exports={JsonStore,atomicWrite,validate,emptyState};
