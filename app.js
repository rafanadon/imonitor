const express =  require("express");
const path = require('path');
const mysql = require("mysql");
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');






//loop in the app.js
dotenv.config({ path: './.env'});

const app = express();




const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
});


const publicDirectory = path.join(__dirname,'./public');
app.use(express.static(publicDirectory));
app.use(express.static('images'));


//parse Url-encoded bodies (as sent by html forms)
app.use(express.urlencoded({extended: false}));
//parse JSON bodies
app.use(express.json());
app.use(cookieParser());




app.set('view engine', 'hbs');




// to know if database is connected
db.connect((error)=>{
    if(error) {
        console.log(error)
    }else{
        console.log("MYSQL CONNECTED...")
    }

});


//define routes
app.use('/', require('./route/pages'));
app.use('/auth',require('./route/auth'));





app.listen(8000, () => {
    console.log("Server started on Port 8000");
});

