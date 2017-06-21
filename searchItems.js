const request = require('request-promise');
const get = require('lodash/get');
const _ = require('underscore');
const utils = require('./utils');

const searchItems = (params, callback) => {
  console.log("paramas", params);
  let jsonresp = {
      author: {
          name: "Martin",
          lastname: "Introini",
      },
      categories: [],
      items: [],
  };
  if (!params.id) {
      jsonresp = {
          error: 'Missing required parameter `q`',
      };
      return;
  }

  return request({
      url: params.ml_url + params.id,
      method: 'GET',
      headers: { // speciyfy the headers
          'Content-Type': 'application/json'
      },
      resolveWithFullResponse: true
  }).then(({ statusCode, body }) => {
      let maxSearch = 4;
      if (statusCode === 200) {
          //parse data from body resp
          let allItems = JSON.parse(body).results;
          let allFilters = JSON.parse(body).filters;

          let ml_filters = get(JSON.parse(body), 'filters[0].values[0].path_from_root', []);

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
                          decimals: utils.getDecimal(currentItem.price)
                      },
                      picture: currentItem.thumbnail,
                      condition: currentItem.condition,
                      free_shipping: currentItem.shipping.free_shipping,
                      state_name: currentItem.address.state_name,
                  });
              }
          }
          return jsonresp;
      }
      throw new Error("unexpected error");
  });
}

module.exports = {
  search: searchItems
};
