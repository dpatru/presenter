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
};

var displayStyles = [
    { label: 'Black on White', value: 'blackOnWhite'},
    { label: 'White on Black', value: 'whiteOnBlack'}
];
/*
We want to be able to:
- Set the padding. Padding should be constant no matter the font size. 
We can do this by setting the font size in pixels, not ems.
- Set the font size. 
 */

var app = new Vue({
    el: "#presenter",
    data: {
	display: {
	    height:100, width: 100, scrollTop:0, scrollLeft:0, window:0, fontSize:1,
	    styles: displayStyles, style: displayStyles[0].value, padding:16,
	    styleSheet: ".content {white-space:pre-wrap} .blackOnWhite {color:black; background-color:white;} .blackOnWhite em.hilite {font-style:normal; background:yellow} .blackOnWhite em.bold {font-style:normal; color:red} .whiteOnBlack {color:white; background-color:black;} .whiteOnBlack em.hilite {font-style: normal; color:yellow} .whiteOnBlack em.bold {font-style:normal;color:lightcoral}"
	},
	raw: '',
	interactive: false,
	history: [],
	previewZoom: .5,
    },
    watch: {
	'display.padding': function(val){ if (this.interactive) {this.updateDisplayPadding(); }},
	'display.fontSize': function(val){ if (this.interactive) {this.updateDisplayFontSize(); }},
	'display.style': function(val){ if (this.interactive) {this.updateDisplayStyle(); }},
	'innerHTML': function(val, oldval) {
	    if (this.interactive && val != oldval) {
		this.updateDisplayInnerHTML();
	    }
	}
	
    },
    methods: {
	updateDisplayPadding: function() {
	    var w = this.display.window;
	    if (w){
		w.document.body.style.padding = this.display.padding+'px';
	    }
	},
	updateDisplayFontSize: function() {
	    var w = this.display.window;
	    if (w) {
		w.document.body.style.fontSize = this.display.fontSize+'em';
	    }
	},
	updateDisplayInnerHTML: function() {
	    var w = this.display.window;
	    if (w) {
		w.document.body.innerHTML = this.innerHTML;
	    }
	},
	updateDisplayStyle: function() {
	    var w = this.display.window;
	    if (w) {
	    	w.document.body.className = "content " + this.display.style;
	    }
	},
	updateDisplay: function() {
	    var w = this.getDisplay();
	    this.updateDisplayStyle();
	    this.updateDisplayInnerHTML();
	    this.updateDisplayPadding();
	    this.updateDisplayFontSize();
	    this.updateDisplaySize();
	    if (w) {
	    // 	w.document.body.innerHTML =
	    // 	    '<style>body{padding:'+this.display.padding+'px}</style>'+
	    // 	    this.innerHTML;
	    // 	w.document.body.className = "content this.display.style";
	    // 	this.updateDisplaySize();
	    	this.history.push({
	    	    raw: this.raw,
	    	    style: this.display.style,
	    	    fontSize: this.fontSize,
	    	    padding: this.display.padding,
	    	    innerHTML: this.innerHTML });
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
		var c = w.document.body;
		this.display.height = c.clientHeight;
		this.display.width = c.clientWidth;
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
	},
	deleteHistoryItem:function(i) {
	    console.log('removing history item', i);
	    this.history.splice(i,1);
	}
    },
    computed: {
	styleSheet: function() {
	    return '<style scoped>'+this.display.styleSheet+'</style>';
	},
	innerHTML: function() {
	    return this.styleSheet + emphasize(escapeHtml(this.raw));
	},
	controlStyle: function () {
	    return {
		// float: 'left',
		display: 'inline-block', verticalAlign: 'top'
	    };
	},
	previewWrapperStyle: function() {
	    var el = $('#previewPane')[0].getBoundingClientRect();
	    console.log('bounding el height', el.height);
	    console.log('calculated height', this.display.height * this.previewZoom);
	    console.log('bounding el width', el.width);
	    console.log('calculated width', this.display.width * this.previewZoom);
	    console.log('bounding el', el);
	    return {
		position: 'relative', display: 'inline-block',
		height: Math.max(el.height,Math.round(this.display.height*this.previewZoom)),
		width: Math.max(el.width,Math.round(this.display.width*this.previewZoom)),
		// backgroundColor: 'green',
		overflow: 'hidden',
		outline: '1px solid green'
	    };
	},
	basePreviewStyle: function(){ // scaling happens here, can this be combined with previewStyle?
	    return {
		// float:'right',
		// position:'absolute', right:0, top:0,
		display:'inline-block',
		outline:'1px solid gray',
		transform: 'scale('+this.previewZoom+')', transformOrigin: 'top left',
		margin:0, padding:this.display.padding+'px', overflow:'hidden'
		// zoom: this.previewZoom,
	    };
	},
	previewStyle: function(){ // sizing happens here
	    return {
		display:'block',
		boxSizing:'border-box',
		height:this.display.height,
		width:this.display.width,
		fontSize:this.display.fontSize+'em',
		// zoom: this.previewZoom,
		overflow:'auto'
	    };
	},
    }
});

