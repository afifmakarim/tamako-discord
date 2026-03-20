import request = require('request');
import { CONFIG } from '../config/config';

export const getRequest = (url: string): Promise<string> => {
  return new Promise((success, failure) => {
    request(url, (error: any, response: any, body: any) => {
      if (!error && response.statusCode === 200) {
        success(body);
      } else {
        failure(error || new Error(`Status Code: ${response.statusCode}`));
      }
    });
  });
};

export const getSteamId = async (steamIdArgs: string[], apiKey: string): Promise<string> => {
  const vanityUrl = steamIdArgs.join(' ');
  const url = `${CONFIG.STEAM_API_BASE_URL}/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${vanityUrl}`;

  const body = await getRequest(url);
  const parsing = JSON.parse(body);

  if (parsing.response && parsing.response.steamid) {
    return parsing.response.steamid;
  }

  throw new Error('SteamID not found in response');
};
