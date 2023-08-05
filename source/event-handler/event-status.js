const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {

    async function loop() {

      const autoMaintenance = (service_id) => {
        console.log(service_id)
      }

      let counter = 0, output = '';
      let currentPlayers = 0, maximumPlayers = 0;
      const validDocument = async ({ channels, logging, tokens, maintenance }) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': tokens[0] } })
        const serverArr = [...response.data.data.services];
        console.log(serverArr)

        const action = serverArr.map(async server => {
          let { id, details, suspend_date } = server;
          let unix = new Date(suspend_date).getTime() / 1000;

          const url = `https://api.nitrado.net/services/${id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': tokens[0] } })
          let { status, service_id, slots, query } = response.data.data.gameserver;

          maintenance[service_id] ? autoMaintenance(service_id) : null
          currentPlayers += query.player_current ? query.player_current : 0;
          maximumPlayers += slots;

          if (counter < 10) {
            if (status === 'restarting') output += `${maintenance[service_id] ? `\`👾\` \`A-S-M\` \`🟠\` \`Service Restarting\`` : ''} \`🟠\` \`Service Restarting\`\n${query.server_name ? query.server_name : 'Gameserver Restarting'}\nPlayer Count: \`(0/${slots})\`\nID: ||${service_id}||\n\n**Server Runtime**\n<t:${unix}:f>\n\n`
            if (status === 'stopping') output += '...'
            if (status === 'updating') output += '...'
            if (status === 'started') output += `${maintenance[service_id] ? `\`👾\` \`A-S-M\` \`🟢\` \`Service Online\`` : `\`🟢\` \`Service Online\``}\n${query.server_name ? query.server_name : 'Gameserver Starting'}\nPlayer Count: \`(${query.player_current}/${slots})\`\nID: ||${service_id}||\n\n**Server Runtime**\n<t:${unix}:f>\n\n`;
            if (status === 'stopped') output += '...'
            counter++
          }
        })

        await Promise.all(action)

        const unix = Math.floor(Date.now() / 1000);
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setDescription(`${output}**Global Player Count**\n\`🌐\` \`(${currentPlayers}/${maximumPlayers})\`\n\n<t:${unix}:R>\n**Application Upgrade**\nLorem ipsum dolar esut init duit.\nLorem ipsum dolar esut init duit.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        client.channels.fetch(channels.status).then(async (channel) => {
          await channel.send({ embeds: [embed] })
        })
      }

      const reference = await db.collection('configuration').get();
      reference.forEach(doc => {
        doc.data() ? validDocument(doc.data()) : console.log('invalid')
      })

      setTimeout(loop, 10000);
    }
    loop();
  },
};