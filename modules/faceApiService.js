const path = require("path");

const fs = require('fs');
const fetch2 = require('node-fetch');

const tf = require("@tensorflow/tfjs-node");

const faceapi = require("@vladmandic/face-api/dist/face-api.node.js");

const canvas =require('canvas');

const { Canvas, Image, ImageData } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

const modelPathRoot = "./models";

let optionsSSDMobileNet;

async function image(file) {
  const decoded = tf.node.decodeImage(file);
  const casted = decoded.toFloat();
  const result = casted.expandDims(0);
  decoded.dispose();
  casted.dispose();
  return result;
}

async function detect(tensor) {
  const result = await faceapi.detectAllFaces(tensor, optionsSSDMobileNet).withAgeAndGender()
  return result;
}

async function loadFaceAPIModels() {
  const modelPath = path.join(__dirname, modelPathRoot);
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  
  await faceapi.nets.ageGenderNet.loadFromDisk(modelPath);
  console.log("FaceAPI models loaded");
}
async function detectImgUrl(imgUrl,name) {
  console.log("detecting ImgUrl",imgUrl);

  let start=new Date().getTime()
  await loadFaceAPIModels()

  
  
  const filePath = path.join(OUTPUT_FOLDER, `${name}.png`);
  const res = await fetch2(imgUrl);
  if (!res.ok) {
      throw new Error(`Failed to download image: ${res.statusText}`);
  }

  const buffer = await res.buffer();
        
  // Write the buffer to a file
  fs.writeFileSync(filePath, buffer);
  console.log(`Image saved to: ${filePath}`);

  const imageBuffer = fs.readFileSync(filePath);
  const imageTensor = tf.node.decodeImage(imageBuffer, 3);
  // let optionsSSDMobileNet = new faceapi.TinyFaceDetectorOptions({ inputSize: 320 })
  let optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({
    minConfidence: 0.5,
  });
  const result = await faceapi.detectAllFaces(imageTensor, optionsSSDMobileNet).withAgeAndGender()
  let end=new Date().getTime()
  console.log(end-start,name,result)
  // const image = await faceapi.fetchImage(imgUrl)
  // console.log(image instanceof HTMLImageElement)
}

async function main(file,dataUrl) {
  console.log("FaceAPI single-process test");

  await faceapi.tf.setBackend("tensorflow");
  await faceapi.tf.enableProdMode();
  await faceapi.tf.ENV.set("DEBUG", false);
  await faceapi.tf.ready();

  console.log(
    `Version: TensorFlow/JS ${faceapi.tf?.version_core} FaceAPI ${
      faceapi.version.faceapi
    } Backend: ${faceapi.tf?.getBackend()}`
  );

  console.log("Loading FaceAPI models");
  const modelPath = path.join(__dirname, modelPathRoot);
//   await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  // optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({
  //   minConfidence: 0.5,
  // });

// faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath)

await Promise.all([faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath),faceapi.nets.ageGenderNet.loadFromDisk(modelPath)])
optionsSSDMobileNet = new faceapi.TinyFaceDetectorOptions({ inputSize: 320 })
// faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),


  let tensor

  if(dataUrl){
    const base64String = dataUrl.split(",")[1];
    const imageBuffer = Buffer.from(base64String, "base64");
    
    tensor = tf.node.decodeImage(imageBuffer);

  }else{
    tensor = await image(file);
  }

  
  

//   const segmentation = await model.segmentPeople(imageTensor);

  const result = await detect(tensor);
  console.log(result)
  console.log("Detected faces:", result.length);

  tensor.dispose();

  return result;
}

module.exports = {
  detect: main,
  detectImgUrl
};