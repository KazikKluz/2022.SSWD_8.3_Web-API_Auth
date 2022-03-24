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
