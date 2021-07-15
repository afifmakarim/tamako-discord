const moment = require('moment');
const request = require('request');
const CONFIG = require('./config/config')
const id_to_HeroName = require('./utils/dota-helper');
const { getRequest, getSteamId } = require('./utils/steam-helper');
const http = require('http'); 

// prerequisite to host in repl.it 
http.createServer(function (req, res) {   
  res.write("I'm alive");   
  res.end(); 
}).listen(8080);

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  client.user.setActivity(".help")
})

client.on('message', (receivedMessage) => {
  if (receivedMessage.author == client.user) { // Prevent bot from responding to its own messages
    return
  }

  if (receivedMessage.content.startsWith(CONFIG.BOT_PREFIX)) {
    processCommand(receivedMessage)
  }
})

const processCommand = (receivedMessage) => {
  let fullCommand = receivedMessage.content.substr(1) // Remove the leading exclamation mark
  let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
  let primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
  let arguments = splitCommand.slice(1) // All other words are arguments/parameters/options for the command
  let fullString = arguments.join(" ")
  console.log("Command received: " + primaryCommand)
  console.log("Arguments: " + arguments) // There may not be any arguments
  console.log("full string : " + fullString)

  if (primaryCommand == "weather") {
    weatherCommand(arguments, receivedMessage)
  } else if (primaryCommand == "write") {
    writeCommand(fullString, receivedMessage)
  } else if (primaryCommand == "help") {
    helloCommand(fullString, receivedMessage)
  } else if (primaryCommand == "steam") {
    steamCommand(arguments, receivedMessage)
  }else if (primaryCommand == "dota") {
    dotaCommand(arguments, receivedMessage)
  }
}

const helloCommand = (arguments, receivedMessage) => {
  if (arguments.length == 0) {
  const embed = new Discord.RichEmbed()
    .setAuthor('Tamako BOT Available Keyword', receivedMessage.author.avatarURL)
    .setDescription('Hello! Tamako BOT is here!')
    .setColor(0x495284)
    .addField("Weather", "Weather report from your city.\nex: .weather [city name]")
    .addField("Write", "Overlay text into image.\nex: .write [text]")
    .addField("Steam", "Your steam profile information.\nex: .steam [url username]")
    .addField("Dota", "Your dota 2 information\nex: .dota [url username]")
    .setImage("http://moarpowah.com/wp-content/uploads/2013/04/Tamako-with-glasses.jpg")
    .setTimestamp()
  receivedMessage.channel.send(embed);
  }else{return null;}
}

const weatherCommand = (arguments, receivedMessage) => {
  if (arguments.length > 0) {
    let apiKey = '9de670aed3147ecab224239b8ebd0d93';
    let city = arguments;
    let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
    request(url, function (err, response, body) {
      let weathers = JSON.parse(body)
      if (weathers.name == null) {
        receivedMessage.channel.send(city + " not found")
      } else {
        let iconcode = weathers.weather[0].icon;
        let message = `It's ${weathers.weather[0].description} and ${weathers.main.temp}°C in ${weathers.name}, ${weathers.sys.country}!`;
        receivedMessage.channel.send(message, {
          files: ["http://openweathermap.org/img/w/" + iconcode + ".png"]
        });
        console.log(message);
      }
    });
  } else {
    receivedMessage.channel.send("Try `.weather [city name]`")
  }


}

const writeCommand = (fullString, receivedMessage) => {
  if (fullString.length >= 8) {
    let tulisan = encodeURIComponent(fullString);
    let gambarS = "https://res.cloudinary.com/dftovjqdo/image/upload/a_-27,g_west,l_text:dark_name:" + tulisan + ",w_450,x_280,y_100/anime_notebook_yhekwa.jpg"
    receivedMessage.channel.send({
      files: [gambarS]
    });
  } else if (fullString.length <= 8) {
    let tulisan = encodeURIComponent(fullString);
    let gambarL = "https://res.cloudinary.com/dftovjqdo/image/upload/a_-27,g_west,l_text:dark_name:" + tulisan + ",w_200,x_250,y_100/anime_notebook_yhekwa.jpg"
    receivedMessage.channel.send({
      files: [gambarL]
    });
  } else {
    receivedMessage.channel.send("Try `.write [your text]`")
  }
}

