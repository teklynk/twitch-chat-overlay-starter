function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    let results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

let channel = getUrlParameter('channel').toLowerCase().trim(), // Channels to initially join
    useColor = true, // Use chatters' colors or to inherit
    showBadges = true // Show chatters' badges

setInterval(function () {
    window.scrollTo(0, chat.scrollHeight);
}, 100);

let chat = document.getElementById('chat'),
    randomColorsChosen = {},
    clientOptions = {
        options: {
            debug: true,
            skipUpdatingEmotesets: true
        },
        connection: {reconnect: true},
        channels: [channel]
    },
    client = new tmi.client(clientOptions);

function dehash(channel) {
    return channel.replace(/^#/, '');
}

function htmlEntities(html) {
    function it() {
        return html.map(function (n, i, arr) {
            if (n.length === 1) {
                return n.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
                    return '&#' + i.charCodeAt(0) + ';';
                });
            }
            return n;
        });
    }

    let isArray = Array.isArray(html);
    if (!isArray) {
        html = html.split('');
    }
    html = it(html);
    if (!isArray) html = html.join('');
    return html;
}

function formatEmotes(text, emotes) {
    let splitText = text.split('');
    for (let i in emotes) {
        let e = emotes[i];
        for (let j in e) {
            let mote = e[j];
            if (typeof mote === 'string') {
                mote = mote.split('-');
                mote = [parseInt(mote[0]), parseInt(mote[1])];
                let length = mote[1] - mote[0],
                    empty = Array.apply(null, new Array(length + 1)).map(function () {
                        return ''
                    });
                splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
                splitText.splice(mote[0], 1, '<img class="emoticon" src="https://static-cdn.jtvnw.net/emoticons/v2/' + i + '/default/dark/1.0">');
            }
        }
    }
    return htmlEntities(splitText).join('');
}

function badges(chan, user) {

    function createBadge(name) {
        let badge = document.createElement('div');
        badge.className = 'chat-badge-' + name;
        return badge;
    }

    let chatBadges = document.createElement('span');
    chatBadges.className = 'chat-badges';

    if (user.username === chan) {
        chatBadges.appendChild(createBadge('broadcaster'));
    }
    if (user['user-type']) {
        chatBadges.appendChild(createBadge(user['user-type']));
    }
    if (user.turbo) {
        chatBadges.appendChild(createBadge('turbo'));
    }

    return chatBadges;
}

function handleChat(channel, user, message, self) {

    let chan = dehash(channel),
        name = user.username,
        chatLine = document.createElement('div'),
        chatChannel = document.createElement('span'),
        chatName = document.createElement('span'),
        chatColon = document.createElement('span'),
        chatMessage = document.createElement('span');

    let color = useColor ? user.color : 'inherit';
    if (color === null) {
        if (!randomColorsChosen.hasOwnProperty(chan)) {
            randomColorsChosen[chan] = {};
        }
        if (randomColorsChosen[chan].hasOwnProperty(name)) {
            color = randomColorsChosen[chan][name];
        }
    }

    chatLine.className = 'chat-line';
    chatLine.dataset.username = name;
    chatLine.dataset.channel = channel;

    if (user['message-type'] === 'action') {
        chatLine.className += ' chat-action';
    }

    chatChannel.className = 'chat-channel';
    chatChannel.innerHTML = chan;

    chatName.className = 'chat-name';
    chatName.style.color = color;
    chatName.innerHTML = user['display-name'] || name;

    chatColon.className = 'chat-colon';

    chatMessage.className = 'chat-message';

    chatMessage.style.color = color;
    chatMessage.innerHTML = formatEmotes(message, user.emotes);

    if (client.opts.channels.length > 1) chatLine.appendChild(chatChannel);
    if (showBadges) chatLine.appendChild(badges(chan, user, self));
    chatLine.appendChild(chatName);
    chatLine.appendChild(chatColon);
    chatLine.appendChild(chatMessage);

    chat.appendChild(chatLine);

}

client.addListener('message', handleChat);

client.connect();