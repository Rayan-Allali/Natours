const fs=require('fs')
const mongoose =require('mongoose')
const dotenv=require('dotenv')
const Tour=require('./../../models/tourModel')
const User=require('./../../models/userModel')
const Review =require('./../../models/review.model')
dotenv.config({path: './config.env'})
const db=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)
mongoose.connect(db,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(()=>{
console.log("db is connected")
})
//read json fileconst tours = JSON.parse(
    const tours = JSON.parse(
        fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
      );
      const users = JSON.parse(
        fs.readFileSync(`${__dirname}/users.json`, 'utf-8')
      );
      const reviews = JSON.parse(
        fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
      );
//import data to db
const importData=async()=>{
    try{
        await Tour.create(tours)
        await User.create(users,{validateBeforeSave:false})
        await Review.create(reviews)
        console.log('Data Successfully loaded!')
    }
    catch(err){
        console.log(err)
    }
    process.exit()
}
const deleteData=async()=>{
    try{
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()
        console.log('Data Successfully deleted!')
    }
    catch(err){
        console.log(err)
    }
    process.exit()
}
if(process.argv[2]==='--import'){
    importData()
}
else if(process.argv[2]==='--delete'){
    deleteData()
}
console.log(process.argv)