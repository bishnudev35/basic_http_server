import { Router } from "express";
import {  logInUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middlewear.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
const router =Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

    router.route("/login").post(logInUser)

    //secrate routes
    router.route("/loggout").post(verifyJWT,logoutUser)

export default router