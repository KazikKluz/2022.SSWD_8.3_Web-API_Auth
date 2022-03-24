# 8.3 Web API Lab: Access Control - Server API Setup
*Enda Lee 2022*

### Quick Start

1. Download or `fork` the code from this repository.
2. Open in VS Code.
3. copy `sample.env` to `.env` and configure for your database.
4. In a terminal run `npm install`
5. Start the application using `npm run dev`



## Introduction

The next step is to configure the `server API` so that it can control access to routes using the `access token` provided by `Auth0`. **It is extremely important to control access on the server side as well as in the client**.

The access control will be configured as `Middleware` which will perform user authentication and authorisation before protected controller functions are executed.

## Prerequisites

You should have registered for an Auth0 account and configured an API, Web application, Users, and roles before continuing. 

## 1. Configuration and Setup

Start by adding a configuration file to store values from the Auth0 API setup in the previous step. **Import: Use your own application settings**

Add auth_config.json to the config folder (or rename the example file).
![](media/4d6139db256eb40d082bd255e26d0b78.png)

The required settings can be found in the Auth0 dashboard. Choose the Product API App created earlier then open Quick Start and choose Node.js. Here you will find the values for audience, issuer, and the crypto algorithms. Note that these are app specific, so it is important to use the value for your app.
![](media/fd0c18d326c1b99768eba772e6b23db2.png)

Add your values to auth_config.json. Also add the configured permissions (permissions tab in the Auth0 API settings).

Using a configuration file for these values makes changes easier if required.
![](media/4ec7910c95a6d1a28579f4adda37b32b.png)

## 2. The Auth Middleware

Next define the Middleware which will be responsible for authentication and authorization. It will use the Auth0 services, and the configuration value above to verify a user’s access token as required.

### Install Required Dependencies
Use npm to install the following required dependencies. Search <https://www.npmjs.com/> for more details about these packages.

```bash
npm install express-jwt jwks-rsa express-jwt-authz
```



### Define the JWT Auth Middleware

Add a new folder, named middleware, to the root of the app. Then add a new file named jwtAuth.js to the folder.
![](media/e42dda89b6a69c6a5bc40a8de419366d.png)

The code is modified from the Auth0 Quick Start example for Node.js with the addition of an authorisation check, using `express-jwt-autz` to compare required permissions with those contained in a JWT.

Read the comments for details.

##### `middleware/jwtAuth.js`

```javascript
// Dependencies
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const jwtAuthz = require('express-jwt-authz');

// Load the configuration settings
const authConfig = require("../config/auth_config.json");
 
// Authentication
//
// create the JWT middleware (these checks happen BEFORE controller endpoints)
const checkJwt = jwt({
    // Gets the JSON Web Key Set which will be used to verify the access token and issuer.
    // Sets other required parameters including the algorithm to be used
    // including the Public Key required to verify a JWT
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `${authConfig.issuer}.well-known/jwks.json`
    }),
  // 
    audience: authConfig.audience,
    scope: 'openid email profile',
    issuer: authConfig.issuer,
    algorithms: authConfig.algorithms
  });

//
// Authorisation
// Verify that the JWT includes scpecific permissions (from the JWT), passed as a parameter
//
// https://github.com/auth0/express-jwt-authz#user-content-options
// https://medium.com/javascript-in-plain-english/securing-a-node-js-api-with-auth0-7785a8f2c8e3
const checkAuth = (permissions) => jwtAuthz(permissions, {customScopeKey: "permissions" });
// ,checkAllScopes: true 

// Export
module.exports = {
  authConfig,
  checkJwt,
  checkAuth,
};
```

Note the authorisation check examines the **`permissions`** key of the `JWT`, as defined by the **`customScopeKey`**.

## 3. Protecting the productController functions

Now that the middleware has been defined, it can be used to control access to the controller to:

1.  Ensure that the user is authenticated (if required).

2.  Ensure that the user is authorised before allowing access.

Note that authorisation is only every carried out after authentication has succeeded. There is no point authorising a user who cannot be identified!

Start by importing the middleware in productController.js:
![](media/36d046b4f1148055b75347edd1890971.png)

Now the routes can be protected. In this example we will require authentication for the create, update, and delete routes. In addition, we can check if the user has the required permissions. Here the create (POST) route:

Read comments for details:
![](media/cbcc42bd7cb8513347b33d4abf66bd53.png)

Note the addition of the middleware functions checkJwt and checkAuth.

### Testing
Try to add a new product using Insomnia, what was the result? You should see:
![](media/6b0e9ae1d837f3191c2f953051d190eb.png)

Also testing with the client application. Verify that authentication and authorization checks work as expected.

## 4. Retrieving and using the Auth0 username (email)

