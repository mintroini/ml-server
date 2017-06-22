const request = require("request-promise");
const _ = require("underscore");
const utils = require("./utils");

const getItem = (params, callback) => {
  //   https://api.mercadolibre.com/items/MLA626101408
  let jsonresp = {
    author: {
      name: "Martin",
      lastname: "Introini"
    },
    item: {}
  };

  if (!params.id) {
    jsonresp = {
      error: "Missing required parameter `id`"
    };
    return;
  }

  return request({
    url: params.ml_url + "/items/" + params.id,
    method: "GET",
    headers: {
      // speciyfy the headers
      "Content-Type": "application/json"
    },
    resolveWithFullResponse: true
  })
    .then(({ statusCode, body }) => {
      if (statusCode === 200) {
        let item = JSON.parse(body);
        if (item) {
          //get all plain data
          _.extend(jsonresp.item, {
            id: item.id,
            title: item.title,
            price: {
              currency: item.currency_id,
              amount: Math.floor(item.price),
              decimals: utils.getDecimal(item.price)
            },
            //picture: _.pluck(item.pictures, 'url'),
            picture: item.pictures[0].url || item.thumbnail || "",
            condition: item.condition,
            free_shipping: item.shipping.free_shipping,
            sold_quantity: item.sold_quantity
          });
        }
        return {
          jsonresp: jsonresp,
          category_id: item.category_id
        };
      }
      throw new Error("unexpected error");
    })
    .then(({ jsonresp, category_id }) => {
      //looking for categories breadcrumbs
      //https://api.mercadolibre.com/categories/MLA386061
      return request({
        url: params.ml_url + "/categories/" + category_id,
        method: "GET",
        headers: {
          // speciyfy the headers
          "Content-Type": "application/json"
        },
        resolveWithFullResponse: true
      })
        .then(({ statusCode, body }) => {
          if (statusCode === 200) {
            let breadcrumbs = JSON.parse(body).path_from_root || [];
            if (breadcrumbs) {
              _.extend(jsonresp.item, {
                categories: _.pluck(breadcrumbs, "name")
              });
            }
            return jsonresp;
          }
          throw new Error("unexpected error");
        })
        .catch(err => {
          console.log("Categories not available, IGNORE");
          return jsonresp;
        });
    })
    .then(jsonresp => {
      //have to look into second level query -> description url
      return request({
        url: params.ml_url + "/items/" + params.id + "/description",
        method: "GET",
        headers: {
          // speciyfy the headers
          "Content-Type": "application/json"
        },
        resolveWithFullResponse: true
      })
        .then(({ statusCode, body }) => {
          if (statusCode === 200) {
            let description = JSON.parse(body);

            if (description) {
              _.extend(jsonresp.item, {
                description: description.text.length > 0
                  ? description.text
                  : description.plain_text
              });
            }
            // return callback(error, jsonresp);

            return jsonresp;
          }
          throw new Error("unexpected error");
        })
        .catch(err => {
          console.log("Description not available, IGNORE");
          return jsonresp;
        });
    });
};

module.exports = {
  get: getItem
};
