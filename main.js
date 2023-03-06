require("dotenv").config();
const Discord = require('discord.js');
const crawler = require('./crawler.js');
const db = require('./db.js');
const utils = require('./utils.js');

const client = new Discord.Client();

var timerDelay = 30 * 60000;
var tagId;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    tagId = `<@${client.users.cache.keyArray()[0]}>`;
    console.log(`tagId = ${tagId}`);
});

client.on('message', msg => {
    let argParm = utils.getArgParm(msg.content);
    if (msg.author.id === client.user.id) console.log(`[${msg.channel.guild.name} <- ${msg.channel.name} <- Reply] ${msg.content}`);
    if (argParm[0] !== tagId) return;
    console.log(`[${msg.channel.guild.name} -> ${msg.channel.name} -> ${msg.author.tag}] ${argParm.slice(1).toString()}`);

    if (argParm[1] === 'help') {
        channelSend(msg.channel,
            'Usage :\n' +
            '  - `help` : 查看幫助\n' +
            '  - `init` : 對此頻道進行初始化才可使用以下功能\n' +
            '  - `start` : 此頻道的自動訂閱發布啟動 (大概每' + parseInt(timerDelay / 60000) + '分鐘更新)\n' +
            '  - `stop` : 此頻道的自動訂閱發布停止\n' +
            '  - `status` : 查看此頻道的自動訂閱發布狀態\n' +
            '  - `list` : 查看此頻道的訂閱者\n' +
            '  - `add [用戶名稱]` : 增加此頻道的訂閱者\n' +
            '  - `del [用戶名稱]` : 移除此頻道的訂閱者\n' +
            '  - `del -all` : 移除此頻道的所有訂閱者'
        );
    }
    else if (argParm[1] === 'init') {
        db.addSubscribeChannel(msg).then(res => {
            console.log(res);
            if (res.insertResult) channelSend(msg.channel, '建立初始化頻道');
            else channelSend(msg.channel, '更新初始化頻道');
        });
    }
    else if (argParm[1] === 'add') {
        let username = argParm[2];
        db.addSubscribeUser(msg, username).then(res => {
            console.log(res);
            if (!res.findResult) {
                channelSend(msg.channel, `尚未初始化頻道 (輸入 "${tagId} init" 指令)`);
                return;
            }
            if (!res.updateResult) {
                channelSend(msg.channel, `訂閱已存在 (https://www.instagram.com/${username}/)`);
                return;
            }
            channelSend(msg.channel, `開始訂閱 ${username} 帳號 (https://www.instagram.com/${username}/)`);

            // 篩選所有貼文列表取得新貼文列表
            crawler(username)
                // 篩選所有貼文列表取得新貼文列表
                .then(async res => {
                    let postIdList = [];
                    res.forEach(post => postIdList.push(post.id));
                    let inPosts = await db.findPostByFilter({ id: { $in: postIdList } });
                    let inPostIdList = [];
                    inPosts.forEach(post => inPostIdList.push(post.id));
                    let newPosts = [];
                    res.forEach(post => {
                        if (inPostIdList.indexOf(post.id) === -1) newPosts.push(post);
                    });
                    return newPosts;
                })
                // 將新貼文保存至DB
                .then(async newPosts => {
                    console.log(`newPosts number : ${newPosts.length}`);
                    if (newPosts.length === 0) return [];
                    let insertResult = await db.insertPostRecord(newPosts);
                    console.log(insertResult);
                    return newPosts;
                })
                // 也將新貼文推撥至其他頻道，當前頻道不推撥
                .then(newPosts => {
                    var filter = {
                        'channel.id': { $ne: msg.channel.id },
                        'enable': true,
                        'deleted': false,
                    };
                    db.getAllSubscribeChannelInfoByFilter(filter).then(res => {
                        let findResultList = res.findResult;
                        findResultList.forEach(findResult => {
                            let subscribeUserList = findResult.subscribes;
                            let subscribeChannel = new Discord.TextChannel(
                                new Discord.Guild(client, { id: findResult.guild.id }),
                                { id: findResult.channel.id },
                            );
                            newPosts.forEach(post => {
                                if (subscribeUserList.indexOf(post.owner.username) !== -1) {
                                    subscribeChannel.send(`${post.owner.username} 於 ${utils.timeConverter(post.postTimestamp)} 發布了新貼文\n(${post.url})`);
                                }
                            })
                        })
                    })
                });
        });
    }
    else if (argParm[1] === 'del') {
        if (argParm[2] === '-all') {
            db.delAllSubscribeUser(msg).then(res => {
                console.log(res);
                if (!res.findResult) {
                    channelSend(msg.channel, `尚未初始化頻道 (輸入 "${tagId} init" 指令)`);
                    return;
                }
                if (res.updateResult.modifiedCount === 0) {
                    channelSend(msg.channel, `無訂閱存在`);
                    return;
                }
                channelSend(msg.channel, `取消訂閱所有帳號，共 ${res.findResult.subscribes.length} 個`);
            })
        }
        else {
            let username = argParm[2];
            db.delSubscribeUser(msg, username).then(res => {
                console.log(res);
                if (!res.findResult) {
                    channelSend(msg.channel, `尚未初始化頻道 (輸入 "${tagId} init" 指令)`);
                    return;
                }
                if (res.updateResult.modifiedCount === 0) {
                    channelSend(msg.channel, `此訂閱不存在`);
                    return;
                }
                channelSend(msg.channel, `取消訂閱 ${username} 帳號`);
            })
        }
    }
    else if (argParm[1] === 'list') {
        db.getSubscribeChannelInfo(msg).then(res => {
            console.log(res);
            if (!res.findResult) {
                channelSend(msg.channel, `尚未初始化頻道 (輸入 "${tagId} init" 指令)`);
                return;
            }
            let subArr = res.findResult.subscribes;
            if (subArr.length == 0) {
                channelSend(msg.channel, '目前無帳號訂閱中');
                return;
            }
            let replyStr = '訂閱中：'
            subArr.forEach(item => {
                replyStr += `\n - ${item} (https://www.instagram.com/${item}/)`
            });
            channelSend(msg.channel, replyStr);
        })
    }
    else if (argParm[1] === 'status') {
        db.getSubscribeChannelInfo(msg).then(res => {
            console.log(res);
            if (!res.findResult) {
                channelSend(msg.channel, `尚未初始化頻道 (輸入 "${tagId} init" 指令)`);
                return;
            }
            if (res.findResult.enable) {
                channelSend(msg.channel, '此頻道訂閱功能狀態：啟動中');
                return;
            }
            channelSend(msg.channel, '此頻道訂閱功能狀態：未啟動');
        })
    }
    else if (argParm[1] === 'start') {
        db.setSubscribeChannel(msg, true).then(res => {
            console.log(res);
            if (!res.findResult) {
                channelSend(msg.channel, `尚未初始化頻道 (輸入 "${tagId} init" 指令)`);
                return;
            }
            if (res.updateResult.modifiedCount === 0) {
                channelSend(msg.channel, '頻道訂閱功能目前啟動中');
                return;
            }
            channelSend(msg.channel, `啟動頻道訂閱功能 (每${parseInt(timerDelay / 60000)}分鐘更新)`);
        });
    }
    else if (argParm[1] === 'stop') {
        db.setSubscribeChannel(msg, false).then(res => {
            console.log(res);
            if (!res.findResult) {
                channelSend(msg.channel, `尚未初始化頻道 (輸入 "${tagId} init" 指令)`);
                return;
            }
            if (res.updateResult.modifiedCount === 0) {
                channelSend(msg.channel, '頻道訂閱功能目前未啟動');
                return;
            }
            channelSend(msg.channel, '停止頻道訂閱功能');
        });
    }
    else if (argParm[1] === 'crawler') {
        crawlerIg();
    }
});

