// This is the product controller

// Import router package
const router = require('express').Router();

// Import the product service
const productService = require("../services/productService.js");

// Auth0
const { authConfig, checkJwt, checkAuth } = require("../middleware/jwtAuth.js");

// This endpoint will return all product data from the database
router.get('/', async(req, res) => {
  // Get info from user profile
  // if logged in (therefore access token exists)
  // get token from request
  let token = 'empty';
  let userProfile = 'not logged in';
  
  if (req.headers["authorization"]) {
    try {
      // extract the JWT from the header
      token = await req.headers["authorization"].replace("Bearer ", "");
      // Call the user service
      userProfile = await userService.getAuthUser(token);
      // log
      console.log("%c user profile: ", "color: blue", userProfile);
      console.log("%c user email: ", "color: blue", userProfile.email);
    } catch (err) {
      console.log(`ERROR getting user profile: ${err.message}`);
    }
  }

    try {
        // Get result from the product service
        const result = await productService.getProducts();

        // Send a  response
        res.json(result);
    } catch (err) {
        res.status(500);
        res.send(err.message);   
    }
});

// This endpoint is used to add new products
// Note that this handles a POST request (router.post)
// request body contains data
router.post('/', checkJwt, checkAuth([authConfig.create]), async(req, res) => {

  // read data request body, this will be the new product
  const newProduct = req.body;
  
  // If data missing return 400
  if (typeof newProduct === "undefined") {
    res.statusMessage = "Bad Request - missing product data";
    res.status(400).json({ content: "error" });
  }
  // log the data to the console
  console.log('product data sent:\n', newProduct);

  // Call productService to create the new product
  try {
    const result = await productService.addOrUpdateProduct(newProduct);

    // Send response back to client
    res.json(result);

    // Catch and send errors
  } catch (err) {
    res.status(500);
    res.send(err.message);
  }

});

// This endpoint is used to update existing products
// Note that this handles a PUT request (router.post)
// request body contains data
router.put('/', checkJwt, checkAuth([authConfig.update]), async(req, res) => {
  // read data request body, this will be the new product
  const updateProduct = req.body;
  
  // If data missing return 400
  if (typeof updateProduct === "undefined") {
    res.statusMessage = "Bad Request - missing product data";
    res.status(400).json({ content: "error" });
  }
  // log the data to the console
  console.log('product data sent:\n', updateProduct);

  // Call productService to create the new product
  try {
    const result = await productService.addOrUpdateProduct(updateProduct);

    // Send response back to client
    res.json(result);

    // Catch and send errors
  } catch (err) {
    res.status(500);
    res.send(err.message);
  }
});

// This endpoint will return a single product by id
// The endpoint is same as for / but with an added :id parameter
router.get('/:id', async(req, res) => {

    // Try to get data and return
    try {
        // Get result from the product service
        // passing the value from req.params.id
        const result = await productService.getProductById(req.params.id);

        // Send a  response
        res.json(result);

    // Handle server errors    
    } catch (err) {
        res.status(500);
        res.send(err.message);   
    }
});

// This endpoint will delete a product by id
router.delete('/:id', checkJwt, checkAuth([authConfig.delete]), async(req, res) => {

  // Try to get data and return
  try {
      // Get result from the product service
      // passing the value from req.params.id
      const result = await productService.deleteProduct(req.params.id);

      // Send a  response
      res.json(result);

  // Handle server errors    
  } catch (err) {
      res.status(500);
      res.send(err.message);   
  }
});

// Endpoint to handle requests for product by id
// req.query version
// req format: /product/bycat/4
//
router.get("/bycat/:catId", async (req, res) => {
    // read values from req
    const catId = req.params.catId;
  
    // If params are missing return 400
    if (typeof catId === "undefined") {
      res.statusMessage = "Bad Request - missing cat id";
      res.status(400).json({ content: "error" });
    }
    // Get products 
    try {
      const result = await productService.getProductsByCatId(catId);
  
      // Send response back to client
      res.json(result);
  
      // Catch and send errors
    } catch (err) {
      res.status(500);
      res.send(err.message);
    }
  });

// export
module.exports = router;
