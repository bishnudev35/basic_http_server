import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudnary.js"
import {ApiResponce} from "../utils/ApiResponce.js"

const generateAccessAndRefreshToken=async(userId)=>{
  try{
    const user= await User.findById(userId)
    const accessToken=user.generateAcessToken();
    const refreshToken=user.generateRefreshToken();

    user.refreshToken=refreshToken
    user.save({validateBeforeSave:false})

   return {accessToken,refreshToken}
  }catch(error){
    throw new ApiError(500,"somthing went wrong while generating access and refesh token")
  }
}


const registerUser=asyncHandler(async(req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })
    // take user credential
    //check credntial validation- nit empty
    // check already exist:user name || email
    //cheack for image
    // cheack avater 
    // uplote coudnary, avatarw
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
  if(req.files && Array.isArray(req.body.coverImage) && req.body.coverImage.length>0){
    coverImageLocalPath=req.body.coverImage[0].path;
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

const logInUser= asyncHandler(async(req,res)=>{
  //teke user name ||email and password
  //cheack user exist
  // cheack password
  //access and refreash token
  //send cookie
  //responce
const {email,username,password}=req.body
console.log(email)
if(!username && !email){
  throw new ApiError(400,"username or email required")
}
 const user=await User.findOne({
  $or:[{email},{username}]
})
if(!user){
  throw new ApiError(400,"user not exist")
}
if(!password){
  throw new ApiError(400,"password required")
}
const isPasswordValid=await user.isPasswordCorrect(password)
if(!isPasswordValid){
  throw new ApiError(401, "invalid password")
}
 const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

const LoggdinUser=await User.findById(user._id).select("-password -refreshToken")


 const options={
  httpOnly:true,
  secure:true
 }
 return res.status(200).cookie("accessToken",accessToken,options)
 .cookie("refreshToken",refreshToken,options).json(
  new ApiResponce(
    200,{
      user:LoggdinUser,accessToken,refreshToken
    },"user logged in sucessfully"
  )
 )
})   
   

const logoutUser =asyncHandler(async(req,res)=>{
 await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    }
  )
  const options={
    httpOnly:true,
    secure:true
   }
   return res.status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponce(200,{},"User logged Out"))
})


export {registerUser,
  logInUser,
  logoutUser,
  
}