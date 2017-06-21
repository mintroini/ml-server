const express = require('express');
const request = require('request');
const _ = require('underscore');
const app = express();
var cors = require('cors');
var items = require('./items');
var searchItems = require('./searchItems');


app.use(cors());
app.set('port', (process.env.PORT || 3001));

//Set Body Parser for JSON


// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
}

app.get('/api/items/:id', (req, res, next) => {
    console.log("Call for: items/:id");

    items.get({
      id: req.params.id,
      ml_url : "https://api.mercadolibre.com"
    }).then(
      result => {
        res.json(result)
      },
      error => {
        res.status(500);
        res.json(error.message);
      }
    );
});

app.get('/api/items', (req, res) => {
    console.log("Call for:  /api/items?q=");

    searchItems.search({
      id: req.query.q,
      ml_url: "https://api.mercadolibre.com/sites/MLA/search?q="
    }).then(
      result => {
        res.json(result)
      },
      error => {
        res.status(500);
        res.json(error.message);
      }
    );
});

app.listen(app.get('port'), () => {
    console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
