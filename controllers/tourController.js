const Tour=require('./../models/tourModel')
const catchAsync=require('./../utils/catchAsync')
const AppError=require('./../utils/appError')
// const AppError=require('./../utils/appError')
const factory=require('./handlerFactory')
/* exports.checkId=(req,res ,next)=>{
//     if(val > tours.length - 1){
//         return res.status(404).json({
//          status:'fail',
//          message:'invalid id'
//         })
//        }
//        next()
 } */
exports.alisTopTours=(req,res,next)=>{
req.query.limit='5';
req.query.sort='-ratingsAverge,price'
req.query.fields='name,price,ratingsAverge,summary,,difficulty';
next()
}



exports.getAllTours=factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
  exports.createTour=factory.createOne(Tour)
 exports.updateTour=factory.updateOne(Tour)
   exports.deleteTour =factory.deleteOne(Tour)
  exports.getTourStat=catchAsync(async(req,res,next)=>{
    
    const stats =await Tour.aggregate([
      {
          $match:{ratingsAverage:{$gte:4.5}}
      },
      {
          $group:{
              _id:'$difficulty',
              numTours:{$sum: 1},
              numRatingd:{$sum:'$ratingsQuantity'},
              avgRating:{$avg: '$ratingsAverage'},
              avgPrice:{$avg:'$price'},
              minPrice:{$min:'$price'},
              maxPrice:{$max:'$price'},
          }
      },
      {
          $sort:{
              avgPrice:1
          }
      },
      {$match:{
          __id:{$ne:'easy'}
      }}
  ])
  res.status(200).json({
      statu:'success',
      data:{
         stats
      }
  })

})


  exports.getMonthlyPlan =catchAsync(async (req, res,next) => {
    
    const year = req.params.year * 1; // 2021
  
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'
      },
      {
        $match: {
          startDates: {
              $gte: (`${year}-01-01`), 
              $lte: (`${year}-12-31`)
          }
        }
      },
      {
          $group: {
            _id: { $month:'$startDates' },
            numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
          }
        },
        {
          $addFields: { month: '$_id' }
        },
        {
          $project: {
            _id: 0
          }
        },
        {
          $sort: { numTourStarts: -1 }
        },
        {
          $limit: 12
        }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  }) 
  ///tours-within/:distance/center/:latlng/unit/:unit
  exports.getToursWithin=catchAsync(async(req,res,next)=>{
    const {distance , latlng , unit}=req.params
    const [lat,lng]=latlng.split(',')
    const radius= unit === 'mi' ? distance / 3963.2 :distance / 6378.1
    if(!lat || !lng){
      next(new AppError('plese provide the lat and the lng',400))
    }
const tours=await Tour.find({startLocation:{$geoWithin:{$centerSphere:[[lng,lat], radius]}}})
    res.status(200).json({
      status:"success",
      results:tours.length,
      data:{
        data:tours
      }
    })
  })
  exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  
    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitutr and longitude in the format lat,lng.',
          400
        )
      );
    }
  
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng * 1 ,  lat * 1]
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
          spherical: true
        }
      },
      {
        $project: {
          distance: 1,
          name: 1
        }
      }
    ]);
  
    res.status(200).json({
      status: 'success',
      data: {
        distances
      }
    });
  });