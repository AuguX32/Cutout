import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
const project=process.cwd();
const appDir=path.join(project,'release/win-unpacked');
const output=path.join(project,'release/CUTOUT-7.0.0-Windows-x64-Setup.exe');
const assistant=path.join(project,'release/installer.exe');
const icon=path.join(project,'desktop/icon.ico');
const entries=await fs.readdir(appDir,{recursive:true,withFileTypes:true});
const files=entries.filter(e=>e.isFile()).map(e=>path.relative(appDir,path.join(e.parentPath,e.name))).sort();
const dirs=entries.filter(e=>e.isDirectory()).map(e=>path.relative(appDir,path.join(e.parentPath,e.name))).sort((a,b)=>b.length-a.length);
const quote=s=>s.replaceAll('$','$$').replaceAll('"','$\\"');
const win=s=>quote(s.split(path.sep).join('\\'));
const uninstall=files.map(f=>`  Delete "$INSTDIR\\${win(f)}"`).concat(dirs.map(d=>`  RMDir "$INSTDIR\\${win(d)}"`)).join('\n');
const script=`Unicode true
!include "MUI2.nsh"
!include "x64.nsh"
Name "CUTOUT"
OutFile "${quote(assistant)}"
InstallDir "$LOCALAPPDATA\\Programs\\CUTOUT"
InstallDirRegKey HKCU "Software\\CUTOUT" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
Icon "${quote(icon)}"
UninstallIcon "${quote(icon)}"
VIProductVersion "7.0.0.0"
VIAddVersionKey /LANG=1036 "ProductName" "CUTOUT"
VIAddVersionKey /LANG=1036 "FileDescription" "CUTOUT — Installation Windows x64"
VIAddVersionKey /LANG=1036 "FileVersion" "7.0.0"
VIAddVersionKey /LANG=1036 "LegalCopyright" "CUTOUT 2026"
!define MUI_ABORTWARNING
!define MUI_ICON "${quote(icon)}"
!define MUI_UNICON "${quote(icon)}"
!define MUI_FINISHPAGE_RUN "$INSTDIR\\CUTOUT.exe"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "French"
Function .onInit
  \${IfNot} \${RunningX64}
    MessageBox MB_ICONSTOP "Cette application nécessite Windows 64 bits."
    Abort
  \${EndIf}
  SetRegView 64
  SetShellVarContext current
FunctionEnd
Section "Installer"
  SetOutPath "$INSTDIR"
  AddSize 3033000
  CopyFiles /SILENT "$EXEDIR\\app\\*.*" "$INSTDIR"
  IfErrors 0 +2
  Abort "La copie de l’application a échoué."
  WriteUninstaller "$INSTDIR\\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\\CUTOUT"
  CreateShortcut "$SMPROGRAMS\\CUTOUT\\CUTOUT.lnk" "$INSTDIR\\CUTOUT.exe"
  CreateShortcut "$DESKTOP\\CUTOUT.lnk" "$INSTDIR\\CUTOUT.exe"
  WriteRegStr HKCU "Software\\CUTOUT" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CUTOUT" "DisplayName" "CUTOUT"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CUTOUT" "DisplayVersion" "7.0.0"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CUTOUT" "Publisher" "CUTOUT"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CUTOUT" "DisplayIcon" "$INSTDIR\\CUTOUT.exe"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CUTOUT" "UninstallString" '$\\"$INSTDIR\\Uninstall.exe$\\"'
  WriteRegDWORD HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CUTOUT" "NoModify" 1
  WriteRegDWORD HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CUTOUT" "NoRepair" 1
SectionEnd
Section "Uninstall"
  SetRegView 64
  SetShellVarContext current
${uninstall}
  Delete "$INSTDIR\\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\\CUTOUT\\CUTOUT.lnk"
  RMDir "$SMPROGRAMS\\CUTOUT"
  Delete "$DESKTOP\\CUTOUT.lnk"
  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\CUTOUT"
  DeleteRegKey HKCU "Software\\CUTOUT"
  ; Preserve %APPDATA%/CUTOUT and all user-created files.
SectionEnd
`;
const scriptPath=path.join(project,'release/cutout-installer.nsi');await fs.writeFile(scriptPath,script);
const executable=process.env.CUTOUT_MAKENSIS || 'makensis';
await new Promise((resolve,reject)=>{const child=spawn(executable,['-V3',scriptPath],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('NSIS failed: '+code)));});
// The large model payload exceeds practical NSIS data-block limits. A 7-Zip
// installer SFX extracts the application and starts the small NSIS assistant.
const sevenZip=process.env.CUTOUT_7ZIP || '7z';
const modulePath=process.env.CUTOUT_SFX_MODULE;
if(!modulePath) throw Error('Set CUTOUT_SFX_MODULE to the official LZMA SDK bin/7zSD.sfx');
const staging=path.join(project,'release/windows-sfx');
await fs.mkdir(staging,{recursive:true});
await fs.cp(appDir,path.join(staging,'app'),{recursive:true,force:true});
await fs.copyFile(assistant,path.join(staging,'installer.exe'));
const prefix=path.join(project,'release/cutout-installer.sfx');
const configuration=';!@Install@!UTF-8!\nTitle="CUTOUT 7"\nRunProgram="installer.exe"\n;!@InstallEnd@!\n';
await fs.writeFile(prefix,Buffer.concat([await fs.readFile(modulePath),Buffer.from(configuration)]));
await fs.rm(output,{force:true});
await new Promise((resolve,reject)=>{const child=spawn(sevenZip,['a','-t7z','-sfx'+prefix,output,'app','installer.exe','-mx=3','-mmt=2','-md=16m'],{cwd:staging,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('7-Zip failed: '+code)));});
console.log('Installer ready: '+output);
