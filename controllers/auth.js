const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');



const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
});



// login controller for the Admin
exports.aLogin = async (req, res) => {
    try {
      // checking if the email and password are in the database
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).render('aLogin', {
            message: 'Please provide an email and password',
          });
        }
    
        const query = 'SELECT * FROM admin WHERE email = ?';
        db.query(query, [email], async (error, result) => {
          if (error) {
            console.error('Error executing query:', error);
            return res.status(500).render('aLogin', {
              message: 'Internal Server Error',
            });
          }
    
          if (!result || result.length === 0) {
            return res.status(401).render('aLogin', {
              message: 'Email or password is incorrect',
            });
          }
    
          const user = result[0];
          const passwordMatch = await bcrypt.compare(password, user.password);
    
          if (!passwordMatch) {
            return res.status(401).render('aLogin', {
              message: 'Email or password is incorrect',
            });
          }
    
          const id = user.id;
          const token = jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          });
    
          console.log('The token is:', token);
    
          const cookieOptions = {
            expires: new Date(
              Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
          };
    
          res.cookie('jwt', token, cookieOptions);
          res.status(200).redirect('/aDash');
        });
      } catch (error) {
        console.error('Error in aLogin:', error);
        res.status(500).render('aLogin', {
          message: 'Internal Server Error',
        });
      }
    };


//login controller for users
exports.uLogin = async (req, res) => {
    try {
      // to recieve data from the user
      const { email, password } = req.body;
      // check if their email and password written in the input box
      if (!email || !password) {
        return res.status(400).render('uLogin', {
          message: 'Please provide an email and password', //it will send an error if there is no matching email or password
        });
      }
      //database query to check 
      const query = 'SELECT * FROM users WHERE email = ?';
      db.query(query, [email], async (error, result) => {
        if (error) {
          console.error('Error executing query:', error);
          return res.status(500).render('uLogin', {
            message: 'Internal Server Error',
          });
        }
  
        if (!result || result.length === 0) {
          return res.status(401).render('uLogin', {
            message: 'Email or password is incorrect',
          });
        }
        
        const user = result[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        // if the password doesnt match it will render the login page 
        if (!passwordMatch) {
          return res.status(401).render('uLogin', {
            message: 'Email or password is incorrect',
          });
        }
        // check the id of the logged in user using token 

        const id = user.id;
        const token = jwt.sign({ id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });
  
        console.log('The token is:', token);
        
        //will use cookies for extra authentication
        const cookieOptions = {
          expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
          ),
          //to prevent sidescripts to access the data without in a http environment
          httpOnly: true,
        };
        
        //if it is verified and have cookies it will be directed to the user dashboard
        res.cookie('jwt', token, cookieOptions);
        res.status(200).redirect('/uDash');
      });
    } catch (error) {
      console.error('Error in uLogin:', error);
      res.status(500).render('uLogin', {
        message: 'Internal Server Error',
      });
    }
  };
  

// This is for the register controller
exports.register = (req, res) => {
    console.log(req.body);


    const { name, email, password, confirmPassword } = req.body;

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) =>{
        if (error) {
            console.log(error);
        }
        if(result.length > 0) {
            return res.render('register', {
                message: 'That email is already in use'
            });
        } else if (password !== confirmPassword) {
            return res.render('register', {
                message: 'Passwords do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO users SET ?', {name: name, email: email, password: hashedPassword}, (error, result) => {
            if(error){
                console.log(error);
            }else{
                console.log(result);
                return res.render('register', {
                    message: 'Intern Registered'
                });
                
            }
        })

    });


}


// 1
// controller for the security and token 
exports.isuLoggedIn = async (req, res, next) =>{
    if (req.cookies.jwt) {
            try {
                //  verify the token
                const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
     
                console.log(decoded);

            // 2. check the user if still exist
            db.query('SELECT * FROM users WHERE id=?', [decoded.id], (error, result)=>{
                console.log(result);
                
                if(!result){
                       return next();
                    }
                    req.user = result[0];

                    return next();
            });
            



        } catch (error) {
            console.log(error);
            return next();
        }
    }else{
        next();
    }
    
}

// Admin log in functionality
exports.isaLoggedIn = async (req, res, next) =>{
  
  if (req.cookies.jwt) {
          try {
              //  verify the token
              const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
   

          // 2. check the user if still exist
          db.query('SELECT * FROM admin WHERE id=?', [decoded.id], (error, result)=>{
              
              if(!result){
                     return next();
                  }
                  req.admin = result[0];

                  return next();
          });
          
          

      } catch (error) {
          console.log(error);
          return next();
      }
  }else{
      next();
  }
  
}