At this point the API can use the JWT to authenticate a user by the presence of a valid token. The permissions for that user, contained in the token, can then be used to check if the user is authorized to access endpoints.

**But what if you need to link the Auth0 user with your database?**

This can be achieved by requesting the details from the Auth0 account/ tenancy. This will be achieved via a fetch call.

##### First install the axios package.

```bash
npm install –save axios
```



#### Create a user service.

The service will be used to get the required data. Add **userService.js** to the services folder:
![](media/3101a982692b5a6326853b88e5601b11.png)

#### Test
This test will retrieve the user profile in the **`productController`**, and log it to the console (just before getting all products:
![](media/bc1ac0a59bf6ea9491aa77bdeccbff01.png)

#### Output

When a request is received for products, get the token, find the user details, and log:
![](media/c435ca74ae4138f0e093290c780557d1.png)



#####  user controller `userController.js`

This controller contains endpoints for retrieving user data, e.g. the user profile

```javascript
const router = require('express').Router();
const userService = require('../services/userService.js');

// Auth0
const { authConfig, checkJwt, checkAuth } = require('../middleware/jwtAuth.js');

/* Hand get requests for '/'
/* this is the default rout
*/
router.get('/', function (req, res) {
    // set content type of response body in the headers
    res.setHeader('Content-Type', 'application/json');

    // Send a JSON response - this app will be a web api so no need to send HTML
    //res.end(JSON.stringify({message: 'This is the home page'}));
    res.json({content: 'This is the default route - try /user/profile'});

});

// get user profile for authenticated user
// http://localhost:8080/user/profile
router.get('/profile', async (req, res) => {
    let userProfile;
    // Get products
    try {
        // Get info from user profile
        // if logged in (therefore access token exists)
        // get token from request
        if (req.headers['authorization']) {
            let token = req.headers['authorization'].replace('Bearer ', '');
            userProfile = await userService.getAuthUser(token);
            console.log("user email: ", profile.email);
        }
        res.json(userProfile);

      // Catch and send errors  
      } catch (err) {
        console.log(`ERROR getting user profile: ${err.message}`);
        res.status(500);
        res.send(err.message);
      }
});


// Export as a module
module.exports = router;
```



## 5. Users in the app database

If required, users registered via Auth0 can also be included in the application database.

### 1. Create a new table, `app_user`

The  **`prisma\schema.prisma`** file includes a definition for a new database table named `app_user`. 

```javascript
// Data Model for app_user
model app_user {
  id                  Int @id @default(autoincrement())
  email               String @db.VarChar(255) @unique
  first_name          String @db.VarChar(255)
  last_name           String @db.VarChar(255)
  password            String @db.VarChar(255)
  role                String @db.VarChar(8)
}
```



Use `Prisma`  to apply this schema to the database:

```bash
npx prisma db push
```

![prisma push](./media/prisma_push.png)



Check Supabase to make sure that the table is added and insert some same data

![app_use](./media/app_user.png)



### 2. Add Data Access

Add data access for users with functions to:

1. Get all users.
2. Get a user by id.
3. Get a user by email.

This could be used to retrieve a local user based on the user email address from an Auth0 profile. 

**`dataAccess\userData.js`**

```javascript
// Data access functions for users
// Import dependencies
const { PrismaClient } = require("@prisma/client");

// declare an instance of the client
const prisma = new PrismaClient();

// Get all users from DB
//
async function getUsers() {
    // define variable to store users
    let users;
  
    try {
      // Get all users
      // https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany
      users = await prisma.app_user.findMany();
  
      // Alternative raw sql
      // prisma.$queryRaw`select * from app_user`;
  
      // Catch and log errors to server side console
    } catch (err) {
      console.log("DB Error - get all users: ", err.message);
    } finally {
    }
    // return all users found
    return users;
  } // End function
  
  // Get user by id from DB
  //
  async function getUserById(id) {
    // Define variable
    let user;
  
    try {
      // use where with findUnique
      user = await prisma.app_user.findUnique({
        where: { id: id },
      });
  
      // Catch and log errors to server side console
    } catch (err) {
      console.log("DB Error - get user by id: ", err.message);
    } finally {
    }
    // return a single user if found
    return user;
  } // End function


    // Get user by email from DB
  //
  async function getUserByEmail(email) {
    // Define variable
    let user;
    try {
      // use where with findUnique
      user = await prisma.app_user.findUnique({
        where: { email: email },
      });
  
      // Catch and log errors to server side console
    } catch (err) {
      console.log("DB Error - get user by id: ", err.message);
    } finally {
    }
    // return a single user if found
    return user;
  } // End function

  // Export 
module.exports = {
    getUsers,
    getUserById,
    getUserByEmail
};

```








------

Enda Lee 2022
