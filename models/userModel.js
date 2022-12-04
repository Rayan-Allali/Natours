const crypto =require('crypto')
const mongoose=require('mongoose')
const validator=require('validator')
const bcrypt =require('bcryptjs')
const {Schema} = mongoose;
const UserSchema = new Schema({
    name:{
        type:String,
        required:[true,'please tell us your name']
    
    },
    email:{
        type:String,
        validate:[validator.isEmail,'please provide a valid email'],
        required:[true,'user must have an email'],
        unique:true,
        lowercase:true
    },
    photo:{
        type:String
    },
role:{
    type:String,
    enum:['user', 'guide','lead-guide','admin'],
    default:'user'
},
    password:{
        type:String,
        required:[true,'user must have a password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,'please confirme your password'],
        validate:{
            //this only works in save or create !!
            validator:function(val){
                return val === this.password
            }
        },
        select:false
    },
    passwwordChangedAt:{type:Date},
    passwordResetToken:{type:String},
    passwordResetExpires:{type:Date},
    active:{
        type:Boolean,
        default:true,
        select:false
    }

})
UserSchema.pre(/^find/,function(next){
this.find({active:{$ne:false}});
next()
})
UserSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();
  
    this.passwordChangedAt = Date.now() - 1000;
    next();
  });
UserSchema.pre('save',async function(next){
    if(!this.isModified('password'))return next();

    //hash the password cost of 12
    this.password=await bcrypt.hash(this.password, 12);

    this.passwordConfirm= undefined;
    next()
    
})

UserSchema.methods.correctPassword =function(candidatePassword,userPassword){
    return bcrypt.compare(candidatePassword,userPassword)
}

UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
  
      return JWTTimestamp < changedTimestamp;
    }
  
    // False means NOT changed
    return false;
  };
  UserSchema.methods.createPasswordResetToken =function(){
    const resetToken=crypto.randomBytes(32).toString('hex');
    this.passwordResetToken= crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires=Date.now() + 10 * 60 * 1000;

    return resetToken
}
const User=mongoose.model('User',UserSchema);
module.exports = User