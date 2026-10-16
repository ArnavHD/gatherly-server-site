const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// const admin = require("firebase-admin");

const serviceAccount = require("./firebase-admin-serviece-key.json");



const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());



// Replace the placeholder with your Atlas connection string
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rd0vmtq.mongodb.net/?appName=Cluster0`;
// Creates a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


initializeApp({
  credential: cert(serviceAccount),
});



const varifyFirebaseToken = async(req, res, next) =>{
  const authHeader = req.headers?.authorization;
  
 
  if(! authHeader || !authHeader.startsWith('Bearer ')){
    return res.status(401).send({message: 'Unauthorized access'});
  }

  const token = authHeader.split(' ')[1];

  try{
    const decoded = await getAuth().verifyIdToken(token);
    console.log("decoded token", decoded);
    req.decoded = decoded;
    next();
  }
  catch(error){
    return res.status(401).send({message: "Unauthorized access"});
  }

  console.log('token in the middleware', token);
  
};

const varifyTokenEmail = (req, res, next) =>{

  if(req.query.email !== req.decoded.email){
    return res.status(403).send({message: 'Forbidden Access'});
  }
  next();

}


async function run() {
  try {
    // Connects the client to the server (optional starting in v4.7)
    await client.connect();

    const eventsCollection = client.db("gatherlyServer").collection("events");
    const applicationsCollection = client.db("gatherlyServer").collection("applications");

    // event api
    app.get("/events", varifyFirebaseToken, varifyTokenEmail, async (req, res) => {

      const email = req.query.email;

      const query = {};
      if(email){
        query["organizer.email"] = email;

      }

      const cursor = eventsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get specific events
    app.get("/events/:id", async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await eventsCollection.findOne(query);
        res.send(result);
    }) 

    app.post('/events', async(req, res)=>{
      const newEvent = req.body;
      console.log(newEvent);
      const result = await eventsCollection.insertOne(newEvent);
      res.send(result);
    })


    
    // event application related apis
    app.get('/applications', varifyFirebaseToken, varifyTokenEmail, async(req, res) =>{
        const email = req.query.email;


        const query = {
            applicant : email,
        }
        const result = await applicationsCollection.find(query).toArray();
        res.send(result);
    })

    app.get("/applications/event/:event_id", async (req, res) => {
      const event_id = req.params.event_id;
      const query = { eventId: event_id };
      const result = await applicationsCollection.find(query).toArray();
      res.send(result);
    });
    

    app.post('/applications', async(req, res)=>{
        const application = req.body;
        console.log(application);
        const result = await applicationsCollection.insertOne(application);
        res.send(result);
    })

    app.patch('/applications/:id', async(req, res) =>{
      const id = req.params.id;
      const updated = req.body;
      const filter = {_id: new ObjectId(id)};

      const updatedDoc = {
        $set: {
          status: req.body.status,
        }
      }
      const result = await applicationsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
    


    // Sends a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
  res.send("Gatherly is rocking");
});

app.listen(port, () => {
  console.log(`Gatherly server is running on port ${port}`);
});
