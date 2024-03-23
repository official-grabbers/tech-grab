const express = require('express')
const app = express()
const runWappalyzer = require("./src/cli")

const port = 80
const hostname = '0.0.0.0';

app.use(express.json())

// Define a basic GET request handler
app.get('/', (req, res) => {
  res.send('Hello World')
})

// Define a basic GET request handler
app.get('/check', (req, res) => {
  const websiteURL = req.query.url // Assuming you're passing the website URL as a query parameter
  runWappalyzer(websiteURL)
    .then((results) => {
      res.send(JSON.stringify(results))
    })
    .catch((error) => {
      res.send(error.message || String(error))
    })
})

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
