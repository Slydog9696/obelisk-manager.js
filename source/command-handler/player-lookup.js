const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-lookup')
    .setDescription('Performs a database player lookup.')
    .addStringOption(option => option.setName('username').setDescription('Selected action will be performed on given tag.').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ emphermal: false });

    const input = {
      username: interaction.options.getString('username'),
      guild: interaction.guild.id,
    };

    let { username, guild } = input;
    username = username.includes('#') ? username.replace('#', '') : username;

    const administrator = 'Obelisk Permission'
    await interaction.guild.roles.fetch().then(async roles => {
      const role = roles.find(role => role.name === administrator);
      if (!role || !interaction.member.roles.cache.has(role.id)) {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setTitle('`Obelisk Management`')
          .setDescription(`\`🟠\` \`System Failure\`\nYou do not have the required permissions.\nPlease ask an administrator for access.\n\n**Troubleshooting & Solution**\nRole: \`${administrator}\` is required.\nThe role is generated upon token setup.`);

        return interaction.followUp({ embeds: [embed] });
      }
    })

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
        .setDescription(`**Game Command Success**\nSelected user was located.\nLocal data will be shown.\n\n<t:${unix}:f>\nRemoved for ${reason}.\nAdmin: <@${admin}>`)
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
