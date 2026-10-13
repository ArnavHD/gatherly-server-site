const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;
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
async function run() {
  try {
    // Connects the client to the server (optional starting in v4.7)
    await client.connect();

    const eventsCollection = client.db("gatherlyServer").collection("events");
    const applicationsCollection = client.db("gatherlyServer").collection("applications");

    // event api
    app.get("/events", async (req, res) => {
      const cursor = eventsCollection.find();
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
    
    // event application related apis
    app.get('/applications', async(req, res) =>{
        const email = req.query.email;

        const query = {
            applicant : email,
        }
        const result = await applicationsCollection.find(query).toArray();
        res.send(result);
    })
    



    app.post('/applications', async(req, res)=>{
        const application = req.body;
        console.log(application);
        const result = await applicationsCollection.insertOne(application);
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
