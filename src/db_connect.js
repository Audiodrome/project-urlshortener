const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("devDB").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const db = client.db("devDB");

// init counter for shorturls
async function count() {
  await db.collection("tinyurls").deleteMany({});
  let result = await db.collection("tinyurls").findOne({ count_id: "One" });
  if (result === null) {
    result = await db.collection("tinyurls").insertOne({ count_id: "One", counter: 0 });
  }
  // console.log("result", result);
}

count().catch(console.error);

module.exports.db = db;
module.exports.ObjectId = ObjectId;