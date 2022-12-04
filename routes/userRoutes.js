const express=require('express');

const router=express.Router();

const userController=require('./../controllers/userController');
const authController=require('./../controllers/authController');

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/logout',authController.logout)
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//protect all routes after this middlewar
router.use(authController.protect)


router.patch('/updatePassword', authController.updatePassword)

router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe',  userController.deleteMe);
router.get('/me',userController.getMe,userController.getUser)
//router that are restricted to admin

router.use(authController.restrictTo('admin'))
router.route('/').get(userController.getAllUsers)
router.route('/:id').delete(userController.deleteUser).patch(authController.protect,authController.restrictTo('admin'),userController.updateUser)


module.exports=router;