// user logout functionality 
exports.uLogout = async (req, res) => {
    res.cookie('jwt', 'ulogout',{
        expires: new Date(Date.now()+ 2*1000), //create new Date for cookie that will expire in 2 seconds
        httpOnly: true //only true with http

    });

    res.status(200).redirect('/uLogin');
}



// Admin logout functionality 
exports.aLogout = async (req, res) => {
    res.cookie('jwt', 'alogout',{
        expires: new Date(Date.now()+ 2*1000), //create new Date for cookie that will expire in 2 seconds
        httpOnly: true //only true with http

    });

    res.status(200).redirect('/aLogin');
}

// users input their profile details



// users  will see their profiles details at the dashboard
exports.uview = async (req, res, ) => {
  try {
    // Verify the token for each user, then store it in the variable named 'decoded'
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);


    // Database query
    db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (err, result) => {
      if (!err) {
        // If there is no error, display the user data in the user dashboard with the result
        const userData = result[0];

        // Include the image URL in the data object
        const data = {
          name: userData.name,
          age: userData.age,
          gender: userData.gender,
          birthday: userData.birthday,
          bPlace: userData.bPlace,
          civilStatus: userData.civilStatus,
          address: userData.address,
          contact: userData.contact,
          email: userData.email,
          father: userData.father,
          mother: userData.mother,
          cityAdd: userData.cityAdd,
          provincial: userData.provincial,
          company: userData.company,
          hostAdd: userData.hostAdd,
          supervisor: userData.supervisor,
          hostContact: userData.hostContact,
          image: userData.image,
        };

        res.render('uDash', { result: [data] });

      } else {
        console.log(err);
        res.status(500).render('errorPage', {
          message: 'Internal Server Error',
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).render('errorPage', {
      message: 'Internal Server Error',
    });
  }
};




//admin to delete interns
exports.delete = (req, res) =>{
    // database query 
    db.query('DELETE FROM users WHERE id = ?',  [req.params.id] , (err, result) => {
        if(!err){
            res.redirect('aDash'); //if there is no error it will redirect to Admin Dashboard
        }else{
            console.log(err);
        }
        
        console.log('The data from user table: \n', result);  // this will log the result to the console

    });

};

exports.requirements = async (req, res) => {
  console.log(req.body);

  // verify the token for the logged in user
  const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
  console.log(decoded);
  // Create Multer upload instance
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../images/'));
      },
      filename: (req, file, cb) => {
        const uniqueId = uuidv4(); // Generate unique ID
        const originalName = file.originalname;
        const extension = path.extname(originalName);
        const filename = uniqueId + extension;
        cb(null, filename);
      },
    }),
  });

  // Use Multer middleware for file upload
  upload.single('simpleFile')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      console.error(error);
      return res.status(500).send('Error occurred while uploading the file.');
    } else if (error) {
      console.error(error);
      return res.status(500).send('Error occurred while uploading the file.');
    }
    const {
      internsId,
      age,
      gender,
      birthday,
      bPlace,
      civilStatus,
      address,
      contact,
      father,
      mother,
      cityAdd,
      provincial,
      company,
      hostAdd,
      supervisor,
      hostContact,
    } = req.body;
  
    const updatedData = {
      internsId,
      age,
      gender,
      birthday,
      bPlace,
      civilStatus,
      address,
      contact,
      father,
      mother,
      cityAdd,
      provincial,
      company,
      hostAdd,
      supervisor,
      hostContact,
    };
  
    // Update user data and handle file upload if available
    const updateAndUpload = () => {
      db.query('UPDATE users SET ? WHERE id = ?', [updatedData, decoded.id], (error, result) => {
        if (error) {
          console.log(error);
          return res.status(500).render('requirements', {
            message: 'Error updating data',
          });
        } else {
          console.log(result);
          return res.render('requirements', {
            message: 'Updated',
          });
        }
      });
    };

    if (req.file) {
      const photoFileName = req.file.filename; // Get the filename of the uploaded photo
      db.query('UPDATE users SET image = ? WHERE id = ?', [photoFileName, decoded.id], (error, result) => {
        if (error) {
          console.log(error);
          return res.status(500).render('requirements', {
            message: 'Error updating data',
          });
        } else {
          console.log(result);
          updateAndUpload(); // Call the updateAndUpload function after file upload
        }
      });
    } else {
      updateAndUpload(); // Call the updateAndUpload function if no file is uploaded
    }
  });
};






