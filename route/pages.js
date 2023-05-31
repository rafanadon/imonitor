const express = require('express');
const authController=require('../controllers/auth'); // this to call out auth in controllers
const mysql = require("mysql");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
});


const router =express.Router();

// routers to bridge static sites
router.get('/',(req,res)=>{
    res.render('index');    
});

router.get('/reqhome', (req,res)=>{
    res.render('reqhome');
})

router.get('/about', (req,res)=> {
    res.render('about');
})

router.get('/register', authController.isaLoggedIn, (req,res)=>{
    
    if(req.admin){
        res.render('register');
    } else{
        res.redirect('/aLogin');
    }
});
router.get('/aLogin',(req,res)=>{
    res.render('aLogin');
});


router.get('/aDash',authController.isaLoggedIn, (req,res)=>{
    if(req.admin){
        // user management by admin that can view the interns basic name and email
        db.query('SELECT * FROM users WHERE status = "active"', (err, result) => {
            if(!err){
              res.render('aDash',{ result });
            }else{
                console.log(err);
            }
        
        });
   
   
   
    } else{
        res.redirect('/aLogin');
    }

});


router.get('/uLogin',(req,res)=>{
    res.render('uLogin');
});

router.get('/uDash',authController.uview, authController.isuLoggedIn, (req,res,next) =>{
    if(req.user){
        res.render('uDash');
     } else {
       res.redirect('/uLogin');
       
    };


});


router.get('/uOjt', authController.isuLoggedIn , (req,res)=>{
    if(req.user){
        res.render('uOjt');
     } else {
       res.redirect('/uLogin');
     }

});

router.get('/requirements', authController.isuLoggedIn, (req, res)=>{
    if (req.user){
        res.render('requirements');
    }else{
        res.redirect('/uLogin')
    }
});


router.get('/uLack', authController.isuLoggedIn, (req,res) =>{
    if (req.user){
        res.render('uLack');
    }else{
        res.redirect('/uLogin');
    }
});




router.get('/:id',authController.delete, (req,res)=>{
        res.redirect('aDash');
    
    
});

module.exports = router;