/* Magic Mirror
 * Node Helper: Jokes
 *
 * Aaron Kable
 * MIT Licensed.
 */

var NodeHelper = require('node_helper');
var moment = require('moment');
var request = require('request');
var validUrl = require('valid-url');

var validAPIs = ["ticndb", "tambal"];
var apiUrls = ["http://api.icndb.com/jokes/random", "http://tambal.azurewebsites.net/joke/random"];

var JokeFetcher = function(url, api, reloadInterval) {
    var self = this;

    var reloadTimer = null;
    var joke = '';

    var fetchFailedCallback = function() {};
    var eventsReceivedCallback = function() {};

    /* fetchJoke()
     * Initiates joke fetch.
     */
    var fetchJoke = function() {

        clearTimeout(reloadTimer);
        reloadTimer = null;

        //console.log('Getting data: ' + url);

        request.get(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //console.log('Getting data: '+ body);
                var data = JSON.parse(body);
                //console.log(data);
                //console.log(api);
                switch (api){
                    case "ticndb":
                        joke = data.value.joke; //TODO custom fields
                        break;
                    case "tambal":
                        joke = data.joke;
                        break;
                    case "webknox":
                        joke = data.joke;
                        break;
                }
                //console.log('got data: '+ joke);
                self.broadcastEvents();
                scheduleTimer();
            } else {
                console.error(self.name + ": Could not load Jokes.");
            }
        });


    };

    /* scheduleTimer()
     * Schedule the timer for the next update.
     */
    var scheduleTimer = function() {
        //console.log('Schedule update timer.');
        clearTimeout(reloadTimer);
        reloadTimer = setTimeout(function() {
            fetchJoke();
        }, reloadInterval);
    };

    /* public methods */

    /* startFetch()
     * Initiate startFetch();
     */
    this.startFetch = function() {
        fetchJoke();
    };

    /* broadcastItems()
     * Broadcast the exsisting events.
     */
    this.broadcastEvents = function() {
        if (joke === '') {
            //console.log('No events to broadcast yet.');
            return;
        }
        //console.log('Broadcasting: ' + joke);
        eventsReceivedCallback(self);
    };

    /* onReceive(callback)
     * Sets the on success callback
     *
     * argument callback function - The on success callback.
     */
    this.onReceive = function(callback) {
        eventsReceivedCallback = callback;
    };

    /* onError(callback)
     * Sets the on error callback
     *
     * argument callback function - The on error callback.
     */
    this.onError = function(callback) {
        fetchFailedCallback = callback;
    };

    /* url()
     * Returns the url of this fetcher.
     *
     * return string - The url of this fetcher.
     */
    this.url = function() {
        return url;
    };

    /* api()
     * Returns the api of this fetcher.
     *
     * return string - The api of this fetcher.
     */
    this.api = function() {
        return api;
    };

    /* events()
     * Returns current available events for this fetcher.
     *
     * return array - The current available events for this fetcher.
     */
    this.joke = function() {
        return joke;
    };

};

module.exports = NodeHelper.create({
    // Override start method.
    start: function() {
        var self = this;
        var joke = '';
        this.fetchers = [];

        console.log('Starting node helper for: ' + this.name);
    },

    // Override socketNotificationReceived method.
    socketNotificationReceived: function(notification, payload) {
        if (notification === 'ADD_JOKE') {
            //console.log('ADD_JOKE: ');
            var apiUrl = apiUrls[0];
            var currentAPI = validAPIs[0];
            for (index = 0; index < validAPIs.length; ++index) {
                if (validAPIs[index] === payload.api){
                    console.log(validAPIs[index]);
                    apiUrl = apiUrls[index];
                    currentAPI = validAPIs[index];
                }
            }

            this.createFetcher(apiUrl, currentAPI, payload.fetchInterval);
        }
    },

    /* createFetcher(url, reloadInterval)
     * Creates a fetcher for a new url if it doesn't exsist yet.
     * Otherwise it reuses the exsisting one.
     *
     * attribute url string - URL of the news feed.
     * attribute reloadInterval number - Reload interval in milliseconds.
     */

    createFetcher: function(url, api, fetchInterval) {
        var self = this;
        //console.log('processing joke fetcher for url: ' + url + ' - Interval: ' + fetchInterval);
        if (!validUrl.isUri(url)){
            self.sendSocketNotification('INCORRECT_URL', {url:url});
            return;
        }

        var fetcher;
        //console.log('processing joke fetcher for url: ' + url + ' - Interval: ' + fetchInterval);
        if (typeof self.fetchers[url] === 'undefined') {
            console.log('Create new joke fetcher for url: ' + url + ' - Interval: ' + fetchInterval);
            fetcher = new JokeFetcher(url, api, fetchInterval);

            fetcher.onReceive(function(fetcher) {
                //console.log('Broadcast events.');
                //console.log(fetcher.events());

                self.sendSocketNotification('JOKE_EVENT', {
                    url: fetcher.url(),
                    joke: fetcher.joke()
                });
            });

            fetcher.onError(function(fetcher, error) {
                self.sendSocketNotification('FETCH_ERROR', {
                    url: fetcher.url(),
                    error: error
                });
            });

            self.fetchers[url] = fetcher;
        } else {
            //console.log('Use exsisting news fetcher for url: ' + url);
            fetcher = self.fetchers[url];
            fetcher.broadcastEvents();
        }

        fetcher.startFetch();
    }
});
