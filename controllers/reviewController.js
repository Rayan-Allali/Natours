const Review=require('./../models/review.model.js')
// const catchAsync=require('./../utils/catchAsync.js')
const factory=require('./handlerFactory')

exports.getAllReviews=factory.getAll(Review)
exports.setTourUserIds=(req,res,next)=>{
    if(!req.body.tour)req.body.tour=req.params.tourId
    if(!req.body.user)req.body.user=req.user.id
    next()
}

exports.getReviews=factory.getOne(Review)
exports.createReviews=factory.createOne(Review)
exports.deleteReview=factory.deleteOne(Review)
exports.updateReview=factory.updateOne(Review)