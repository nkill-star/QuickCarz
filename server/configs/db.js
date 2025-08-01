import mongoose from "mongoose";

const connectDB = async ()=>{
    try {
        mongoose.connection.on('connected', ()=>console.log('databse connected'))
        await mongoose.connect(`${process.env.MONGODB_URI}/QuickCarz`)
    } catch (error) {
        console.log(error.message);
        
    }
}


export default connectDB