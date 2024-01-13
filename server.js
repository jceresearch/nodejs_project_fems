/*---------------------------------------------------------------------------------------------

"use strict";

// Constants

const PORT = 3000;
const HOST = "0.0.0.0";

// importing the dependencies
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");




// App
const app = express();
//Static pages
app.use(express.static("src/static"));

// defining the Express app

// adding Helmet to enhance your Rest API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan("combined"));

// defining an endpoint to return message
app.get("/api", (req, res) => {
  
  fs.readFile("./data/timeseries.json", "utf8", (err, jsonString) => {
    if (err) {
      console.log("Error reading file from disk:", err);
      return;
    }
    try {
      const data = JSON.parse(jsonString);
      res.send(data);
    } catch (err) {
      console.log("Error parsing JSON string:", err);
    }
  });




});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
