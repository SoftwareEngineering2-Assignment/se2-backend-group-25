const express = require('express'); // Importing the Express.js framework
const path = require('path'); // Importing the Path module to work with file and directory paths

const router = express.Router(); // Creating a new instance of an Express router

const file = path.join(__dirname, '../../index.html'); // Resolving the full path of the index.html file using the __dirname global variable

router.use(express.static(file)); // Serving the index.html file as a static resource using the Express static middleware

router.get('/', (req, res) => res.sendFile(file)); // Handling the root URL path and sending the index.html file to the client

module.exports = router; // Exporting the router as a Node.js module

/*
This code defines a single route for the root URL path / which serves the index.html file located at the project root directory.
The express.static() middleware serves the file as a static resource, allowing the client to retrieve and cache it efficiently.
The router.get() method sets up a GET request handler for the root path that sends the index.html file to the client as a response.
Finally, the module.exports statement exports the router as a Node.js module that can be used by other parts of the application.
*/
