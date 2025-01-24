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

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword= asyncHandler(async (req,res)=> {
  const {oldPassword,newPassword}=req.body

  const user=await User.findById(req.body?._id)

 const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
 if(!isPasswordCorrect){
  throw new ApiError(400, "Invalid old password")
 }
 user.password=newPassword
 await user.save({validateBeforeSave:false})
 return res.status(400)
 .json(new ApiResponce (200,{},"Password changed sucessfully"))
  
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"current user fatched sucessfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body
  if(!fullName || !email){
    throw new ApiError(400,"all fields are required")
  }
  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
    $set:{
      fullName,
      email:email,
    }
    },{
      new:true
    }
  ).select("-password")
  return res.status(200)
  .json( new ApiResponce(200,user, "Account details updated sucessfully"))
})

const updateUserAvatar= asyncHandler(async(req,res)=>{
const avatarLocalPath=req.file?.path
if(!avatarLocalPath){
  throw new ApiError(400, "Avatar file missing")
}
const avatar=await uploadOnCloudinary(avatarLocalPath)
if(!avatar.url){
  throw new ApiError(400,"Error while uploding on avatar ")
}
 const user=await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      avatar:avatar.url
    }
  },
  {new:true},
).select("-password")
return res.status(200)
.json(
  new ApiResponce (200, user,"Avatar updated sucessfully")
)
})


const updateUserCoverImage= asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400, "cover image  file missing")
  }
  const coverImage=await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage.url){
    throw new ApiError(400,"Error while uploding on coverImage ")
  }
   const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
      coverImage:coverImage.url
      }
    },
    {new:true},
  ).select("-password")
  return res.status(200)
  .json(
    new ApiResponce (200, user,"CoverImage updated sucessfully")
  )
  })
 

export {registerUser,
  logInUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
}