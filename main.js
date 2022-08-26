const Discord = require('discord.js');
const { token } = require('./token.json');
const crawler = require('./crawler.js');
const client = new Discord.Client();
const db = require('./db.js');

var timer;
var timerDelay = 600000;
var channel;
var tagName;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    tagName = `<@${client.users.cache.keyArray()[0]}>`;
    console.log(`tagName = ${tagName}`);
});

client.on('message', msg => {
    if (msg.content.indexOf(tagName + ' ') != 0) return;
    let text = msg.content.substring(tagName.length + 1);
    channel = msg.channel;
    console.log(channel);
    console.log(`[${msg.author.tag}] ${text}`);
    if (msg.author == client.user) return
    if (text === 'help') {
        msg.channel.send(
            'Usage :\n' +
            '  - `help`         : 查看幫助\n' +
            '  - `start`       : 自動訂閱發布啟動 (每10分鐘更新)\n' +
            '  - `stop`         : 自動訂閱發布停止\n' +
            '  - `check`       : 單次即時訂閱檢查\n' +
            '  - `list`         : 查看目前訂閱者\n' +
            '  - `add`           : 增加訂閱者\n' +
            '  - `del`           : 移除訂閱者\n' +
            '  - `del -all` : 移除所有訂閱者'
        );
    }
    else if (text === 'start') {
        crawlerIG();
        if (timer) clearInterval(timer);
        timer = setInterval(crawlerIG, timerDelay);
        msg.channel.send('訂閱發布啟動 (每10分鐘更新)');
    }
    else if (text === 'stop') {
        if (!timer) return;
        clearInterval(timer);
        timer = undefined;
        msg.channel.send('訂閱發布停止');
    }
    else if (text === 'check') {
        crawlerIG();
    }
    else if (text === 'list') {
        db.getSubUserList().then(res => {
            if (res.length == 0) {
                msg.channel.send('目前無帳號訂閱中');
                return;
            }
            let reply = '訂閱中：'
            res.forEach(item => {
                reply += `\n - ${item.username} (https://www.instagram.com/${item.username}/)`
            });
            msg.channel.send(reply);
        })
    }
    else if (text === 'del -all') {
        db.delSubUser({}).then(res => {
            console.log(res);
            if (res.deletedCount == 0) {
                msg.channel.send(`訂閱不存在`);
                return;
            }
            msg.channel.send(`取消訂閱所有帳號，共 ${res.deletedCount} 個`);
        })
    }
    else if (text.indexOf('add ') == 0) {
        let name = text.substring(4);
        db.addSubUser(name).then(res => {
            if (!res) {
                msg.channel.send(`訂閱已存在 (https://www.instagram.com/${name}/)`);
                return;
            }
            msg.channel.send(`開始訂閱 ${name} 帳號 (https://www.instagram.com/${name}/)`);
        })
    }
    else if (text.indexOf('del ') == 0) {
        let name = text.substring(4);
        db.delSubUser({ username: name }).then(res => {
            console.log(res);
            if (res.deletedCount == 0) {
                msg.channel.send(`訂閱不存在`);
                return;
            }
            msg.channel.send(`取消訂閱 ${name} 帳號`);
        })
    }
});

function crawlerIG() {
    if (!channel) return;
    db.getSubUserList().then(res => {
        res.forEach(item => {
            crawler.run(item.username).then(res => {
                res.forEach(out => {
                    // 使用貼文id搜尋DB是否已存在
                    const query = { 'id': out.id };
                    db.getLastPost(query).then(res => {
                        let timestring = crawler.timeConverter(out.timestamp);
                        // 如果爬到新貼文就新增資料到DB且呼叫Bot
                        if (!res) {
                            // console.log(`"${timestring} 貼文" 不存在`);
                            db.pushSubRecord(out);
                            channel.send(`${out.owner.username} 於 ${timestring} 發布了新貼文 (${out.url})`);
                        }
                        else {
                            // console.log(`"${timestring} 貼文" 已存在`);
                        }
                    })
                })
            });
        })
    })
}

client.login(token);