const { Events } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {

      //! Collects the players, and the server name, loops through each player.
      //! If player does not exist, pushes player information to database.
      const playerCollection = async (players, { details }) => {
        const reference = (await db.collection('player-metadata').doc('metadata').get()).data()
        players.forEach(async player => {
          const { id, name, last_online } = player;
          reference[name] ? null : await db.collection('player-metadata').doc('metadata')
            .set({ [name]: { name: name, uuid: id, last_online, server: details.name } }, { merge: true }).then(() => {
              console.log(`Database Written: ${name}`)
            })
        })
      }

      //! Loops through each server, if the response is successful, runs: playerCollection()
      const validDocument = async ({ nitrado }) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });

        response.data.data.services.forEach(async server => {
          const url = `https://api.nitrado.net/services/${server.id}/gameservers/games/players`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
          response.status === 200 ? playerCollection(response.data.data.players, server) : null
        })
      }

      //! Loops through each document, if the document exists, runs: validDocument()
      //! Passes doc.data() which holds the token: 'Nitrado'
      const reference = await db.collection('configuration').get();
      reference.forEach(doc => {
        doc.data() ? validDocument(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 60000);
    }
    loop().then(() => console.log('Loop started:'));
  },
};