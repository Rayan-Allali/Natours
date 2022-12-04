const mongoose =require('mongoose')
const dotenv=require('dotenv')

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
  
dotenv.config({path: './config.env'})
const app = require('./app');

const db=process.env.DATABASE
mongoose.connect(db,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(()=>{
console.log("db is connected")
})


const port= process.env.PORT || 3000;
const server=app.listen(port,()=>{
    console.log(`running on port ${port}...`)
});

process.on('unhandledRejection',err=>{
    console.log(err.name,err.message)
    console.log('Unhansled rejection shuting down')
    server.close(()=>{
        process.exit(1)    
    })
    
})