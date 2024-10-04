const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGODB_URI;

// MongoDB connection logic
let db;
async function connectToMongo() {
  if (!db) {
    try {
      const client = new MongoClient(mongoURI, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });
      await client.connect();
      db = client.db("ProductStore");
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection failed:", error);
      throw error;
    }
  }
  return db;
}

// Root route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is working!" });
});

// GET route - Get all items with pagination
app.get("/clothes", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    const db = await connectToMongo();
    const products = db.collection("products");

    const data = await products
      .find()
      .skip(page * perPage)
      .limit(perPage)
      .toArray();

    const totalItems = await products.countDocuments();

    res.status(200).json({
      items: data,
      total: totalItems,
      page,
      perPage,
      totalPages: Math.ceil(totalItems / perPage),
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    res
      .status(500)
      .json({ message: `Failed to fetch products. Error: ${error.message}` });
  }
});

// POST route - Add a new item
app.post("/clothes", async (req, res) => {
  const { image, name, price, rating } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Missing required field(s)" });
  }

  try {
    const db = await connectToMongo();
    const products = db.collection("products");

    const newProduct = { image, name, price, rating };
    await products.insertOne(newProduct);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Failed to add product:", error);
    res
      .status(500)
      .json({ message: `Failed to add product. Error: ${error.message}` });
  }
});

// PUT route - Update an item by ID
app.put("/clothes/:id", async (req, res) => {
  const id = req.params.id;
  const { image, name, price, rating } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Missing required field(s)" });
  }

  try {
    const db = await connectToMongo();
    const products = db.collection("products");

    const updatedProduct = { image, name, price, rating };
    const result = await products.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedProduct }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: `Product with id ${id} updated`,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Failed to update product:", error);
    return res
      .status(500)
      .json({ message: `Failed to update product. Error: ${error.message}` });
  }
});

// DELETE route - Delete an item by ID
app.delete("/clothes/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ message: "Missing id" });
  }

  try {
    const db = await connectToMongo();
    const products = db.collection("products");

    const product = await products.findOne({ _id: new ObjectId(id) });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await products.deleteOne({ _id: new ObjectId(id) });
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete product:", error);
    return res
      .status(500)
      .json({ message: `Failed to delete product. Error: ${error.message}` });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening at http://localhost:${process.env.PORT}`);
});

// Export the app for Vercel
module.exports = app;
