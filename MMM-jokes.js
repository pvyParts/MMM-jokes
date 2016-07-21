/* Magic Mirror
 * Module: jokes
 *
 * Random Jokes from http://TICNDB.com or http://tambal.azurewebsites.net/
 * based on the compliments default module
 *
 * By Aaron Kable
 * MIT Licensed.
 */

Module.register('MMM-jokes',{

    // Module config defaults.
    defaults: {
        api: 'ticndb',
        fadeSpeed: 4000,
        initialLoadDelay: 2500, // 2.5 seconds delay on load
        retryDelay: 2500,
        updateInterval: 10 * 60 * 1000, // every 10 minutes
    },

    // Define required scripts.
    getScripts: function() {
        return ['moment.js'];
    },

    // Define start sequence.
    start: function() {
        Log.info('Starting module: ' + this.name);
        this.joke = '';
        this.loaded = false;
        //this.scheduleUpdate(this.config.initialLoadDelay);
        this.updateTimer = null;

        this.addJoke(this.config.api);
    },

    // Override socket notification handler.
    socketNotificationReceived: function(notification, payload) {
        console.log(notification);
        if (notification === 'JOKE_EVENT') {
            this.joke = payload.joke;
        } else if(notification === 'FETCH_ERROR') {
            Log.error('Joke Error. Could not fetch joke: ' + payload.url);
        } else if(notification === 'INCORRECT_URL') {
            Log.error('Joke Error. Incorrect url: ' + payload.url);
        } else {
            Log.log('Joke received an unknown socket notification: '+notification);
        }

        this.updateDom(this.config.animationSpeed);
    },

    // Override dom generator.
    getDom: function() {
        var joke = document.createTextNode(this.decodeHtml(this.joke));
        var wrapper = document.createElement("div");
        wrapper.className = 'thin large bright';
        wrapper.appendChild(joke);

        return wrapper;
    },

    /* createJoke(url)
     * Requests node helper to add joke url.
     *
     * argument url sting - Url to add.
     */
    addJoke: function(api) {
        this.sendSocketNotification('ADD_JOKE', {
            api: api,
            fetchInterval: this.config.updateInterval
        });
    },

    // escape a string for display in html
    // see also:
    // polyfill for String.prototype.codePointAt
    //   https://raw.githubusercontent.com/mathiasbynens/String.prototype.codePointAt/master/codepointat.js
    // how to convert characters to html entities
    //     http://stackoverflow.com/a/1354491/347508
    // html overrides from
    //   https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides / http://stackoverflow.com/questions/1354064/how-to-convert-characters-to-html-entities-using-plain-javascript/23831239#comment36668052_1354098
    decodeHtml: function(html){
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }
});
