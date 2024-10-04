const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGODB_URI;

//mongo URI
const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

client.connect();
const db = client.db("ProductStore");
const products = db.collection("products");

app.get("/", (req, res) => {
  res.send("WORKING");
});

// GET route - Allows to get all the items
// example: localhost:8000/clothes?page=0&perPage=2
app.get("/clothes", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    var data = await products
      .find()
      .skip(page * perPage)
      .limit(perPage)
      .toArray();

    res.status(200).json({
      items: data,
      total: data.length,
      page,
      perPage,
      totalPages: Math.ceil(data.length / perPage),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(`Failed to fetch products. Error: ${error}`);
  }
});

// POST route - Allows to add a new item
// example: localhost:8000/clothes
/*
  body: {
    "image": "https://your-image-url.com/image.png",
    "name": "T-shirt",
    "price": "10",
    "rating": 4
  }
*/
app.post("/clothes", async (req, res) => {
  const { image, name, price, rating } = req.body;

  if (!name || !price) {
    res.status(400).send("Missing required field/(s)");
    return;
  }

  try {
    const newProduct = {
      image,
      name,
      price,
      rating,
    };

    await products.insertOne(newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Failed to add product. Error: ${error}`);
    return;
  }
});

// PUT route - Allows to update an item
// example: localhost:8000/clothes/1
/*
  body: {
    "image": "https://your-image-url.com/image.png",
    "name": "T-shirt",
    "price": "10",
    "rating": 4
  }
*/
app.put("/clothes/:id", async (req, res) => {
  const id = req.params.id;
  const { image, name, price, rating } = req.body;

  if (!name || !price) {
    res.status(400).send("Missing required field/(s)");
    return;
  }

  const updatedProduct = {
    image,
    name,
    price,
    rating,
  };

  try {
    const result = await products.updateOne(
      { _id: ObjectId(id) },
      { $set: updatedProduct }
    );

    if (result.modifiedCount === 0) {
      res.status(404).send({ error: "Job not found" });
    } else {
      res.status(200).send(`Job with id ${jobId} updated`);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(`Failed to update product. Error: ${error}`);
    return;
  }
});

// DELETE route - Allows to delete an item
// example: localhost:8000/clothes/1
app.delete("/clothes/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) {
    res.status(400).send("Missing id");
    return;
  }

  try {
    const product = await products.findOne({ _id: new ObjectId(id) });
    if (!product) {
      res.status(404).send("Not Found");
      return;
    }

    await products.deleteOne({ _id: new ObjectId(id) });
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(500).send(`Failed to delete product. Error: ${error}`);
    return;
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening at http://localhost:${process.env.PORT}`);
});

// Export the app for Vercel
module.exports = app;
