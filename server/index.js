const express = require("express");
const path = require('path');

const PORT = process.env.PORT || 3001;

const app = express();

const buildPath = path.join(__dirname, '..', '/client/build');
// console.log("**** buildPath", buildPath)
app.use(express.static(buildPath));

app.get("/status", (req, res) => {
    res.json({ message: "Hello from server!" });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/client/build/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});