const request = require('request');

const getRequest = (url) => {
    return new Promise(function (success, failure) {
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          success(body);
        } else {
          failure(error);
        }
      });
    });
  }
  
  const getSteamId = (arguments) => {
    let vanityUrl = arguments;
    let url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=7834436769DDB41F2D14A2F312377946&vanityurl=${vanityUrl}`
    return new Promise(function (success, failure) {
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          parsing = JSON.parse(body);
          ids = parsing.response.steamid;
          success(ids);
        } else {
          failure(error);
        }
      });
    });
  }

  module.exports = {getRequest, getSteamId}