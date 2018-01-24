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
	display: {height:100, width: 100, scrollTop:0, scrollLeft:0, window:0, fontSize:1},
	raw: '',
	history: [],
	previewZoom: 50,
	displayStyle: 'blackOnWhite'
    },
    methods: {
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
	    var me = this;
	    var w = this.display.window;
	    w.onresize=function(){me.updateDisplaySize();};
	    w.document.onscroll=function(){
		me.updateDisplayScroll();
	    };
	    return this.display.window;
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

