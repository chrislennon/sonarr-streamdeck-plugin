/* global $CC, Utils, $SD */

$SD.on('connected', (jsonObj) => connected(jsonObj));
let timerId = 0;

function connected(jsn) {
    $SD.on('com.chrislennon.sonarr.action.willAppear', (jsonObj) => action.onWillAppear(jsonObj));
    $SD.on('com.chrislennon.sonarr.action.keyDown', (jsonObj) => action.onKeyDown(jsonObj));
    $SD.on('com.chrislennon.sonarr.action.didReceiveSettings', (jsonObj) => action.onDidReceiveSettings(jsonObj));
};

async function getSonarrQueue(jsn) {
    this.settings = jsn.payload.settings;
    const response = await fetch(`${this.settings.sonarrUrl}/api/queue`, {
        headers: {
            'X-API-KEY': this.settings.apiKey
        }
    })
    return await response.json();
}

async function getQueueSize(jsn) {
    const count = await this.getSonarrQueue(jsn)
    $SD.api.setTitle(jsn.context, count.length);
}

function setupTimer(jsn) {
    if (this.timerId != 0) clearTimeout(this.timerId)
    this.timerId = setTimeout(async function () {
        await getQueueSize(jsn)
    }, 30000);
}

const action = {
    settings:{},
    onDidReceiveSettings: function(jsn) {
        this.settings = Utils.getProp(jsn, 'payload.settings', {});
        setupTimer(jsn)
    },

    onWillAppear: async function (jsn) {
        this.settings = jsn.payload.settings;

        if (!this.settings || Object.keys(this.settings).length === 0) {
            this.settings.sonarrUrl = 'http://localhost:8989'
            this.settings.queueType = 'all'
            this.settings.apiKey = ''
        }
        await getQueueSize(jsn)
        setupTimer(jsn)
    },

    onKeyDown: function (jsn) {
        console.log(`opening ${jsn.payload.settings.sonarrUrl}`);
        $SD.api.openUrl(jsn.context, `${jsn.payload.settings.sonarrUrl}/activity/queue`)
    },

};

