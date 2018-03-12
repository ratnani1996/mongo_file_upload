const express = require('express')
const app = express();


app.set('view engine', 'ejs');

//middlewares
const path = require('path')
const crypto = require('crypto')
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const GridFsStorage = require('multer-gridfs-storage');
const multer = require('multer')
const Grid = require('gridfs-stream')

//connect to mongodb database
const mongoose = require('mongoose')
const url = "mongodb://localhost:27017/MongoFileUpload"
const conn = mongoose.createConnection(url);
// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  console.log(`Connection to the database up and runnning`)
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});
  
//configure storage
  var storage = new GridFsStorage({
    url: 'mongodb://localhost:27017/MongoFileUpload',
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });


//defining routes
//route for homepage
app.get('/', (req, res)=>{
    res.render('index');
})

//handle post request for upload
//name="file" in HTML
app.post('/upload', upload.single('file'), (req, res)=>{
    res.redirect('/');
})


//route to show all the files
app.get('/files', function(req, res){
    gfs.files.find().toArray((err, files)=>{
        if(!files || files.length == 0){
            return res.status(404).json({err : 'No files present'})
        }
        else{
            return res.json( files);
        }
        
    })
})

//route to get the specific file
//display single file object
app.get('/files/:filename' , (req, res)=>{
    gfs.files.findOne({filename : req.params.filename}, (err, files)=>{
        if(!files || files.length == 0){
            return res.status(404).json({err : 'File not found'})
        }
        else{
            return res.json(files);
        }
    })
})

//route to get /image:filename
//display single image
app.get('/image/:filename', (req, res)=>{
    gfs.files.findOne({filename : req.params.filename}, (err, files)=>{
        if(!files || files.length == 0){
            return res.status(404).json({err : 'File not found'})
        }
        else{
            if(files.contentType == 'image/png' || files.contentType == 'image/jpg' || files.contentType == 'image/jpeg'){
                var readstream = gfs.createReadStream(files.filename);
                readstream.pipe(res);
            }
            else{
                return res.status(404).json({
                    err : 'No image file'
                })
            }
        }
    })
})


app.listen(3000, ()=>{
    console.log(`Listening to port 3000`);
})