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
    return txt
	.replace(/(\W)\*\*(\w.*?\S)\*\*(\W)/g,
		 function(m,m1,m2,m3){
		     return m1+'<em class="bold">'+m2+'</em>'+m3;})
	.replace(/(\W)\*(\w.*?\S)\*(\W)/g,
		 function(m,m1,m2,m3){
		     return m1+'<em class="hilite">'+m2+'</em>'+m3;});
}


var displayStyleSheet = {
    blackOnWhite: "body {padding:1em; margin:0; white-space:pre-wrap} em.hilite {font-style:normal; background:yellow} em.bold {font-style:normal; color:red}",
    whiteOnBlack: "body {color:white; background-color:black; padding:1em; margin:0; white-space:pre-wrap} em.hilite {font-style: normal; color:yellow} em.bold {font-style:normal;color:lightcoral}"
};

var app = new Vue({
    el: "#presenter",
    data: {
	list: ['one','two','three'],
	historyItemZoom: .15,
	history: [
	    {id: 0, html: 'one', colors: 'blackOnWhite',
	     fontSize: 1, padding: 10},
	    {id: 1, html: 'two', colors: 'whiteOnBlack',
	     fontSize: 1, padding: 10}],
	nextSlide: 2,
	displaying: 0,
	editing: 0,
	renderArea: {height:0, width: 0},
	displayArea: {height:0, width: 0},
	display: {height:100, width: 100,
		  scrollTop:0, scrollLeft:0, fontSize:1, window:0},
	displayArea: {height:99, width: 99},
	displayStyle: 'blackOnWhite',
	contextMenuData: {},
	clicked: 0,
	// dblclicked: false,
	clickDelay: 90,
	warning:'',
	displayWindowError: false
    },
    
    // beforeCreate: function() {
    // 	console.log('beforeCreate');
    // 	//var w = this.getDisplay();
    // },
    
    created: function() {
	console.log('created');
	var w = this.getDisplay();
    },
    
    // mounted: function() {
    // 	console.log('mounted');
    // 	// Called when application is mounted.
    // 	var w = this.getDisplay();
    // },
    
    methods: {
	displayWindow: function() {
	    console.log("displayWindow");
	    var r = this.display.window;
	    if (!r) {
		this.warning = "displayWindow: no display window";
		console.log(this.warning);
	    }
	    else if (r.closed) {
		this.warning = "displayWindow: display window is closed";
		console.log(this.warning);
	    }
	    else {
		this.displayWindowError = false;
		this.warning = '';
		return r;
	    }
	    if (this.displayWindowError) {
		this.warning += "Can't recover.";
		throw "Display window error."
	    }
	    this.displayWindowError = true;
	    console.log("displayWindow: handling error");
	    this.getDisplay();
	    return this.displayWindow;
	},


	displayWindowIsClosed: function() {
	     return !this.display.window || this.display.window.closed || !this.display.window.document.body.clientWidth || !this.display.window.document.body.clientHeight;
	},

	html: function(n) {
	    return emphasize(this.history[n].html);
	},
	
	dragHistoryZoom: function(ev) {
	    // console.log('dragHistoryZoom:', ev);
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
            console.log('open', locals)
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
	    var s = {
		id: this.nextSlide++, html: '', colors: 'blackOnWhite', fontSize: 1, padding: 10
	    };
	    if (i in this.history) {
		var d = this.history[i];
		s.html = d.html;
		s.colors = d.colors;
		s.fontSize = d.fontSize;
		s.padding = d.padding;
	    }
	    return s;
	},
	    
	insertNewSlide: function(position, duplicate) {
	    console.log("inserting at", position);
	    this.history.splice(position, 0, this.newSlide(duplicate? position: -1));
	    for (var p of ['editing', 'displaying']) {
		if (position <= this[p]) {
		    this[p] += 1;
		}
	    }
	},

	duplicateSlide: function(position) {
	    return this.insertNewSlide(position, true);
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
	    console.log('removing slide '+position);
	    console.log(this.history.length);
	    this.history.splice(position, 1);
	    console.log(this.history.length);

	},

	confirm: function(msg) {
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
	onUpdate: function (event) {
	    this.list.splice(event.newIndex, 0,
				this.list.splice(event.oldIndex, 1)[0]);
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
	    var w = this.displayWindow();
	    if (!w) {
		console.log("historyItemStyle: Error: couldn't get display");
		return {};
	    }
	    return merge(this.colors(n), {
		// outline: "red solid 2px",
		// overflow: "hidden",
		// zoom: this.historyItemZoom,
		transform: "scale("+this.historyItemZoom+")",
		transformOrigin: "top left",
		// fontSize: "1em",
		// textSizeAdjust: "auto",
		// fontSizeAdjust: "auto",
		width: w.document.body.clientWidth +'px',
		height: w.document.body.clientHeight +'px'
	    });
	},
	renderAreaScale: function() {
	    var w = this.displayWindow();
	    if (!w) {
		console.log("renderAreaScale: Error: couldn't get display");
		return -1;
	    }
	    return this.renderArea.width / w.document.body.clientWidth;
	},
	renderAreaWrapperStyle: function(n){
	    // set the size, but not the zoom level
	    var w = this.displayWindow();
	    if (!w) {
		console.log("renderAreaWrapperStyle: Error: couldn't get display");
		return {};
	    }
	    var s = this.renderAreaScale();
	    if (s < 0) {
		console.log("renderAreaWrapperStyle: Error: couldn't get scale");
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
	    var w = this.displayWindow();
	    if (!w) {
		console.log("renderAreaStyle: Error: couldn't get display");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "gray solid 1px",
		overflow: "hidden",
		// zoom: this.historyItemZoom,
		transform: "scale("+this.renderAreaScale()+")",
		transformOrigin: "top left",
		fontSize: "1em",
		textSizeAdjust: "auto",
		fontSizeAdjust: "auto",
		width: w.document.body.clientWidth +'px',
		height: w.document.body.clientHeight +'px'
	    });
	},
	displayAreaScale: function() {
	    var w = this.displayWindow();
	    if (!w) {
		console.log("displayAreaScale: Error: couldn't get display");
		return -1;
	    }
	    return this.displayArea.width / w.document.body.clientWidth;
	},
	displayAreaWrapperStyle: function(n){
	    // set the size, but not the zoom level
	    var w = this.displayWindow();
	    if (!w) {
		console.log("displayAreaWrapperStyle: Error: couldn't get display");
		return {};
	    }
	    var s = this.displayAreaScale();
	    if (s < 0) {
		console.log("displayAreaWrapperStyle: Error: couldn't get scale");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "green solid 1px",
		overflow: "hidden",
		fontSize: "1em",
		textSizeAdjust: "auto",
		fontSizeAdjust: "auto",
		width: this.displayArea.width +'px',
		height: w.document.body.clientHeight * s +'px'
	    });
	},
	displayAreaStyle: function(n){
	    // set the zoom level
	    var w = this.displayWindow();
	    if (!w) {
		console.log("displayAreaStyle: Error: couldn't get display");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "gray solid 1px",
		overflow: "hidden",
		// zoom: this.historyItemZoom,
		transform: "scale("+this.displayAreaScale()+")",
		transformOrigin: "top left",
		fontSize: "1em",
		textSizeAdjust: "auto",
		fontSizeAdjust: "auto",
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
		padding: slide.padding+'px',
		margin: 0,
		whiteSpace: 'pre-wrap',
		fontSize: slide.fontSize+'em'
	    });
	},

	updateDisplayArea: function() {
	    this.displayArea.width = $("#displayArea").width();
	    this.displayArea.height = $("#displayArea").height();
	},
	
	getDisplay: function() {
	    console.log("getDisplay");
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
		me.updateDisplayScroll();
		me.setDisplayWindowListeners();
		me.setDisplay()
	    }, 500);
	    
	    return this.display.window;
	},

	setDisplayWindowListeners: function() {
	    var me = this;
	    var w = this.displayWindow();
	    console.log("setDisplayWindowListeners");
	    try {
		if (!w) {
		    console.error('getDisplay: Error trying to set callbacks on null displayWindow, bailing out');
		    return;
		}
		w.onresize = function() {
		    console.log('onresize callback');
		    return me.updateDisplayDimensions();
		};
		w.document.onscroll = function() {
		    console.log('onscroll callback');
		    me.updateDisplayScroll();
		};
		w.onclose = function() {
		    console.log('onclose callback');
		    me.display.window = 0;
		};
	    }
	    catch(error) {
		console.error('getDisplay: Error setting callbacks on display window:', error);
	    }
	},

	updateDisplayDimensions: function() {
	    console.log('updateDisplayDimensions');
	    var w = this.displayWindow();
	    if (!w) {
		this.warning = 'updateDisplayDimensions: Error: window is null';
		console.log(this.warning);
	    }
	    this.display.width = w.document.body.clientWidth;
	    this.display.height = w.document.body.clientHeight;
	    if (!this.display.width || !this.display.height) {
		this.warning = "Display has bad dimensions: width = " + this.display.width + ", height = " + this.display.height;
		console.log(this.warning);
	    }
	    return false; // stopPropogation
	},
	
	updateDisplayScroll: function() {
	    console.log('updateDisplayScroll');
	    var w = this.displayWindow();
	    if (!w) {
		console.log('updateDisplayScroll: Error: window is null');
	    }
	    this.display.scrollTop = w.document.body.scrollTop;
	    this.display.scrollLeft = w.document.body.scrollLeft;
	    return false;
	},

	setDisplay: function() {
	    console.log("setDisplay");
	    var s = this.displayingSlide;
	    var w = this.displayWindow();
	    if (!w) {
		console.log('displayingSlide: Error: no display');
		return;
	    }
	    w.document.body.innerHTML =
		"<style> @import 'styles.css' </style>" + s.html;

	    for (var p in s.style) {
		w.document.body.style[p] = s.style[p];
	    }

	    w.document.body.className = this.className(this.displaying);
	}
	
    },
    watch: {
	displayingSlide: function() {
	    // console.log('displayingSlide has changed, setting display');
	    this.setDisplay();
	},

	// displayWindow: function() {
	//     console.log('watching displayWindow');
	//     if (!this.displayWindow || this.displayWindow.closed) {
	// 	console.log('watching displayWindow: can not open display');
	// 	throw 'watching displayWindow: can not open display';
	// 	this.getDisplay();
	// 	this.setDisplay();
	//     }
	// },

	displayWindowIsClosed: function() {
	    console.log('watching displayWindowIsClosed');
	    if (this.displayWindowIsClosed) {
		this.warning = 'watching displayWindowIsClosed: closed display';
		console.log(this.warning);
		// this.getDisplay();
		// this.setDisplay();
	    }
	},
	
    },
    
    computed: {
	editingSlide: function() {
	    var s = this.history[this.editing];
	    return {
		id: s.id, html: emphasize(s.html), colors: s.colors,
		fontSize: s.fontSize, padding: s.padding,
		style: this.slideStyle(this.editing),
		className: this.className(this.editing)
	    };
	},

	displayingSlide: function() {
	    var s = this.history[this.displaying];
	    return {id: s.id, html: emphasize(s.html), colors: s.colors,
		    fontSize: s.fontSize, padding: s.padding,
		    style: this.slideStyle(this.displaying),
		    className: this.className(this.displaying)
		   };
	},
	
	previewDocument: function(){
	    var frameRef = document.getElementById('preview');
	    return frameRef.contentWindow ?
		frameRef.contentWindow.document : frameRef.contentDocument;
	},
	
	displayStyleSheet: function() {
	    return '<style>'+displayStyleSheet[this.displayStyle]+
		'body{font-size:'+this.display.fontSize+'em}'+
		'</style>';
	},
	
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
	    console.log(id+' not in app');
	}
	
    }
});
areaRO.observe(document.querySelector('#displayArea'));
areaRO.observe(document.querySelector('#renderArea'));

    
// function sizePreview(){
//     var previewScale = document.getElementById('previewScale').value;
//     document.getElementById('previewScaleText').innerText = previewScale+'%';
//     if (display && display.innerWidth) {
// 	var preview = document.getElementById('preview');
// 	preview.style.height = display.innerHeight * previewScale/100.0;
// 	preview.style.width = display.innerWidth * previewScale/100.0;
// 	var previewDocument = getPreviewDocument();
// 	previewDocument.body.style.zoom = previewScale/100.0;
// 	// previewDocument.body.style.transform = 'scale('+previewScale/100.0+')';
// 	// previewDocument.body.style.transformOrigin = '0 0';
// 	// previewDocument.body.style.margin = '0';
// 	// previewDocument.body.style.padding = '1em';
//     }
// }
// function runInDisplay(action) {
//     // console.log('runInDisplay');
//     if (!display) {
// 	// console.log('no display');
// 	// try to open an existing window and kill it
// 	// If an existing window exists, then the onload event won't fire.
// 	display = window.open('', 'display');
// 	if (display) { display.close();	}
// 	display = window.open('display.html', 'display');
// 	display.onload = function(){
// 	    // console.log('onload');
// 	    action(display);
// 	};
//     }
//     else if (display.closed) {
// 	// console.log('closed display');
// 	display = window.open('display.html', 'display');
// 	display.onload = function(){ action(display); };
//     }
//     else {
// 	// console.log('already opened display', display, display.document, display.document.readyState);
// 	action(display);
//     }
//     display.onresize=sizePreview;
// }

