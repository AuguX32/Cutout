const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {JsonStore}=require('./store.cjs');
const state=name=>({version:1,updatedAt:new Date().toISOString(),session:{name,type:'image/png',source:Buffer.from('test').toString('base64'),result:null}});
async function temporary(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cutout-store-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));return {dir,file:path.join(dir,'cutout.json')};}
test('queued saves survive restart and keep previous valid backup',async t=>{const {dir,file}=await temporary(t);const store=new JsonStore(file);await Promise.all(Array.from({length:12},(_,i)=>store.write(state(String(i)))));assert.equal((await new JsonStore(file).read()).state.session.name,'11');assert.equal(JSON.parse(await fs.readFile(file+'.bak')).session.name,'10');assert.deepEqual((await fs.readdir(dir)).sort(),['cutout.json','cutout.json.bak']);});
test('corrupt primary recovers backup and is preserved when resaving',async t=>{const {dir,file}=await temporary(t);const store=new JsonStore(file);await store.write(state('first'));await store.write(state('second'));await fs.writeFile(file,'{"broken');const restored=await store.read();assert.equal(restored.recovered,true);assert.equal(restored.state.session.name,'first');await store.write(state('third'));assert.equal((await store.read()).state.session.name,'third');const corrupt=(await fs.readdir(dir)).find(n=>n.includes('.corrupt-'));assert.equal(await fs.readFile(path.join(dir,corrupt),'utf8'),'{"broken');assert.equal(JSON.parse(await fs.readFile(file+'.bak')).session.name,'first');});
test('backup write failure leaves committed primary intact and queue usable',async t=>{const {file}=await temporary(t);const store=new JsonStore(file);await store.write(state('safe'));await fs.mkdir(file+'.bak');await assert.rejects(store.write(state('rejected')));assert.equal((await store.read()).state.session.name,'safe');await fs.rmdir(file+'.bak');await store.write(state('retry'));assert.equal((await store.read()).state.session.name,'retry');});
test('invalid input cannot replace previous saved state',async t=>{const {file}=await temporary(t);const store=new JsonStore(file);await store.write(state('safe'));assert.throws(()=>store.write({version:2}));assert.equal((await store.read()).state.session.name,'safe');});
test('editable composition survives restart and invalid layers cannot replace it',async t=>{
  const {file}=await temporary(t);const store=new JsonStore(file);const saved=state('composition');
  saved.session.tool='compose';saved.session.project={background:'#f01813',backgroundImage:null,layers:[{id:'text',kind:'text',x:50,y:60,scale:1,rotation:0,opacity:1,text:'CUTOUT',font:'Syne',fontSize:30,color:'#ffffff'}]};
  await store.write(saved);assert.deepEqual((await new JsonStore(file).read()).state.session.project,saved.session.project);
  const bad=structuredClone(saved);bad.session.project.layers[0].scale=NaN;assert.throws(()=>store.write(bad));assert.deepEqual((await store.read()).state.session.project,saved.session.project);
});

test('editable text, base and gradient layers survive a restart',async()=>{
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'cutout-layers-'));
 try{const store=new JsonStore(path.join(folder,'cutout.json'));const state={version:1,updatedAt:null,session:{name:'layers.png',type:'image/png',source:'AAAA',result:'AAAA',tool:'compose',project:{background:null,backgroundImage:null,layers:[{id:'base',kind:'base',name:'Premier plan',x:20,y:30,width:100,height:80,scale:1,rotation:20,opacity:1,visible:false,locked:true},{id:'text',kind:'text',text:'Texte modifié',font:'Courier New',fontSize:32,color:'#ff0000',weight:600,italic:true,textBackground:'#d6ee63',padding:12,x:10,y:20,scale:1,rotation:0,opacity:.8},{id:'gradient',kind:'gradient',name:'Fond',width:100,height:80,x:50,y:40,scale:1,rotation:0,opacity:1,gradient:{x1:0,y1:.5,x2:1,y2:.5,start:'#ff0000',end:'#0000ff',mid:.3}}]}}};await store.write(state);assert.deepEqual((await new JsonStore(store.filename).read()).state,state);state.session.project.layers[2].gradient.mid=NaN;assert.throws(()=>store.write(state));assert.equal((await store.read()).state.session.project.layers[2].gradient.mid,.3);}finally{await fs.rm(folder,{recursive:true,force:true});}
});
