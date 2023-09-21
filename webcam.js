var bounding_box_colors = {};

var confidence = 0.6;
var speechEnabled = false;
var speakEnabled = false;


function toggleSpeak() {
    speakEnabled = !speakEnabled;
}

function drawBoundingBoxes (predictions, canvas, ctx, user_stated_confidence = 0.5) {
    for (var i = 0; i < predictions.length; i++) {
        var confidence = predictions[i].confidence;

        if (confidence < user_stated_confidence) {
            continue;
        }

        if (predictions[i].class in bounding_box_colors) {
            ctx.strokeStyle = bounding_box_colors[predictions[i].class];
        } else {
            var o = Math.round, r = Math.random, s = 255;
            ctx.strokeStyle = "#" + Math.floor(Math.random()*16777215).toString(16);
            bounding_box_colors[predictions[i].class] = ctx.strokeStyle;
        }

        var rect = canvas.getBoundingClientRect();

        var prediction = predictions[i];
        var x = prediction.bbox.x - prediction.bbox.width / 2;
        var y = prediction.bbox.y - prediction.bbox.height / 2;
        var width = prediction.bbox.width;
        var height = prediction.bbox.height;

        var scaling = window.devicePixelRatio;

        ctx.rect(x, y, width, height);

        ctx.fillStyle = "rgba(0, 0, 0, 0)";
        ctx.fill();

        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = "4";
        ctx.strokeRect(x, y, width, height);
        ctx.font = "25px Arial";
        ctx.fillText(prediction.class + " " + Math.round(confidence * 100) + "%", x, y - 10);
        
        speak(prediction.class);  
            
    }
}

// define the speak function
function speak(text) {
    if (speakEnabled && speechEnabled) {
        var synth = window.speechSynthesis;
        var utterance = new SpeechSynthesisUtterance(text);
        synth.speak(utterance);
    }
}


// get webcam feed
var stream
var videoLoaded = false;
var video = document.createElement("video");
video.setAttribute("autoplay", "");
video.setAttribute("muted", "");
video.setAttribute("playsinline", "");
video.addEventListener("loadeddata", function(){
    videoLoaded = true;
})

// create canvas
var canvas = document.createElement("canvas");
canvas.setAttribute("width", "640");
canvas.setAttribute("height", "480");
document.getElementById("canvas").appendChild(canvas);

// get canvas context
var ctx = canvas.getContext("2d");


navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function(stream) {
    video.srcObject = stream;
    video.play();

    roboflow.auth({
        publishable_key: "rf_148OafwzfTgRMKEvv0desWVSsph2"
    }).load({
        model: "isl-yolov5",
        version: 1
    }).then(function(model) {
        setInterval(function() {
            model.detect(video).then(function(predictions) {
                // draw frame on canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                console.log(predictions)
                drawBoundingBoxes(predictions, canvas, ctx, confidence);
            });
        }, 1000 / 30);
    });
});

function toggleWebcam() {
    if (stream) {
        if (videoLoaded && !video.paused) {
            if (videoLoaded) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "black";
                ctx.fillRect(0,0,canvas.width, canvas.height);
            }
            video.pause();
            speechEnabled = false;
            document.getElementById("toggleSpeechButton").disabled = true

        }
        stream.getTracks().forEach(function(track) {
            track.stop();
        });
        stream = null;
    } else {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function(newStream) {
            stream = newStream;
            video.srcObject = stream;
            video.play();
            document.getElementById("toggleSpeechButton").disabled = false;

        });
    }
}

document.getElementById("toggleSpeechButton").addEventListener("click", function() {
    speechEnabled = !speechEnabled;
    if (speechEnabled) {
        document.getElementById("toggleSpeechButton").innerHTML = "Disable Speech";
    } else {
        document.getElementById("toggleSpeechButton").innerHTML = "Enable Speech";
    }
});





