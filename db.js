const mongo = require('mongodb').MongoClient;
const { mongodb_url } = require('./token.json');

async function pushSubRecord(doc) {
    const client = await mongo.connect(mongodb_url);
    const coll = client.db('discord_bot').collection('record');
    const result = await coll.insertOne(doc);
    await client.close();
    return result;
};

async function getLastPost(filter) {
    const client = await mongo.connect(mongodb_url);
    const coll = client.db('discord_bot').collection('record');
    const sort = { 'timestamp': -1 };
    const result = await coll.findOne(filter, { sort });
    await client.close();
    return result;
}

async function addSubUser(name) {
    const client = await mongo.connect(mongodb_url);
    const coll = client.db('discord_bot').collection('subscribe');
    const find_result = await coll.findOne({ username: name });
    if (!find_result) {
        const result = await coll.insertOne({ username: name });
        await client.close();
        return result;
    }
    return false;
};

async function delSubUser(filter) {
    const client = await mongo.connect(mongodb_url);
    const coll = client.db('discord_bot').collection('subscribe');
    const result = await coll.deleteMany(filter);
    await client.close();
    return result;
};

async function findSubUser(name) {
    const client = await mongo.connect(mongodb_url);
    const coll = client.db('discord_bot').collection('subscribe');
    const result = await coll.findOne({ username: name });
    await client.close();
    return result;
};

async function getSubUserList() {
    const client = await mongo.connect(mongodb_url);
    const coll = client.db('discord_bot').collection('subscribe');
    const cursor = coll.find({});
    const result = await cursor.toArray()
    await client.close();
    return result;
};

module.exports = {
    pushSubRecord,
    getLastPost,
    addSubUser,
    delSubUser,
    findSubUser,
    getSubUserList
};

// addSubUser("test").then(res => {
//     console.log('add:');
//     console.log(res);
//     console.log();
// })

// findSubUser("test").then(res => {
//     console.log('find:');
//     console.log(res);
//     console.log();
// })

// addSubUser("test").then(res => {
//     console.log('add:');
//     console.log(res);
//     console.log();
//     getSubUserList().then(res => {
//         console.log('get:');
//         console.log(res);
//         console.log();
//         delSubUser({username: "test"}).then(res => {
//             console.log('del:');
//             console.log(res);
//             console.log();
//         })
//     })
// })