require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('node:dns');
const bodyParser = require('body-parser');
const { db, ObjectId } = require('./src/db_connect.js');
const { base62Encode } = require('./src/base_encode.js')

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

app.post('/api/shorturl', async (req, res) => {
  // console.log(req.body);
  const options = {
    family: 6,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };

  try {
    let result = await dns.promises.lookup(req.body.url, options);
    
    console.log('address: %j family: IPv%s', result.address, result.family);

    let urlID = new ObjectId();
    let shortURL = base62Encode(BigInt(parseInt(urlID.toHexString(), 16)));
    let doc = { original_url: req.body.url, short_url: shortURL };
    
    result = await db.collection("tinyurl").insertOne(doc);
    console.log("doc", result);

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(404).send('Address not found.');
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
