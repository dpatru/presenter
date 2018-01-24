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
    blackOnWhite: ".content {padding:1em; margin:0; white-space:pre-wrap} .content em.hilite {font-style:normal; background:yellow} .content em.bold {font-style:normal; color:red}",
    whiteOnBlack: ".content {color:white; background-color:black; padding:1em; margin:0; white-space:pre-wrap} .content em.hilite {font-style: normal; color:yellow} .content em.bold {font-style:normal;color:lightcoral}"
};

var app = new Vue({
    el: "#presenter",
    data: {
	display: {height:100, width: 100, scrollTop:0, scrollLeft:0, window:0, fontSize:1},
	raw: '',
	history: [],
	previewZoom: .5,
	displayStyle: 'blackOnWhite'
    },
    methods: {
	updateDisplay: function() {
	    var w = this.getDisplay();
	    if (w) {
		w.document.body.innerHTML = this.innerHTML;
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
	}
	    
    },
    computed: {
	styleSheet: function() {
	    return '<style scoped>'+displayStyleSheet[this.displayStyle]+'</style>';
	},
	innerHTML: function() {
	    return this.styleSheet +
		'<div style="outline:0px solid red; font-size:'+this.display.fontSize+'em">'+
		emphasize(escapeHtml(this.raw))+'</div>';
	},
	basePreviewStyle: function(){ // scaling happens here
	    return {
		//float:'right',
		position:'absolute', right:0, top:0,
		display:'block',
		outline:'1px solid gray',
		transform: 'scale('+this.previewZoom+')', transformOrigin: 'top right',
		margin:0, padding:0, overflow:'hidden'
		// zoom: this.previewZoom,
	    };
	},
	previewStyle: function(){ // sizing happens here
	    return {
		display:'block',
		boxSizing:'border-box',
		height:this.display.height,
		width:this.display.width,
		// zoom: this.previewZoom,
		overflow:'auto'
	    };
	},
    }
});

