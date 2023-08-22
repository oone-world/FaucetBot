const { SlashCommandBuilder } = require('@discordjs/builders');
const { watchlist } = require('../config.json');
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

async function getLastTx(address) {
	const res = await fetch('https://dev.oonescan.com/api?module=account&action=txlist&address=' + address, { method: 'Get' });
	const json = await res.json();

	return json['result'][0]['timeStamp'];
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Creates report of configured faucets.'),
	async execute(interaction) {
		await interaction.reply('Checking status')
		// For each watched address, get the date of the last transaction
		const transactions = await Promise.all(watchlist.map(async item => {
			const timestamp = await getLastTx(item.address)
			const minutesAgo = (timestamp ?
				(Math.floor((new Date().getTime() / 1000 - timestamp) / 60)) + ' minute(s) ago'
				:
				'No transactions in the last 12 hours'
			);
			return {
				label: item.label,
				url: item.url,
				timestamp: minutesAgo,
			}
		}))
		const embed = new MessageEmbed()
			.setTitle('Last faucet transactions')
			.setColor('#0099ff')
			.setTimestamp()
			.setFooter('Powered by Oonescan')
			.setDescription(transactions.map(({ label, url, timestamp }) => `[${label}](${url}): ${timestamp}`).join('\n'))

		return interaction.followUp({ embeds: [embed] })
	},
};