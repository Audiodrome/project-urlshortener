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
  let result = await db.collection("tinyurls").findOne({ short_url: Number(req.params.shorturl) }).catch(logError);

  if (result !== null)
    res.redirect(result.original_url);
  else
    res.send('Redirect failed.');
});

app.get('/api/encodeshorturl/:shorturl', async (req, res) => {
  console.log("Params", req.params);
  let result = await db.collection("tinyurls.b62").findOne({ short_url: req.params.shorturl }).catch(logError);

  if (result !== null)
    res.redirect(301, result.original_url);
  else
    res.send('Redirect failed.');
});

app.post('/api/shorturl', async (req, res) => {
  const options = {
    family: 6,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };

  const re = new RegExp('^https?:\/\/', 'i');
  let isValidURL = re.test(req.body.url);
  let doc;

  if (!isValidURL) {
    doc = { error: 'invalid url' };
  } else {
    doc = await db.collection("tinyurls").findOne({ original_url: req.body.url }).catch(logError);
    console.log("Does doc exist?: ******", doc);

    if (doc === null && isValidURL) {
      // add new url to db and increment count by 1
      doc = await db.collection("tinyurls").findOneAndUpdate(
        { count_id: "One" }, 
        { $inc: { counter: 1 } },
        { returnDocument: 'after'}
      ).catch(logError);

      doc = { original_url: req.body.url, short_url: doc.counter };

      await db.collection("tinyurls").insertOne(doc).catch(logError);
      console.log("Insert new doc: ******", doc);
    } else {
      doc = { original_url: doc.original_url, short_url: doc.short_url };
      console.log("Return existing doc ******", doc);
    }
  }
  res.json(doc); 
});

app.post('/api/encodeshorturl', async (req, res) => {
  // console.log(req.body);
  const options = {
    family: 6,
    hints: dns.ADDRCONFIG | dns.V4MAPPED,
  };

  const re = new RegExp('^https?:\/\/', 'i');
  let url = req.body.url.replace(re, '');
  let statusCode;
  let result = await dns.promises.lookup(url, options).catch(logError);

  if (result.code === 'ENOTFOUND') {
    statusCode = 404;
    result = { error: 'address not found' };
  } else {
    url = `https://${url}`; 
    let doc = await db.collection("tinyurls.b62").findOne({ original_url: url }).catch(logError);

    if (doc === null) {
      let urlID = new ObjectId();
      let shortURL = base62Encode(BigInt(parseInt(urlID.toHexString(), 16)));
      doc = { original_url: url, short_url: shortURL };
      await db.collection("tinyurls.b62").insertOne(doc).catch(logError);
    }
    statusCode = 201;
    result = doc;
  }
  res.status(statusCode).json(result);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

function logError(err) {
  console.error(err);
  return err;
}
