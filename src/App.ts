import moment = require('moment');
import request = require('request');
import http = require('http');
import { Client, GatewayIntentBits, EmbedBuilder, Message } from 'discord.js';
import { Player, QueryType } from 'discord-player';

import { CONFIG } from './config/config';
import { id_to_HeroName, id_to_LobbyType } from './utils/dota-helper';
import { getRequest, getSteamId } from './utils/steam-helper';
import { SpotifyExtractor } from "discord-player-spotify";
const { DefaultExtractors } = require('@discord-player/extractor');

// prerequisite to host in repl.it
http.createServer(function (req, res) {
  res.write("I'm alive");
  res.end();
}).listen(process.env.PORT || 8080);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

const player: Player | undefined = CONFIG.ENABLE_MUSIC_PLAYER ? new Player(client) : undefined;

if (player) {
  player.events.on('error', (queue, error) => {
    console.log(`[Error emitting from queue] ${error.message}`);
    console.log(error);
  });
  player.events.on('playerError', (queue, error) => {
    console.log(`[Player Audio Error] ${error.message}`);
    console.log(error);
  });
}

client.on('ready', async () => {
  if (client.user) {
    client.user.setActivity(".help");
  }
  if (player) {
    await player.extractors.loadMulti(DefaultExtractors);
    console.log('Bot is ready and discord-player extractors loaded!');
  } else {
    console.log('Bot is ready (Music Player Disabled by Feature Flag)');
  }
});

client.on('messageCreate', (receivedMessage: Message) => {
  if (receivedMessage.author.bot) {
    return;
  }

  if (receivedMessage.content.startsWith(CONFIG.BOT_PREFIX)) {
    processCommand(receivedMessage);
  }
});

const processCommand = (receivedMessage: Message) => {
  const fullCommand = receivedMessage.content.substring(1);
  const splitCommand = fullCommand.split(' ');
  const primaryCommand = splitCommand[0];
  const args = splitCommand.slice(1);
  const fullString = args.join(' ');

  console.log("Command received: " + primaryCommand);

  if (primaryCommand === "weather") {
    weatherCommand(args, receivedMessage);
  } else if (primaryCommand === "write") {
    writeCommand(fullString, receivedMessage);
  } else if (primaryCommand === "help") {
    helloCommand(fullString, receivedMessage);
  } else if (primaryCommand === "steam") {
    steamCommand(args, receivedMessage);
  } else if (primaryCommand === "dota") {
    dotaCommand(args, receivedMessage);
  } else if (primaryCommand === "play") {
    playCommand(args, receivedMessage);
  } else if (primaryCommand === "skip") {
    skipCommand(receivedMessage);
  } else if (primaryCommand === "stop") {
    stopCommand(receivedMessage);
  }
};

const helloCommand = (fullString: string, receivedMessage: Message) => {
  if (fullString.length === 0) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Tamako BOT Available Keyword', iconURL: receivedMessage.author.avatarURL() || undefined })
      .setDescription('Hello! Tamako BOT is here!')
      .setColor(0x495284)
      .addFields(
        { name: "Weather", value: "Weather report from your city.\nex: .weather [city name]" },
        { name: "Write", value: "Overlay text into image.\nex: .write [text]" },
        { name: "Steam", value: "Your steam profile information.\nex: .steam [url username]" },
        { name: "Dota", value: "Your dota 2 information\nex: .dota [url username]" },
        { name: "Music", value: "Play music!\nex: .play [song]\n.skip\n.stop" }
      )
      .setImage("http://moarpowah.com/wp-content/uploads/2013/04/Tamako-with-glasses.jpg")
      .setTimestamp();
    receivedMessage.channel.send({ embeds: [embed.toJSON() as any] });
  }
};

const weatherCommand = (args: string[], receivedMessage: Message) => {
  if (args.length > 0) {
    const apiKey = CONFIG.WEATHER_API_KEY;
    const city = args.join(' ');
    const url = `${CONFIG.WEATHER_API_BASE_URL}/weather?q=${city}&units=metric&appid=${apiKey}`;

    request(url, (err: any, response: any, body: any) => {
      try {
        const weathers = JSON.parse(body);
        if (weathers.name == null) {
          receivedMessage.channel.send(city + " not found");
        } else {
          const iconcode = weathers.weather[0].icon;
          const message = `It's ${weathers.weather[0].description} and ${weathers.main.temp}°C in ${weathers.name}, ${weathers.sys.country}!`;
          receivedMessage.channel.send({
            content: message,
            files: ["http://openweathermap.org/img/w/" + iconcode + ".png"]
          });
          console.log(message);
        }
      } catch (e) {
        receivedMessage.channel.send("Error fetching weather.");
      }
    });
  } else {
    receivedMessage.channel.send("Try `.weather [city name]`");
  }
};

