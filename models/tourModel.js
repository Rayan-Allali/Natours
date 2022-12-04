const mongoose=require('mongoose')
const slugify=require('slugify')
 const validator=require('validator')
const {Schema} = mongoose;

const TourSchema = new Schema({
  name: {type:String,required:[true,'tour must have a name'],
   trim:true,
  unique:true,
  maxlength: [40, 'A tour name must have less or equal then 40 characters'],
  minlength: [10, 'A tour name must have more or equal then 10 characters']},
  slug:String,
duration:{type:Number,required:[true,'tour must have a name']},
maxGroupSize:{type:Number,required:[true,'tour must have a Group Size']},
difficulty:{
  type:String,
  required:[true,'tour must have a difficulty'],
  enum: {
    values: ['easy', 'medium', 'difficult'],
    message: 'Difficulty is either: easy, medium, difficult'
  },
  trim:true},
  ratingsAverage:{type:Number,
    default:4.5,
    min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val =>Math.round(val * 10) / 10
},
ratingsQuantity:{
  type:Number,
    default:0 
},
  price:{ 
    type:Number,
    required:[true,'tour must have a price']  
   },
   priceDiscount:{ 
    type:Number,
     validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
  },
   summary:{type:String,trim:true},
   description:{type:String,trim:true,required:[true,'tour must have a description']},
   imageCover:{type:String,trim:true,required:[true,'tour must have a cover image']},
   images:[String],
   CreatedAt:{type:Date,default:Date.now(),select:false},
   startDates:[Date],
   secretTour:{
    type:Boolean,
    default:false
   },
   startLocation:{
    type:{
      type: String,
      default:'Point',
      enum:['Point']
    },
    coordinates:[Number],
    adresse:{type:String},
    description:{type:String}
   },
   locations:[{
    type:{
      type: String,
      default:'Point',
      enum:['Point']
    },
    coordinates:[Number],
    adresse:{type:String},
    description:{type:String},
    day:Number
   }],
   guides:
   [
    {
      type: mongoose.Schema.ObjectId,
      ref:'User'
    
    }
  ]
},{
  toJSON:{ virtuals :true },
  toObject:{ virtuals :true}
});

TourSchema.index({startLocations:'2dsphere'})
TourSchema.index({price:1,ratingsAverage:-1})
TourSchema.index({slug:1})
TourSchema.virtual('durationWeeks').get(function (){
  return this.duration / 7
})

//virtual populate
TourSchema.virtual('reviews',{
  ref:'Review',
  foreignField:'tour',
  localField:'_id'
})
// Documents Middleware:rune before .save() and .create() but not .insertMany()
TourSchema.pre('save',function(next){
  this.slug=slugify(this.name,{lower:true})
  next()
})
// TourSchema.pre('save',function(next){
//   console.log('Will save document...')
//   next()
// })
// TourSchema.post('save',function(doc,next){
//   console.log(doc)
//   next()
// })
// TourSchema.pre('save',async function(next){
//  const guidesPromises= this.guides.map(async id=>
//   await User.findById(id)
//   );
//   this.guides=await Promise.all(guidesPromises)
//   next()
// })

//query Middleware
TourSchema.pre(/^find/,function(next){
  this.populate({path:'guides',
  select:'-__v -passwordChangedAt'}
  )
  next()
})

TourSchema.pre(/^find/,function(next){
  this.find({secretTour:{$ne:true}})
  this.start=Date.now()
  next()
})

TourSchema.post(/^find/,function(doc,next){
  console.log(`it took ${Date.now() - this.start} ms`)
  next()
})

//aggregation middleware
// TourSchema.pre('aggregate',function(next){
//   this.pipline().unshift({ $match:{secretTour :{$ne:true}}})
//   next()
// })


const Tour=mongoose.model('Tour',TourSchema);
module.exports=Tour
