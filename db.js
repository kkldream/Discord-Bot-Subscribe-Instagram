const { MongoClient } = require('mongodb');
const { mongodb_url } = require('./token.json');

async function execute(colName, func) {
    const client = await MongoClient.connect(mongodb_url);
    const col = client.db('discord_bot').collection(colName);
    const result = await func(col);
    await client.close();
    return result;
};

module.exports = {

    // [初始化/更新]頻道
    addSubscribeChannel: (msg) => {
        return execute('subscribes', async col => {
            let updateResult = await col.updateOne({
                'channel.id': msg.channel.id,
                'guild.id': msg.channel.guild.id,
                'deleted': false
            }, {
                $set: {
                    'channel.name': msg.channel.name,
                    'guild.name': msg.channel.guild.name,
                    refreshTimestamps: new Date(msg.createdTimestamp),
                }
            });
            let insertResult;
            if (updateResult.matchedCount == 0) {
                insertResult = await col.insertOne({
                    channel: {
                        id: msg.channel.id,
                        name: msg.channel.name,
                    },
                    guild: {
                        id: msg.channel.guild.id,
                        name: msg.channel.guild.name,
                    },
                    subscribes: [],
                    createdTimestamps: new Date(msg.createdTimestamp),
                    refreshTimestamps: new Date(msg.createdTimestamp),
                    enable: false,
                    deleted: false,
                });
            }
            return { updateResult, insertResult };
        });
    },

    // 增加指定訂閱者
    addSubscribeUser: (msg, username) => {
        return execute('subscribes', async col => {
            var filter = {
                'channel.id': msg.channel.id,
                'guild.id': msg.channel.guild.id,
                'deleted': false
            };
            let findResult = await col.findOne(filter);
            let updateResult;
            if (!findResult) return { findResult, updateResult };
            if (findResult.subscribes.indexOf(username) === -1) {
                updateResult = await col.updateMany({ _id: findResult._id }, { $push: { subscribes: username } });
            }
            return { findResult, updateResult };
        });
    },

    // 刪除指定訂閱者
    delSubscribeUser: (msg, username) => {
        return execute('subscribes', async col => {
            var filter = {
                'channel.id': msg.channel.id,
                'guild.id': msg.channel.guild.id,
                'deleted': false
            };
            let findResult = await col.findOne(filter);
            let updateResult;
            if (!findResult) return { findResult, updateResult };
            updateResult = await col.updateMany({ _id: findResult._id }, { $pull: { subscribes: username } });
            return { findResult, updateResult };
        });
    },

    // 刪除所有訂閱者
    delAllSubscribeUser: (msg) => {
        return execute('subscribes', async col => {
            var filter = {
                'channel.id': msg.channel.id,
                'guild.id': msg.channel.guild.id,
                'deleted': false
            };
            let findResult = await col.findOne(filter);
            let updateResult;
            if (!findResult) return { findResult, updateResult };
            updateResult = await col.updateMany({ _id: findResult._id }, { $set: { subscribes: [] } });
            return { findResult, updateResult };
        });
    },

    // 取得當前頻道資訊
    getSubscribeChannelInfo: (msg) => {
        return execute('subscribes', async col => {
            var filter = {
                'channel.id': msg.channel.id,
                'guild.id': msg.channel.guild.id,
                'deleted': false
            };
            let findResult = await col.findOne(filter);
            return { findResult };
        });
    },

    // [啟動/停止]頻道訂閱功能
    setSubscribeChannel: (msg, status) => {
        return execute('subscribes', async col => {
            var filter = {
                'channel.id': msg.channel.id,
                'guild.id': msg.channel.guild.id,
                'deleted': false
            };
            let findResult = await col.findOne(filter);
            let updateResult;
            if (!findResult) return { findResult, updateResult };
            updateResult = await col.updateOne({ _id: findResult._id }, { $set: { enable: status } });
            return { findResult, updateResult };
        });
    },

    // 取得所有頻道資訊
    getAllSubscribeChannelInfoByFilter: (filter) => {
        return execute('subscribes', async col => {
            let findResult = await col.find(filter).toArray();
            return { findResult };
        });
    },

    // 自訂義搜尋貼文
    findPostByFilter: (filter) => {
        return execute('posts', async col => {
            let findResult = await col.find(filter).toArray();
            return findResult
        });
    },

    // 插入貼文陣列
    insertPostRecord: (docList) => {
        return execute('posts', async col => {
            let insertResult = await col.insertMany(docList);
            return insertResult
        });
    },
}