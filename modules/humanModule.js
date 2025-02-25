const Human = require("@vladmandic/human").default;
const fs = require('fs');

const makeFileFromUrl=require('./faceApiModule').makeFileFromUrl

const OUTPUT_FOLDER = `./OUTPUT`; 

if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER);
}


// const human = new Human({
//     modelBasePath: "https://vladmandic.github.io/human/models/",
//     debug: true,
//   });

  
  const humanDetect=async(imgUrl,name)=>{
    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    let bf=(await makeFileFromUrl(imgUrl,name)).buffer
    // const imageBuffer = fs.readFileSync(filePath);
    const decoded = await human.image(bf); // Process with Human.js

    const result = await human.detect(decoded);

    console.log(result,name)
  }

  module.exports = {
    humanDetect
  };