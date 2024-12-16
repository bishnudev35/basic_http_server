import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"
dotenv.config({path: './.env'})

cloudinary.config({ 
  cloud_name: "dndg0rm9o", 
  api_key:"932353631699168", 
  api_secret: "1Qgzfcjw2ATsJclAIAP3xFzASU8" 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log(process.env.CLOUDINARY_CLOUD_NAME)
        console.log(localFilePath)
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log(response)
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
       // fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}