const writeCommand = (fullString: string, receivedMessage: Message) => {
  if (fullString.length >= 8) {
    const tulisan = encodeURIComponent(fullString);
    const gambarS = "https://res.cloudinary.com/dftovjqdo/image/upload/a_-27,g_west,l_text:dark_name:" + tulisan + ",w_450,x_280,y_100/anime_notebook_yhekwa.jpg";
    receivedMessage.channel.send({ files: [gambarS] });
  } else if (fullString.length > 0 && fullString.length < 8) {
    const tulisan = encodeURIComponent(fullString);
    const gambarL = "https://res.cloudinary.com/dftovjqdo/image/upload/a_-27,g_west,l_text:dark_name:" + tulisan + ",w_200,x_250,y_100/anime_notebook_yhekwa.jpg";
    receivedMessage.channel.send({ files: [gambarL] });
  } else {
    receivedMessage.channel.send("Try `.write [your text]`");
  }
};

const steamCommand = (args: string[], receivedMessage: Message) => {
  if (args.length > 0) {
    getSteamId(args, CONFIG.STEAM_API_KEY).then((ids) => {
      const url = `${CONFIG.STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${CONFIG.STEAM_API_KEY}&steamids=${ids}`;
      return getRequest(url).then((body) => {
        const steamBody = JSON.parse(body);
        const url1 = `${CONFIG.STEAM_API_BASE_URL}/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${CONFIG.STEAM_API_KEY}&steamid=${ids}&format=json`;
        return getRequest(url1).then((body1) => {
          const steamBodys = JSON.parse(body1);
          const embed = new EmbedBuilder()
            .setTitle("Recently Played Games")
            .setAuthor({ name: steamBody.response.players[0].personaname, iconURL: steamBody.response.players[0].avatar })
            .setDescription('By: ' + steamBody.response.players[0].realname)
            .setColor(0x495284);

          if (steamBodys.response && steamBodys.response.games) {
            for (let i = 0; i < steamBodys.response.games.length; i++) {
              const text = steamBodys.response.games[i].name;
              const desc = Math.floor(steamBodys.response.games[i].playtime_forever / 60);
              embed.addFields({ name: text, value: desc + ' hrs' });
            }
          }

          embed.setImage(steamBody.response.players[0].avatarfull)
            .setTimestamp()
            .setFooter({ text: 'Last Logon ' + moment.unix(steamBody.response.players[0].lastlogoff).format("MM/DD/YYYY") });
          receivedMessage.channel.send({ embeds: [embed.toJSON() as any] });
        }).catch((err) => {
          const embed = new EmbedBuilder()
            .setTitle("IGN : " + steamBody.response.players[0].personaname)
            .setAuthor({ name: steamBody.response.players[0].realname, iconURL: steamBody.response.players[0].avatar })
            .setDescription("No Recent Games Played")
            .setColor(0x495284)
            .setImage(steamBody.response.players[0].avatarfull)
            .setTimestamp()
            .setFooter({ text: 'Last Logon ' + moment.unix(steamBody.response.players[0].lastlogoff).format("MM/DD/YYYY") });
          receivedMessage.channel.send({ embeds: [embed.toJSON() as any] });
        });
      }).catch(() => {
        receivedMessage.channel.send("Cannot Retrieve Steam Information");
      });
    }).catch(() => {
      receivedMessage.channel.send("Cannot Retrieve Steam ID");
    });
  }
};

