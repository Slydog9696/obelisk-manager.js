const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js')

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('database-search')
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
        .setTitle('`Obelisk Management`')
        .setDescription(`\`🟠\` \`System Failure\`\nThe selected user cannot be located.\nDatabase document does not exist.\n\n**Additional Information**\nThe player is not currently banned.`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })

      return await interaction.followUp({ embeds: [embed] });
    }

    const validPlayer = async ({ admin, reason, unix }) => {
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('`Obelisk Management`')
        .setDescription(`\`🟢\` \`System Success\`\nThe selected user has been located.\nLocal data will be shown below.\n\n<t:${unix}:F>\nRemoved for ${reason}.\n||<@${admin}>||`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })

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
