import express from "express";
import { parse } from "json2csv";
import path from "path";
const app = express();
import fs from "fs";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "../client")));

// welcome page
app.get("/", (req, res) => {
  res.send(
    "Welcome to the backend of D3.js visuals, use the /api routes to get the data",
  );
});

app.get("/api/v1/apps/json", (req, res) => {
  const filePath = path.join(__dirname, "../../data/data.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file from disk: ${err}`);
      res.status(500).send("Internal Server Error");
    } else {
      try {
        // parse JSON string to JSON object
        JSON.parse(data);

        // if parsing succeeds, send the file
        res.sendFile(filePath);
      } catch (parseErr) {
        console.error(`Error parsing JSON string: ${parseErr}`);
        res.status(400).send("Invalid JSON");
      }
    }
  });
});

app.get("/api/v1/apps/csv", (req, res) => {
  const filePath = path.join(__dirname, "../../data/data.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file from disk: ${err}`);
      res.status(500).send("Internal Server Error");
    } else {
      try {
        // parse JSON string to JSON object
        const jsonData = JSON.parse(data);

        // convert JSON to CSV
        const csvData = parse(jsonData);

        // write CSV to a file
        const csvFilePath = path.join(__dirname, "../../data/data.csv");
        fs.writeFile(csvFilePath, csvData, (writeErr) => {
          if (writeErr) {
            console.error(`Error writing file to disk: ${writeErr}`);
            res.status(500).send("Internal Server Error");
          } else {
            // if writing succeeds, send the file
            res.sendFile(csvFilePath);
          }
        });
      } catch (parseErr) {
        console.error(`Error parsing JSON string: ${parseErr}`);
        res.status(400).send("Invalid JSON");
      }
    }
  });
});

app.listen(3000, () => console.log("Example app is listening on port 3000."));
