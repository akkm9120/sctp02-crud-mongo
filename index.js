const express = require('express');
const cors = require('cors');
const mongodb = require('mongodb');
require('dotenv').config();


const MongoClient = mongodb.MongoClient;

// create a shortcut to mongodb.ObjectId
const ObjectId = mongodb.ObjectId;

// create the express application
const app = express();

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
                criteria.Name = {
                    '$regex': req.query.name,
                    '$options': 'i'
                };
            }

            if (req.query.subjects) {
                criteria.Subjects = {
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
                })
                return;
            }
            if (!subjects || !Array.isArray(subjects)) {
                res.status(400);
                res.json({
                    'error': 'Subjects must be provided and must be an array'
                })
            }
          
            const dateObject = new Date(dateEnrolled);
            console.log(dateObject)
            // insert a new document based on what the client has sent
            const result = await db.ollection("students").insertOne({
                'Name': name,
                'Age': age,
                'Subjects': subjects,
                'DateEnrolled': dateObject
            });
            console.log("Results:", result); // Log the results for debugging
            res.json({
                'result': result
            })
        } catch (e) {
            // e will contain the error message
            res.status(500);
            // internal server error
            res.json({
                'error': e
            })
        }

    })

    app.put('/students/:id', async function (req, res) {
        try {
            const description = req.body.description;
            const food = req.body.food;
            const datetime = req.body.datetime ? new Date(req.body.datetime) : new Date();

            if (!description || !food || !Array.isArray(food)) {
                res.status(400); // bad request -- the client didn't follow the specifications for our endpoint
                res.json({
                    'error': 'Invalid data provided'
                });
                return;
            }

            const result = await db.collection("sightings").updateOne({
                '_id': new ObjectId(req.params.id)
            }, {
                '$set': {
                    'description': description,
                    'food': food,
                    'datetime': datetime
                }
            })

            res.json({
                'result': result
            })
        } catch (e) {
            res.status(500);
            res.json({
                'error': 'Internal Server Error'
            })
        }

    })

    app.delete('/students/:id', async function (req, res) {
        await db.collection('sightings').deleteOne({
            '_id': new ObjectId(req.params.id)
        });

        res.json({
            'message': "Deleted"
        })
    })


    app.post("/subjects/:subjectName", async function (req, res) {
        const subject_name = req.params.subjectName;
        const newSubject = {
            subject_name
        }
        const result = await db.collection("subjects").insertOne(newSubject);

        res.json({
            "result": result
        })
    })

    app.get("/subjects", async function (req, res) {
        const results = await db.collection("subjects").find({}).toArray();
        res.json({
            "subjects": results
        })
    })

    app.delete("/subjects/:subjectName", async function (req, res) {
        const subjecName = req.params.subjectName;
        const id = db.collection()
    })
}

main();

app.listen(3000, function () {
    console.log("Server has started");
});