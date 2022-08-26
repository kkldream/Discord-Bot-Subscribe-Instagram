const Discord = require('discord.js');
const { token } = require('./token.json');
const client = new Discord.Client();

var channel;
var tagName;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    tagName = `<@${client.users.cache.keyArray()[0]}>`;
    console.log(`tagName = ${tagName}`);
    let guild = new Discord.Guild(client, {id: '359677482456317952'})
    let channel_tmep = new Discord.TextChannel(guild, {id: '1011662945534619690'});
    channel_tmep.send("Hello");
});

client.on('message', msg => {
    if (msg.author.id == client.user.id) return;
    console.log(msg);
    console.log({
        channel: {
            id: msg.channel.id,
            name: msg.channel.name,
            deleted: msg.channel.deleted,
        },
        guild: {
            id: msg.channel.guild.id,
            name: msg.channel.guild.name,
            deleted: msg.channel.guild.deleted,
        },
        author: {
            id: msg.author.id,
            username: msg.author.username,
            discriminator: msg.author.discriminator,
            tag: msg.author.tag,
            bot: msg.author.bot,
        },
        msg: {
            id: msg.id,
            deleted: msg.deleted,
            content: msg.content,
            type: msg.type,
            createdTimestamp: msg.createdTimestamp,
            system: msg.system,
        }
    });
});

client.login(token);