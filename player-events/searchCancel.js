module.exports = (bot, message, query, tracks) => {

    const { MessageEmbed } = require('discord.js')
    const embed = new   MessageEmbed()
    .setColor(bot.color)
    .setDescription(' You did not provide a valid response ... Please send the command again ')

    message.channel.send(embed);

};