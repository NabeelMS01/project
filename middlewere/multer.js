const multer = require("multer");
const path =require('path')


const storage = multer.diskStorage({

  destination: (req,file,cb)=>{
     cb(null,'public/uploads/')
  },
  filename: (req, file, cb) => {
  //  path.extname(file.originalname.substr(file.originalname.lastIndexOf('.')) )


const ext =file.originalname.substring(file.originalname.lastIndexOf('.'))
    cb(
      null, file.fieldname + "-" + Date.now() + ext
    );
  },
});

//init upload

  const upload= multer({
    storage:storage
  })

module.exports = upload