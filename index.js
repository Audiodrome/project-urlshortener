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

app.get('/api/shorturl/:shorturl', async (req, res) => {
  console.log("Params", req.params);
  try {
    let result = await db.collection("tinyurls").findOne({ short_url: Number(req.params.shorturl) });
    console.log("Result", result);
    if (result === null || req.params.shorturl === 'undefined')
      res.redirect('http://localhost:3000');
    else
      // res.redirect(301, result.original_url);
      res.redirect(result.original_url);
  } catch (err) {
    console.error(err);
    res.send('Redirect failed.');
  }
});

app.post('/api/shorturl', async (req, res) => {
  const options = {
    family: 6,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };

  try {
    const re = new RegExp('^https?:\/\/', 'i');

    let isValidURL = re.test(req.body.url);
    let doc = await db.collection("tinyurls").findOne({ original_url: req.body.url });
    console.log("Does doc exist?: ******", doc);

    if (doc === null && isValidURL) {
      // add new url to db and increment count by 1
      doc = await db.collection("tinyurls").findOneAndUpdate(
        { count_id: "One" }, 
        { $inc: { counter: 1 } },
        { returnDocument: 'after'}
      );

      doc = { original_url: req.body.url, short_url: doc.counter };

      await db.collection("tinyurls").insertOne(doc);
      console.log("Insert new doc: ******", doc);
    } else {
      doc = { original_url: doc.original_url, short_url: doc.short_url };
      console.log("Return existing doc ******", doc);
    }
    
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.json({ error: 'invalid url' });
  }
});

app.post('/api/encodeshorturl', async (req, res) => {
  // console.log(req.body);
  const options = {
    family: 6,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };

  try {
    const re = new RegExp('^https?:\/\/', 'i');
    // let isValidURL = re.test(req.body.url);
    let url = req.body.url.replace(re, '');
    await dns.promises.lookup(url, options);
    
    // console.log('address: %j family: IPv%s', result.address, result.family);

    let doc = await db.collection("tinyurls.b62").findOne({ original_url: req.body.url });

    if (doc === null) {
      let urlID = new ObjectId();
      let shortURL = base62Encode(BigInt(parseInt(urlID.toHexString(), 16)));
      doc = { original_url: req.body.url, short_url: shortURL };

      await db.collection("tinyurls.b62").insertOne(doc);
    }

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'address not found' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
