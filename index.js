require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('node:dns');
const bodyParser = require('body-parser');
const { db, ObjectId } = require('./src/db_connect.js');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/test', async (req, res) => {
  let urlID = new ObjectId();
  console.log("hex url id", urlID.toHexString());
  console.log("hex to dec", parseInt(urlID.toHexString(), 16))
  let result = await db.collection("tinyurl").insertOne({
    count: 0
  });
  console.log(result);
  res.send({ help: "HELP" }).status(204);
});

app.post('/api/shorturl', (req, res) => {
  console.log(req.body);
  const options = {
    family: 6,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };

  dns.promises.lookup(req.body.url, options).then(result => {
    console.log('address: %j family: IPv%s', result.address, result.family);
    return db.collection("tinyurl").insertOne({ test: req.body.url });
  }).then(doc => {
    console.log(doc);
    return res.status(201).json({ original_url: req.body.url, short_url: "placeholder" });
  }).catch(err => {
    console.error(err);
    return res.status(404).send('Address not found.');
  });

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
