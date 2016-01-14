'use strict';
var P = require('bluebird');
var Intercom = require('intercom-client');
var useragent = require('useragent');

function IntercomAttributesFinder(params, opts) {
  var userModel = null;
  var intercom = new Intercom.Client(opts.integrations.intercom.appId,
    opts.integrations.intercom.apiKey).usePromises();

  function getCustomer(customerId) {
    return new P(function (resolve, reject) {
      if (customerId) {
        return userModel
          .findById(customerId)
          .lean()
          .exec(function (err, customer) {
            if (err) { return reject(err); }
            if (!customer) { return reject(); }
            resolve(customer);
          });
      } else {
        resolve();
      }
    });
  }

  this.perform = function () {
    var userCollectionName = opts.integrations.intercom.userCollection;
    userModel = opts.mongoose.model(userCollectionName);

    return getCustomer(params.recordId)
      .then(function (customer) {
        return intercom.users.find({ email: customer.email });
      })
      .then(function (response) {
        return response.body;
      })
      .then(function (user) {
        // jshint camelcase: false
        var agent = useragent.parse(user.user_agent_data);
        user.browser = agent.toAgent();
        user.platform = agent.os.toString();
        user.city = user.location_data.city_name;
        user.country = user.location_data.country_name;

        user.geoloc = [user.location_data.latitude,
          user.location_data.longitude];

        user.tags = user.tags.tags.map(function (tag) {
          return tag.name;
        });

        user.companies = user.companies.companies.map(function (company) {
          return company.name;
        });

        return P
          .map(user.segments.segments, function (segment) {
            return intercom.segments
              .find({ id: segment.id })
              .then(function (response) {
                return response.body.name;
              });
          })
          .then(function (segments) {
            user.segments = segments;
            return user;
          });
      })
      .catch(function () {
        return null;
      });
  };
}

module.exports = IntercomAttributesFinder;
