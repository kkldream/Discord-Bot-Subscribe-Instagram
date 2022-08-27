const fetch = require('cross-fetch');

async function crawlerIG(username) {
    let url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    let headers = { 'x-ig-app-id': '936619743392459' };
    let cursor = await fetch(url, { headers: headers });
    let jsondata = await cursor.json();
    let posts = jsondata.data.user.edge_owner_to_timeline_media.edges;
    var output = [];
    posts.forEach(post => {
        let id = post.node.id;
        let owner = post.node.owner;
        let shortcode = post.node.shortcode;
        let url = `https://www.instagram.com/p/${shortcode}/`;
        let timestamp = post.node.taken_at_timestamp;
        let text;
        if (post.node.edge_media_to_caption.edges[0])
            text = post.node.edge_media_to_caption.edges[0].node.text;
        output.push({
            id: id,
            owner: owner,
            shortcode: shortcode,
            url: url,
            postTimestamp: new Date(timestamp * 1000),
            text: text,
            createdTimestamps: new Date(),
        });
    });
    return output;
}

module.exports = crawlerIG;