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
    template: '<div style="outline: red solid 1px"> Navigation Template </div>'
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
	display: {height:100, width: 100, scrollTop:0, scrollLeft:0, window:0, fontSize:1},
	raw: '',
	previewZoom: 50,
	displayStyle: 'blackOnWhite',
	contextMenuData: {},
	clicked: false,
	clickDelay: 10
    },
    methods: {
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
	    console.log('clickHistory');
	    if (this.clicked) return;
	    this.clicked = true;
	    var self = this;
	    setTimeout(function() {
		console.log('clickHistory timeout', index);
		if (self.clicked) {
		    self.editing = index;
		    self.clicked = false;
		}
	    }, self.clickDelay);
	},

	dblclickHistory: function(index) {
	    console.log('dblclickHistory');
	    if (this.clicked) {
		this.clicked = false;
		this.displaying = index;
	    }
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
	    var colors = this.history[n].colors;
	    return {
		background: colors=='blackOnWhite'? 'white':
		    colors=='whiteOnBlack'? 'black': 'purple',
		color: colors=='blackOnWhite'? 'black':
		    colors=='whiteOnBlack'? 'white': 'yellow'
	    };
	},
	historyItemStyleWrapper: function(n){
	    // set the size, but not the zoom level
	    var w = this.getDisplay();
	    if (!w) {
		console.log("historyItemStyle: ERROR: couldn't get display");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "red solid 1px",
		borderBottom: (this.displaying==n? 'green': 'white') + ' solid .3em',
		borderTop: (this.editing==n? 'red': 'white') + ' solid .3em',
		// outline: "green solid 1px",
		overflow: "hidden",
		fontSize: "1em",
		'text-size-adjust': "auto",
		'font-size-adjust': "auto",
		'textSizeAdjust': "auto",
		'fontSizeAdjust': "auto",
		'-webkit-text-size-adjust': "auto",
		width: w.document.body.clientWidth * this.historyItemZoom +'px',
		height: w.document.body.clientHeight * this.historyItemZoom +'px',
		marginRight: this.historyItemZoom * 4 +'em'
	    });
	},
	historyItemStyle: function(n){
	    // set the zoom level
	    var w = this.getDisplay();
	    if (!w) {
		console.log("historyItemStyle: ERROR: couldn't get display");
		return {};
	    }
	    return merge(this.colors(n), {
		// outline: "red solid 2px",
		// overflow: "hidden",
		// zoom: this.historyItemZoom,
		transform: "scale("+this.historyItemZoom+")",
		transformOrigin: "top left",
		// fontSize: "1em",
		// 'text-size-adjust': "auto",
		// 'font-size-adjust': "auto",
		// 'textSizeAdjust': "auto",
		// 'fontSizeAdjust': "auto",
		// '-webkit-text-size-adjust': "auto",
		width: w.document.body.clientWidth +'px',
		height: w.document.body.clientHeight +'px'
	    });
	},
	renderAreaScale: function() {
	    var w = this.getDisplay();
	    if (!w) {
		console.log("renderAreaScale: ERROR: couldn't get display");
		return -1;
	    }
	    return this.renderArea.width / w.document.body.clientWidth;
	},
	renderAreaStyleWrapper: function(n){
	    // set the size, but not the zoom level
	    var w = this.getDisplay();
	    if (!w) {
		console.log("renderAreaStyleWrapper: ERROR: couldn't get display");
		return {};
	    }
	    var s = this.renderAreaScale();
	    if (s < 0) {
		console.log("renderAreaStyleWrapper: ERROR: couldn't get scale");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "green solid 1px",
		overflow: "hidden",
		fontSize: "1em",
		'text-size-adjust': "auto",
		'font-size-adjust': "auto",
		'textSizeAdjust': "auto",
		'fontSizeAdjust': "auto",
		'-webkit-text-size-adjust': "auto",
		width: this.renderArea.width +'px',
		height: w.document.body.clientHeight * s +'px'
	    });
	},
	renderAreaStyle: function(n){
	    // set the zoom level
	    var w = this.getDisplay();
	    if (!w) {
		console.log("renderAreaStyle: ERROR: couldn't get display");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "red solid 1px",
		overflow: "hidden",
		// zoom: this.historyItemZoom,
		transform: "scale("+this.renderAreaScale+")",
		transformOrigin: "top left",
		fontSize: "1em",
		'text-size-adjust': "auto",
		'font-size-adjust': "auto",
		'textSizeAdjust': "auto",
		'fontSizeAdjust': "auto",
		'-webkit-text-size-adjust': "auto",
		width: w.document.body.clientWidth +'px',
		height: w.document.body.clientHeight +'px'
	    });
	},
	displayAreaScale: function() {
	    var w = this.getDisplay();
	    if (!w) {
		console.log("displayAreaScale: ERROR: couldn't get display");
		return -1;
	    }
	    return this.displayArea.width / w.document.body.clientWidth;
	},
	displayAreaStyleWrapper: function(n){
	    // set the size, but not the zoom level
	    var w = this.getDisplay();
	    if (!w) {
		console.log("displayAreaStyleWrapper: ERROR: couldn't get display");
		return {};
	    }
	    var s = this.displayAreaScale();
	    if (s < 0) {
		console.log("displayAreaStyleWrapper: ERROR: couldn't get scale");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "green solid 1px",
		overflow: "hidden",
		fontSize: "1em",
		'text-size-adjust': "auto",
		'font-size-adjust': "auto",
		'textSizeAdjust': "auto",
		'fontSizeAdjust': "auto",
		'-webkit-text-size-adjust': "auto",
		width: this.displayArea.width +'px',
		height: w.document.body.clientHeight * s +'px'
	    });
	},
	displayAreaStyle: function(n){
	    // set the zoom level
	    var w = this.getDisplay();
	    if (!w) {
		console.log("displayAreaStyle: ERROR: couldn't get display");
		return {};
	    }
	    return merge(this.colors(n), {
		display: "inline-block",
		outline: "red solid 1px",
		overflow: "hidden",
		// zoom: this.historyItemZoom,
		transform: "scale("+this.displayAreaScale+")",
		transformOrigin: "top left",
		fontSize: "1em",
		'text-size-adjust': "auto",
		'font-size-adjust': "auto",
		'textSizeAdjust': "auto",
		'fontSizeAdjust': "auto",
		'-webkit-text-size-adjust': "auto",
		width: w.document.body.clientWidth +'px',
		height: w.document.body.clientHeight +'px'
	    });
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
	    this.display.width = $("#displayArea").width();
	    this.display.height = $("#displayArea").height();
	},
	updateDisplay: function() {
	    var w = this.getDisplay();
	    if (w) {
		w.document.body.innerHTML = this.displayInnerHTML;
		this.updateDisplaySize();
	    }
	},
	getDisplay: function() {
	    if (!this.display.window || this.display.window.closed) {
		this.display.window = window.open('display.html', 'display');
	    }
	    if (!this.display.window) {
		    console.log('null display.window');
	    }
	    else {
		var me = this;
		var w = this.display.window;
		w.onresize=function(){me.updateDisplaySize();};
		w.document.onscroll=function(){
		    me.updateDisplayScroll();
		};
		return this.display.window;
	    }
	},
	updateDisplaySize: function() {
	    var w = this.display.window;
	    if (w) {
		this.display.height = w.document.body.clientHeight;
		this.display.width = w.document.body.clientWidth;
	    }
	},
	updateDisplayScroll: function() {
	    console.log('scrolling');
	    var w = this.display.window;
	    
	    if (w) {
		this.display.scrollTop = w.document.body.scrollTop;
		this.display.scrollLeft = w.document.body.scrollLeft;
		console.log('scrollTop', w.document.body.scrollTop);
	    }
	}
	    
    },
    computed: {
	previewDocument: function(){
	    var frameRef = document.getElementById('preview');
	    return frameRef.contentWindow ?
		frameRef.contentWindow.document : frameRef.contentDocument;
	},
	previewStyle: function() {
	    var frameRef = document.getElementById('preview');
	    var d = frameRef.contentWindow ?
	    	frameRef.contentWindow.document : frameRef.contentDocument;
	    
	    // d.body.style.zoom = this.previewZoom/100.0;

	    // var fontSize = this.display.fontSize + 'em';
	    // d.body.style.fontSize = fontSize;
	    var w = this.getDisplay();

	    frameRef.style.height =
		Math.round(this.display.height * this.previewZoom/100.0);
	    frameRef.style.width =
		Math.round(this.display.width * this.previewZoom/100.0);

	    if (w) {
		// w.document.body.style.fontSize = fontSize;
		while (d.body.innerHeight < w.document.body.clientHeight * this.previewZoom/100.0){
		    $('#preview').height($('#preview').height()+1);
		    console.log('adjusting height', $('#preview').height());
		}
		while (d.body.innerWidth < w.document.body.clientWidth * this.previewZoom/100.0){
		    $('#preview').width($('#preview').width()+1);
		    console.log('adjusting width', $('#preview').width());
		}
	    }
	    // console.log('width', $('#preview').width());
	    return {
		height: $('#preview').height(),
		width: $('#preview').width()
	    }
	},
	displayStyleSheet: function() {
	    return '<style>'+displayStyleSheet[this.displayStyle]+
		'body{font-size:'+this.display.fontSize+'em}'+
		'</style>';
	},
	innerHTML: function() {
	    return emphasize(escapeHtml(this.raw));
	},
	displayInnerHTML: function() {
	    return this.displayStyleSheet + this.innerHTML;
	},
	previewStyleSheet: function() {
	    return '<style>'+displayStyleSheet[this.displayStyle]+
		'body {zoom:'+this.previewZoom/100.0+'; font-size:'+this.display.fontSize+'em}'+
		'</style>';
	},
	previewInnerHTML: function() {
	    return this.previewStyleSheet + this.innerHTML;
	}
    }
});

// from  https://wicg.github.io/ResizeObserver/#algorithms
var areaRO = new ResizeObserver( function(entries) {
    for (let entry of entries) {
	// let cs = window.getComputedStyle(entry.target);
	let cs = entry.target.getBoundingClientRect();
	console.log('watching element:', entry.target);
	console.log(entry.contentRect.width,' is ', cs.width);
	console.log(entry.contentRect.height,' is ', cs.height);
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

