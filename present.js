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

/* Run separate vue apps on the presenter and display. The presenter
 * will create the display, so it will have a reference to it. The
 * presenter updates the display's model. The display's vue app will
 * update the display.
 *
 * The link also goes backwards, because the display's dimensions need
 * to be reflected in the presenter. Set up watchers for dimensions
 * and notify the control. This means that the model will have a
 * reference to the control.
 *
 * How would a single truth object helps simplify things? Maybe you
 * could avoid having watchers, but both apps would still have to know
 * when the shared model changes. And the shared model is proxied by
 * each. I think this means that the proxy is used to inform the app
 * of changes to the model. (When the model is changed through the
 * proxy, the app knows about it. But when the model is changed
 * directly, I don't think the app is aware. proxy.change(modelparam,
 * 3) vs model[param] = 3)
 * 
 * The original way I had it may be simpler. The control creates the
 * display and models it. When the display's html or style changes,
 * the control updates it directly. There is not so much to update on
 * the display. Just styling and content, three things if the styling
 * is set as both a class and a style object. (note that the
 * individual fields of style object may have to be watched, because
 * the watch function needs both the present value of the style object
 * and the old value. The old value may be hard to represent because
 * it requires deep copying.
 */
// Try to use the same model, see
// https://vuejs.org/v2/guide/state-management.html#Simple-State-Management-from-Scratch
// I don't have time right now, but this is what should be done:
// Have a global object that stores the truth about the display and the preview.

var displayTruth = {
    height:100, width: 100, scrollTop:0, scrollLeft:0, window:0, fontSize:1,
    styles: displayStyles, style: displayStyles[0].value, padding:16,
    styleSheet: ".content {white-space:pre-wrap} .blackOnWhite {color:black; background-color:white;} .blackOnWhite em.hilite {font-style:normal; background:yellow} .blackOnWhite em.bold {font-style:normal; color:red} .whiteOnBlack {color:white; background-color:black;} .whiteOnBlack em.hilite {font-style: normal; color:yellow} .whiteOnBlack em.bold {font-style:normal;color:lightcoral}",
    innerHTML: 'hello'
};

var app = new Vue({
    el: "#presenter",
    data: {
	display: displayTruth,
	raw: '',
	interactive: false,
	history: [],
	previewZoom: .5,
    },
    // watch: {
    // 	'display.padding': function(val){ if (this.interactive) {this.updateDisplayPadding(); }},
    // 	'display.fontSize': function(val){ if (this.interactive) {this.updateDisplayFontSize(); }},
    // 	'display.style': function(val){ if (this.interactive) {this.updateDisplayStyle(); }},
    // 	'innerHTML': function(val, oldval) {
    // 	    if (this.interactive && val != oldval) {
    // 		this.updateDisplayInnerHTML();
    // 	    }
    // 	}
	
    // },
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
	    // this.updateDisplayStyle();
	    // this.updateDisplayInnerHTML();
	    // this.updateDisplayPadding();
	    // this.updateDisplayFontSize();
	    // this.updateDisplaySize();
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
	    if (!w.displayApp) {
		w.makeDisplay(window, this);
	    }
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
	className: function() {
	    return "content "+this.display.style;
	},
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

