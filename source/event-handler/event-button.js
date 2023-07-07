const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {

      const invalidButton = async () => {
        console.log('Invalid Button')
      }

      const returnMetadata = async () => {
        await interaction.deferReply({ ephemeral: true });
        console.log(interaction.message.interaction.id)

        // Fetch collector, from player ban.
        const reference = (await db.collection('player-metadata').doc(interaction.message.interaction.id).get()).data()
        console.log(reference)
      }

      interaction.customId === 'metadata' ? returnMetadata() : invalidButton();

    });
  },
};

