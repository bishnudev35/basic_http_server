import mongoose from "mongoose";
import { DB_NAME } from "../comstants.js";

const connectDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST :  ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB CONNECTION error", error);
       process.exit(1)
    }
}
export default connectDB