const dotaCommand = async (args: string[], receivedMessage: Message) => {
  if (args.length > 0) {
    try {
      const ids = await getSteamId(args, CONFIG.STEAM_API_KEY);
      const simpanId = Number(ids.substr(3)) - 61197960265728;
      const infoUrl = `${CONFIG.OPEN_DOTA_BASE_URL}/${simpanId}/`;
      const wrUrl = `${CONFIG.OPEN_DOTA_BASE_URL}/${simpanId}/wl`;
      const signatureHeroUrl = `${CONFIG.OPEN_DOTA_BASE_URL}/${simpanId}/heroes`;
      const recentUrl = `${CONFIG.OPEN_DOTA_BASE_URL}/${simpanId}/recentMatches`;

      const [body1, body2, body3, body4] = await Promise.all([
        getRequest(infoUrl),
        getRequest(wrUrl),
        getRequest(signatureHeroUrl),
        getRequest(recentUrl)
      ]);

      const getInfo = JSON.parse(body1);
      const getWr = JSON.parse(body2);
      const getSignature = JSON.parse(body3);
      const getRecent = JSON.parse(body4);

      const hero1 = getSignature.length > 0 ? id_to_HeroName(getSignature[0].hero_id) : "Unknown";
      const hero2 = getSignature.length > 1 ? id_to_HeroName(getSignature[1].hero_id) : "Unknown";

      let recentMatchDesc = "No recent match found.";

      if (getRecent.length > 0) {
        const heroRec = id_to_HeroName(getRecent[0].hero_id);
        const kills = getRecent[0].kills;
        const deaths = getRecent[0].deaths;
        const assists = getRecent[0].assists;
        const last_hits = getRecent[0].last_hits;
        const gold_per_min = getRecent[0].gold_per_min;
        const lobbyType = id_to_LobbyType(getRecent[0].lobby_type);
        const matchDate = moment.unix(getRecent[0].start_time).format("MM/DD/YYYY HH:mm");
        recentMatchDesc = `Recent Match Information:\n\nHero : ${heroRec}\nLobby : ${lobbyType}\nK/D/A : ${kills}/${deaths}/${assists}\n LH/GPM : ${last_hits}/${gold_per_min}\n Date : ${matchDate}`;
      }

      const embed = new EmbedBuilder()
        .setTitle("Dota 2 Player Profile")
        .setAuthor({ name: getInfo.profile.personaname, iconURL: getInfo.profile.avatarfull || undefined })
        .setDescription(recentMatchDesc)
        .setColor(0x495284)
        .setImage(getInfo.profile.avatarfull)
        .addFields(
          { name: "Win", value: `${getWr.win}` },
          { name: "Total Match", value: `${getWr.win + getWr.lose}` },
          { name: "Signature Hero", value: `${hero1} / ${hero2}` }
        )
        .setTimestamp()
        .setURL(getInfo.profile.profileurl)
        .setFooter({ text: "OpenDota API" });

      receivedMessage.channel.send({ embeds: [embed.toJSON() as any] });
    } catch (err) {
      receivedMessage.channel.send("Cannot Retrieve Dota 2 Information");
    }
  }
};

const playCommand = async (args: string[], receivedMessage: Message) => {
  if (!player) return receivedMessage.channel.send("Music player is currently disabled");
  if (!receivedMessage.member?.voice?.channel) {
    receivedMessage.channel.send("You are not in a voice channel!");
    return;
  }
  const query = args.join(' ');
  if (!query) {
    receivedMessage.channel.send("Please specify a track.");
    return;
  }

  try {
    const { track } = await player.play(receivedMessage.member.voice.channel as any, query, {
      nodeOptions: {
        metadata: { channel: receivedMessage.channel },
        selfDeaf: false
      },
      searchEngine: QueryType.AUTO
    });
    receivedMessage.channel.send(`Loading track **${track.title}**!`);
  } catch (e) {
    receivedMessage.channel.send(`Error playing track: ${e}`);
  }
};

const skipCommand = async (receivedMessage: Message) => {
  if (!player) return receivedMessage.channel.send("Music player is currently disabled");
  const queue = player.nodes.get(receivedMessage.guildId!);
  if (!queue || !queue.isPlaying()) {
    receivedMessage.channel.send("No music is currently playing.");
    return;
  }
  queue.node.skip();
  receivedMessage.channel.send("Skipped current track.");
};

const stopCommand = async (receivedMessage: Message) => {
  if (!player) return receivedMessage.channel.send("Music player is currently disabled");
  const queue = player.nodes.get(receivedMessage.guildId!);
  if (!queue || !queue.isPlaying()) {
    receivedMessage.channel.send("No music is currently playing.");
    return;
  }
  queue.delete();
  receivedMessage.channel.send("Stopped the player and cleared the queue.");
};

client.login(CONFIG.DISCORD_BOT_TOKEN);