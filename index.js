const Discord = require('discord.js')
const bot = new Discord.Client();
const { token, prefix, main_color: color, bot_owners: owners, counter_number_reach, ignore_channel_id, ignore_channel_toggle, xp_system_levelrate, xp_system_rate, xp_system_toggle, report_system_channel, mod_logs_color, report_system_toggle, suggest_system_channel, suggest_system_toggle, status_type, command_cooldown_time, command_cooldown_toggle, anti_self_bot_message, anti_selfbot_toggle, mod_logs_channel, mod_logs_toggle, bot_name, anti_bad_word_toggle, anti_bad_words, welcome_message_channel, welcome_message_server, welcome_message_enabled, status_url, bot_status, status_change_interval } = require('./config.json')
const { MessageEmbed } = require('discord.js')
const fs = require('fs')
const { Player } = require('discord-player');
const ms = require('ms');
const noWords = anti_bad_words
let userlogs = require('./database/user-logs.json')
const superagent = require('superagent')
const api = require('covidapi');
let warns = JSON.parse(fs.readFileSync('./database/warns.json', 'utf8'));
const fetch = require('node-fetch')
const { Buffer } = require('buffer');
const xp = require('./database/xp.json')
const axios = require('axios');
const { config } = require('process');
let count = 0;
const player = new Player(bot);
bot.player = player
bot.afk = new Map();
bot.locked = new Map();
const cooldown = new Set();


bot.on("ready", () => {
    console.log(`Ready ${bot.user.username}`)
    function pickStatus() {
        const status = bot_status
        let Status = Math.floor(Math.random() * status.length);

        bot.user.setActivity(status[Status], {
            type: status_type,
            url: status_url
        })
    }

    setInterval(pickStatus, status_change_interval * 1000)
})


fs.readdir('./player-events/', (err, files) => {
    if (err) return console.color(err);
    files.forEach(file => {
        const event = require(`./player-events/${file}`);
        let eventName = file.split(".")[0];
        console.log(`Loading player event ${eventName}`);
        bot.player.on(eventName, event.bind(null, bot));
    });
});
bot.mcount = 0
bot.on("guildMemberAdd", (member) => {
    if (welcome_message_enabled === true) {
        console.log("Mmeber jo")
        if (member.guild.id !== welcome_message_server) return;
        bot.mcount++
        console.log(`Użytkownik dołączył ${bot.mcount}`);
        bot.guilds.cache.get(welcome_message_server).channels.cache.get(welcome_message_channel).send(`Witaj **<@${member.id}>** na **${member.guild.name}**`)
    } else { }
})



bot.on("message", message => {
    if (require('./config.json').counter === true) {
        if (count !== counter_number_reach) {
            if (message.author.id === bot.user.id) return;
            const takeAway = Math.floor(Math.random() * 40);
            if (message.channel.id !== require('./config.json').counter_channel) return;
            if (message.content.includes(count)) {
                count++
                if (count === counter_number_reach) {
                    const doneEmbed = new MessageEmbed()
                        .setColor(color)
                        .setDescription(`Gongrats! The counter of \`${counter_number_reach}\` has been reached!`)
                        .setFooter("I will know longer be counting..")

                    message.channel.send(doneEmbed)
                }

                let Num = Math.floor(Math.random() * 150);
                const curse = Math.floor(Math.random() * 70)
                if (Num === 50) {
                    const bonusEmbed = new MessageEmbed()
                        .setColor(color)
                        .setTitle("dostales powerupa xD")
                        .setDescription(`I have added ${takeAway} to the Count! \n \n Start counting from ${count + takeAway}`);
                    console.log('Takeaway is ' + takeAway)
                    message.channel.send(`<@${message.author.id}> You have found a power up!`, bonusEmbed)
                    console.log("Before " + count)
                    count += takeAway
                    console.log("After: " + count)
                }
                if (Num === 1) {
                    const curseEmbed = new MessageEmbed()
                        .setColor()
                        .setDescription(`U found a curse! \n \n Taking away ${curse} \n Start counting from ${count - curse}`)
                    // message.channel.send(`U found a curse! \n \n Taking away ${curse} \n Start counting from ${count - curse}`);
                    count -= curse
                    message.channel.send(curseEmbed)
                }

            } else {
                message.delete();
            }
        } else { }
    } else { }

})

bot.on("message", message => {
    if (require('./config.json').xp_system_toggle === true) {
        if (message.author.bot) return;
        if (!message.content.includes(`${prefix}buy`)) {
            let xpAdd = Math.floor(Math.random() * 7) + xp_system_rate;

            if (!xp[message.author.id]) {
                xp[message.author.id] = {
                    xp: 0,
                    level: 1
                }
            }

            let curxp = xp[message.author.id].xp
            let curlvl = xp[message.author.id].level
            let nxtLvl = xp[message.author.id].level * xp_system_levelrate
            xp[message.author.id].xp = curxp + xpAdd;
            if (nxtLvl <= xp[message.author.id].xp) {
                xp[message.author.id].level = curlvl + 1;
                let lvlup = new MessageEmbed()
                    .setColor(color)
                    .setTitle("Level up!")
                    .addField("Nowy level", curlvl + 1)

                message.reply(lvlup).then(msg => msg.delete({ timeout: '7000' }))
            }
            fs.writeFile('./database/xp.json', JSON.stringify(xp), (err) => {
                if (err) console.log(err);
            });
        } else {
            console.log("Buy command")
        }
    } else { }
})


