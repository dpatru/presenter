var display = window.open("display.html", "display");
function $(id){return document.getElementById(id);}
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
    display.document.body.innerHTML = "<style>em {background:yellow}</style>"+$("content").value;
}

document.body.innerHTML +=
    '<input id="myFile" type="file" onchange="loadFile()"/>' + 
    '<textarea id="content" style="display:block"></textArea>' + 
    '<button onclick="updateDisplay();">Update Display</button>' +
    '<br><label>fontSize<input type="range" min="1" max="10" step=".1" value="1" oninput="updateFontSize(this.value)" onchange="updateFontSize(this.value)"></label>';
    // '<textarea id="content" style="display:block; width:100%"></textarea>'+
    // '<button onclick="updateDisplay();">Update Display</button>';

function updateFontSize(s){
    console.log('changing font size to '+s);
    var b = display.document.body;
    b.style.fontSize = s+'em';
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
