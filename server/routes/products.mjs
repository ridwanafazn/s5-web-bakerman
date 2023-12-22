app.use("/products", products);

// Get a list of 50 posts
router.get("/", async (req, res) => {
    let collection = await db.collection("products");
    let results = await collection.find({})
      .limit(50)
      .toArray();
    res.send(results).status(200);
  });