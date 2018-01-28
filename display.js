function makeDisplay(controlw, control) {
    window.displayApp = new Vue ({
	data: controlw.displayTruth,
	// computed: {
	//     setInnerHTML: function () {
	// 	this.innerHTML = control.innerHTML;
	// 	return this.innerHTML;
	//     },
	//     className: function() {
	// 	return "content "+this.style;
	//     }
	}
    });
}
	
