const express = require('express');
const cors = require('cors');
const mongodb = require('mongodb');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const MongoClient = mongodb.MongoClient;

// create a shortcut to mongodb.ObjectId
const ObjectId = mongodb.ObjectId;

// create the express application
const app = express();
require('dotenv').config();
// enable cors
app.use(cors());

// set JSON as the means of
// receiving requests and sending responses
app.use(express.json());

// function to connect to the database
async function connect(uri, dbname) {

    // `connect` allows us to connect to the mongodb
    const client = await MongoClient.connect(uri);
    let db = client.db(dbname);
    return db;
}

async function main() {
    // connection string is now from the .env file
    const uri = process.env.MONGO_URI;
    // get the database using the `connect` function
    const db = await connect(uri, "fake_school");

    // create the routes after connecting to the database
    app.get("/students", async function (req, res) {
        try {
            let criteria = {};

            if (req.query.name) {
                criteria.name = {
                    '$regex': req.query.name,
                    '$options': 'i'
                };
            }

            if (req.query.subjects) {
                criteria.subjects = {
                    '$in': [req.query.subjects],
                    //  
                };
            }

            console.log("Criteria:", criteria); // Log the criteria object for debugging

            const results = await db.collection("students").find(criteria).toArray();

            console.log("Results:", results); // Log the results for debugging

            res.json({
                'students': results
            });

        } catch (e) {
            res.status(500).json({
                'error': e.message
            });
        }
    });




    // Sample Food Sighting document"
    // 	"_id": {
    // 		"$oid": "65eeb99ab1af55b0982204e0"
    // 	},
    // 	"Name": "James Verses",
    // 	"Age": {
    // 		"$numberInt": "14"
    // 	},
    // 	"Subjects": [
    // 		"Transfiguration",
    // 		"Alchemy"
    // 	],
    // 	"DateEnrolled": "15th June 2015"
    // }

    app.post("/students", async function (req, res) {
        try {
            const { name, age, subjects, dateEnrolled } = req.body;
          
            if (!name) {
                res.status(400);
                res.json({
                    'error': 'A Name must be provided'
                });
                return;
            }
    
            if (!age) {
                res.status(400);
                res.json({
                    "error": "Age must be provided"
                });
                return;
            }
    
            if (!subjects || !Array.isArray(subjects)) {
                res.status(400);
                res.json({
                    'error': 'Subjects must be provided and must be an array'
                });
                return;
            }
    
            const newStudent = {
                name,
                age,
                subjects: subjects.map(subject => ({ _id: new ObjectId(), name: subject })),
                dateEnrolled: new Date(dateEnrolled) || new Date()
            };
    

            const result = await db.collection("students").insertOne(newStudent);
    
           


            res.json({
                'result': result // Return the newly inserted document
            });
        } catch (e) {
            res.status(500);
            res.json({
                'error': e.message
            });
        }
    });
    
    app.put('/students/:studentid', async function (req, res) {
        try {
            const { name, age, subjects, dateEnrolled } = req.body;
    
            if (!name) {
                res.status(400);
                res.json({
                    'error': 'A Name must be provided'
                });
                return;
            }
    
            if (!age) {
                res.status(400);
                res.json({
                    "error": "Age must be provided"
                });
                return;
            }
    
            if (!subjects || !Array.isArray(subjects)) {
                res.status(400);
                res.json({
                    'error': 'Subjects must be provided and must be an array'
                });
                return;
            }
    
            const modifiedStudent = {
                name,
                age,
                subjects: subjects.map(subject => ({ _id: new ObjectId(), name: subject })),
                dateEnrolled: new Date(dateEnrolled) || new Date()
            };
    
            await db.collection("students").updateOne(
                { "_id": new ObjectId(req.params.studentid) },
                { '$set': modifiedStudent }
            );
    
            res.json({
                'result': modifiedStudent
            });
        } catch (e) {
            res.json({
                'error': e
            });
        }
    });
    

    app.delete('/students/:id', async function (req, res) {
        await db.collection('students').deleteOne({
            '_id': new ObjectId(req.params.id)
        });

        res.json({
            'message': "Deleted"
        })
    })


    // app.post("/subjects/:subjectName", async function (req, res) {
    //     const subject_name = req.params.subjectName;
    //     const newSubject = {
    //         subject_name
    //     }
    //     const result = await db.collection("subjects").insertOne(newSubject);

    //     res.json({
    //         "result": result
    //     })
    // })

    // app.get("/subjects", async function (req, res) {
    //     const results = await db.collection("subjects").find({}).toArray();
    //     res.json({
    //         "subjects": results
    //     })
    // })

    // app.delete("/subjects/:subjectName", async function (req, res) {
    //     const subjecName = req.params.subjectName;
    //     const id = db.collection()
    // })>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


    function generateAccessToken(id, email) {
        // the first arugment of `jwt.sign` is the payload that you want to store
        // the second argument of `jwt.sign` is the token secret
        // the third arugment is an option object
        return jwt.sign({
            'user_id': id,
            'email': email
        }, process.env.TOKEN_SECRET, {
            'expiresIn':'3d'  // w = weeks, d = days, h = hours, m = minutes, s = seconds
        });
    }
    
    // this is a middleware function that check if a valid JWT has been provided
    // a middleware function has three arugments: req, res, next
    function authenticateWithJWT(req, res, next) {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(" ")[1];
            // first argument: the token that I want to verify
            // second argument: the token secret
            // third argument: callback function
            jwt.verify(token, process.env.TOKEN_SECRET, function(err,payload){
                if (err) {
                    res.status(400);
                    return res.json({
                        'error': err
                    })
                } else {
                    // the JWT is valid, forward request to the route and store the payload in the request
                    req.payload = payload;
                    next();
                }
            })
        } else {
            res.status(400);
            res.json({
                'error':'Login required to access this route'
            })
        }
     
    
    }
    

 // Users sign up and log in
    // It is very common in RESTFul API to represent a process as a document 
    // that is created because of said process
    app.post('/user', async function(req,res){

        // hashing with bcrypt is an async function
        // bcyrpt.hash takes two argument:
        // 1. the plaintext that you want to hash
        // 2. how secure you want it
        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        const result = await db.collection('users').insertOne({
            'email': req.body.email,
            'password': hashedPassword
        })
        res.json({
            'result': result
        })
    })

    // Allow user to log in by providing their email and password
    app.post('/login', async function(req,res){
        // 1. Find the user by email address
        const user = await db.collection('users')
                        .findOne({
                            email: req.body.email
                        });

        
        // 2. Check if the password matches
        if (user) {
            // bcrypt.compare()
            // - first arugment is the plaintext
            // - second argument is the hashed version 
            if (await bcrypt.compare(req.body.password, user.password)) {
                // valid login - so generate the JWT
                const token = generateAccessToken(user._id, user.email);
                res.json({
                    'token': token
                })
            } else {
                res.status(400);
                res.json({
                    'error':'Invalid login credentials'
                })
            }
        } else {
            res.status(400);
            return res.json({
                'error':'Invalid login credentials'
            })
        }

        // 3. Generate and send back the JWT (aka access token)
    });

    // Protected route: client must provide the JWT to access
    app.get('/profile',authenticateWithJWT, async function(req,res){
       
        res.json({
            'message':'success in accessing protected route',
            'payload': req.payload
        })
    })

    app.get('/payment', authenticateWithJWT, async function(req,res){
        res.json({
            'message':"accessing protected payment route"
        })
    })
}      


main();

app.listen(3000, function () {
    console.log("Server has started");
});