const steamCommand = (arguments, receivedMessage) => {
  if (arguments.length > 0) {
    getSteamId(arguments).then(function (ids) {
      let url = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=7834436769DDB41F2D14A2F312377946&steamids=${ids}`
      return getRequest(url).then(function (body) {
        let steamBody = JSON.parse(body); // get info user    
        let url1 = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=7834436769DDB41F2D14A2F312377946&steamid=${ids}&format=json`
        return getRequest(url1).then(function (body1) {
          let steamBodys = JSON.parse(body1); // get recent game
          var i;
          var text = "";
          var desc = "";
          const embed = new Discord.RichEmbed()
            .setTitle("Recently Played Games")
            .setAuthor(steamBody.response.players[0].personaname, steamBody.response.players[0].avatar)
            .setDescription('By: '+steamBody.response.players[0].realname)
            .setColor(0x495284)
          for (i = 0; i < steamBodys.response.games.length; i++) {
            text = steamBodys.response.games[i].name;
            desc = Math.floor(steamBodys.response.games[i].playtime_forever / 60);
            embed.addField(text, desc+' hrs');
          }
          embed.setImage(steamBody.response.players[0].avatarfull)
            .setTimestamp()
            .setFooter('Last Logon '+moment.unix(steamBody.response.players[0].lastlogoff).format("MM/DD/YYYY"));
          receivedMessage.channel.send(embed);
        }).catch(function (err) {
          const embed = new Discord.RichEmbed()
            .setTitle("IGN : " + steamBody.response.players[0].personaname)
            .setAuthor(steamBody.response.players[0].realname, steamBody.response.players[0].avatar)
            .setDescription("No Recent Games Played")
            .setColor(0x495284)
            .setImage(steamBody.response.players[0].avatarfull)
            .setTimestamp()
            .setFooter('Last Logon '+moment.unix(steamBody.response.players[0].lastlogoff).format("MM/DD/YYYY"));
          receivedMessage.channel.send(embed);

        });
      }).catch(function(){
        receivedMessage.channel.send("Cannot Retrieve Steam Information");
      })
    });
  }
}

const dotaCommand = (arguments, receivedMessage) => {
  if (arguments.length > 0){
    getSteamId(arguments).then(function (ids) {
      let simpanId = ids.substr(3) - 61197960265728;
      infoUrl = `${CONFIG.OPEN_DOTA_BASE_URL}/${simpanId}/`;
      return getRequest(infoUrl).then(function (body1) {
        getInfo = JSON.parse(body1);
        wrUrl = `${CONFIG.OPEN_DOTA_BASE_URL}/${simpanId}/wl`;
        return getRequest(wrUrl).then(function (body2) {
        getWr = JSON.parse(body2);
        signatureHeroUrl = `${CONFIG.OPEN_DOTA_BASE_URL}/${simpanId}/heroes`;
        return getRequest(signatureHeroUrl).then(function(body3){
        getSignature = JSON.parse(body3);
        hero1 = id_to_HeroName(getSignature[0].hero_id);
        hero2 = id_to_HeroName(getSignature[1].hero_id);
        recentUrl = `${CONFIG.OPEN_DOTA_BASE_URL}/${simpanId}/recentMatches`;
        return getRequest(recentUrl).then(function(body4){
        getRecent = JSON.parse(body4);
        heroRec = id_to_HeroName(getRecent[0].hero_id); 
        const embed = new Discord.RichEmbed()
            .setTitle("Dota 2 Player Profile")
            .setAuthor(getInfo.profile.personaname, getInfo.profile.avatarfull)
            .setDescription(`Recent Match Information:\n\nHero : ${heroRec}\nK/D/A : ${getRecent[0].kills}/${getRecent[0].deaths}/${getRecent[0].assists}\n LH/GPM : ${getRecent[0].last_hits}/${getRecent[0].gold_per_min}`)
            .setColor(0x495284)
            .setImage(getInfo.profile.avatarfull)
            .addField("Win",
            `${getWr.win}`)       
            .addField("Total Match",
            `${getWr.win + getWr.lose}`)    
            .addField("Signature Hero",
            `${hero1} / ${hero2}`)
            .setTimestamp()
            .setURL(getInfo.profile.profileurl)
            .setFooter("OpenDota API");
          receivedMessage.channel.send(embed);
        })
        })
        
        })

      })
    }).catch(function(){
      receivedMessage.channel.send("Cannot Retrieve Dota 2 Information");
    });
  }
}


// Connect the bot with your Discord applications bot token.
client.login(CONFIG.DISCORD_BOT_TOKEN);