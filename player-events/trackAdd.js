module.exports = (bot, message, queue, track) => {

    const { MessageEmbed } = require("discord.js")

        const embed = new MessageEmbed()
        .setColor(bot.color)
        .setDescription(`${track.title} has been added to the queue.`)
    message.channel.send(embed);

};