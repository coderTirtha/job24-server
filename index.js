const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = 5000 || process.env.PORT;

// readyMade Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pj7mp5d.mongodb.net/?retryWrites=true&w=majority`;

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  // console.log(token);
  if (!token) {
    return res.status(401).send({ message: "Not Authorized" })
  }
  jwt.verify(token, process.env.ACCESS_WEB_TOKEN, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send("Unauthorized")
    }
    // console.log('Value in the token', decoded);
    req.user = decoded;
    next();
  });
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const jobCollection = client.db('job24').collection('jobs');
    // Authentication related APIs
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_WEB_TOKEN, { expiresIn: '1h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      }).send({ success: true });
    });
    app.post('/logout', async (req, res) => {
      const user = req.body;
      // console.log(user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    });


    // job CRUD related APIs
    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      // console.log(newJob);
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    });
    app.get('/jobs', verifyToken, async (req, res) => {
      const user = req.user;
      // console.log("User from token", user);
      if (req.query.email !== req.user.email) {
        return res.status(403).send("Forbidden");
      }
      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await jobCollection.find(query).toArray();
      res.send(result);
    });
    app.get('/jobs/category', async(req, res) => {
      let query = {}
      if(req.query?.category) {
        query = {category : req.query.category}
      }
      console.log(query);
      const result = await jobCollection.find(query).toArray();
      res.send(result);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send("job24-server is running");
});

app.listen(port, () => {
  console.log(`Server is running at PORT: ${port}`);
});