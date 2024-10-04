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
// example: localhost:3000/clothes?page=0&perPage=2
app.get("/clothes", async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    var data = await products
      .find()
      .skip(page * perPage)
      .limit(perPage)
      .toArray();

    console.log(data.length);

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
// example: localhost:3000/clothes
/*
  body: {
    "image": "https://your-image-url.com/image.png",
    "name": "T-shirt",
    "price": "10",
    "rating": 4
  }
*/
app.post("/clothes", (req, res) => {
  const { image, name, price, rating } = req.body;

  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);

    const maxId = jsonData.items.reduce(
      (max, item) => Math.max(max, item.id),
      0
    );

    const newItem = {
      id: maxId + 1,
      image,
      name,
      price,
      rating,
    };

    jsonData.items.push(newItem);

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(201).json(newItem);
    });
  });
});

// PUT route - Allows to update an item
// example: localhost:3000/clothes/1
/*
  body: {
    "image": "https://your-image-url.com/image.png",
    "name": "T-shirt",
    "price": "10",
    "rating": 4
  }
*/
app.put("/clothes/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { image, name, price, rating } = req.body;

  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);

    const index = jsonData.items.findIndex((item) => item.id === id);

    if (index === -1) {
      res.status(404).send("Not Found");
      return;
    }

    jsonData.items[index] = {
      id,
      image,
      name,
      price,
      rating,
    };

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(200).json(jsonData.items[index]);
    });
  });
});

// DELETE route - Allows to delete an item
// example: localhost:3000/clothes/1
app.delete("/clothes/:id", (req, res) => {
  const id = parseInt(req.params.id);

  fs.readFile("db.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const jsonData = JSON.parse(data);

    const index = jsonData.items.findIndex((item) => item.id === id);

    if (index === -1) {
      res.status(404).send("Not Found");
      return;
    }

    jsonData.items.splice(index, 1);

    fs.writeFile("db.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      res.status(204).send();
    });
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening at http://localhost:${process.env.PORT}`);
});

// Export the app for Vercel
module.exports = app;
