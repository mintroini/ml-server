const express = require('express');
const request = require('request');
var cors = require('cors');
const _ = require('underscore');

const app = express();

app.use(cors());
app.set('port', (process.env.PORT || 3001));

//Set Body Parser for JSON


// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
}

app.get('/api/items/:id', (req, res, next) => {
    console.log("Call for: items/:id");
    const param = req.params.id;
    const ml_url = "https://api.mercadolibre.com";
    let was_error = false;

    //   https://api.mercadolibre.com/items/MLA626101408

    if (!param) {
        if (req.query && req.query.q) {
            console.log("Send to next!");
            next();
        }
        res.json({
            error: 'Missing required parameter `id`',
        });
        return;
    }


    let jsonresp = {
        author: {
            name: "Martin",
            lastname: "Introini",
        },
        item: {},
    };

    request({
        url: ml_url+'/items/' + param,
        method: 'GET',
        headers: { // speciyfy the headers
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        if (error) {
            //leaving this extra check to see on console what is going on
            console.log(error);
            res.json(jsonresp);
            return;
        } else if (response.statusCode && response.statusCode === 200) {
            let item = JSON.parse(body);
            if (item) {
                // get category_id for pdp breadcrumbs
                let category_id = item.category_id;
                //get all plain data
                _.extend(jsonresp.item, {

                    id: item.id,
                    title: item.title,
                    price: {
                        currency: item.currency_id,
                        amount: Math.floor(item.price),
                        decimals: getDecimal(item.price),
                    },
                    //picture: _.pluck(item.pictures, 'url'),
                    picture: item.pictures[0].url || item.thumbnail || "",
                    condition: item.condition,
                    free_shipping: item.shipping.free_shipping,
                    sold_quantity: item.sold_quantity,

                });

                //looking for categories breadcrumbs
                //https://api.mercadolibre.com/categories/MLA386061
                request({
                    url: ml_url + '/categories/' + category_id,
                    method: 'GET',
                    headers: { // speciyfy the headers
                        'Content-Type': 'application/json'
                    }
                }, function (error, response, body) {

                    if (error) {
                        //leaving this extra check to see on console what is going on
                        console.log(error);
                        res.json(jsonresp);
                        return;
                    } else if (response.statusCode && response.statusCode === 200) {

                        let breadcrumbs = JSON.parse(body).path_from_root ||[];
                        if (breadcrumbs) {
                          console.log("breadcrumbs", breadcrumbs);
                             _.extend(jsonresp.item, {
                                 categories: _.pluck(breadcrumbs, 'name'),
                             });
                        }
                    }
                });
                //have to look into second level query -> description url
                request({
                    url: ml_url+'/items/' + param + '/description',
                    method: 'GET',
                    headers: { // speciyfy the headers
                        'Content-Type': 'application/json'
                    }
                }, function (error, response, body) {
                    if (error) {
                        //leaving this extra check to see on console what is going on
                        console.log(error);
                        res.json(jsonresp);
                        return;
                    } else if (response.statusCode && response.statusCode === 200) {
                        let description = JSON.parse(body);
                        if (description) {
                            _.extend(jsonresp.item, {
                                description: description.text,
                            });
                            res.json(jsonresp);

                        }
                    }
                });



            }
        }
    });


});


app.get('/api/items', (req, res) => {
    console.log("Call for:  /api/items?q=");

    const ml_url = "https://api.mercadolibre.com/sites/MLA/search?q=";
    const param = req.query.q;

    if (!param) {
        res.json({
            error: 'Missing required parameter `q`',
        });
        return;
    }

    request({
        url: ml_url + param,
        method: 'GET',
        headers: { // speciyfy the headers
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        let maxSearch = 4;
        let jsonresp = {
            author: {
                name: "Martin",
                lastname: "Introini",
            },
            categories: [],
            items: [],
        };

        if (error) {
            //leaving this extra check to see on console what is going on
            console.log(error);
            res.json(jsonresp);

        } else if (response.statusCode && response.statusCode === 200) {
            //parse data from body resp
            let allItems = JSON.parse(body).results;
            let allFilters = JSON.parse(body).filters;

            let ml_filters= ( allFilters &&
                              allFilters[0] &&
                              allFilters[0].values &&
                              allFilters[0].values[0] &&
                              allFilters[0].values[0].path_from_root
                            ) ? allFilters[0].values[0].path_from_root : [];

            ml_filters = _.pluck(ml_filters, 'name');

            jsonresp.categories = ml_filters;

            if (allItems) {
                //get length for resp
                let length = (allItems.length > maxSearch) ? maxSearch : allItems.length;
                console.log("length: ", length);
                for (let i = 0; i < length; i++) {
                    //setting current item var as helper
                    let currentItem = allItems[i];
                    // jsonresp.items.push(allItems[i]);
                    jsonresp.items.push({
                        id: currentItem.id,
                        title: currentItem.title,
                        price: {
                            currency: currentItem.currency_id,
                            amount: Math.floor(currentItem.price),
                            decimals: getDecimal(currentItem.price)
                        },
                        picture: currentItem.thumbnail,
                        condition: currentItem.condition,
                        free_shipping: currentItem.shipping.free_shipping,
                    });
                }
            }
            res.json(jsonresp);

        }
    });
});

function getDecimal(amount) {
    return (Number((amount - Math.floor(amount)).toFixed(2))* 100);
}

app.listen(app.get('port'), () => {
    console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
