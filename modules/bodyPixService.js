const tf = require('@tensorflow/tfjs-node');
const bodyPix = require('@tensorflow-models/body-pix');
const bodySegmentation = require("@tensorflow-models/body-segmentation");
const fs = require('fs');


async function image(file) {
  const decoded = tf.node.decodeImage(file);
  const casted = decoded.toFloat();
  const result = casted.expandDims(0);
  decoded.dispose();
  casted.dispose();
  return result;
}

// async function runBodyPix(file) {

//     const tensor = await image(file);
//     // const result = await detect(tensor);
//     const net = await bodyPix.load();

//     // const imageBuffer = fs.readFileSync(imagePath);
//     // const imageTensor = tf.node.decodeImage(imageBuffer);
//     const segmentation = await net.segmentPerson(tensor);
//     console.log(segmentation);

//     tensor.dispose();

//     return segmentation
// }

let bodyModel
const setUpSegmentBodyModel=()=>{
    return new Promise(async(resolve,reject)=>{
        // const {architecture,multiplier,outputStride,quantBytes}=chosenModel
        const model = bodySegmentation.SupportedModels.BodyPix;
        // const segmenterConfig = {
        //     architecture,multiplier,outputStride,quantBytes
        // };

        bodySegmentation.createSegmenter(model).then(mdl=>{
            bodyModel=mdl
                console.log('BODY M0DEL 1 INITIATED',bodyModel);
                resolve('')
     })
    })
}
  




async function runBodyPix(fileData) {
    // const imageBuffer = req.files.file.data;
    const imageTensor = tf.node.decodeImage(fileData);

    await setUpSegmentBodyModel()

    const segmentation = await bodyModel.segmentPeople(imageTensor);
    // const net = await bodyPix.load();
    // const imageBuffer = fs.readFileSync(imagePath);
    // const imageTensor = tf.node.decodeImage(imageBuffer);
    // const segmentation = await net.segmentPerson(imageTensor);
    // console.log(segmentation);
    return segmentation
}

module.exports = {
    runBodyPix,
  };
