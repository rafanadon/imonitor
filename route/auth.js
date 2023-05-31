const express = require('express');
const authController = require('../controllers/auth');
const router =express.Router();



//load authcontroller
router.post('/register', authController.register); // <----- This line is for the register page 
router.post('/aLogin',authController.aLogin); // <------ This is to have a bridge from the login html to the controller
router.post('/uLogin',authController.uLogin);// <-------- The bridge to the user login 
router.get('/uLogout', authController.uLogout); //<------- user Logout
router.get('/aLogout', authController.aLogout); //<------- Admin logout

router.get('/uDash', authController.uview); //<------ user can view their profile


router.post('/requirements', authController.requirements); //<-------- User submit form

module.exports = router;