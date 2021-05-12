module.exports = (bot, message, query, tracks) => {

    message.channel.send({
        embed: {
            color: require('../config.json').main_color,
            author: { name: `O to co mi sie udalo wyszukac! ${query}` },
            timestamp: new Date(),
            description: `${tracks.map((t, i) => `**${i + 1}** - ${t.title}`).join('\n')}`,
        },
    });

};