bot.on("message", async message => {
    if (bot.afk.has(message.author.id)) {
        bot.afk.delete(message.author.id);
        try {
            if (message.member.nickname.includes("[AFK]")) {
                if (message.member.manageable) {
                    message.member.setNickname(`${message.member.user.username.substring("[AFK]")}`)
                }
            }
        } catch (e) { }
        message.channel.send(`Witaj ponownie <@${message.member.id}>! Usunołem cię z statusu jaki AFK`)
    }
    if (message.mentions.users.first()) {
        if (bot.afk.has(message.mentions.users.first().id)) {
            if (message.author.id === bot.user.id) return;
            message.reply(`${message.mentions.users.first().username} Jest afk (Czas: ${(Date.now) - bot.afk.date}): ${bot.afk.get(message.mentions.users.first().id).reason}`);
        }
    }
    let badwordIs = false;
    var i
    for (i = 0; i < noWords.length; i++) {

        if (message.content.toLowerCase().includes(noWords[i].toLowerCase())) badwordIs = true;
    }
    if (anti_bad_word_toggle === true) {
        if (badwordIs) {
            message.delete()
            return message.reply("Uważaj na słowa!");
        } else { }
    }
    const whitelistee = require('./config.json').whitelisted
    let wlisted = false
    whitelistee.forEach(id => {
        if (message.author.id === id) wlisted = true;
    })
    if (anti_selfbot_toggle === true) {
        if (message.embeds.length) {
            if (!message.author.bot) {
                if (wlisted === true) return;
                message.delete().then(() => {
                    return message.reply(anti_self_bot_message);
                })
            }
        }
    }

    const { content } = message;

    if (content.includes('discord.gg/')) {
        if (wlisted === true) return;
        if (!owners.includes(message.author.id)) {
            message.delete().then(() => {
                message.reply("Żadnej reklamy swoiej byku!");
            })
        } else { }
    }
    if (content.includes('https')) {
        if (wlisted === true) return;
        if (!owners.includes(message.author.id)) {
            message.delete().then(() => {
                message.reply("Żadnej reklamy swoiej byku");
            })
        } else { }
    }
    if (content.includes('.com')) {
        if (wlisted === true) return;
        if (!owners.includes(message.author.id)) {
            message.delete().then(() => {
                message.reply("Żadnej reklamy swoiej byku!");
            })
        } else { }
    }

    const meEmbed = new MessageEmbed()
        .setColor(color)
        .setDescription(`Hej, jestem botem o nazwie ${bot_name} Mój prefix to ;\`${require('./config.json').prefix}\` | Komenda \`${require('./config.json').prefix}help\` Wpisz ;help aby dowiedzieć sie all o bocie`)

    if (message.mentions.users.has(bot.user.id)) return message.channel.send(meEmbed)


    if (!message.content.startsWith(prefix) || message.author.bot) return;
    if (message.channel.type === 'dm') return message.channel.send("nie możesz używać poleceń w DM!")
    const blacklistedUser = require('./config.json').blacklisted
    let listed = false
    blacklistedUser.forEach(id => {
        if (message.author.id === id) listed = true
    })

    if (listed === true) return message.reply("Jesteś na białej liście od bota!")

    const aboveRole = new MessageEmbed()
        .setColor(color)
        .setDescription('Ten użytkownik ma wyższą rolę niż ty!')

    const userWhitelisted = new MessageEmbed()
        .setColor(color)
        .setDescription("Ten użytkownik jest na białej liście! Nie mogę tego zrobić!");

    const userStaff = new MessageEmbed()
        .setColor(color)
        .setDescription('To jest admin nie mozesz tego zrobic')

    const noMusicChannel = new MessageEmbed()
        .setColor(color)
        .setDescription("Nie jesteś na kanale głosowym.");

    const userOwner = new MessageEmbed()
        .setColor(color)
        .setDescription("Ten użytkownik jest właścicielem bota! Nie mogę tego zrobić.")

    const noError = new MessageEmbed()
        .setColor(color)
        .setDescription('Wystąpił błąd, ale nie mogłem go znaleźć.');

    const noMember = new MessageEmbed()
        .setColor(color)
        .setDescription('Nie wymieniono żadnego członka. Spróbuj wspomnieć o użytkowniku.');

    const noChannel = new MessageEmbed()
        .setColor(color)
        .setDescription('Nie wspomniano o żadnym kanale.');

    const noPerms = new MessageEmbed()
        .setColor(color)
        .setDescription('Członek nie ma wymaganych uprawnień')
    if (!message.content.startsWith(prefix) || message.author.bot) return

    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLocaleLowerCase();

    if (!message.guild.me.hasPermission("ADMINISTRATOR")) return message.channel.send('I am Missing `ADMINISTRATOR` Permissions.. ')

    if (command_cooldown_toggle === true) {

        if (cooldown.has(message.author.id)) {
            return message.reply("Komenda nie udana spróbuj ponownie!")
        }
        if (!owners.includes(message.author.id)) {
            cooldown.add(message.author.id)

            setTimeout(() => {
                cooldown.delete(message.author.id)
            }, command_cooldown_time * 1000)
        }
    } else { }

    if (ignore_channel_toggle === true) {
        if (ignore_channel_id.includes(message.channel.id)) {
            message.member.send(`Nie możesz używać poleceń w programie <#${message.channel.id}>`)
            return;
        }
    }

    if (command === 'help') {
        const helpEmbed = new MessageEmbed()
            .setColor(color)
            .setTitle("Info o bocie")
            .setDescription(`Informacje o bocie ${bot_name}`)
            .addField("Adminstrator", "`kick` `ban` `mute` `unmute` `hackban` `unban` `nuke` `clean` `clear` `softban` `warn` `delwarn` `warny` `clearwarns`")
            .addField("Zabawa", "   `Brak`")
            .addField("Inne", "`invites` `slowmode` `lock` `modlogs` `odblokuj` `dm` `Admini` `eval`")
            .addField("Muzyka", "`graj`, `join` `wyjdz` `stop` `pause` `loop` `np`")
            .addField('Informacje', "`stats` `membercount` `uptime` `config`")
            .addField("Rózne", "`snipe` `embed` `ping` `info` `av` `sugestia` `zglos` `id` `afk`")
            .addField("Level XP", "`level`")

        message.channel.send(helpEmbed)
    }

    if (command === 'clearwarns') {
        if (message.member.hasPermission("MANAGE_GUILD") || owners.includes(message.author.id)) {

            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember);

            const noWarns = new MessageEmbed()
            .setColor(color)
            .setDescription("Użytkownik nie ma żadnych ostrzeżeń")

            if (!warns[user.id]) {
                return message.channel.send(noWarns);
            }

            let warnss = warns[user.id].warns

            const clearedEmbed = new MessageEmbed()
            .setColor(color)
            .setDescription(`wyczyściłem \`${warnss}\` osoby użytkownika!`)

            message.channel.send(clearedEmbed)

            warns[user.id].warns -= warnss;

            fs.writeFile('./database/warns.json', JSON.stringify(warns), (err) => { if (err) console.log(err)})

            

        } else return message.channel.send(noPerms)
    }

    if (command === 'config') {
        let xpsystem = "";
        if (xp_system_toggle === true) xpsystem = 'Enabled'
        if (xp_system_toggle === false) xpsystem = 'Disabled'
        const configEmbed = new MessageEmbed()
            .setColor(color)
            .setAuthor(message.author.username, message.author.displayAvatarURL())
            .setDescription(`Ustawienia konfiguracji dla ${bot_name}`)
            .addField("Anti self bot", anti_selfbot_toggle, true)
            .addField('Xp system', xpsystem, true)
            .addField("Komenda do chatu", command_cooldown_toggle, true)
            .addField("Logi", mod_logs_toggle, true)
            .addField('Powitalne wiadomości', welcome_message_enabled, true)
            .addField("Whitelista", require('./config.json').whitelisted.join(", "), true)
            .addField("Blacklista", blacklistedUser.join(" , "), true)
            .addField("System zgłoszen", report_system_toggle, true)
            .addField("System propozycij", suggest_system_toggle, true)
            .addField("Ignorowanie kanału", ignore_channel_toggle, true)
            .addField("Ustawienie statusu", status_type, true)
            .addField("Statystyki", require('./config.json').counter, true)
            .addField("Mój prefix", prefix, true)
            .addField("Autor bota", owners.join(", "), true)
            .addField('Ranga mute', `<@&${require('./config.json').mute_role}>`, true)

            message.channel.send(configEmbed)
    }

    if (command === 'eval') {
        if (!args[0]) return message.reply("Wprowadź kod, aby wykonać!");

        try {
            // 
            const toEval = args.join(" ");
            const evalulated = eval(toEval);


        } catch (e) {
            message.channel.send('Incorrect form of **javascript** code ' + '\n\n `' + e + '`');
        }
    }

    if (command === 'afk') {
        bot.afk.set(message.author.id, {
            guild: message.guild.id,
            date: (Date.now),
            reason: args.join(" ") || "Nie podano powodu."
        })
        message.reply("Ustawiłem cie jako afk").then(() => {
            if (message.member.manageable) {
                message.guild.members.cache.find(mm => mm.id === message.member.id).setNickname(`[AFK]${message.member.user.username}`);
            } else { }
        })
    }



    if (command === 'uptime') {
        var seconds = parseInt((bot.uptime / 1000) & 60),
            minutes = parseInt((bot.uptime / (1000 * 60)) % 60),
            hours = parseInt((bot.uptime / (1000 * 60 * 60)) % 24);
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        let embed = new MessageEmbed()
            .setColor(color)
            .setDescription(`⌛Godzina: ${hours}\n\n⏱𝘔𝘪𝘯uta: ${minutes}\n\n⌚Sekunda: ${seconds}`)
        message.channel.send(embed)

    }

    if (command === 'owners') {
        if (message.member.hasPermission("MANAGE_GUILD") || owners.includes(message.author.id)) {
            owners.map(owner => message.channel.send(`<@${owner}>`))
        } else return message.channel.send(noPerms);
    }

    if (command === 'level') {
        if (require('./config.json').xp_system_toggle === true) {
            if (!message.mentions.users.first()) {
                if (!xp[message.author.id]) {
                    xp[message.author.id] = {
                        xp: 0,
                        level: 1
                    }
                }
                let curxp = xp[message.author.id].xp
                let curlvl = xp[message.author.id].level

                let lvlEmbed = new MessageEmbed()
                    .setAuthor(message.author.username, message.author.displayAvatarURL())
                    .setColor(color)
                    .addField("Level", curlvl, true)
                    .addField("XP", curxp, true)

                message.channel.send(lvlEmbed)
            } else {
                try {
                    const user = message.mentions.users.first();

                    if (!xp[user.id]) {
                        xp[message.author.id] = {
                            xp: 0,
                            level: 1
                        }
                    }
                    let curxp = xp[user.id].xp
                    let curlvl = xp[user.id].level

                    let lvlEmbed = new MessageEmbed()
                        .setAuthor(user.username, user.displayAvatarURL())
                        .setColor(color)
                        .addField("Level", curlvl, true)
                        .addField("XP", curxp, true)

                    message.channel.send(lvlEmbed)
                } catch (e) {
                    message.channel.send("Użytkownika nie ma w mojej bazie danych, co oznacza, że użytkownik nie wpisał.")
                }
            }
        } else {
            return message.channel.send("Obecnie system XP nie")
        }
    }




    if (command === 'delwarn') {
        if (message.member.hasPermission("MANAGE_GUILD") || owners.includes(message.author.id)) {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember);

            const ownUser = new MessageEmbed()
                .setColor(color)
                .setDescription("Nie możesz usunąć własnego ostrzerzenia!.")

            if (user.id === message.author.id) return message.channel.send(ownUser)

            const noWarns = new MessageEmbed()
                .setColor(color)
                .setDescription("Użytkownik nie ma żadnego Warna")

            if (!warns[user.id]) {
                return message.channel.send(noWarns)
            }

            warns[user.id].warns--

            const delWarned = new MessageEmbed()
                .setColor(color)
                .setDescription(`Usunołem 1 ostrzrzenie! <@${user.id}>`)

            message.channel.send(delWarned)

            fs.writeFile('./database/warns.json', JSON.stringify(warns), (err) => {
                if (err) console.log(err)
            })

        } else return message.channel.send(noPerms)
    }

    if (command === 'warn') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const user = message.mentions.members.first();
            if (!user) return message.channel.send(noMember);
            if (user.hasPermission("MANAGE_MESSAGES")) return message.channel.send(userStaff)

            let reason = args.slice(1).join(" ");
            if (!reason) reason = 'Nie podano powodu!';

            if (!warns[user.id]) {
                warns[user.id] = {
                    warns: 0,
                    reason: "None"
                }
            }

            warns[user.id].warns++



            const warnedEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`_<@${user.id}> Otrzymał warna | ${reason}`)

            message.channel.send(warnedEmbed)
            fs.writeFile('./database/warns.json', JSON.stringify(warns), (err) => {
                if (err) console.log(err)
            })
            if (!userlogs[user.id]) {
                userlogs[user.id] = {
                    logs: 0
                }
            }
            userlogs[user.id].logs++
            fs.writeFile('./database/user-logs.json', JSON.stringify(userlogs), (err) => {
                if (err) console.log(err)
            })
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'modlogs') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember)

            
            try {
                const modlogsEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`<@${user.id}> ma ${userlogs[user.id].logs || "None"} łącznie 0 przypadków modlogów.`)

            message.channel.send(modlogsEmbed);
            } catch (e) {
                const modlogsEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`<@${user.id}> ma łącznie 0 przypadków modlogów`)

            message.channel.send(modlogsEmbed);
            }
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'warnings') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(noMember);

            const warningsEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(user.username, user.displayAvatarURL())
                .setDescription(`Warnings for <@${user.id}> \n \n Warns: ${warns[user.id].warns || 'None'}`)

            message.channel.send(warningsEmbed)

        } else {
            return message.channel.send(noPerms)
        }


    }


    if (command === 'report') {
        if (report_system_toggle === true) {
            const userBot = new MessageEmbed()
                .setColor(color)
                .setDescription("Ten użytkownik jest botem, nie możesz zgłaszać botów!")
            const reportUser = message.mentions.users.first();
            if (!reportUser) return message.channel.send(noMember);
            if (reportUser.bot) return message.channel.send(userBot)
            const reportReason = args.slice(1).join(" ");

            const noReportReason = new MessageEmbed()
                .setColor(color)
                .setDescription("Nie podałeś żadnego powodu zgłoszenia.")

            if (!reportReason) return message.channel.send(noReportReason);

            const reportEmbed = new MessageEmbed()
                .setColor(color)
                .setTimestamp()
                .setAuthor(reportUser.username, reportUser.displayAvatarURL())
                .setFooter(message.guild.name, message.guild.iconURL())
                .setDescription(`**Member:** ${reportUser.username} (${reportUser.id})
                **Zgłoszenie by:** ${message.member.user.username} (${message.member.id})
                **ID:A** <#${message.channel.id}> (${message.channel.id})
                **Powód:** ${args.slice(1).join(" ")}`)


            const reportRecived = new MessageEmbed()
                .setColor(color)
                .setDescription("Otrzymano raport!")

            message.channel.send(reportRecived);

            bot.channels.cache.get(report_system_channel).send(reportEmbed)


        } else {
            message.channel.send("System raportów obecnie off")
        }
    }

    if (command === 'suggest') {
        if (suggest_system_toggle === true) {
            const suggestion = args.join(" ");
            const noSuggestion = new MessageEmbed()
                .setColor(color)
                .setDescription("Nie podano żadnej sugesti!")
            if (!suggestion) return message.channel.send(noSuggestion)
            const suggestEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(message.author.tag + ' zasugerował', message.author.displayAvatarURL())
                .setDescription(suggestion)
                .setTimestamp()

            const suggestionSent = new MessageEmbed()
                .setColor(color)
                .setDescription("Sugestia została wysłana!")

            message.channel.send(suggestionSent)

            bot.channels.cache.get(suggest_system_channel).send(suggestEmbed).then(m => m.react("🟢") && m.react("🔴"))
        } else {
            message.channel.send("System sugestii jest wyłączony.")
        }
    }

    if (command === 'clear') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const noPurge = new MessageEmbed()
                .setColor(color)
                .setDescription('Podaj liczbę wiadomości do usunięcia')
            const deleteCount = args[0];
            if (!deleteCount) return message.channel.send(noPurge)

            message.channel.bulkDelete(deleteCount);
        } else {
            return message.channel.send(noPerms);
        }
    }




    if (command === 'softban') {
        if (message.member.hasPermission("BAN_MEMBERS")) {
            const user = message.mentions.members.first();
            if (!user) return message.channel.send(noMember);

            if (message.member.roles.highest.position < user.roles.highest.position) return message.channel.send(aboveRole);
            if (owners.includes(user.id)) return message.channel.send(userOwner)
            user.ban({
                reason: `Softbanning user | Automatyzacja By ${message.author.tag}`,
                days: 7
            }).then(() => {
                message.guild.members.unban(user.id).then(() => {
                    const banned = new MessageEmbed()
                        .setColor(color)
                        .setDescription(`<@${user.id}> Dostał softbana!`)
                    message.channel.send(banned)
                })
            })
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'roast') {
        const user = message.mentions.users.first();
        if (!user) return message.channel.send(noMember);
        let msg = await message.channel.send("Getting a roast...");
        fetch('https://evilinsult.com/generate_insult.php?lang=en&type=json')
            .then(res => res.json())
            .then(json => {
                const roastEmbed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(user.username + ` ${json.insult}`)
                msg.edit(roastEmbed)
            })
    }

    if (command === 'invites') {
        const { MessageEmbed } = require('discord.js')
        const { guild } = message

        guild.fetchInvites().then((invites) => {
            const inviteCount = {}

            invites.forEach((invite) => {
                const { uses, inviter } = invite
                const { username, discriminator } = inviter

                const name = `${username}#${discriminator}`

                inviteCount[name] = (inviteCount[name] || 0) + uses
            })

            let replText = 'Invites:'



            for (const invite in inviteCount) {
                const count = inviteCount[invite]
                replText += `\n${invite} **Top 10 osób zapraszających!**

                **1.** {osoba} Zaprosił/a {ilość} osób!
                **2.**
                **3.**
                **4.**
                **5.**
                **6.**
                **7.**
                **8.**
                **9.**
                **10.**
                
                Wszystkim osobą z tej listy dziękujemy!  ${count}`
            }
            try {
                let e = new MessageEmbed()
                    .setAuthor(message.author.tag, message.author.displayAvatarURL())
                    .setDescription(replText)
                    .setColor(color)
                message.channel.send(e);
            } catch (e) {
                message.channel.send("No nie wiem ;d")
            }
        })
    }

    if (command === 'id') {
        const role = message.mentions.roles.first();
        const channel = message.mentions.channels.first();
        const user = message.mentions.users.first();
        const n = new MessageEmbed()
            .setColor(color)
            .setDescription("Wspomnij członka / rolę / kanał")
        if (!role && !channel && !user) return message.channel.send(n)
        if (role) {
            message.channel.send(`${role.name} ID is: ${role.id}`)
        } else {
            if (channel) {
                message.channel.send(`${channel.name} ID is: ${channel.id}`)
            } else {
                if (user) {
                    message.channel.send(user.tag + ' ID is: ' + user.id)
                }
            }
        }
    }

    if (command === 'docs') {
        const noQuery = new MessageEmbed()
            .setColor(color)
            .setDescription("Wpisz zapytanie, które mam wyszukać!")
        const uri = `https://djsdocs.sorta.moe/v2/embed?src=stable&q=${encodeURIComponent(args.join(" "))}`;
        if (!args[0]) return message.channel.send(noQuery)
        axios.get(uri)
            .then((embed) => {
                const { data } = embed

                if (data && !data.error) {
                    message.channel.send({
                        embed: data
                    })
                } else {
                    const noFind = new MessageEmbed()
                        .setColor(color)
                        .setDescription('There was no results for that query')
                    message.reply(noFind)
                }
            })
            .catch(err => {

            })

    }



    if (command === 'clean') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            message.channel.messages.cache.forEach(msg => {
                if (msg.author.bot) msg.delete();
            })
        } else {
            return message.channel.send(noPerms);
        }
    }

    if (command === 'stats') {
        let embed = new MessageEmbed()
            .setColor(color)
            .setDescription(`**${bot_name} Info o bocie** \n \n Statystyki bota`)
            .addField("Bot informacje", `-\`guilds:\` ${bot.guilds.cache.size} \n -\`Developers:\` H0KUS#8388 \n -\`Managers:\` None`)
            .addField("Inne info", `-\`Ping:\` ${bot.ws.ping}ms \n -\`Prefix:\` ${require('./config.json').prefix}\n -\`Libary:\` discord.js  \n -\`Version:\` ${Discord.version} `)
            .addField("Info o serwerze", `-\`Kanały\` ${bot.channels.cache.size} \n -\`Emojis\` ${bot.emojis.cache.size} \n -\`Opcje\` ${bot.options.shardCount}`)
            .addField("Zużycznie remu bota", `-\`Memory Usage\` ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB \n -\`Cpu Usage\` ${(process.cpuUsage().system).toFixed(1)}% \n -\`Recourse Usage\` ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + (process.cpuUsage().system).toFixed(1)}`)
        message.channel.send(embed);
    }


    if (command === 'loop') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);
        const repeatMode = player.getQueue(message).repeatMode;

        if (repeatMode) {
            player.setRepeatMode(message, false);
            return message.channel.send('Tryb powtarzania ** wyłączony ** !');
        } else {
            player.setRepeatMode(message, true);
            return message.channel.send('Od teraz piosenka leci **Ciągle** !');
        };
    }

    if (command === 'pause') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);

        if (!player.getQueue(message)) return message.channel.send('Obecnie brak muzyki!');

        player.pause(message);

        message.channel.send(`Song ${player.getQueue(message).playing.title} **STOP** !`);

    }

    if (command === 'resume') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);

        if (!player.getQueue(message)) return message.channel.send('Obecnie brak muzyki!');

        player.resume(message);

        message.channel.send(`Song ${player.getQueue(message).playing.title} **Gra dalej** !`);
    }


    if (command === 'np') {
        const track = await player.nowPlaying(message);
        const filters = [];

        Object.keys(player.getQueue(message).filters).forEach((filterName) => {
            if (player.getQueue(message).filters[filterName]) filters.push(filterName);
        });

        message.channel.send({
            embed: {
                color: color,
                author: { name: track.title },
                footer: { text: `${bot_name} Music` },
                fields: [
                    { name: 'Channel', value: track.author, inline: true },
                    { name: 'Requested by', value: track.requestedBy.username, inline: true },
                    { name: 'From playlist', value: track.fromPlaylist ? 'Yes' : 'No', inline: true },

                    { name: 'Views', value: track.views, inline: true },
                    { name: 'Duration', value: track.duration, inline: true },
                    { name: 'Filters activated', value: filters.length, inline: true },

                    { name: 'Progress bar', value: player.createProgressBar(message, { timecodes: true }), inline: true }
                ],
                thumbnail: { url: track.thumbnail },
                timestamp: new Date(),
            },
        });

    }

    if (command === 'stop') {
        const musicStopped = new MessageEmbed()
            .setColor(color)
            .setDescription("Muzyka została zastopowana z powodu zastopowania komendą!.")
        player.setRepeatMode(message, false)
        player.stop(message)
        message.channel.send(musicStopped)
    }

    if (command === 'membercount') {
        const mCount = new MessageEmbed()
            .setColor(color)
            .setDescription(`**${message.guild.name}** has: \n \n ${message.guild.memberCount} members!`)

        message.channel.send(mCount)
    }

    if (command === 'ascii') {
        const figlet = require('figlet')
        if (!args[0]) return message.channel.send('Proszę podać tekst!');

        let msg = args.join(" ");

        figlet.text(msg, function (err, data) {
            if (err) {
                console.log('Sometyhing went wromng!');
                console.dir(err);
            }

            if (data.length > 2000) return message.reply('dzierżawa zapewnia tekst o długości poniżej 2000 znaków!');

            message.channel.send('```' + data + '```')
        })
    }

    if (command === 'cat') {

        let msg = await message.channel.send('Generuje!...')

        let { body } = await superagent
            .get('https://aws.random.cat/meow')
        //console.log(body.file)
        if (!{ body }) return message.channel.send('Nie udano spróbuj potem!')

        const catEmbed = new MessageEmbed()


            .setAuthor('cat!', message.author.displayAvatarURL())
            .setColor(color)
            .setImage(body.file)
            .setTimestamp()

        message.channel.send(catEmbed)

        msg.delete();
    }

    if (command === 'dog') {
        let msg = await message.channel.send('Generating...')

        let { body } = await superagent
            .get('https://dog.ceo/api/breeds/image/random')
        //console.log(body.file)
        if (!{ body }) return message.channel.send('Nie udano, spróbuj ponownie!')

        const dogEmbed = new MessageEmbed()


            .setAuthor('dog!', message.author.displayAvatarURL())
            .setColor(color)
            .setImage(body.message)
            .setTimestamp()


        message.channel.send(dogEmbed)//.then(msg => msg.delete({timeout: "10000"}));

        msg.delete();
    }

    if (command === 'join') {
        const Iam = new MessageEmbed()
            .setColor(color)
            .setDescription("Jestem już na kanale!")
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);
        if (message.guild.me.voice.channel) return message.channel.send(Iam)

        message.member.voice.channel.join().then(() => {
            const joined = new MessageEmbed()
                .setColor(color)
                .setDescription(`Dołączyłem **${message.member.voice.channel.name}**`)

            message.channel.send(joined)
        })
    }

    if (command === 'wyjdz') {
        if (!message.member.voice.channel) return message.channel.send(noMusicChannel);

        message.member.voice.channel.leave()
        const joined = new MessageEmbed()
            .setColor(color)
            .setDescription(`I have left **${message.member.voice.channel.name}**`)

        message.channel.send(joined)

    }

    if (command === 'graj') {

        if (!message.member.voice.channel) return message.channel.send(noMusicChannel)

        player.play(message, args.join(" "));

        const eee = new MessageEmbed()
            .setColor(color)
            .setDescription("Searching for results..")

        message.channel.send(eee)

    }

    if (command === 'meme') {
        fetch('https://meme-api.herokuapp.com/gimme')
            .then(res => res.json())
            .then(async json => {
                let msg = await message.channel.send('O to twój mem xD');
                const memeEmbed = new MessageEmbed()
                    .setColor(color)
                    .setTitle(json.title)
                    .setImage(json.url)
                    .setFooter(`Subredit : ${json.subreddit}`);

                msg.edit(memeEmbed);
            })
    }

    if (command === 'covid') {
        const data = await api.all()
        const coronaEmbed = new MessageEmbed()
            .setColor(color)
            .addField("Casses", data.cases)
            .addField("Deaths", data.deaths)
            .addField("Recoverd", data.recovered)
            .addField("Active", data.active)
            .addField("Today Cases", data.todayCases)
            .addField("Critical", data.critical)
            .addField("tests", data.tests)
            .addField("Today Deaths", data.todayDeaths)
            .addField("Cases Per million", data.casesPerOneMillion)
            .addField("Affected Countries", data.affectedCountries)

        message.channel.send(coronaEmbed);
    }


    if (command === 'calc') {
        let method = args[0];
        let firstNumber = Number(args[1]);
        let secondNumber = Number(args[2])
        const operations = ['add', 'subtract', 'multiply', 'divide'];

        if (!method) return message.reply("Użyj następującego formatu! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        let noOperations = new MessageEmbed()
            .setColor(0xb51d36)
            .setDescription(' No operations mentioned.')
        if (!operations.includes(method)) return message.reply("Please use the following format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        if (!args[1]) return message.reply("Please use the following format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        if (!args[2]) return message.reply("Please use the following format! \n \n ``` \n -calc add 3 4 \n -calc subtract 3 2 \n -calc multiply 2 4 \n -calc divide 5 2``` ");

        if (isNaN(firstNumber)) return message.reply("The first number must be a number!");

        if (isNaN(secondNumber)) return message.reply("The second number must be a number!");

        if (method === 'add') {
            let doMath = firstNumber + secondNumber
            message.channel.send(`${firstNumber} + ${secondNumber} = ${doMath}`);
        }
        if (method === 'subtract') {
            let doMath = firstNumber - secondNumber
            message.channel.send(`${firstNumber} - ${secondNumber} = ${doMath}`);
        }
        if (method === 'multiply') {
            let doMath = firstNumber * secondNumber
            message.channel.send(`${firstNumber} x ${secondNumber} = ${doMath}`);
        }
        if (method === 'divide') {
            let doMath = firstNumber / secondNumber
            message.channel.send(`${firstNumber} / ${secondNumber} = ${doMath}`);
        }

    }

    if (command === 'av') {
        if (args[0]) {
            const user = message.mentions.users.first();
            if (!user) return message.reply('Wspomnij użytkownika, aby uzyskać dostęp do jego zdjęcia profilowego.');

            const otherIconEmbed = new MessageEmbed()
                .setTitle(`${user.username}'s avatar!`)
                .setImage(user.displayAvatarURL);

            return message.channel.send(otherIconEmbed).catch(err => console.log(err));
        }

        const myIconEmbed = new MessageEmbed()
            .setColor(color)
            .setTitle(`${message.author.username}'s Avatar!`)
            .setImage(message.author.displayAvatarURL());

        return message.channel.send(myIconEmbed).catch(err => console.log(err));
    }

    if (command === 'unban') {
        if (message.member.hasPermission("BAN_MEMBERS") || owners.includes(message.author.id)) {
            if (!args[0]) return message.channel.send(noMember)
            let bannedU = await bot.users.fetch(args[0])
            const notFound = new MessageEmbed()
                .setColor(color)
                .setDescription(`  Ten użytkownik nie został odnaleziony! Spróbuj wpisać ban <ID>`)
            if (!bannedU) return message.channel.send(notFound);

            const unbanned = new MessageEmbed()
                .setColor(color)
                .setDescription(` ${bannedU.username} Użytkownik został odbanowany!`)

            message.channel.send(unbanned)

            message.guild.members.unban(bannedU);
        } else return message.channel.send(noPerms);
    }

    if (command === 'nuke') {
        if (message.member.hasPermission("MANAGE_CHANNELS") || owners.includes(message.author.id)) {

            let nukeChannel = message.mentions.channels.first();
            if (!nukeChannel) nukeChannel = message.channel
            const position = nukeChannel.position

            const nukedEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(` Pomyslnie rozjebano kanal xD`, message.author.displayAvatarURL())
                .setImage("https://media.discordapp.net/attachments/720812237794574347/765218830418182204/200.gif?width=269&height=150")

            nukeChannel.clone().then(c => {
                c.send(nukedEmbed);
                c.setPosition(position);
            })
            await nukeChannel.delete()
        } else return message.channel.send(noPerms);
    }

    if (command === 'unmute') {
        if (message.member.hasPermission("BAN_MEMBERS") || owners.includes(message.author.id)) {
            const user = message.guild.member(message.mentions.users.first());
            if (!user) return message.channel.send(noMember);

            const muteRole = require('./database/muterole.json')[message.guild.id].role

            user.roles.remove(muteRole).then(() => {

                const removed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`Użytkownik został odciszony! <@${user.id}>`)

                message.channel.send(removed)
            })
        } else return message.channel.send(noPerms);
    }

    if (command === 'hack') {
        const user = message.mentions.users.first();
        if (!user) return message.channel.send(noMember);

        let hackEmails = [
           
        ]

        const hackPasswords = [
           
        ]

        const lastMessage = [
        ]

        const mostCommonWord = [
            "small",
            "big",
            "penis",
            "dick",
            "hi",
            "lonely",
            "bya",
            "ni**a",
            "gay",
            "person",
            "fuck",
            "pussy",
            "neek"
        ]

        let mes = await message.channel.send(`Hacking ${user.username}..`).then((msg) => {

            setTimeout(() => {
                msg.edit("[▖] Znajdowanie loginu niezgody (2fa bypassed)")
            }, 2 * 1000)

            setTimeout(() => {
                msg.edit(`[▗] **Email:** \`${hackEmails[Math.floor(Math.random() * hackEmails.length)]}\` \n **Password:** \`${hackPasswords[Math.floor(Math.random() * hackPasswords.length)]}\` `)
            }, 4 * 1000)

            setTimeout(() => {
                msg.edit("**[▝] Pobieranie dms z najbliższymi przyjaciółmi (jeśli w ogóle są znajomi)**")
            }, 6 * 1000)
            setTimeout(() => {
                msg.edit(`**[▝] Ostatni DM:** ${lastMessage[Math.floor(Math.random() * lastMessage.length)]}`)
            }, 8 * 1000)

            setTimeout(() => {
                msg.edit("[▖] Znajdowanie najpopularniejszego słowa ..")
            }, 10 * 1000)

            setTimeout(() => {
                msg.edit(`[▗] **Najpopularniejsze słowo:** ${mostCommonWord[Math.floor(Math.random() * mostCommonWord.length)]}`)
            }, 12 * 1000)

            setTimeout(() => {
                msg.edit("[▘] **Zainstalowałem Trodant, zhakowałem WSZYSTKIE EMOJIS**")
            }, 14 * 1000)

            setTimeout(() => {
                msg.edit("[▗] Sprzedaż danych rządowi.")
            }, 16 * 1000)

            setTimeout(() => {
                msg.edit(`Zakończone hakowanie <@${user.id}>`)
            }, 18 * 1000)
        })
    }

    if (command === 'embed') {
        message.delete();
        const embedSay = args.join(" ")
        let noEmbedSay = new MessageEmbed()
            .setColor(`GREEN`)
            .setDescription("Musisz napisać wiadomośc aby napisać embeda")
        if (!embedSay) return message.channel.send(noEmbedSay)
        const embedembed = new MessageEmbed()
            .setColor(`GREEN`)
            .setDescription(embedSay)
            .setFooter(message.author.tag, message.author.avatarURL())
            .setTimestamp()

        message.channel.send(embedembed)
    }

    if (command === 'say') {
        message.delete();
        const noSaY = new MessageEmbed()
            .setColor(color)
            .setDescription('Napisz wiadomość')
        if (!args) return message.channel.send(noSaY)
        message.channel.send(args.join(" "))
    }

    if (command === 'snipe') {
        try {

            const msg = bot.snipes.get(message.channel.id)
            if (!msg) return message.channel.send(noSnipe)
            const snipedEmbed = new MessageEmbed()
                .setColor(color)
                .setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL())
                .setDescription(msg.content)
                .setTimestamp()
            message.channel.send(snipedEmbed)
        } catch (e) {

            const noSnipe = new MessageEmbed()
                .setColor(color)
                .setDescription('Nie wiem xD')
            message.channel.send(noSnipe)
        }
    }


    if (command === 'ping') {
        message.channel.send("Pinging...").then(msgs => {
            const ping = msgs.createdTimestamp - message.createdTimestamp;

            msgs.edit(`Pong!🏓 Response ping is: \`${ping}\`ms | Discord API latency is: \`${bot.ws.ping}\`ms`)
        })
    }

    if (mod_logs_toggle === true) {
        if (message.member.hasPermission("MANAGE_MESSAGES")) {

            const logEmbed = new MessageEmbed()
                .setColor(mod_logs_color)
                .setDescription(`<@${message.author.id}> has used \`${message.content}\` in <#${message.channel.id}>`)

            bot.channels.cache.get(mod_logs_channel).send(logEmbed);

        }
    } else {

    }



    if (command === 'announce') {
        if (message.member.hasPermission("MENTION_EVERYONE") || owners.includes(message.author.id)) {

            const noAnnouncement = new MessageEmbed()
                .setColor(color)
                .setDescription('Nie wspomniano nic, co mógłbym ogłosić')

            const annoouncement = args.slice(1).join(" ");
            if (!annoouncement) return message.channel.send(noAnnouncement)
            const annoouncementChannel = message.mentions.channels.first();
            if (!annoouncementChannel) return message.channel.send(noChannel);

            const announced = new MessageEmbed()
                .setColor(color)
                .setDescription("Wysłałem ogłoszenie")

            message.channel.send(announced)



            annoouncementChannel.send(annoouncement);
        } else return message.channel.send(noPerms);
    }

    if (command === 'serverinfo') {
        const owner = message.guild.ownerID
        let embed = new MessageEmbed()
            .setColor(color)
            .setTitle(`${message.guild.name}`)
            .addField("**Własciciel:**", `<@${owner}>`, true)
            .addField("Lokalizacja", message.guild.region, true)
            .addField("Kanały textowe", message.guild.channels.cache.size, true)
            .addField("Osoby", message.guild.memberCount, true)
            .addField("**Lista ról**", message.guild.roles.cache.size, true)//a70f3e9169546b2c67d301aaeef38.gif
            .setThumbnail(message.guild.iconURL())
            .setFooter(`${message.author.username}`, message.author.displayAvatarURL())

        message.channel.send(embed)
    }


    if (command === 'kick') {
        if (message.member.hasPermission("BAN_MEMBERS") || owners.includes(message.author.id)) {
            const member = message.guild.member(message.mentions.users.first());
            if (!member) return message.channel.send(noMember);
            let reason = args.slice(1).join(" ")
            if (!reason) reason = 'Nie podano powodu.';
            if (message.member.roles.highest.position < member.roles.highest.position) return message.channel.send(aboveRole);

            if (owners.includes(member.id)) return message.channel.send(userOwner);

            member.kick(member, `Automatyzacja By HOKUS ${message.author.tag}`).then(() => {
                const kickedEmbec = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`${member.user.username} został wyrzucony!`)
                message.channel.send(kickedEmbec)
            })
        } else return message.channel.send(noPerms)
    }


    if (command === 'ban') {
        if (message.member.hasPermission("BAN_MEMBERS") || owners.includes(message.author.id)) {
            const member = message.guild.member(message.mentions.users.first());
            if (!member) return message.channel.send(noMember);
            let reason = args.slice(1).join(" ")
            if (!reason) reason = 'Nie podano powodu.';
            if (message.member.roles.highest.position < member.roles.highest.position) return message.channel.send(aboveRole);
            if (owners.includes(member.id)) return message.channel.send(userOwner);

            member.ban({
                reason: `Autorized by ${message.author.tag}`
            }).then(() => {
                const kickedEmbec = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`${member.user.username} Został zbanowany!`)
                message.channel.send(kickedEmbec)
            })
        } else {
            return message.channel.send(noPerms);
        }
    }



    if (command === 'mute') {
        if (message.member.hasPermission("MANAGE_MESSAGES") || owners.includes(message.author.id)) {
            const wUser = message.guild.member(message.mentions.users.first())
            if (wUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send(userStaff)
            if (!wUser) return message.channel.send(noMember)
            let time = args[1]

            const noTimeEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription("Nie podano czasu")


            if (!time) return message.channel.send(noTimeEmbed);
            if (owners.includes(wUser.id)) return message.channel.send(userOwner);

            let muteRole = require('./config.json').mute_role
            if (muteRole === 'nie mam dostepu xD') muteRole = message.guild.roles.cache.find(role => role.name === 'Muted')
            if (wUser.roles.cache.has(muteRole)) return message.reply("Użytkownik jest już wyciszony.")

            wUser.roles.add(muteRole)

            const mutedEmbed = new MessageEmbed()
                .setColor(color)
                .setDescription(`${wUser.user.username} Otrzymał w prezencie muta ${time}`)

            message.channel.send(mutedEmbed);

            if (!userlogs[wUser.id]) userlogs[wUser.id] = {
                logs: 0
            }

            userlogs[wUser.id].logs++

            fs.writeFile('./database/user-logs.json', JSON.stringify(userlogs), (err) => {
                if (err) console.log(err);
            })


            setTimeout(() => {
                let unmkutedEmbed = new MessageEmbed()
                    .setColor(color)
                    .setDescription(`${wUser.user.username} został odciszony!`)
                wUser.roles.remove(muteRole).then(() => {
                    message.channel.send(unmkutedEmbed)
                })
            }, (ms(time)))
        } else {
            return message.channel.send(noPerms)
        }
    }

    if (command === 'gay') {
        console.log(bot.locked.get(message.channel.id).perms)
        let gayMember = message.mentions.users.first()
        if (!gayMember) gayMember = message.author
        const gayEmbed = new MessageEmbed()
            .setColor(color)
            .setTitle(`${gayMember.tag} gayrate is:`)
            .setDescription(`${gayMember.tag} is ${Math.floor(Math.random() * 100)}% gay`)

        message.channel.send(gayEmbed)
    }

    if (command === 'whois' || command === 'userinfo') {
        if (message.mentions.users.last()) {
            const wuser = message.mentions.users.first();
            const mUser = message.mentions.members.first();
            const embed = new MessageEmbed()
                .setColor(color)
                .setAuthor(wuser.username, wuser.displayAvatarURL())
                .setTitle(`Info o  ${wuser.username}`)
                .addFields(
                    {
                        name: "Nick",
                        value: mUser.user.tag,
                        inline: true
                    },
                    {
                        name: 'Bot',
                        value: mUser.user.bot,
                        inline: true
                    },
                    {
                        name: 'Nick',
                        value: mUser.nickname || 'None',
                        inline: true
                    },
                    {
                        name: 'Utworzenie konta',
                        value: new Date(mUser.joinedTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: 'Wejście',
                        value: new Date(wuser.createdTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: 'Licznik ról',
                        value: mUser.roles.cache.size - 1,
                        inline: true
                    },
                    {
                        name: "Role",
                        value: mUser.roles.cache.map(role => `<@&${role.id}>`),
                        inline: true
                    },
                )
            message.channel.send(embed)
        } else {

            const e = new MessageEmbed()
                .setColor(color)
                .setAuthor(message.author.tag, message.author.displayAvatarURL())
                .setTitle(`Info o ${message.author.username}`)
                .setThumbnail(message.author.displayAvatarURL())
                .addFields(
                    {
                        name: 'Nick',
                        value: message.author.tag,
                        inline: true
                    },
                    {
                        name: 'Bot',
                        value: message.author.bot,
                        inline: true
                    },
                    {
                        name: "Nick",
                        value: message.member.nickname || 'None',
                        inline: true
                    },
                    {
                        name: 'Wejscie na serwer',
                        value: new Date(message.member.joinedTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: "Utworzenie konta",
                        value: new Date(message.author.createdTimestamp).toLocaleDateString(),
                        inline: true
                    },
                    {
                        name: "Licznik ról",
                        value: message.member.roles.cache.size - 1,
                        inline: true
                    },
                    {
                        name: "Role",
                        value: message.member.roles.cache.map(role => `<@&${role.id}>`),
                        inline: true
                    },
                )
            //    }
            message.channel.send(e)
        }
    }


    if (command === 'lock') {
        const channel = message.mentions.channels.first();

        if (!channel) return message.channel.send(noChannel);

        const mainRole = message.guild.roles.everyone.id
        bot.locked.set(channel.id, {
            perms: channel.permissionOverwrites
        })

        channel.createOverwrite(mainRole, {
            SEND_MESSAGES: false
        }).then(() => {
            const locked = new MessageEmbed()
                .setColor(color)
                .setDescription("Kanał został zablokowany!");
            message.channel.send(locked);
        })
    }

    if (command === 'unlock') {
        const channel = message.mentions.channels.first();

        if (!channel) return message.channel.send(noChannel);

        const mainRole = message.guild.roles.everyone.id

        channel.updateOverwrite(mainRole, {
            SEND_MESSAGES: null
        }).then(() => {
            const locked = new MessageEmbed()
                .setColor(color)
                .setDescription("Kanał został odblokowany!");
            message.channel.send(locked);
        })
    }

    if (command === 'hackban') {
        try {
            if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send(noPerms)
            const user = await bot.users.fetch(args[0]);
            if (!args[0]) return message.channel.send(noMember)
            if (!user) return message.channel.send(noMember);
            if (owners.includes(user.id)) return message.channel.send(userOwner);
            message.guild.members.ban(user);

            const hackbanned = new MessageEmbed()
                .setColor(color)
                .setDescription(`Zbanowałem ${user.username} z serwera`)

            message.channel.send(hackbanned)


        } catch (color) {

            message.channel.send(noError)
        }
    }


    if (command === 'token') {
        const tokenEmbed = new MessageEmbed()
            .setColor(color)
            .setDescription("Wspomnij o tokenie użytkownika, który muszę pobrać")
        try {
            const user = message.mentions.users.first();
            if (!user) return message.channel.send(tokenEmbed)
            message.channel.send(Buffer.from(user.id).toString("base64") + Buffer.from(user.lastMessageID).toString("base64"))
        } catch (e) {
            message.channel.send("Użytkownik ostatnio nie wpisał, co jest wymagane, aby pobrać jego token.")
        }
    }

    if (command === 'dm') {
        if (!message.member.hasPermission("MANAGE_GUILD")) return message.channel.send(noPerms)
        message.delete();
        const user = message.mentions.users.first();

        if (!user) return message.channel.send(noMember);

        user.send(args.slice(1).join(" "))
    }

})

bot.on("channelCreate", (guildchannel, dmchannel) => {
    if (guildchannel.type === 'dm') return;
    const channelCreated = new MessageEmbed()
        .setColor(mod_logs_color)
        .setDescription(`_A Kanał został utworzony \n \n **Kanał:** <#${guildchannel.id}> \n **Kanał ID:** ${guildchannel.id}\n **Typ kanału:** ${guildchannel.type}`)
    if (mod_logs_toggle === true) {
        bot.channels.cache.get(mod_logs_channel).send(channelCreated);
    } else { }
})

bot.on("messageUpdate", (oldMessage, newMessage) => {
    if (oldMessage.author.bot) return;
    const messageEditedEmbed = new MessageEmbed()
        .setColor(mod_logs_color)
        .setAuthor(oldMessage.author.tag, oldMessage.author.displayAvatarURL())
        .setDescription(`Wiadomosc zostala zaupedtowana<#${oldMessage.channel.id}> \n \n **Ostatnia wiadomość:** \n ${oldMessage.content} \n **Nowa wiadomość:** \n ${newMessage.content}`)
    if (mod_logs_toggle === true) {

        bot.channels.cache.get(mod_logs_channel).send(messageEditedEmbed)

    } else { }
})

bot.on("messageDelete", (message) => {
    if (message.embeds.length) return;
    if (mod_logs_toggle === true) {
        const messageDeletedEmebd = new MessageEmbed()
            .setColor(mod_logs_color)
            .setAuthor(message.author.tag, message.author.displayAvatarURL())
            .setDescription(`Wiadomość została usunięta **<#${message.channel.id}>** \n \`${message.content}\``)
            .setTimestamp()
        bot.channels.cache.get(mod_logs_channel).send(messageDeletedEmebd)
    } else { }
    bot.snipes = new Map();
    bot.snipes.set(message.channel.id, {
        content: message.content,
        author: message.author
    })
})

bot.login(token)