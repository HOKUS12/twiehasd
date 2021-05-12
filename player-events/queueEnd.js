module.exports = (bot, message, queue) => {
    const {MessageEmbed} = require('discord.js')
    const embed = new MessageEmbed()
    .setColor(bot.color)
    .setDescription(` Muzyka została zastopowana z powodu, konca czasu piosenki!`)
    message.channel.send(embed);

};