import * as dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  BOT_PREFIX: process.env.BOT_PREFIX || '.',
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || '',
  OPEN_DOTA_BASE_URL: process.env.OPEN_DOTA_BASE_URL || 'https://api.opendota.com/api/players',
  STEAM_API_KEY: process.env.STEAM_API_KEY || '',
  WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',
  STEAM_API_BASE_URL: process.env.STEAM_API_BASE_URL || 'https://api.steampowered.com',
  WEATHER_API_BASE_URL: process.env.WEATHER_API_BASE_URL || 'http://api.openweathermap.org/data/2.5',
  ENABLE_MUSIC_PLAYER: process.env.ENABLE_MUSIC_PLAYER === 'true',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
};
