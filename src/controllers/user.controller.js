import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudnary.js"
import {ApiResponce} from "../utils/ApiResponce.js"
const registerUser=asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })
    // take user credential
    //cheack crential validation- nit empty
    // cheack already exist:user name || email
    //cheack for image
    // cheack avater 
    // uplote coudnary, avatar
    // creat user object
    // remove password and refresh token field
    //cheack for userr creation
    // return responce


   const {fullName,email,username,password} = req.body
     console.log("email:",fullName);
     console.log("email:",email);
     console.log("email:",username);
     console.log("email:",password);
  if(
    [fullName,email,username,password].some((field)=>
      field?.trim()==="")
    
  ){
    throw new ApiError(400,"all fields are required")
  }
  
 const existedUser=await User.findOne({
    $or:[{username},{email}]
  })
  if(existedUser){
    throw new ApiError(400,"user already exist")
  }
  console.log(req.files)
  const avatarLocalPath=req.files?.avatar[0].path
  //const coverImageLocalPath=req.files?.coverImage[0].path;
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.body.covreImage) && req.body.covreImage.length>0){
    coverImageLocalPath=req.body.covreImage[0].path;
  }
  console.log(avatarLocalPath)
  console.log(coverImageLocalPath)
  if(!avatarLocalPath) {
    throw new ApiError(400,"avater is required")
  }
  const avatar=  await uploadOnCloudinary(avatarLocalPath)
  
 const covreImage = await uploadOnCloudinary(coverImageLocalPath)
 if(!avatar) {
  throw new ApiError(400,"avater file is required")
}
 const finalCoverImage = covreImage?.url || "";

 const user=await User.create({
  fullName,
  avatar: avatar.url,
   finalCoverImage,
  email,
  password,
  username: username.toLowerCase(),
})
 const createdUser=await User.findById(user._id).select("-password -refreshToken")

 if(!createdUser){
  throw new ApiError(500,"something went wrong while user created")
 }

 return res.status(201).json(
  new ApiResponce(200,createdUser,"uere registered sucessfully")
 )
 



})
   


export {registerUser}