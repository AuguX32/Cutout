const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('cutoutDesktop',Object.freeze({
  nativeEdit:action=>ipcRenderer.invoke('cutout:native-edit',action),
  onEditCommand:callback=>{const listener=(_event,action)=>callback(action);ipcRenderer.on('cutout:edit-command',listener);return()=>ipcRenderer.removeListener('cutout:edit-command',listener);},
  settings:settings=>ipcRenderer.invoke('cutout:settings',settings),
  generationModels:()=>ipcRenderer.invoke('cutout:generation-models'),
  installGenerationModel:id=>ipcRenderer.invoke('cutout:install-generation-model',id),
  generationProgress:()=>ipcRenderer.invoke('cutout:generation-progress'),
  generate:request=>ipcRenderer.invoke('cutout:generate',request),
  exportImage:(bytes,name,format)=>ipcRenderer.invoke('cutout:export-image',bytes,name,format),
  cancel:()=>ipcRenderer.invoke('cutout:cancel'),
  segment:input=>ipcRenderer.invoke('cutout:segment',input),
  load:()=>ipcRenderer.invoke('cutout:load'),
  save:session=>ipcRenderer.invoke('cutout:save',session),
  exportPng:(bytes,name)=>ipcRenderer.invoke('cutout:export',bytes,name),
  openStorage:()=>ipcRenderer.invoke('cutout:storage')
}));
