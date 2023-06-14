const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');



//middleware
app.use(cors());
app.use(express.json())


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aj4jua7.mongodb.net/?retryWrites=true&w=majority`;

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

    const userCollection = client.db('sportsDb').collection('user')
    const classCollection = client.db('sportsDb').collection('myClass')




    app.post('/addclass', async (req, res) => {
      const myClass = req.body;
      const result = await classCollection.insertOne(myClass)
      res.send(result)
    })
    app.get('/myClass', async (req, res) => {
    
      const result = await classCollection.find().toArray();
      res.send(result);
    })





    
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send(token)
    })

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
    const verifyInstructors = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      if (user?.role !== 'instructors') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
   

    

    app.get('/dashboard/myclass', async (req, res) => {
      const email = req.query.email;
      if(!email){
        res.send([])
      }
      const query = {'instructors.email':email};
      const result = await classCollection.find(query).toArray();
      res.send(result)
    })
    app.get('/dashboard/allclasses', async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result)
    })


    app.get('/users',verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })
    


    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email:email}
      const user = await userCollection.findOne(query)
      const result = {admin:user?.role==='admin'};
      res.send(result)
    })



    // app.get('/users/instructors/:email', async (req, res) => {
    //   const email = req.params.email;
    //   const query = {email:email}
    //   const user = await userCollection.filter(query)
    //   const result = {instructors:user?.role==='instructors'};
    //   res.send(result)
    // })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user)
      res.send(result)

    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })
    app.patch('/users/instructors/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructors'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    console.log("Database Connected successfully ✅");
  } finally {

  }
}
run().catch(console.error);



app.get('/', (req, res) => {
  res.send('Sports Is On')
})
app.listen(port, () => {
  console.log(`Sports Is Opening At ${port}`)
})
