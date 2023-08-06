const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {

    async function loop() {
      const autoMaintenance = (service_id) => {
        console.log(service_id);
      }

      const pageSize = 5;
      const validDocument = async ({ channels, logging, nitrado, maintenance }) => {
        let currentPlayers = 0, maximumPlayers = 0, counter = 0, currentPage = 0, pages = [];
        let output = '';

        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
        const serverArr = [...response.data.data.services];

        const action = serverArr.map(async server => {
          let { id, suspend_date } = server;
          let unix = new Date(suspend_date).getTime() / 1000;

          const url = `https://api.nitrado.net/services/${id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
          let { status, service_id, slots, query } = response.data.data.gameserver;

          maintenance[service_id] ? autoMaintenance(service_id) : null;
          currentPlayers += query.player_current ? query.player_current : 0;
          maximumPlayers += slots;

          if (counter < pageSize) {
            if (status === 'started') output += `${maintenance[service_id] ? `\`👾\` \`A-S-M\` \`🟢\` \`Service Online\`` : `\`🟢\` \`Service Online\``}\n${query.server_name ? query.server_name : 'Gameserver Starting'}\nPlayer Count: \`(${query.player_current}/${slots})\`\nID: ||${service_id}||\n\n**Server Runtime**\n<t:${unix}:f>\n\n`;
            counter++;
          }

          if (counter === pageSize) {
            pages.push(output);
            output = '';
            counter = 0;
          }
        });

        await Promise.all(action).then(() => {
          if (output) pages.push(output);

          const unix = Math.floor(Date.now() / 1000);
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('previous-page')
                .setLabel('Previous Page')
                .setStyle(ButtonStyle.Secondary),

              new ButtonBuilder()
                .setCustomId('next-page')
                .setLabel('Next Page')
                .setStyle(ButtonStyle.Secondary),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`${pages[currentPage]}**Global Player Count**\n\`🌐\` \`(${currentPlayers}/${maximumPlayers})\`\n\n<t:${unix}:R>\n**Application Upgrade**\nLorem ipsum dolar esut init duit.\nLorem ipsum dolar esut init duit.` || '')
            .setFooter({ text: 'Tip: Contact support if there are issues.' });

          client.channels.fetch(channels.status).then(async (channel) => {
            const message = await channel.messages.fetch(channels.message);
            const filter = (interaction) => ['previous-page', 'next-page'].includes(interaction.customId) && interaction.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (interaction) => {
              interaction.customId === 'previous-page' && currentPage > 0 ? currentPage-- : null
              interaction.customId === 'next-page' && currentPage < pages.length - 1 ? currentPage++ : null

              const updatedEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setDescription(`${pages[currentPage]}**Global Player Count**\n\`🌐\` \`(${currentPlayers}/${maximumPlayers})\`\n\n<t:${unix}:R>\n**Application Upgrade**\nLorem ipsum dolar esut init duit.\nLorem ipsum dolar esut init duit.` || '')
                .setFooter({ text: 'Tip: Contact support if there are issues.' });

              await interaction.update({ embeds: [updatedEmbed] });
            });

            await message.edit({ embeds: [embed], components: [row] });
          });
        });
      }

      const reference = await db.collection('configuration').get();
      reference.forEach(doc => {
        doc.data() ? validDocument(doc.data()) : console.log('invalid');
      });

      setTimeout(loop, 60000);
    }
    loop();
  },
};