// function $(id){return document.getElementById(id);}
// function loadFile() {
//     // https://stackoverflow.com/a/33641308/268040
//     // https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
//     var file = document.getElementById("myFile").files[0];
//     var reader = new FileReader();
//     reader.onload = function (e) {
// 	var textArea = document.getElementById("content");
// 	textArea.value = e.target.result;
//     };
//     reader.readAsText(file);
// }

// function getPreviewDocument() {
//     var frameRef = document.getElementById('preview');
//     var d = frameRef.contentWindow
//         ? frameRef.contentWindow.document
//         : frameRef.contentDocument
//     return d;
// }
// function updatePreview(){
//     var d = getPreviewDocument();
//     d.body.innerHTML = myhtml();
// }

// function setDisplay() {
//     runInDisplay(function (d) {
// 	d.document.body.innerHTML = myhtml();
//     });
// }

// function updateDisplay(){
//     updatePreview();
//     setDisplay();
// }
    
// function updateFontSize(s){
//     var size = $('fontSize').innerText = s+'em';
//     runInDisplay(function(d) {
// 	var b = d.document.body;
// 	b.style.fontSize = size;
//     });
//     getPreviewDocument().body.style.fontSize = size;
// }
// function maximize() {
//     runInDisplay(function(d) {
// 	var b = d.document.body;
// 	for (var h = 1; h < 100; h++) {
// 	    b.style.fontSize = h+"em"
// 	    if (b.scrollHeight > b.clientHeight) {
// 		h--;
// 		b.style.textSize = h+"em"
// 		break
// 	    }
// 	}
//     });
// }

