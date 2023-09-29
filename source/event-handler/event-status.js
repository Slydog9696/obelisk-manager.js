const { Events, Embed, EmbedBuilder } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {

      let output = '', counter = 0;
      const validService = async (nitrado, status, services) => {
        await services.forEach(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          const gameservers = response.data.data.gameserver;
        })
      }

      const validToken = async (nitrado, status) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })

        const services = response.data.data.services;
        response.status === 200 ? validService(nitrado, status, services) : invalidService()
      }

      const validDocument = async ({ nitrado, status }) => {
        const url = 'https://oauth.nitrado.net/token';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        response.status === 200 ? validToken(nitrado, status) : invalidToken()
      }

      const reference = await db.collection('configuration').get();
      reference.forEach(doc => {
        doc.data() ? validDocument(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 60000);
    }
    loop().then(() => console.log('Loop started:'));
  },
};

