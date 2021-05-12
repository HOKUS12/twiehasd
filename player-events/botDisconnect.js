module.exports = (bot, message, queue) => {

    const { MessageEmbed } = require('discord.js') 
    const embed = new   MessageEmbed()
    .setColor(bot.color)
    .setDescription('Bot wyszedł z kanału głosowego!')

    message.channel.send(embed);

};
