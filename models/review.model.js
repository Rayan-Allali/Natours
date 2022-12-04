const mongoose =require('mongoose')
const Tour=require('./tourModel.js')
const ReviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
ReviewSchema.index({tour : 1,user: 1},{unique:true})
ReviewSchema.pre(/^find/ , function(next){
  this.populate({path:'user' , select :'name photo'})
  next()
})

ReviewSchema.statics.calcAverageRatings=async function(tourId){
const status =await this.aggregate([
  {$match:{tour:tourId}},
  {$group:{
    _id:'$tour',
    nRatings:{$sum:1},
    avgRating:{$avg:'$rating'}
  }}
]);
if(status.lenght>0){
  await Tour.findByIdAndUpdate(tourId,{ratingsQuantity:status[0].nRatings,
    ratingsAverage:status[0].avgRating})
}else{
  await Tour.findByIdAndUpdate(tourId,{ratingsQuantity:0,
    ratingsAverage:4.5})
}

}
ReviewSchema.post('save',function(){
  this.constructor.calcAverageRatings(this.tour);
})
ReviewSchema.pre(/^findOneAnd/,async function(next){
  this.r=await this.findOne()
})
ReviewSchema.post(/^findOneAnd/,async function(next){
 await this.r.constructor.calcAverageRatings(this.r.tour);
})
const Review=mongoose.model('Review',ReviewSchema);
module.exports=Review