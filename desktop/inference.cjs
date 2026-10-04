// Runs only in a bundled, standalone Node process. Never load native ORT inside Electron.
const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const job=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
 process.env.NODE_PATH=job.runtime;require('node:module').Module._initPaths();
 const ort=require(path.join(job.runtime,'onnxruntime-node'));
 const session=await ort.InferenceSession.create(job.model,{executionProviders:['cpu'],intraOpNumThreads:2,interOpNumThreads:1,executionMode:'sequential',graphOptimizationLevel:'basic',enableCpuMemArena:false,enableMemPattern:false,logSeverityLevel:3});
 const feeds={};for(const input of job.inputs){const b=await fs.readFile(input.file);const data=input.type==='uint8'?Uint8Array.from(b):new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));feeds[input.name||session.inputNames[0]]=new ort.Tensor(input.type,data,input.dims);}
 const result=await session.run(feeds);const tensor=result[session.outputNames[0]];
 await fs.writeFile(job.output,Buffer.from(tensor.data.buffer,tensor.data.byteOffset,tensor.data.byteLength));
 console.log(JSON.stringify({dims:tensor.dims,type:tensor.type}));await session.release();
})().catch(e=>{console.error(String(e.stack||e));process.exitCode=1;});
