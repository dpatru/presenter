var display = window.open("display.html", "display");
function $(id){return document.getElementById(id);}
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
function updateDisplay(){
    console.log('updating display this = ', this);
    display.document.body.innerHTML =
	"<style>"+
	document.querySelector('input[name="style"]:checked').value+
	"body {margin:1em; white-space:pre-wrap;}"+
	"</style>"+
	emphasize(escapeHtml($("content").value));
}


document.body.innerHTML +=
    '<input id="myFile" type="file" onchange="loadFile()"/>' + 
    '<textarea id="content" style="display:block"></textArea>' + 
    '<button onclick="updateDisplay();">Update Display</button>' +
    '<br><label>fontSize <span id="fontSize">1 em</span> <input type="range" min="1" max="10" step=".1" value="1" oninput="updateFontSize(this.value)" onchange="updateFontSize(this.value)"></label>' +
    '<br><label><input name="style" checked type="radio" value="em.hilite {font-style:normal; background:yellow} em.bold {font-style:normal; color:red}"> black on white</label>'+
    '<br><label><input name="style" type="radio" value="em.hilite {font-style: normal; color:yellow} em.bold {font-style:normal;color:lightcoral} body {color:white; background-color:black}"> white on black</label>'+
    '';

    // '<textarea id="content" style="display:block; width:100%"></textarea>'+
    // '<button onclick="updateDisplay();">Update Display</button>';

function updateFontSize(s){
    console.log('changing font size to '+s);
    var b = display.document.body;
    b.style.fontSize = $('fontSize').innerText = s+'em';
}

function maximize() {
    var b = display.document.body;
    for (var h = 1; h < 100; h++) {
	b.style.fontSize = h+"em"
	if (b.scrollHeight > b.clientHeight) {
	    h--;
	    b.style.textSize = h+"em"
	    break
	}
    }
}

