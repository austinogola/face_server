const express = require("express");
const fileUpload = require("express-fileupload");
const bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var fs = require('fs');
const multer = require('multer');
// const Busboy = require("busboy");


const faceApiService=require('./modules/faceApiService')

const faceApiModule=require('./modules/faceApiModule')
const bodyPixService=require('./modules/bodyPixService')
const downloadYTVideo=require('./modules/YTDownloader').downloadVideo

const downloadVideoWithDetect=require('./modules/YTDownloader').downloadVideoWithDetect

// const humanDetect=require('./modules/humanModule').humanDetect;

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));
// app.use(fileUpload({
//   limits: { fileSize: 50 * 1024 * 1024 }, // Example: limit to 50MB
// }));
// app.use(busboy()); 

// app.post('/upload', function(req, res) {
//   var fstream;
//   req.pipe(req.busboy);
//   req.busboy.on('file', function (fieldname, file, filename) {
//       console.log("Uploading: " + filename); 
//       fstream = fs.createWriteStream(__dirname + '/files/' + filename);
//       file.pipe(fstream);
//       fstream.on('close', function () {
//           res.redirect('back');
//       });
//   });
// });

app.post('/image_url',(req,res)=>{
  // console.log(req.body)
  // faceApiService.detectImgUrl(req.body.imageUrl,req.body.name)
  faceApiModule.detectImgByUrl(req,res)
  // humanDetect(req.body.imageUrl,req.body.name)
  // res.send("DONE")
})

app.post('/ytVideo',(req,res)=>{
  // console.log(req.body)
  // faceApiService.detectImgUrl(req.body.imageUrl,req.body.name)
  // downloadYTVideo(req,res)
  downloadVideoWithDetect(req,res)
  // humanDetect(req.body.imageUrl,req.body.name)
  // res.send("DONE")
})

app.post('/ytVideoDownload',(req,res)=>{
  // console.log(req.body)
  // faceApiService.detectImgUrl(req.body.imageUrl,req.body.name)
  downloadYTVideo(req,res)
  // downloadYTVideo(req,res)
  // downloadVideoWithDetect(req,res)
  // humanDetect(req.body.imageUrl,req.body.name)
  // res.send("DONE")
})



app.post("/upload1", (req, res) => {
    const busboy = new Busboy({ headers: req.headers });

    let fileData = Buffer.alloc(0);
    let fileType = "";

    busboy.on("file", (fieldname, file, info) => {
        console.log(`Uploading: ${info.filename}`);
        fileType = info.mimeType;

        file.on("data", (data) => {
            fileData = Buffer.concat([fileData, data]);
        });

        file.on("end", async () => {
            console.log("File upload complete");

            // Call your faceApiService (assuming it's an async function)
            try {
                const result = await faceApiService.detect(fileData);
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    });

    req.pipe(busboy);
});

// const upload = multer({ 
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB limit
//   }
// });

const upload = multer({ dest: 'uploads/' });

app.post("/upload3",upload.single('file'), async (req, res) => {
console.log(Object.keys(req))
    console.log(req.files)
    console.log(req.file)
  const { file } = req.files;

  console.log(file);
  const result = await faceApiService.detect(file.data);
// const result = await bodyPixService.runBodyPix(file.data);

//   res.json({
//     detectedFaces: result.length,
//   });
res.json({
    detectedFaces: result,
  });

//   res.send("Successfile upload");
});


app.post("/upload",upload.single('file'), async (req, res) => {
  console.log(Object.keys(req))
      console.log(req.files)
      console.log(req.file)
    // const { file } = req.files;
  
    console.log(req.file);
    const result = await faceApiService.detect(req.file.data);
  // const result = await bodyPixService.runBodyPix(file.data);
  
  //   res.json({
  //     detectedFaces: result.length,
  //   });
  res.json({
      detectedFaces: result,
    });
  
  //   res.send("Successfile upload");
  });

app.post("/uploadBase64", async (req, res) => {
    const { dataUrl } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: "No data URL provided" });
    }
  
    try {
      // Extract Base64 string from data URL
      const result = await faceApiService.detect(null,dataUrl);
  
      res.json({ result });
    } catch (error) {
      console.error("Error processing image:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  });

app.listen(port, () => {
  console.log("Server started on port" + port);
});