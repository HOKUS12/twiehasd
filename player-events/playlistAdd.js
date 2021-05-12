module.exports = (bot, message, playlist) => {
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
    .setColor(bot.color)
    .setDescription(` ${playlist.title} dodano do playlisty (**${playlist.items.length}** songs) !`)

    message.channel.send(embed);

};