const symbols = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '{', '}', '[', ']', '"', '\'', ':', ';', '?', '/', '.', '<', '>', '|', '*', '-', '+', '=', '`'];
function channelSend(channel, text) {
    let allOutput = '';
    text.split('\n').forEach(str => {
        let httpStart = str.indexOf('https://');
        let oneOutput = '';
        for (let index = 0; index < str.length; index++) {
            let ch = str[index];
            if (symbols.indexOf(ch) !== -1 && index < httpStart)
                oneOutput += `\\${ch}`;
            else
                oneOutput += ch;
        }
        allOutput += `${oneOutput}\n`;
    })
    channel.send(allOutput);
}

function crawlerIg() {
    console.log('\ncrawlerIg :');
    db.getAllSubscribeChannelInfoByFilter({ 'deleted': false })
        // 取得所有訂閱者列表
        .then(res => {
            // console.log(res);
            allSubscribeUserList = [];
            let findResultList = res.findResult;
            findResultList.forEach(findResult => {
                let subscribeUserList = findResult.subscribes;
                subscribeUserList.forEach(subscribeUser => {
                    if (allSubscribeUserList.indexOf(subscribeUser) === -1) {
                        allSubscribeUserList.push(subscribeUser);
                    }
                })
            })
            return allSubscribeUserList;
        })
        // 透過訂閱者列表取得所有貼文列表
        .then(async allSubscribeUserList => {
            console.log('allSubscribeUserList :');
            console.log(allSubscribeUserList);
            let allPosts = [];
            for (const subscribeUser of allSubscribeUserList) {
                let res = await crawler(subscribeUser);
                res.forEach(res => allPosts.push(res));
            }
            return allPosts;

        })
        // 篩選所有貼文列表取得新貼文列表
        .then(async allPosts => {
            let postIdList = [];
            allPosts.forEach(post => postIdList.push(post.id));
            let filter = { id: { $in: postIdList } }
            let inPosts = await db.findPostByFilter(filter);
            let inPostIdList = [];
            inPosts.forEach(post => inPostIdList.push(post.id));
            let newPosts = [];
            allPosts.forEach(post => {
                if (inPostIdList.indexOf(post.id) === -1) newPosts.push(post);
            });
            return newPosts;
        })
        // 將新貼文推撥至各頻道並保存至DB
        .then(async newPosts => {
            console.log(`newPosts number : ${newPosts.length}`);

            // 推撥至各頻道
            var filter = { 'enable': true, 'deleted': false, };
            db.getAllSubscribeChannelInfoByFilter(filter).then(res => {
                let findResultList = res.findResult;
                findResultList.forEach(findResult => {
                    let subscribeUserList = findResult.subscribes;
                    let subscribeChannel = new Discord.TextChannel(
                        new Discord.Guild(client, { id: findResult.guild.id }),
                        { id: findResult.channel.id },
                    );
                    newPosts.forEach(post => {
                        if (subscribeUserList.indexOf(post.owner.username) !== -1) {
                            subscribeChannel.send(`${post.owner.username} 於 ${utils.timeConverter(post.postTimestamp)} 發布了新貼文\n(${post.url})`);
                        }
                    })
                })
            })

            // 保存至DB
            if (newPosts.length === 0) return;
            let insertResult = await db.insertPostRecord(newPosts);
            console.log(insertResult);

        });
}

setInterval(crawlerIg, timerDelay);
client.login(process.env.DISCORD_BOT_TOKEN);
