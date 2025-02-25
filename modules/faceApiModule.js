const path = require("path");
const sharp = require('sharp');
const axios = require('axios');

const fs = require('fs');
const fetch2 = require('node-fetch');


const tf = require('@tensorflow/tfjs-node');

tf.env().set('WEBGL_CPU_FORWARD', false); // Forces GPU acceleration if available
tf.env().set('WEBGL_PACK', true); // Optimizes memory usage
tf.env().set('WEBGL_FORCE_F16_TEXTURES', true); // Reduces memory load on GPU

const faceapi = require("@vladmandic/face-api/dist/face-api.node.js");

const canvas =require('canvas');

const { Canvas, Image, ImageData } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

const modelPathRoot = "./models";

async function loadFaceAPIModels({tiny=false,ssd=false}) {

    console.log({tiny,ssd})
  const modelPath = path.join(__dirname, modelPathRoot);

  let modelsArr=[]

  if(tiny && ssd){
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath),
        faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
        faceapi.nets.ageGenderNet.loadFromDisk(modelPath),
    ])
  }
  else if(tiny){
    await Promise.all([faceapi.nets.ageGenderNet.loadFromDisk(modelPath),faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath)] )
  }
  else if(ssd){
    await Promise.all([faceapi.nets.ageGenderNet.loadFromDisk(modelPath),faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath)] )
  }
  
  console.log("FaceAPI models loaded");
}

loadFaceAPIModels({tiny:true})

const OUTPUT_FOLDER = `./OUTPUT`; 

if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER);
}

const allowedFormats = ['jpeg', 'jpg', 'png', 'bmp'];
const makeFileFromUrl=(url,name)=>{
  return new Promise(async(resolve, reject) => {
    const res = await fetch2(url);
    if (!res.ok) {
        throw new Error(`Failed to download image: ${res.statusText}`);
        reject('`Failed to download image: ${res.statusText}`')
    }

    const buffer = await res.buffer();

    const metadata = await sharp(buffer).metadata();

    let finalFormat = allowedFormats.includes(metadata.format)?metadata.format:'jpeg';

    const filename = `${name}.${finalFormat}`;

    const filePath = path.join(OUTPUT_FOLDER, filename);

    await sharp(buffer).toFile(filePath);
    // .resize(256, 256, { fit: 'contain', position: 'center' ,background: { r: 255, g: 255, b: 255, alpha: 1 } }) 
    

    resolve({filePath,buffer})


  })
}

let INPUTSIZE=480

const detectImgByUrl=(req,res)=>{

  const {name,imageUrl}=req.body
  if(!name || !imageUrl){
    return res.status(500).json({success:false,message:'Missing details'})
  }
    return new Promise(async (resolve, reject) => {

          if (!fs.existsSync(OUTPUT_FOLDER)) {
            fs.mkdirSync(OUTPUT_FOLDER);
        }
        let start=new Date().getTime()
        let optionsSSDMobileNet = new faceapi.TinyFaceDetectorOptions({ inputSize: INPUTSIZE })
        // make image

        let filePath=(await makeFileFromUrl(imageUrl,name)).filePath
        const imageBuffer = fs.readFileSync(filePath);

        let detections = [];
        
        // resizedTensor.dispose();
        // grayscaleTensor.dispose();
      

        try {
          
          const imageTensor =  tf.node.decodeImage(imageBuffer, 3);
          const result = await faceapi.detectAllFaces(imageTensor, optionsSSDMobileNet).withAgeAndGender()
          imageTensor.dispose();

          let finalDets=result.map(item=>{
              console.log(item)
            let originalDimensions=item.detection._imageDims
            let {gender,genderProbability,age}=item
            let boundingBox=item.detection._box

            return ({originalDimensions,gender,boundingBox,genderProbability,age})
          })
          let end=new Date().getTime()
          fs.unlinkSync(filePath)
          console.log(name,end-start)
          res.status(200).json({success:true,name,results:finalDets})
          
        } catch (error) {
          console.log('Could not detect image',name,error.message)
          res.status(500).json({success:false,message:'Internal server error'})
        }
        
       
       
        // fs.writeFileSync(filePath, buffer);

        // let mid1=new Date().getTime()

        // console.log(mid1-start)

        //make tensor from image file
        // const imageBuffer = fs.readFileSync(filePath);
        

        // let optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({
        //     minConfidence: 0.5,
        //   });

        return
       
      
      
          fs.readFile(filePath, async(err, data) => {

            if (err) {
              console.error(err);
              return
            }

            console.log('Trying',name)

            try {
              const metadata = await sharp(data).metadata();
              console.log(metadata)
              const imageTensor =  tf.node.decodeImage(data, 3);
              let resizedTensor = tf.image.resizeBilinear(imageTensor, [320, 240]);
              const result = await faceapi.detectAllFaces(resizedTensor, optionsSSDMobileNet).withAgeAndGender()
              let end=new Date().getTime()
              // console.log(end-start,name,result)
              console.log('Success',name)
            } catch (error) {
              console.log('Failed',name)
              console.log(error.message)
            }
            
            
          });
        

    })
}


module.exports = {
    detectImgByUrl,makeFileFromUrl
  };