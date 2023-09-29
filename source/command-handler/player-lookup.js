const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-lookup')
    .setDescription('description ...')
    .addStringOption(option => option.setName('username').setDescription('description').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ emphermal: false });

    const input = {
      username: interaction.options.getString('username'),
      guild: interaction.guild.id,
    };

    let { username, guild } = input;
    username = username.includes('#') ? username.replace('#', '') : username;

    const invalidPlayer = async () => {
      const embed = new EmbedBuilder()
        .setColor('#e67e22')
        .setDescription(`**Game Command Failure**\nSelected player not located.\nBan information not found.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })
        .setThumbnail('https://i.imgur.com/PCD2pG4.png')

      return await interaction.followUp({ embeds: [embed] });
    }

    const validPlayer = async ({ admin, reason, unix }) => {
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setDescription(`**Game Command Success**\nSelected user was located.\n<t:${unix}:f>\n\nRemoved for ${reason}.\nBy: <@${admin}>`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })
        .setThumbnail('https://i.imgur.com/CzGfRzv.png')

      playerFound = true;
      return await interaction.followUp({ embeds: [embed] });
    }

    playerFound = false
    const local = (await db.collection('player-banned').doc(guild).get()).data();
    Object.entries(local).forEach(async ([player, doc]) => {
      player === username ? validPlayer(doc) : null;
    });

    playerFound ? null : invalidPlayer()
  }
};
