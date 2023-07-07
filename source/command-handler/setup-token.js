const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore')
const { db } = require('../script.js')
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-token')
    .setDescription('description ...')
    .addStringOption(option => option.setName('token').setDescription('description').setRequired(true)),

  async execute(interaction) {
    const input = {
      token: interaction.options.getString('token'),
      guild: interaction.guild.id,
      admin: interaction.user.id
    };

    const invalidToken = async ({ token }) => {
      await interaction.deferReply({ ephemeral: true });
      console.log(`Invalid: ${token}`)
    }

    const validToken = async ({ token, guild }) => {
      await interaction.deferReply({ ephemeral: false });
      console.log(`Valid: ${token}`)

      const mainManagement = await interaction.guild.channels.create({
        name: `Obelisk Management`,
        type: ChannelType.GuildCategory,
      });

      const command = await interaction.guild.channels.create({
        name: '⚫│𝗖ommand-𝗟ogs',
        type: ChannelType.GuildText,
        parent: mainManagement,
      });

      const status = await interaction.guild.channels.create({
        name: '⚫│𝗦erver-𝗦tatus',
        type: ChannelType.GuildText,
        parent: mainManagement,
      });

      const message = await status.send({ content: 'T' })

      const mainLogging = await interaction.guild.channels.create({
        name: `Obelisk Protection`,
        type: ChannelType.GuildCategory,
      });

      const audit = await interaction.guild.channels.create({
        name: '🍻│𝗔udit-𝗟ogging',
        type: ChannelType.GuildText,
        parent: mainLogging,
      });

      await db.collection('configuration').doc(guild).delete()
        .then(async () => {
          await db.collection('configuration').doc(guild).set(
            {
              channels: { status: status.id, message: message.id },
              logging: { audit: audit.id },
              tokens: [input.token]
            },
            { merge: true }
          );
        });


      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('`Obelisk Management`')
        .setDescription(`\`🟢\` \`System Success\`\nYou've successfully linked your token.\nAuthorization token \`1\` of \`4\` uploaded.\n\n**Additional Information**\nConsider joining our [guild](https://discord.gg/jee3ukfvVr) for updates!\nActive development and support.\n\`Note: Happy hosting!\``)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })

      await interaction.followUp({ embeds: [embed] })
    }

    try {  // Try/Catch for Nitrado issues.
      const url = 'https://oauth.nitrado.net/token';
      const response = await axios.get(url, { headers: { 'Authorization': input.token } });
      response.status === 200 ? validToken(input) : invalidToken(input);

    } catch (error) { invalidToken(input) };

  }
};

