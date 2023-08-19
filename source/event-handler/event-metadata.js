const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {

    async function loop() {
      //? Loop through each server, collect player data.
      //? Store data in the discord-metadata collection.

      const playerCollection = async (players) => {
        const reference = (await db.collection('player-metadata').doc('metadata').get()).data()

        players.forEach(async player => {
          const { id, name, last_online } = player;
          reference[name] ? console.log('Player Exists') : await db.collection('player-metadata').doc('metadata')
            .set({ [name]: { name: name, uuid: id, last_online } }, { merge: true }).then(() => {
              console.log(`Database Written: ${name}`)
            })
        })
      }

      const validDocument = async ({ nitrado }) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });

        response.data.data.services.forEach(async server => {
          const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/players`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
          response.status === 200 ? playerCollection(response.data.data.players) : null
          // console.log(response.data.data.players)
        })
      }

      const reference = await db.collection('configuration').get();
      reference.forEach(doc => {
        doc.data() ? validDocument(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 60000);
    }
    loop();
  },
};