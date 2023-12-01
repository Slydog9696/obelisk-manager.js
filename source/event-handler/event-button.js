const { ActionRowBuilder, Events, ModalBuilder, ChannelType, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on("unhandledRejection", (err) => console.error(err));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {

      try {
        if (interaction.customId === 'setup-token') {
          const modal = new ModalBuilder()
            .setCustomId('token-modal')
            .setTitle('Nitrado Token Verification');

          const row = new ActionRowBuilder()
            .addComponents(
              new TextInputBuilder()
                .setCustomId('token-option').setLabel('Required Nitrado Token').setMinLength(50).setMaxLength(150)
                .setPlaceholder('...oAg66TcQYUnYXBQn17A161-N86cN5jWDp7')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            );

          modal.addComponents(row);
          await interaction.showModal(modal);
        }

        if (interaction.customId === 'token-modal') {
          const invalidToken = async () => {
            await interaction.reply({ content: 'Setup failure, ensure you follow provided steps above.', ephemeral: true });
          }

          const validToken = async ({ token }) => {
            const button = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Base Version')
                  .setCustomId('base-version')
                  .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                  .setLabel('Upgraded Version')
                  .setCustomId('upgraded-version')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true),
              );

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setDescription(`**Token Creation & Overview**\n For those interested in upgrading to our more advanced tooling, the payment __must__ be done before installation, the base version is free.\n\n**Additional Information**\nSelect the upgrade button below for those who want our premium version. After the payment, press it again for a seamless transition.\n\n__Premium temporarily disabled.__ \n\n**[Partnership & Information](https://www.nitrado-aff.com/2M731JR/D42TT/ \"Nitrado Partner Link\")**\nConsider using our partnership link to purchase your personal servers to help fund our services!`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setImage('https://i.imgur.com/2ZIHUgx.png')

            await interaction.reply({ embeds: [embed], components: [button], ephemeral: true }).then(async () => {
              await db.collection('configuration').doc(interaction.guild.id)
                .set({ ['nitrado']: { token: token } }, { merge: true })
            })
          }

          try {
            const nitrado = { token: interaction.fields.getTextInputValue('token-option') };

            const url = 'https://oauth.nitrado.net/token';
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
            response.status === 200 && interaction.guild.features.includes('COMMUNITY')
              ? validToken(nitrado) : invalidToken()

          } catch (error) { invalidToken(), console.log(error.response.data.message) }
        }

        if (interaction.customId === 'base-version') {
          const sent = await interaction.reply({ content: 'Installation starting...', ephemeral: true })

          const roles = await interaction.guild.roles.fetch();
          const action = roles.map(async role => role.name === 'Obelisk Permission' ? await role.delete() : null);
          try { await Promise.all(action) } catch (error) { return await sent.edit({ content: 'In your settings, move the bot above the permission role.', ephemeral: true }) };

          await sent.edit({ content: '33.33% - Managing permissions...', ephemeral: true });
          const role = await interaction.guild.roles.create({
            name: 'Obelisk Permission',
            color: '#2ecc71',
          }).then(() => console.log('Role created...'));

          const permissions = [{
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          }];

          const management = await interaction.guild.channels.create({
            name: `Obelisk Management`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const commands = await interaction.guild.channels.create({
            name: '⚫│𝗕ot-𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: management
          });

          const status = await interaction.guild.channels.create({
            name: '⚫│𝗦erver-𝗦tatus',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: management
          });

          await sent.edit({ content: '66.66% - Pushing channels to database...', ephemeral: true });

          const message = await status.send({ content: 'test' });
          await db.collection('configuration').doc(interaction.guild.id)
            .set({ ['status']: { channel: status.id, message: message.id } }, { merge: true });

          await sent.edit({ content: '99.99% - Confirming additional safeguards...', ephemeral: true })
            .then(async () => { await new Promise(resolve => setTimeout(resolve, 3000)) })
            .then(async () => await sent.edit({ content: '100.00% - Installation completed...', ephemeral: true }))


        }

      } catch (error) { null };
    });
  },
};