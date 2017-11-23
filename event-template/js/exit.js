window.bioEp = {
	// Private variables
	bgEl: {},
	popupEl: {},
	closeBtnEl: {},
	shown: false,
	overflowDefault: "visible",
	transformDefault: "",

	// Popup options
	width: 400,
	height: 220,
	html: "",
	css: "",
	fonts: [],
	delay: 5,
	showOnDelay: false,
	cookieExp: 30,
	showOncePerSession: false,
	onPopup: null,

	// Object for handling cookies, taken from QuirksMode
	// http://www.quirksmode.org/js/cookies.html
	cookieManager: {
		// Create a cookie
		create: function(name, value, days, sessionOnly) {
			var expires = "";

			if(sessionOnly)
				expires = "; expires=0"
			else if(days) {
				var date = new Date();
				date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
				expires = "; expires=" + date.toGMTString();
			}

			document.cookie = name + "=" + value + expires + "; path=/";
		},

		// Get the value of a cookie
		get: function(name) {
			var nameEQ = name + "=";
			var ca = document.cookie.split(";");

			for(var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == " ") c = c.substring(1, c.length);
				if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
			}

			return null;
		},

		// Delete a cookie
		erase: function(name) {
			this.create(name, "", -1);
		}
	},

	// Handle the bioep_shown cookie
	// If present and true, return true
	// If not present or false, create and return false
	checkCookie: function() {
		// Handle cookie reset
		if(this.cookieExp <= 0) {
			// Handle showing pop up once per browser session.
			if(this.showOncePerSession && this.cookieManager.get("bioep_shown_session") == "true")
				return true;

			this.cookieManager.erase("bioep_shown");
			return false;
		}

		// If cookie is set to true
		if(this.cookieManager.get("bioep_shown") == "true")
			return true;

		return false;
	},

	// Show the popup
	showPopup: function() {
		if(this.shown) return;

		this.show();

		// Handle scaling
		this.scalePopup();


		this.shown = true;

		this.cookieManager.create("bioep_shown", "true", this.cookieExp, false);
		this.cookieManager.create("bioep_shown_session", "true", 0, true);
	},


	hidePopup: function() {},
	scalePopup: function() {},

	// Event listener initialisation for all browsers
	addEvent: function (obj, event, callback) {
		if(obj.addEventListener)
			obj.addEventListener(event, callback, false);
		else if(obj.attachEvent)
			obj.attachEvent("on" + event, callback);
	},

	// Load event listeners for the popup
	loadEvents: function() {
		// Track mouseout event on document
		this.addEvent(document, "mouseout", function(e) {
			e = e ? e : window.event;

			// If this is an autocomplete element.
			if(e.target.tagName.toLowerCase() == "input")
				return;

			// Get the current viewport width.
			var vpWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

			// If the current mouse X position is within 50px of the right edge
			// of the viewport, return.
			if(e.clientX >= (vpWidth - 50))
				return;

			// If the current mouse Y position is not within 50px of the top
			// edge of the viewport, return.
			if(e.clientY >= 50)
				return;

			// Reliable, works on mouse exiting window and
			// user switching active program
			var from = e.relatedTarget || e.toElement;
			if(!from)
				bioEp.showPopup();
		}.bind(this));

		// Handle the popup close button
		this.addEvent(this.closeBtnEl, "click", function() {
			bioEp.hidePopup();
		});

		// Handle window resizing
		this.addEvent(window, "resize", function() {
			bioEp.scalePopup();
		});
	},

	// Set user defined options for the popup
	setOptions: function(opts) {
		this.width = (typeof opts.width === 'undefined') ? this.width : opts.width;
		this.height = (typeof opts.height === 'undefined') ? this.height : opts.height;
		this.html = (typeof opts.html === 'undefined') ? this.html : opts.html;
		this.css = (typeof opts.css === 'undefined') ? this.css : opts.css;
		this.fonts = (typeof opts.fonts === 'undefined') ? this.fonts : opts.fonts;
		this.delay = (typeof opts.delay === 'undefined') ? this.delay : opts.delay;
		this.showOnDelay = (typeof opts.showOnDelay === 'undefined') ? this.showOnDelay : opts.showOnDelay;
		this.cookieExp = (typeof opts.cookieExp === 'undefined') ? this.cookieExp : opts.cookieExp;
		this.showOncePerSession = (typeof opts.showOncePerSession === 'undefined') ? this.showOncePerSession : opts.showOncePerSession;
		this.onPopup = (typeof opts.onPopup === 'undefined') ? this.onPopup : opts.onPopup;
	},

	// Ensure the DOM has loaded
	domReady: function(callback) {
		(document.readyState === "interactive" || document.readyState === "complete") ? callback() : this.addEvent(document, "DOMContentLoaded", callback);
	},

	// Initialize
	init: function(opts) {
		// Handle options
		if(typeof opts !== 'undefined')
			this.setOptions(opts);

		// Add CSS here to make sure user HTML is hidden regardless of cookie

		// Once the DOM has fully loaded
		this.domReady(function() {
			// Handle the cookie
			if(bioEp.checkCookie()) return;

			// Load events
			setTimeout(function() {
				bioEp.loadEvents();

				if(bioEp.showOnDelay)
					bioEp.showPopup();
			}, bioEp.delay * 1000);
		});
	}
}
