const { promisify } =require('util')
const User =require('../models/userModel')
const AppError=require('./../utils/appError.js')
const catchAsync =require('../utils/catchAsync')

const crypto=require('crypto')
const jwt=require('jsonwebtoken')
const sendEmail=require('./../utils/email')

const signToken=(id)=>{
   return jwt.sign(/*the payload */ { id } ,/*the secrute */process.env.JWT_SECRET, {/*expire date this is optional*/ expiresIn:process.env.JWT_EXPIRES_IN})
}

const createSendToken=(user,statusCode,res)=>{
    const token=signToken(user._id)
    const cookieOptions={
        expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly:true
    }
    if(process.env.NODE_ENV === 'production'){
        cookieOptions.secure=true
    }
    user.password=undefined
    res.cookie('jwt',token,cookieOptions)
        res.status(statusCode).json({
            status:'success',
            token,
            data:{
                user
            }
        })
}
exports.signUp  =catchAsync(async (req,res,next)=>{
    const newUser = await User.create(req.body)
   createSendToken(newUser,201,res)
    }) 
exports.login = catchAsync(async (req,res,next)=>{
        const { email , password }=req.body;
        if(!email || !password){
          return  next(new AppError('please provide an email and password'),400)
        }
    const user= await User.findOne({ email }).select('+password')
    
    if(!user || !(await user.correctPassword(password,user.password))){
        return next(new AppError('Incorect email or password'),401)
    }
   createSendToken(user,200,res)
    })

    exports.protect = catchAsync(async (req, res, next) => {
      // 1) Getting token and check of it's there
      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
      }
    
      if (!token) {
        return next(
          new AppError('You are not logged in! Please log in to get access.', 401)
        );
      }
    
      // 2) Verification token
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next(
          new AppError(
            'The user belonging to this token does no longer exist.',
            401
          )
        );
      }
    
      // 4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
          new AppError('User recently changed password! Please log in again.', 401)
        );
      }
      // GRANT ACCESS TO PROTECTED ROUTE
      req.user = currentUser;
      res.locals.user = currentUser;
      next();
    });
// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
        if (req.cookies.jwt) {
          try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
              req.cookies.jwt,
              process.env.JWT_SECRET
            );
      
            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
              return next();
            }
      
            // 3) Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
              return next();
            }
      
            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
          } catch (err) {
            return next();
          }
        }
        next();
      };

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
    });
  res.status(200).json({ status: 'success' });
      };

exports.restrictTo=(...roles)=>{
    return (req,res,next) =>{
        //roles is an array ['admin','leas-guide']

        //role is user
        if(!roles.includes(req.user.role)){
           return next(new AppError('you do not have permission to preform this action',403))
        }

        next()
    }
}
exports.forgetPassword=catchAsync(async  (req,res,next)=>{
    //1 get user based on posted email
    const user=await User.findOne({email:req.body.email })
    if(!user){
        return next(new AppError('There is no user with that email',404))
    }
    //2 Generate the randome reset token 
    const resetToken=user.createPasswordResetToken()
    await user.save({validateBeforeSave:false})
    //3 send it to user's email
   
    const resetUrl=`${req.protocol}:://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    
    const message =`forget your password ? Submit patch request with your new password and passwordconfirme to : ${resetUrl}.
    \n if you didn't forget your password please ignore this email !`
    
    try {
        await sendEmail({
          email: user.email,
          subject: message,
          message:message
        });
    
        res.status(200).json({
          status: 'success',
          message: 'Token sent to email!'
        });
      } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
    
        return next(
          new AppError('There was an error sending the email. Try again later!'),
          500
        );}
})

exports.resetPassword=catchAsync(
    async (req,res,next)=>{
        // 1 get the user based on the token
    const hashedToken =crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    
    const user=await User.findOne({passwordResetToken: hashedToken})
        //2 if Token has expired
    if(user.passwordResetExpires < Date.now()){
        return next(new AppError('the token is expired or invalid '),400)
    }
        //3 update changepasswordAt property of the user 
   user.password = req.body.password;
   user.passwordConfirme = req.body.passwordConfirme;
   user.passwordResetExpires=undefined;
   user.passwordResetToken=undefined;
  await user.save()
        //4 log the user in,send jwt
    createSendToken(user,200,res)
        next()
    }
)
exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
  
    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
      return next(new AppError('Your current password is wrong.', 401));
    }
  
    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!
  
    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  });
  