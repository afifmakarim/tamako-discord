import { Message, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { Player, QueryType } from 'discord-player';

export const playCommand = async (player: Player | undefined, args: string[], receivedMessage: Message) => {
  if (!player) return (receivedMessage.channel as TextChannel).send("Music player is currently disabled");
  if (!receivedMessage.member?.voice?.channel) {
    (receivedMessage.channel as TextChannel).send("You are not in a voice channel!");
    return;
  }
  const query = args.join(' ');
  if (!query) {
    (receivedMessage.channel as TextChannel).send("Please specify a track.");
    return;
  }

  try {
    const isLink = query.startsWith('http://') || query.startsWith('https://');

    if (isLink) {
      const { track } = await player.play(receivedMessage.member.voice.channel as any, query, {
        nodeOptions: {
          metadata: { channel: receivedMessage.channel },
          selfDeaf: false
        },
        searchEngine: QueryType.AUTO
      });
      (receivedMessage.channel as TextChannel).send(`Loading track **${track.title}**!`);
    } else {
      const searchResult = await player.search(query, {
        requestedBy: receivedMessage.author,
        searchEngine: QueryType.AUTO
      });

      if (!searchResult || !searchResult.tracks.length) {
        (receivedMessage.channel as TextChannel).send("No results found!");
        return;
      }

      const tracks = searchResult.tracks.slice(0, 5);

      const embed = new EmbedBuilder()
        .setTitle(`Search Results for "${query}"`)
        .setDescription(tracks.map((track, i) => `**${i + 1}.** [${track.title}](${track.url}) - \`${track.duration}\``).join('\n'))
        .setColor(0x495284);

      const row1 = new ActionRowBuilder<ButtonBuilder>();
      for (let i = 0; i < tracks.length; i++) {
        row1.addComponents(
          new ButtonBuilder()
            .setCustomId(`select_track_${i}`)
            .setLabel(`${i + 1}`)
            .setStyle(ButtonStyle.Primary)
        );
      }
      const row2 = new ActionRowBuilder<ButtonBuilder>();
      row2.addComponents(
        new ButtonBuilder()
          .setCustomId('cancel_selection')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
      );

      const message = await (receivedMessage.channel as TextChannel).send({
        embeds: [embed.toJSON() as any],
        components: [row1.toJSON() as any, row2.toJSON() as any]
      });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter: i => i.user.id === receivedMessage.author.id
      });

      collector.on('collect', async i => {
        if (i.customId === 'cancel_selection') {
          await i.update({ content: 'Selection cancelled.', embeds: [], components: [] });
          return;
        }

        await i.deferUpdate();
        const index = parseInt(i.customId.replace('select_track_', ''));
        const selectedTrack = tracks[index];

        await message.edit({ content: `Loading track **${selectedTrack.title}**!`, embeds: [], components: [] });

        if (!player || !receivedMessage.member?.voice?.channel) return;
        try {
          await player.play(receivedMessage.member.voice.channel as any, selectedTrack, {
            nodeOptions: {
              metadata: { channel: receivedMessage.channel },
              selfDeaf: false
            }
          });
        } catch (e) {
          (receivedMessage.channel as TextChannel).send(`Error playing track: ${e}`);
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          message.edit({ content: 'Selection timed out.', components: [] }).catch(() => { });
        }
      });
    }
  } catch (e) {
    (receivedMessage.channel as TextChannel).send(`Error processing request: ${e}`);
  }
};

export const skipCommand = async (player: Player | undefined, receivedMessage: Message) => {
  if (!player) return (receivedMessage.channel as TextChannel).send("Music player is currently disabled");
  const queue = player.nodes.get(receivedMessage.guildId!);
  if (!queue || !queue.isPlaying()) {
    (receivedMessage.channel as TextChannel).send("No music is currently playing.");
    return;
  }
  queue.node.skip();
  (receivedMessage.channel as TextChannel).send("Skipped current track.");
};

export const stopCommand = async (player: Player | undefined, receivedMessage: Message) => {
  if (!player) return (receivedMessage.channel as TextChannel).send("Music player is currently disabled");
  const queue = player.nodes.get(receivedMessage.guildId!);
  if (!queue || !queue.isPlaying()) {
    (receivedMessage.channel as TextChannel).send("No music is currently playing.");
    return;
  }
  queue.delete();
  (receivedMessage.channel as TextChannel).send("Stopped the player and cleared the queue.");
};

export const queueCommand = async (player: Player | undefined, receivedMessage: Message) => {
  if (!player) return (receivedMessage.channel as TextChannel).send("Music player is currently disabled");
  const queue = player.nodes.get(receivedMessage.guildId!);
  if (!queue || !queue.isPlaying()) {
    (receivedMessage.channel as TextChannel).send("No music is currently playing.");
    return;
  }
  
  const currentTrack = queue.currentTrack;
  const tracks = queue.tracks.toArray();
  
  const embed = new EmbedBuilder()
    .setTitle(`Server Queue - ${receivedMessage.guild?.name}`)
    .setColor(0x495284);
    
  let description = `**Currently Playing:**\n[${currentTrack?.title}](${currentTrack?.url}) - \`${currentTrack?.duration}\`\n\n**Up Next:**\n`;
  
  if (tracks.length === 0) {
    description += "No more tracks in the queue.";
  } else {
    description += tracks.slice(0, 10).map((track, i) => `**${i + 1}.** [${track.title}](${track.url}) - \`${track.duration}\``).join('\n');
    if (tracks.length > 10) {
      description += `\n...and ${tracks.length - 10} more tracks.`;
    }
  }
  
  embed.setDescription(description);
  
  (receivedMessage.channel as TextChannel).send({ embeds: [embed.toJSON() as any] });
};
