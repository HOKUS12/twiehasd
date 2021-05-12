module.exports = (bot, message, query) => {
    const { MessageEmbed } = require('discord.js')
   
    const embed = new MessageEmbed()
    .setColor(bot.color)
    .setDescription(`Nie znalezione takiego utworu! ${query} !`)
    message.channel.send(embed);

};