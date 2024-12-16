import multer from "multer";
const storage=multer.diskStorage({
    declearation:function (req, file, cb) {
        console.log(file)
        cb(null,"./public/temp")
    },
    filename: function(req, file, cb){
        cb(null,file.originalname)
    }
})

export const upload=multer({
    storage,
})

