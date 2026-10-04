const models={
 birefnet:{size:1024,file:'birefnet.onnx',mode:'logits'},
 'birefnet-lite':{size:1024,file:'birefnet-lite.onnx',mode:'logits'},
 u2netp:{size:320,file:'u2netp.onnx',mode:'range'},
 silueta:{size:320,file:'silueta.onnx',mode:'range'},
 u2net:{size:320,file:'u2net.onnx',mode:'range'},
 human:{size:320,file:'human.onnx',mode:'range'},
 anime:{size:1024,file:'anime.onnx',mode:'probability'},
 biglama:{size:512,file:'biglama.onnx',mode:'rgb-float'},
 lama:{size:512,file:'lama.onnx',mode:'bgr'},
 migan:{size:512,file:'migan.onnx',mode:'rgb'}
};module.exports=models;
