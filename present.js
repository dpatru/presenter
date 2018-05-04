function merge(){
    var o = {};
    for (var i = 0; i < arguments.length; i++){
	for (var k in arguments[i]) {
	    o[k] = arguments[i][k];
	}
    }
    return o; 
}

Vue.component('navigation', {
    template: '<div style="outline: gray solid 1px"> Navigation Template </div>'
    // data: function() { return {}; }
});



function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
var emphPattern = /(\W)\*(\w.*\S)\*(\W)/.compile()
function emphasize(txt) {
    // console.log('emphasize:',txt);
    return txt
	.replace(/(.)\*\*(\w.*?\S)\*\*(.)/ug,
		 function(m,m1,m2,m3){
		     return m1+'<em class="bold">'+m2+'</em>'+m3;})
	.replace(/(.)\*(\w.*?\S)\*(.)/ug,
		 function(m,m1,m2,m3){
		     return m1+'<em class="hilite">'+m2+'</em>'+m3;});
}




var app = new Vue({
    el: "#presenter",
    data: {
	historyItemZoom: .15,
	history: [
	    {id: 0, html: 'one', colors: 'blackOnWhite',
	     fontSize: 1, padding: 10,
	     displayScrollLeft: 0, displayScrollTop: 0,
	     editScrollLeft: 0, editScrollTop: 0,
	    }
	],
	// search for verse breaks: verses between sentences or
	// headings, catch optional ending quotes with .?
	rein: '',
	reout: '',
	versesRE: /([\.?,]\S? |\n[\p{L} ]{3,50}\n)(\d{1,3}\s\S)/gu,
	versesREout: String.raw`$1\n\n$2`,
	versionRE: /Cornilescu 1924 - Revised 2010, 2014 \(RMNN\)/g, //|Nouă Traducere În Limba Română (NTLR)/g,
	nextSlide: 1,
	displaying: 0,
	editing: 0,
	renderArea: {height:0, width: 0},
	displayArea: {height:0, width: 0},
	display: {height:100, width: 100,
		  scrollTop:0, scrollLeft:0, fontSize:1, window:0},
	contextMenuData: {},
	clicked: 0,
	clickDelay: 90, // dblclick threshold in ms.
	warning:'',
	displayWindowError: false,
	savedHistoryProperties: ['colors', 'fontSize', 'padding', 'editScrollLeft', 'editScrollTop', 'displayScrollLeft', 'displayScrollTop', 'html'],
	savedProperties: ['historyItemZoom', 'displaying', 'editing', 'clickDelay']
    },
    
    created: function() {
	// console.log('created');
	var w = this.getDisplay();
	this.restore();
	var me = this;
    },
    
    methods: {
	testVersionRE: _.debounce(function() {
	    try {
		return this.versionRE.test(this.history[this.editing].html);
	    }
	    catch (error) {
		return false;
	    }
	}),

	// remove version string from text
	removeVersion: function() {
	    var h = this.history[this.editing];
	    var out = "\n\n";
	    return h.html = h.html.replace(this.versionRE, out);
	},

	// test if verses need to be separated
	testVerses: _.debounce(function() {
	    try {
		return this.versesRE.test(this.history[this.editing].html);
	    }
	    catch (error) {
		return false;
	    }
	}),

	// separate verses in the text
	separateVerses: function() {
	    var h = this.history[this.editing];
	    var out = eval('"'+this.versesREout+'"');
	    return h.html = h.html.replace(this.versesRE, out);
	},
	    
	    
	testre: _.debounce(function() {
	    try {
	    var re = new RegExp(this.rein, 'g');
		return re.test(this.history[this.editing].html);
	    }
	    catch (error) {
		return false;
	    }
	}, 300),

	runre: function() {
	    var re = new RegExp(this.rein, 'g');
	    var h = this.history[this.editing];
	    var out = eval('"'+this.reout+'"');
	    return h.html = h.html.replace(re, out);
	},
	    
	update: _.debounce(function (e) {
	    this.history[this.editing].html = e.target.value;
	    this.history[this.editing]
	}, 300),
	
	displayWindowIsClosed: function() {
	     return !this.display.window || this.display.window.closed || !this.display.window.document.body.clientWidth || !this.display.window.document.body.clientHeight;
	},

	html: function(n) {
	    // https://vuejs.org/v2/examples/
	    return marked(emphasize(this.history[n].html),
			  { sanitize: false});
	},
	
	dragHistoryZoom: function(ev) {
	    // console.log('dragHistoryZoom:', ev);
	    // maybe use requestAnimationFrame? see https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
	    var scaleEl = document.querySelector('#historyZoomScale');
	    var elClientX = scaleEl.getBoundingClientRect().left;
	    if (ev.type === 'mousemove' && ev.buttons === 0) {
		// console.log('dragHistoryZoom: no buttons pushed, bailing');
		return false;
	    }
	    // console.log(
	    // 	'dragoverHistoryZoom:',
	    // 	'startValue', this.historyZoomDragStartValue,
	    // 	'clientX', ev.clientX,
	    // 	'startPosition', elClientX,
	    // 	'clientWidth', scaleEl.clientWidth);
			    
	    this.historyItemZoom = (ev.clientX - elClientX) / scaleEl.clientWidth;
	    return false;
	},

	onCtxOpen: function (locals) {
            // console.log('onCtxOpen', locals)
            this.contextMenuData = locals
	},

	onCtxClose: function(locals) {
            //console.log('close', locals)
	},

	resetCtxLocals: function() {
            //this.menuData = newMenuData()
	},

	logClick: function(e,context) {
            //this.contextClicks.push(Object.assign({},this.menuData))
            //return logger('click')(context)
	},

	sayColor: function(color) {
            window.alert('left click on ' + color)
	},

	newSlide: function(i) {
	    // console.log('newSlide', i);
	    if (this.history.length < 1) {
		throw "newSlide Error: no items in history";
	    }
	    if (i < 0 || i > this.history.length) {
		throw "newSlide Error: invalid index " + i;
	    }
	    var html = i == this.history.length? '': this.history[i].html;
	    return Object.assign(
		{},
		this.history[Math.min(i, this.history.length-1)],
		{id: this.nextSlide++, html: html});
	},
	    
	insertNewSlide: function(position, duplicate, append) {
	    // Insert a new slide at position.  If duplicate flag is
	    // true, duplicate the slide that was at position. If
	    // append flag is true, insert at position+1.
	    // console.log("inserting at", position);

	    // base the new slide's style and content on the existing slide
	    var newSlide = this.newSlide(position);
 	    if (!duplicate) { // discard the content, keep styling
		newSlide.html = '';
	    }
	    if (append) {
		position += 1;
	    }
	    this.history.splice(position, 0, newSlide);
			
	    // adjust editing and displaying pointers if they moved
	    // because a new slide was inserted before them
	    for (var p of ['editing', 'displaying']) {
		if (position <= this[p]) {
		    this[p] += 1;
		}
	    }
	},

	duplicateSlide: function(position) {
	    var r = this.insertNewSlide(position, true, true);
	    if (this.editing == position) {
		this.editing += 1;
	    }
	    return r;
	},

	deleteSlide: function(position) {
	    if (this.history.length < 2) { return; }
	    for (var p of ['editing', 'displaying']) {
		if (position < this[p] ||
		    position == this[p] &&
		    position == this.history.length - 1) {
		    this[p] -= 1;
		}
	    }
	    // console.log('deleteSlide: position',position,
	    // 		', length', this.history.length);
	    this.history.splice(position, 1);
	    // console.log('deleteSlide: after length', this.history.length);

	},

	deleteAllSlides: function() {
	    this.editing = this.displaying = 0;
	    while(this.history.length > 1) this.history.pop();
	},
	
	confirm: function(msg) {
	    return true; // skip confirmation
	    return window.confirm(msg);
	},

	clickHistory: function(index) {
	    // clickHistory and dblclickHistory allow double clicking
	    // in the history area without two additional click
	    // events. We do this by waiting to handle a click event
	    // until after a double click would have arrived. If a
	    // click event is followed closely (within clickDelay
	    // milliseconds) by a double click event, then the click
	    // event is ignored.

	    // Specifically, when a click event is received, the
	    // clicked variable is incremented. If it is equal to one,
	    // then we may have a single click. We set a timeout to
	    // find out. If by the time the timeout fires, the clicked
	    // variable is still equal to one, we handle a single
	    // click event. In any case, we reset the clicked variable
	    // in the timeout.

	    // see https://stackoverflow.com/a/41309853/268040

	    // console.log('clickHistory:',
	    // 		'editing =', this.editing,
	    // 		', displaying =', this.displaying);
	    this.clicked += 1;
	    // console.log("clickHistory: clicked =", this.clicked);
	    if (this.clicked == 1) {
		// possible click, set callback to find out.
		var self = this;
		setTimeout(function() {
		    // console.log('clickHistory timeout:',
		    // 		'clicked =', self.clicked,
		    // 		', index =', index);
	 	    if (self.clicked == 1) {
			self.editing = index;
		    }
		    // reset clicked
		    self.clicked = 0;
		}, self.clickDelay);
	    }
	},

	dblclickHistory: function(index) {
	    // console.log('dblclickHistory:',
	    // 		'editing =', this.editing,
	    // 		', displaying =', this.displaying,
	    // 		', reset clicked, set dblclicked, set displaying');
	    this.displaying = index;
	    return false;
	},
	    
	reorderHistory: function(onMoveEvent) {
	    // adjust editing and displaying pointers after a
	    // reordering of the history array.u
	    var i = onMoveEvent.draggedContext.index;
	    var j = onMoveEvent.draggedContext.futureIndex;
	    for (var p of ['editing','displaying']){
		console.log('checking '+p);
		if (i < this[p] && this[p] <= j) {
		    this[p] -= 1;
		}
		else if (i == this[p]) { this[p] = j; }
		else if (j <= this[p] && this[p] < i) {
		    this[p] += 1;
		}
	    }
	},

	colors: function(n){
	    if (undefined === n) return {};
	    var colors = this.history[n].colors;
	    return {
		background: colors=='blackOnWhite'? 'white':
		    colors=='whiteOnBlack'? 'black': 'purple',
		color: colors=='blackOnWhite'? 'black':
		    colors=='whiteOnBlack'? 'white': 'yellow'
	    };
	},

	historyItemWrapperStyle: function(n){
	    // set the size, but not the zoom level
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "gray solid 1px",
		borderBottom: (this.displaying==n? '#afa': '#aaa') + ' solid .3em',
		borderTop: (this.editing==n? '#faa': '#aaa') + ' solid .3em',
		// outline: "green solid 1px",
		overflow: "hidden",
		fontSize: "1em",
		textSizeAdjust: "auto",
		fontSizeAdjust: "auto",
		width: this.display.width * this.historyItemZoom +'px',
		height: this.display.height * this.historyItemZoom +'px',
		cursor: 'pointer',
		marginRight: this.historyItemZoom * 4 +'em'
	    });
	},
	historyFooterStyle: function() {
	    return {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: '100%',
		fontSize: Math.min(this.display.width, this.display.height) * 0.40 * this.historyItemZoom + 'px'
	    };
	},
	
	historyItemStyle: function(n){
	    // set the zoom level
	    var w = this.display.window;
	    if (!w) {
		console.error("historyItemStyle: Error: couldn't get display");
		return {};
	    }
	    return merge(this.colors(n), {
		// outline: "red solid 2px",
		overflow: "auto",
		// zoom: this.historyItemZoom,
		transform: "scale("+this.historyItemZoom+")",
		transformOrigin: "left top",
		// fontSize: "1em",
		// textSizeAdjust: "auto",
		// fontSizeAdjust: "auto",
		width: w.document.body.clientWidth +'px',
		height: w.document.body.clientHeight +'px'
	    });
	},
	renderAreaScale: function() {
	    var w = this.display.window;
	    if (!w) {
		console.error("renderAreaScale: Error: couldn't get display");
		return -1;
	    }
	    return this.renderArea.width / w.document.body.clientWidth;
	},
	renderAreaWrapperStyle: function(n){
	    // set the size, but not the zoom level
	    var w = this.display.window;
	    if (!w) {
		console.error("renderAreaWrapperStyle: Error: couldn't get display");
		return {};
	    }
	    var s = this.renderAreaScale();
	    if (s < 0) {
		console.error("renderAreaWrapperStyle: Error: couldn't get scale");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "green solid 1px",
		overflow: "hidden",
		fontSize: "1em",
		textSizeAdjust: "auto",
		fontSizeAdjust: "auto",
		width: this.renderArea.width +'px',
		height: w.document.body.clientHeight * s +'px'
	    });
	},
	renderAreaStyle: function(n){
	    // set the zoom level
	    var w = this.display.window;
	    if (!w) {
		console.error("renderAreaStyle: Error: couldn't get display");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "gray solid 1px",
		overflow: "auto",
		// zoom: this.historyItemZoom,
		transform: "scale("+this.renderAreaScale()+")",
		transformOrigin: "left top",
		fontSize: "1em",
		textSizeAdjust: "auto",
		fontSizeAdjust: "auto",
		width: w.document.body.clientWidth +'px',
		height: w.document.body.clientHeight +'px'
	    });
	},
	displayAreaScale: function() {
	    var w = this.display.window;
	    if (!w) {
		console.error("displayAreaScale: Error: couldn't get display");
		return -1;
	    }
	    return this.displayArea.width / w.document.body.clientWidth;
	},
	displayAreaWrapperStyle: function(n){
	    // set the size, but not the zoom level
	    var w = this.display.window;
	    if (!w) {
		console.error("displayAreaWrapperStyle: Error: couldn't get display");
		return {};
	    }
	    var s = this.displayAreaScale();
	    if (s < 0) {
		console.error("displayAreaWrapperStyle: Error: couldn't get scale");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "green solid 1px",
		overflow: "hidden",
		fontSize: "1em",
		textSizeAdjust: "auto",
		fontSizeAdjust: "auto",
		boxSizing: 'borderBox',
		width: this.displayArea.width +'px',
		height: w.document.body.clientHeight * s +'px'
	    });
	},
	displayAreaStyle: function(n){
	    // set the zoom level
	    var w = this.display.window;
	    if (!w) {
		console.error("displayAreaStyle: Error: couldn't get display");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "gray solid 1px",
		overflow: "auto",
		// zoom: this.historyItemZoom,
		transform: "scale("+this.displayAreaScale()+")",
		transformOrigin: "left top",
		fontSize: "1em",
		textSizeAdjust: "auto",
		fontSizeAdjust: "auto",
		boxSizing: 'borderBox',
		width: w.document.body.clientWidth +'px',
		height: w.document.body.clientHeight +'px'
	    });
	},
	className: function(n) {
	    return this.history[n].colors;
	},
	
	slideStyle: function(n) {
	    var slide = this.history[n];
	    return merge(this.colors(n), {
		overflow: 'auto',
		padding: slide.padding+'px',
		margin: 0,
		// whiteSpace: 'pre-wrap',
		fontSize: slide.fontSize+'em'
	    });
	},

	// updateDisplayArea: function() {
	//     this.displayArea.width = $("#displayArea").width();
	//     this.displayArea.height = $("#displayArea").height();
	// },
	
	getDisplay: function() {
	    // console.log("getDisplay");
	    if (!this.display.window || this.display.window.closed) {
		this.display.window = 0;
		var name = 'display', i=0;
		while (window.name == name+i) i++;
		this.display.window =
		    window.open('display.html', name+i);
	    }
	    var w = this.display.window;
	    if (!w) {
		console.error('getDisplay: null display.window, bailing out');
		throw 'getDisplay: null display.window, bailing out';
		return;
	    }
	    var me = this;
	    setTimeout(function() {
	    	me.updateDisplayDimensions();
	    	// me.updateDisplayScrollFromDisplayWindow();
	    	me.setDisplayWindowListeners();
	    	me.setDisplay()
	    }, 500);
	    
	    return this.display.window;
	},

	setDisplayWindowListeners: function() {
	    var me = this;
	    var w = this.display.window;
	    // console.log("setDisplayWindowListeners");
	    try {
		if (!w) {
		    console.error('getDisplay: Error trying to set callbacks on null display window, bailing out');
		    return;
		}
		w.onresize = function() {
		    // console.log('onresize callback');
		    return me.updateDisplayDimensions();
		};
		w.document.onscroll = function(e) {
		    // console.log('onscroll callback', w.document.body.scrollTop);
		    var h = me.history[me.displaying];
		    h.displayScrollTop = w.document.body.scrollTop;
		    h.displayScrollLeft = w.document.body.scrollLeft;
		    // me.updateDisplayScroll();
		};
		w.onclose = function() {
		    // console.log('onclose callback');
		    me.display.window = 0;
		};
	    }
	    catch(error) {
		console.error('getDisplay: Error setting callbacks on display window:', error);
	    }
	},

	updateDisplayDimensions: function() {
	    // console.log('updateDisplayDimensions');
	    var w = this.display.window;
	    if (!w) {
		this.warning = 'updateDisplayDimensions: Error: window is null';
		console.error(this.warning);
	    }
	    this.display.width = w.document.body.clientWidth;
	    this.display.height = w.document.body.clientHeight;
	    if (!this.display.width || !this.display.height) {
		this.warning = "Display has bad dimensions: width = " + this.display.width + ", height = " + this.display.height;
		console.error(this.warning);
	    }
	    return false; // stopPropogation
	},

	updateDisplayScrollFromDisplayWindow: function() {
	    // console.log('updateDisplayScrollFromDisplayWindow');
	    var w = this.display.window;
	    if (!w) {
		console.error('updateDisplayScrollFromDisplayWindow: Error: window is null');
	    }
	    var h = this.history[this.displaying];
	    h.displayScrollTop = w.document.body.scrollTop;
	    h.displayScrollLeft = w.document.body.scrollLeft;
	    return false;
	},

	setDisplayScrollFromDisplayArea: function(index, id) {
	    // console.log('setDisplayScroll');
	    var h = this.history[index];
	    var el = document.getElementById(id);
	    h.displayScrollLeft = el.scrollLeft;
	    h.displayScrollTop = el.scrollTop;
	    return;
	},

	setEditScrollFromRenderArea: function() {
	    // console.log('setEditScroll');
	    var h = this.history[this.editing];
	    var d = document.getElementById('renderAreaDivDiv');
	    h.editScrollTop = d.scrollTop;
	    h.editScrollLeft = d.scrollLeft;
	    this.save('history.'+this.editing+'.editScrollLeft',
		      d.scrollLeft);
	    this.save('history.'+this.editing+'.editScrollTop',
		      d.scrollTop);
	},

	setDisplay: function() {
	    // console.log("setDisplay");
	    var s = this.displayingSlide;
	    var w = this.display.window;
	    if (!w) {
		console.error('setDisplay: Error: no display');
		return;
	    }
	    w.document.body.innerHTML =
		"<style> @import 'styles.css' </style>" +
		this.html(this.displaying);

	    for (var p in s.style) {
		w.document.body.style[p] = s.style[p];
	    }

	    w.document.body.className = this.className(this.displaying);

	    w.document.body.scrollTop = s.displayScrollTop;
	    w.document.body.scrollLeft = s.displayScrollLeft;
	    // document.getElementById('displayAreaDivDiv').scrollTop = w.document.body
	},

	numberOfSavedSlides: function() {
	    return window.localStorage.historyLength || 0;
	},
	
	save: function(prop, val) {
	    // console.log('save', prop, val);
	    if (prop) { // just save a specific property
		localStorage[prop] = val;
		return;
	    }
	    var h = this.history;
	    localStorage.historyLength = h.length;
 	    for (var i = 0; i < h.length; i++) {
		for (let p of this.savedHistoryProperties) {
		    localStorage['history.'+i+'.'+p] = h[i][p];
		}
	    }
	    for (let p in this.savedProperties) {
		localStorage[p] = this[p];
	    }
	},

	restore: function() {
	    // console.log("restore");
	    if (!localStorage.historyLength) {
		// console.log("restore: no history");
		return false;
	    }
	    var h = this.history;
 	    for (var i = 0; i < localStorage.historyLength; i++) {
		let o = {};
		for (let p of this.savedHistoryProperties) {
		    o[p] = localStorage['history.'+i+'.'+p];
		}
		let o2 = Object.assign({}, this.history[0], o,
				       {id:this.nextSlide++});
		h.splice(i, 1, o2);
	    }
	    for (let p of this.savedProperties) {
		// only restore defined values
		if (localStorage[p] !== undefined && p in this) {
		    // console.log('restore:', p, localStorage[p]);
		    this[p] = localStorage[p];
		}
	    }

	    this.updateHistory();

	    // console.log('restore: done');
	    return true;
	},
	
	updateHistory: function() {
	    // Manually update this history scrolling because vuejs
	    // templates do not allow the scrollTop property to be
	    // set. This method is called after the history array has
	    // been updated (like after restoring from localStorage).
	    // Update the history in a timeout to give time for the
	    // dom contents to update.
	    var me = this;
	    window.setTimeout(function() {
		// console.log('updateHistory');
		for (var i = 0; i < me.history.length; i++) {
		    // console.log('updateHistory: i', i);
		    var h = me.history[i];
		    var el = document.getElementById('history'+i);
		    el.scrollLeft = h.displayScrollLeft;
		    el.scrollTop = h.displayScrollTop;
		}
	    }, 200);
	}
    },
    
    watch: {

	displayScrollTop: function(newVal, oldVal) {
	    // why is this needed?
	    var h = this.history[this.displaying];
	    var val = h.displayScrollTop;
	    // console.log('watch displayScrollTop: setting the scroll value on the elements to', val)
	    var els = [
		document.getElementById('history'+this.displaying),
		document.getElementById('displayAreaDivDiv'),
		this.display.window.document.body];
	    for (let el of els) {
		// console.log("watch displayScrollTop: setting to", val, el);
		el.scrollTop = val;
	    }
	    this.save('history.'+this.displaying+'.displayScrollTop',
		      h.scrollTop);
	},
		
	displayScrollLeft: function(newVal, oldVal) {
	    // console.log('watch displayScrollLeft: setting the scroll value on the elements.');
	    var h = this.history[this.displaying];
	    var val = h.displayScrollLeft;
	    var els = [
		document.getElementById('history'+this.displaying),
		document.getElementById('displayAreaDivDiv'),
		this.display.window.document.body];
	    for (let el of els) {
		// console.log("displayScrollLeft: setting", val, el);
		el.scrollLeft = val;
	    }
	    this.save('history.'+this.displaying+'.displayScrollLeft',
		      h.scrollLeft);
	},
		
	editing: function() {
	    // set the correct scrolling in the editing div
	    // run in a timeout to give time to update the div contents.
	    this.save('editing', this.editing);
	    var me = this;
	    window.setTimeout(function(){
		var h = me.history[me.editing];
		var d = document.getElementById('renderAreaDivDiv');
		// console.log('watch editing: h', h, ', d', d);
		// console.log('watch editing: setting correct scroll in div, editScrollTop =', h.editScrollTop, ', renderAreaDivDiv.scrollTop', d.scrollTop);
		d.scrollTop = h.editScrollTop;
		d.scrollLeft = h.editScrollLeft;
		// console.log('watch editing: after, editScrollTop =', h.editScrollTop, ', renderAreaDivDiv.scrollTop', d.scrollTop);
	    }, 200);
	},

	displaying: function() {
	    // set the correct scrolling in the display div and the display window.
	    // run in a timeout to give time to update the div contents.
	    this.save('displaying', this.displaying);
	    var me = this;
	    window.setTimeout(function(){
		var h = me.history[me.displaying];
		// console.log('watch displaying Timeout Callback: setting scrollTop in div to', h.displayScrollTop);
		for (let d of [document.getElementById('displayAreaDivDiv'),
			       me.display.window.document.body]) {
		    d.scrollTop = h.displayScrollTop;
		    d.scrollLeft = h.displayScrollLeft;
		}},200);
	},

	editingSlide: function() {
	    // console.log('watch editingSlide');
	    for (let p of this.savedHistoryProperties) {
		this.save('history.'+this.editing+'.'+p,
			  this.history[this.editing][p]);
	    }
	},
	
	displayingSlide: function() {
	    // console.log('watch displayingSlide, setting display');
	    this.setDisplay();
	},

	displayWindowIsClosed: function() {
	    // console.log('watching displayWindowIsClosed');
	    if (this.displayWindowIsClosed) {
		this.warning = 'watching displayWindowIsClosed: closed display';
		console.warn(this.warning);
		// this.getDisplay();
		// this.setDisplay();
	    }
	},

	history: function() {
	    // console.log('watch history: length', this.history.length);
	    var me = this;
	    // allow time for updating contents, then update scroll position.
	    me.save(); // save everything when history changes.
	    me.updateHistory();
	}
	
    },
    
    computed: {
	editingSlide: function() {
	    var s = this.history[this.editing];
	    return {
		id: s.id,
		html: this.html(this.editing),
		colors: s.colors,
		fontSize: s.fontSize, padding: s.padding,
		style: this.slideStyle(this.editing),
		className: this.className(this.editing)
	    };
	},

	displayingSlide: function() {
	    var s = this.history[this.displaying];
	    return {id: s.id,
		    html: this.html(this.displaying),
		    colors: s.colors,
		    fontSize: s.fontSize, padding: s.padding,
		    style: this.slideStyle(this.displaying),
		    className: this.className(this.displaying),
		    displayScrollLeft: s.displayScrollLeft,
		    displayScrollTop: s.displayScrollTop,
		   };
	},
	
	// displayStyleSheet: function() {
	//     return '<style>'+displayStyleSheet[this.displayStyle]+
	// 	'body{font-size:'+this.display.fontSize+'em}'+
	// 	'</style>';
	// },

	displayScrollTop: function() {
	    return this.history[this.displaying].displayScrollTop;
	},

	displayScrollLeft: function() {
	    return this.history[this.displaying].displayScrollLeft;
	}

    }
});

		  
var areaRO = new ResizeObserver( function(entries) {
    // from  https://wicg.github.io/ResizeObserver/#algorithms
    for (let entry of entries) {
	// let cs = window.getComputedStyle(entry.target);
	let cs = entry.target.getBoundingClientRect();
	// console.log('watching element:', entry.target);
	// console.log(entry.contentRect.width,' is ', cs.width);
	// console.log(entry.contentRect.height,' is ', cs.height);
	//console.log(entry.contentRect.top,' is ', cs.paddingTop);
	//console.log(entry.contentRect.left,' is ', cs.paddingLeft);
	var id = entry.target.id;
	if (id && id in app) {
            app[id].width = cs.width;
	    app[id].height = cs.height;
	}
	else {
	    console.warn('ResizeObserver:', id, 'not in app');
	}
	
    }
});
areaRO.observe(document.querySelector('#displayArea'));
areaRO.observe(document.querySelector('#renderArea'));

    

