const {app,BrowserWindow,protocol,net,ipcMain,dialog,shell,Menu}=require('electron');
const path=require('node:path');
const {spawn}=require('node:child_process');
const os=require('node:os');
const models=require('./models.cjs');
const {GenerationModels,validateGeneration}=require('./generation.cjs');let generationModels;
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
const {JsonStore,atomicWrite}=require('./store.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'cutout',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,allowServiceWorkers:true}}]);
let window,store,inferenceWorker,inferencePending=false,settings={theme:null},settingsQueue=Promise.resolve();
const root=path.join(__dirname,'../dist');
const origin='cutout://app';
app.setName('CUTOUT');
if(process.env.CUTOUT_TEST_DATA) app.setPath('userData',path.resolve(process.env.CUTOUT_TEST_DATA));
if(!app.requestSingleInstanceLock()){app.quit();} else {
app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
app.whenReady().then(async()=>{
  store=new JsonStore(path.join(app.getPath('userData'),'cutout.json'));
  const settingsPath=path.join(app.getPath('userData'),'settings.json');
  try{const saved=JSON.parse(await fs.readFile(settingsPath,'utf8'));if(['dark','light'].includes(saved.theme))settings.theme=saved.theme;}catch{}
  protocol.handle('cutout',async request=>{
    const url=new URL(request.url);
    if(url.host!=='app') return new Response('Not found',{status:404});
    const isModel=url.pathname.startsWith('/models/') && !url.pathname.startsWith('/models/esrgan/');
    const base=isModel?(app.isPackaged?path.join(process.resourcesPath,'models'):path.join(__dirname,'../desktop-models')):root;
    const relative=isModel?url.pathname.slice('/models'.length):(url.pathname==='/'?'/index.html':url.pathname);
    const filename=path.resolve(base,'.'+decodeURIComponent(relative));
    if(!filename.startsWith(base+path.sep)) return new Response('Forbidden',{status:403});
    try {
      const response=await net.fetch(pathToFileURL(filename).toString());
      const headers=new Headers(response.headers);
      headers.set('Cross-Origin-Opener-Policy','same-origin');headers.set('Cross-Origin-Embedder-Policy','require-corp');
      headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' blob: 'wasm-unsafe-eval' 'unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' blob: data:; connect-src 'self' blob:; object-src 'none'; base-uri 'none'");
      return new Response(response.body,{status:response.status,headers});
    } catch {return new Response('Not found',{status:404});}
  });
  const check=e=>{if(!window || e.sender!==window.webContents || !e.senderFrame || e.senderFrame.url!==origin+'/index.html') throw Error('Accès non autorisé.');};
  ipcMain.handle('cutout:segment',async(e,request)=>{
    check(e);if(inferenceWorker||inferencePending)throw Error('Une analyse est déjà en cours.');
    const spec=models[request?.engine];if(!spec)throw Error('Moteur inconnu.');
    const n=spec.size*spec.size;
    const inputs=request.inputs;
    const expected=request.engine==='migan'?[{type:'uint8',dims:[1,3,spec.size,spec.size],bytes:n*3,name:'image'},{type:'uint8',dims:[1,1,spec.size,spec.size],bytes:n,name:'mask'}]:['lama','biglama'].includes(request.engine)?[{type:'float32',dims:[1,3,512,512],bytes:n*3*4,name:'image'},{type:'float32',dims:[1,1,512,512],bytes:n*4,name:'mask'}]:[{type:'float32',dims:[1,3,spec.size,spec.size],bytes:n*3*4}];
    if(!Array.isArray(inputs)||inputs.length!==expected.length||inputs.some((x,i)=>!(x instanceof ArrayBuffer)||x.byteLength!==expected[i].bytes))throw Error('Entrée du modèle invalide.');
    const base=app.isPackaged?process.resourcesPath:path.join(__dirname,'..');
    const runtime=path.join(base,app.isPackaged?'native':'desktop-runtime');
    const model=path.join(base,app.isPackaged?'models':'desktop-models',spec.file);
    const executable=app.isPackaged?path.join(base,'node',process.platform==='win32'?'node.exe':'node'):process.env.CUTOUT_NODE||path.join(base,'node-runtime',(process.platform==='darwin'?'mac':process.platform==='win32'?'win':process.platform)+'-'+process.arch,process.platform==='win32'?'node.exe':'node');
    inferencePending=true;const folder=await fs.mkdtemp(path.join(os.tmpdir(),'cutout-ai-')).catch(e=>{inferencePending=false;throw e;});let child;
    try{
      const job={runtime,model,output:path.join(folder,'output.bin'),inputs:[]};
      for(let i=0;i<inputs.length;i++){const file=path.join(folder,'input-'+i+'.bin');await fs.writeFile(file,Buffer.from(inputs[i]));job.inputs.push({...expected[i],file});}
      const jobFile=path.join(folder,'job.json');await fs.writeFile(jobFile,JSON.stringify(job));
      // Native addons and their allocations are isolated from Chromium's allocator and the editor.
      const meta=await new Promise((resolve,reject)=>{
        child=spawn(executable,[(app.isPackaged?path.join(process.resourcesPath,'inference.cjs'):path.join(__dirname,'inference.cjs')),jobFile],{stdio:['ignore','pipe','pipe'],windowsHide:true,env:{...process.env,NODE_OPTIONS:'',ELECTRON_RUN_AS_NODE:''}});inferenceWorker=child;
        let stdout='',stderr='',done=false;
        const timer=setTimeout(()=>{child.kill();reject(Error('Le moteur a dépassé son délai. Essayez un modèle plus léger.'));},600000);
        child.stdout.on('data',b=>{stdout=(stdout+b).slice(-8192);});child.stderr.on('data',b=>{stderr=(stderr+b).slice(-8192);});
        child.once('error',e=>{clearTimeout(timer);reject(e);});
        child.once('exit',(code,signal)=>{clearTimeout(timer);if(inferenceWorker===child)inferenceWorker=null;if(code!==0){console.error('[AI]',stderr);reject(Error('Le moteur a été arrêté ('+(signal||code)+'). Votre image est conservée. Essayez IS-Net, U²-Net léger ou MI-GAN.'));}else{try{resolve(JSON.parse(stdout.trim().split('\n').at(-1)));}catch{reject(Error('Réponse du moteur invalide.'));}}});
      });
      const bytes=await fs.readFile(job.output);if(bytes.length>32*1024*1024)throw Error('Sortie du modèle invalide.');
      return {...meta,data:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),mode:spec.mode};
    }finally{inferencePending=false;child?.kill();if(inferenceWorker===child)inferenceWorker=null;await fs.rm(folder,{recursive:true,force:true});}
  });
  ipcMain.handle('cutout:settings',async(e,next)=>{check(e);if(next!==undefined){if(!next||!['dark','light'].includes(next.theme))throw Error('Thème invalide.');const value={theme:next.theme};settingsQueue=settingsQueue.catch(()=>{}).then(()=>atomicWrite(settingsPath,JSON.stringify(value)));await settingsQueue;settings=value;}return settings;});
  const generationBase=app.isPackaged?process.resourcesPath:path.join(__dirname,'..');
  generationModels=new GenerationModels(path.join(app.getPath('userData'),'generation-models'),path.join(generationBase,'generative-models'),(url,options)=>net.fetch(url,options));
  ipcMain.handle('cutout:generation-models',async e=>{check(e);return generationModels.list();});
  ipcMain.handle('cutout:generation-progress',e=>{check(e);return generationModels.progress;});
  ipcMain.handle('cutout:install-generation-model',async(e,id)=>{check(e);return generationModels.install(id);});
  ipcMain.handle('cutout:generate',async(e,request)=>{
    check(e);if(inferenceWorker||inferencePending)throw Error('Un traitement IA est déjà en cours.');
    const validated=validateGeneration(request);request=validated.request;const spec=validated.spec;
    const base=app.isPackaged?process.resourcesPath:path.join(__dirname,'..');
    const runtime=app.isPackaged?path.join(base,'generative'):path.join(base,'generative-runtime',(process.platform==='darwin'?'mac':process.platform==='win32'?'win':process.platform)+'-'+process.arch);
    const executable=path.join(runtime,process.platform==='win32'?'sd-cli.exe':'sd-cli');
    const model=generationModels.file(spec);try{if((await fs.stat(model)).size!==spec.bytes)throw Error('Poids invalides.');}catch{throw Error('Téléchargez ce modèle depuis Design IA avant de générer.');}
    inferencePending=true;const folder=await fs.mkdtemp(path.join(os.tmpdir(),'cutout-generate-')).catch(e=>{inferencePending=false;throw e;});let child;
    try{const output=path.join(folder,'image.png');await new Promise((resolve,reject)=>{
      child=spawn(executable,['-m',model,'-p',request.prompt,'-n',request.negative,'--cfg-scale',String(request.cfg),'--steps',String(request.steps),'--sampling-method',spec.sampler,...(spec.scheduler?['--scheduler',spec.scheduler]:[]),'--backend','cpu','-t','4','-W',String(request.width),'-H',String(request.height),'-s',String(request.seed),'-o',output],{cwd:runtime,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,NODE_OPTIONS:''}});inferenceWorker=child;let errors='';const timeout=setTimeout(()=>{child.kill();reject(Error('La génération a dépassé dix minutes.'));},600000);child.stderr.on('data',chunk=>{errors=(errors+chunk.toString()).slice(-2000);});child.on('error',err=>{clearTimeout(timeout);reject(Error('Le moteur génératif ne peut pas démarrer : '+err.message));});child.on('exit',(code,signal)=>{clearTimeout(timeout);code===0?resolve():reject(Error(signal?'Génération annulée.':'Le moteur génératif a échoué. '+errors.slice(-400)));});
    });const bytes=await fs.readFile(output);if(bytes.length>10*1024*1024||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Résultat généré invalide.');return bytes.toString('base64');}
    finally{inferencePending=false;child?.kill();if(inferenceWorker===child)inferenceWorker=null;await fs.rm(folder,{recursive:true,force:true});}
  });
  ipcMain.handle('cutout:export-image',async(e,bytes,name,format)=>{
    check(e);const buffer=Buffer.from(bytes),valid=({png:()=>buffer.subarray(0,8).toString('hex')==='89504e470d0a1a0a',jpeg:()=>buffer.subarray(0,3).toString('hex')==='ffd8ff',webp:()=>buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP'})[format];
    if(!valid||!valid()||buffer.length>100*1024*1024)throw Error('Image invalide.');const {canceled,filePath}=await dialog.showSaveDialog(window,{title:'Exporter l’image',defaultPath:path.basename(String(name)).slice(0,255),filters:[{name:format.toUpperCase(),extensions:[format==='jpeg'?'jpg':format]}]});if(canceled)return {canceled:true};await fs.writeFile(filePath,buffer);return {saved:true};
  });
  ipcMain.handle('cutout:cancel',e=>{check(e);inferenceWorker?.kill();generationModels?.cancel();});
  ipcMain.handle('cutout:load' ,async e=>{check(e);return store.read();});
  ipcMain.handle('cutout:save',async(e,session)=>{check(e);return store.write({version:1,updatedAt:new Date().toISOString(),session});});
  ipcMain.handle('cutout:storage',e=>{check(e);shell.showItemInFolder(store.filename);});
  ipcMain.handle('cutout:export',async(e,bytes,name)=>{
    check(e);const buffer=Buffer.from(bytes);
    if(buffer.length>100*1024*1024 || buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a') throw Error('PNG invalide.');
    const {canceled,filePath}=await dialog.showSaveDialog(window,{title:'Exporter le PNG',defaultPath:path.basename(String(name)).slice(0,255),filters:[{name:'Image PNG',extensions:['png']}]});
    if(canceled)return {canceled:true};
    await fs.writeFile(filePath,buffer);return {saved:true};
  });
  const command=action=>()=>window?.webContents.send('cutout:edit-command',action);
  ipcMain.handle('cutout:native-edit',(e,action)=>{check(e);if(!['copy','paste','cut','undo','redo','selectAll'].includes(action))throw Error('Commande inconnue.');window.webContents[action]();});
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform==='darwin'?[{label:'CUTOUT',submenu:[{role:'about'},{type:'separator'},{role:'hide'},{role:'hideOthers'},{type:'separator'},{role:'quit'}]}]:[]),
    {label:'Fichier',submenu:[{label:'Nouveau document',accelerator:'CommandOrControl+N',click:command('new')},{label:'Importer une image',accelerator:'CommandOrControl+O',click:command('open')},{label:'Sauvegarder',accelerator:'CommandOrControl+S',click:command('save')},{label:'Exporter',accelerator:'CommandOrControl+Shift+E',click:command('export')},{type:'separator'},{label:'Afficher le stockage JSON',click:()=>shell.showItemInFolder(store.filename)},{role:'close'}]},
    {label:'Édition',submenu:[{label:'Annuler',accelerator:'CommandOrControl+Z',click:command('undo')},{label:'Rétablir',accelerator:'CommandOrControl+Shift+Z',click:command('redo')},{type:'separator'},{label:'Couper',accelerator:'CommandOrControl+X',click:command('cut')},{label:'Copier',accelerator:'CommandOrControl+C',click:command('copy')},{label:'Coller',accelerator:'CommandOrControl+V',click:command('paste')},{label:'Dupliquer le calque',accelerator:'CommandOrControl+J',click:command('duplicate')},{label:'Tout sélectionner',accelerator:'CommandOrControl+A',click:command('selectAll')},{label:'Désélectionner',accelerator:'CommandOrControl+D',click:command('deselect')}]},
    {label:'Affichage',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]}
  ]));
  createWindow();
  app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
}
function createWindow(){
  window=new BrowserWindow({width:1240,height:900,minWidth:480,minHeight:650,title:'CUTOUT',backgroundColor:'#e8e8e6',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  window.webContents.on('console-message',event=>{console.error('[renderer]',event.message);});
  window.webContents.setWindowOpenHandler(({url})=>{
    if(['https://github.com/imgly/background-removal-js'].includes(url))shell.openExternal(url);
    return {action:'deny'};
  });
  window.webContents.on('will-navigate',(event,url)=>{if(url!==origin+'/index.html')event.preventDefault();});
  window.on('closed',()=>{inferenceWorker?.kill();inferenceWorker=null;window=null;});
  window.loadURL(origin+'/index.html');
}
