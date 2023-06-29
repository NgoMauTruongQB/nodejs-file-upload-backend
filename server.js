const express = require('express')
const cors = require('cors')
const multer = require('multer')
const datauriParser = require('datauri/parser')
const cloudinary = require('cloudinary').v2
require('dotenv').config()
const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true}))
app.use(cors())

// Multer settings
const ALLOWED_FOMATS = ['image/jpeg', 'image/png', 'image/jpg']

// Use memoryStorage for multer upload (dùng ram cho việc upload thay vì lưu file trên ổ đĩa)
const storage = multer.memoryStorage()
const upload = multer({
    storage,
    fileFilter: function(req, file, cb) {
        if(ALLOWED_FOMATS.includes(file.mimetype)) {
            cb(null,true)
        } else {
            cb(new Error('[ERROR] Not supported file type!!!'), false)
        }
    },
})

const singleUpload = upload.single('file')
const singleUploadCtrl = (req, res, next) => {
    singleUpload(req, res, (error) => {
        if(error) {
            return res.status(422).send({
                message: 'Image upload failed'
            })
        }
        next()
    })
}

// Using datauri to stream buffer
const parser = new datauriParser()
const path = require('path')
const formatBuffer = (file) => {
    return parser.format(path.extname(file.originalname).toString().toLowerCase(), file.buffer)
}

// Setting cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
})

cloudinaryUpload = (file) => {
    return cloudinary.uploader.upload(file, {
        upload_preset: process.env.UPLOAS_PRESET,
    })
}

// Upload API
app.post('/api/upload', singleUploadCtrl, async (req, res) => {
    try {
        if(!req.file) {
            return res.status(422).send({
                message: 'There is error when uploading'
            })
        }
        // Convert stream to base64 format
        const file64 = formatBuffer(req.file)
        const uploadResult = await cloudinaryUpload(file64.content)
        return res.status(200).json({
            cloudinaryId: uploadResult.public_id,
            url: uploadResult.secure_url,
            message: 'Upload Seccessfully'
        })
        
    } catch (error) {
        return res.status(402).send({
            message: error.message
        })
    }
})


app.get('/api', (req, res, next) => {
    console.log('Hello world')
})

app.listen(port, () => {
    console.log('Port is running on:', port)
})