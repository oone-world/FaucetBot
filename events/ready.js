const { activityType, activityName, channelId } = require('../config.json');
const {
	MessageActionRow,
	MessageButton,
} = require('discord.js');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		client.user.setActivity(activityName, { type: activityType });

		const button = new MessageActionRow();
		button.addComponents(
			new MessageButton()
				.setCustomId('faucet-button')
				.setStyle('PRIMARY')
				.setLabel('Faucet'),
		);
		client.channels.cache.get(channelId).send({
			content: 'Click on Faucet to get tOONE',
			components: [button],
		});
	},
};
