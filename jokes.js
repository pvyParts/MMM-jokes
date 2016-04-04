/* Magic Mirror
 * Module: jokes
 *
 * Random Jokes from http://TICNDB.com
 *
 * By Aaron Kable
 * MIT Licensed.
 */

Module.register('jokes',{

	// Module config defaults.
	defaults: {
	    url: 'http://api.icndb.com/jokes/random',
		fadeSpeed: 4000,
        initialLoadDelay: 2500, // 2.5 seconds delay. This delay is used to keep the OpenWeather API happy.
		retryDelay: 2500,
		updateInterval: 60 * 1000, // every 10 minutes
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
		
		this.addJoke(this.config.url);
	},
	
    // Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
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
	addJoke: function(url) {
		this.sendSocketNotification('ADD_JOKE', {
			url: url,
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
