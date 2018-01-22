var display = 0; // global variable pointing to the display window.

function sizePreview(){
    var previewScale = document.getElementById('previewScale').value;
    document.getElementById('previewScaleText').innerText = previewScale+'%';
    if (display && display.innerWidth) {
	var preview = document.getElementById('preview');
	preview.style.height = Math.round(display.innerHeight * previewScale/100.0);
	preview.style.width = Math.round(display.innerWidth * previewScale/100.0);
	var previewDocument = getPreviewDocument();
	previewDocument.body.style.zoom = previewScale/100.0;
	// adjust for borders, etc.
	while (previewDocument.body.innerHeight < display.document.body.clientHeight * previewScale/100.0) {
	    $('#preview').height($('#preview').height()+1);
	    console.log('adjusting height', $('#preview').height());
	}
	while (previewDocument.body.innerWidth < display.document.body.clientWidth * previewScale/100.0) {
	    $('#preview').width($('#preview').width()+1);
	    console.log('adjusting width', $('#preview').width());
	}
	    
	// previewDocument.body.style.transform = 'scale('+previewScale/100.0+')';
	// previewDocument.body.style.transformOrigin = '0 0';
	// previewDocument.body.style.margin = '0';
	// previewDocument.body.style.padding = '1em';
    }
}
function runInDisplay(action) {
    // console.log('runInDisplay');
    if (!display) {
	// console.log('no display');
	// try to open an existing window and kill it
	// If an existing window exists, then the onload event won't fire.
	// display = window.open('', 'display');
	// if (display) { display.close();	}
	display = window.open('display.html', 'display');
	display.onload = function(){
	    // console.log('onload');
	    action(display);
	};
    }
    else if (display.closed) {
	// console.log('closed display');
	display = window.open('display.html', 'display');
	display.onload = function(){ action(display); };
    }
    else {
	// console.log('already opened display', display, display.document, display.document.readyState);
	action(display);
    }
    display.onresize=sizePreview;
}


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
function loadFile() {
    // https://stackoverflow.com/a/33641308/268040
    // https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
    var file = document.getElementById("myFile").files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
	var textArea = document.getElementById("content");
	textArea.value = e.target.result;
    };
    reader.readAsText(file);
}
function myhtml() {
    return "<style>"+
	document.querySelector('input[name="style"]:checked').value+
	"body {padding:1em; margin:0; white-space:pre-wrap;}"+
	"</style>"+
	emphasize(escapeHtml($("#content").val()));
}

function getPreviewDocument() {
    var frameRef = document.getElementById('preview');
    var d = frameRef.contentWindow
        ? frameRef.contentWindow.document
        : frameRef.contentDocument
    return d;
}
function updatePreview(){
    var d = getPreviewDocument();
    d.body.innerHTML = myhtml();
}

function setDisplay() {
    runInDisplay(function (d) {
	d.document.body.innerHTML = myhtml();
    });
}

function updateDisplay(){
    updatePreview();
    setDisplay();
}

document.body.innerHTML +=
    '<div id="controlPane" style="float:left">'+
    '<input id="myFile" type="file" onchange="loadFile()"/>' + 
    '<textarea id="content" style="display:block"></textArea>' + 
    '<button onclick="updatePreview();">Update Preview</button>' +
    '<button onclick="updateDisplay();">Update Display</button>' +
    '<br><label>scale <span id="previewScaleText">50%</span><input id="previewScale" type="range" min="1" max="100" step="1" value="50" oninput="sizePreview()"></label>'+
    '<br><label>fontSize <span id="fontSize">1 em</span> <input type="range" min="1" max="10" step=".1" value="1" oninput="updateFontSize(this.value)" onchange="updateFontSize(this.value)"></label>' +
    '<br><label><input name="style" checked type="radio" value="em.hilite {font-style:normal; background:yellow} em.bold {font-style:normal; color:red}"> black on white</label>'+
    '<br><label><input name="style" type="radio" value="em.hilite {font-style: normal; color:yellow} em.bold {font-style:normal;color:lightcoral} body {color:white; background-color:black}"> white on black</label>'+
    '</div>'+
    '<div id="previewPane" style="float:right">'+
    '<iframe id="preview"></iframe>'+
    '</div>'+
    '';

    // '<textarea id="content" style="display:block; width:100%"></textarea>'+
    // '<button onclick="updateDisplay();">Update Display</button>';

    
function updateFontSize(s){
    var size = $('#fontSize').innerText = s+'em';
    runInDisplay(function(d) {
	var b = d.document.body;
	b.style.fontSize = size;
    });
    getPreviewDocument().body.style.fontSize = size;
}

function maximize() {
    runInDisplay(function(d) {
	var b = d.document.body;
	for (var h = 1; h < 100; h++) {
	    b.style.fontSize = h+"em"
	    if (b.scrollHeight > b.clientHeight) {
		h--;
		b.style.textSize = h+"em"
		break
	    }
	}
    });
}

