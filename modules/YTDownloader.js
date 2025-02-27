const ytdl = require("@distube/ytdl-core");
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp=require('sharp')
const {detectImgByPath}=require('./faceApiModule')

// const {sendMessage,sendMessageToClient,onMessage,connectedClients}=require('../index')


async function downloadAndSplitVideo(VIDEO_URL) {
    try {
       

        tempFileStream.on('finish', () => {
            console.log('Download complete. Splitting into chunks...');

            ffmpeg(tempFilePath)
                .outputOptions([
                    `-c copy`, // Copy without re-encoding
                    `-map 0`,  // Map all streams (video/audio)
                    `-segment_time ${CHUNK_DURATION}`, // Set chunk duration
                    `-f segment`, // Output as segments
                    `-reset_timestamps 1`, // Reset timestamps for each chunk
                ])
                .output(path.join(OUTPUT_FOLDER, 'chunk_%03d.mp4'))
                .on('end', () => {
                    console.log('Splitting complete. Chunks saved.');
                    fs.unlinkSync(tempFilePath); // Remove temp file
                })
                .on('error', (err) => console.error('Error:', err))
                .run();
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

const allowedFormats = ['jpeg', 'jpg', 'png', 'bmp'];

const OUTPUT_FOLDER = `./VID_OUTPUT`; 
const downloadVideoWithDetect=(req,res)=>{
    const {url,cookies}=req.body
    const agent = ytdl.createAgent(cookies);
     if (!fs.existsSync(OUTPUT_FOLDER)) {
                fs.mkdirSync(OUTPUT_FOLDER);
            }
    return new Promise((resolve, reject) => {
        let start=new Date().getTime()
        console.log('Getting video info...',url);
            ytdl.getBasicInfo(url, { agent }).then(info=>{
                let frame_num=1
                let vidTitle=info.videoDetails.videoId
                console.log(vidTitle)
                
                // const videoPath = path.join(__dirname, `${vidTitle}.mp4`);
                // const framesDir = path.join(__dirname, `${vidTitle}_frames`);
                // if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);
                // ytdl(vidUrl).pipe(fs.createWriteStream(`${vidTitle}.mp4`));
                
                
                // console.log("Downloading video...");
                // const videoStream = ytdl(videoUrl, { quality: "lowestvideo" });
                // videoStream.pipe(fs.createWriteStream(videoPath));

                // ytdl(url).pipe(writeStream)
                // .on('finish', () => {
                //     let end=new Date().getTime()
                //     console.log('Download complete!',end-start);
                // })
                // .on('error', (err) => {
                //     console.error('Download failed:', err);
                // });

                const videoStream = ytdl(url, { quality: "lowestvideo" });

                ffmpeg(videoStream)
                .outputOptions("-vf fps=1") // Extract 1 frame per second
                .format("image2pipe")
                .pipe(require("stream").PassThrough()) // Use a passthrough stream
                .on("data", async (chunk) => {
                    try {
                        const metadata = await sharp(chunk).metadata();
                        // console.log(metadata)

                         let finalFormat = allowedFormats.includes(metadata.format)?metadata.format:'jpeg';
                        
                            const filename = `${vidTitle}${frame_num}.${finalFormat}`;
                            frame_num++

                             const filePath = path.join(OUTPUT_FOLDER, filename);

                             await sharp(chunk).toFile(filePath);

                             let results= await detectImgByPath(filePath)

                             console.log(results)


                        
                           
                        // const img = await loadImageFromBuffer(chunk);
                        // const detections = await faceapi.detectAllFaces(img).withFaceLandmarks();
                        
                        // Stream JSON response as frames are processed
                      
                        // res.write(JSON.stringify({ frame: Date.now(), faces: detections.length }));
                        // firstFrame = false;
                    } catch (err) {
                        console.error("Error processing frame:", err);
                    }
                })
                            
        })
    })
}

async function loadImageFromBuffer(buffer) {
    const img = new Image();
    img.src = buffer;
    return faceapi.createCanvasFromMedia(img);
}
const downloadVideo=(req,res)=>{
    const {url,cookies}=req.body
    const agent = ytdl.createAgent(cookies);
    return new Promise((resolve, reject) => {
        let start=new Date().getTime()
        console.log('Getting video info...',url);
            ytdl.getBasicInfo(url, { agent }).then(info=>{
                let vidTitle=info.videoDetails.videoId
                console.log(vidTitle)
                // ytdl(vidUrl).pipe(fs.createWriteStream(`${vidTitle}.mp4`));

                const writeStream = fs.createWriteStream(`${vidTitle}.mp4`);

                ytdl(url).pipe(writeStream)
                .on('finish', () => {
                    let end=new Date().getTime()
                    console.log('Download complete!',end-start);
                })
                .on('error', (err) => {
                    console.error('Download failed:', err);
                });
                            
        })
    })
}
const downloadVideo2=(vidUrl,cookies)=>{
    const agent = ytdl.createAgent(cookies);
    return new Promise((resolve, reject) => {

        try {
            console.log('Getting video info...');
            ytdl.getBasicInfo(vidUrl, { agent }).then(info=>{
                // console.log(info.videoDetails)
                let vidTitle=info.videoDetails.videoId

                console.log(vidTitle)

                const CHUNK_DURATION = 10; // Number of seconds per chunk
                const OUTPUT_FOLDER = `./${vidTitle}`; 

                if (!fs.existsSync(OUTPUT_FOLDER)) {
                    fs.mkdirSync(OUTPUT_FOLDER);
                }

                const stream = ytdl(vidUrl);
               

                const tempFilePath = path.join(OUTPUT_FOLDER, 'temp_video.mp4');
                const tempFileStream = fs.createWriteStream(tempFilePath);
                stream.pipe(tempFileStream);

                tempFileStream.on('finish', () => {
                    console.log('Download complete. Splitting into chunks...');
        
                    ffmpeg(tempFilePath)
                        .outputOptions([
                            `-c copy`, // Copy without re-encoding
                            `-map 0`,  // Map all streams (video/audio)
                            `-segment_time ${CHUNK_DURATION}`, // Set chunk duration
                            `-f segment`, // Output as segments
                            `-reset_timestamps 1`, // Reset timestamps for each chunk
                        ])
                        .output(path.join(OUTPUT_FOLDER, 'chunk_%03d.mp4'))
                        .on('end', () => {
                            console.log('Splitting complete. Chunks saved.');
                            fs.unlinkSync(tempFilePath); // Remove temp file
                        })
                        .on('error', (err) => console.error('Error:', err))
                        .run();
                });

                
                // 
            })
            
            
        } catch (error) {
            console.error('Error:', err);
        }
        
    })
}


module.exports = {
    downloadVideo,downloadVideoWithDetect
  };