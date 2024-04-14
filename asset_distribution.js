// get elements
var img = document.getElementById("assetdist_svg");
var slider = document.getElementById("t_input");
var value = document.getElementById("t_value");

// get buttons
var back = document.getElementById("t_back");
var play = document.getElementById("t_play");
var forward = document.getElementById("t_forward");

// set timeout and interval variables
var interval = null;
var holdTimeout = null;

// set hold time needed to trigger hold action
var holdTime = 200;

// get min and max values of slider
const min = parseInt(slider.min);
const max = parseInt(slider.max);

// set initial value of text content
value.textContent = slider.value;

// update text content and image when slider is moved
slider.oninput = function() {
    value.textContent = this.value;
    img.setAttribute("src", "plots/" + this.value + ".svg");
}

// click buttons to move slider

forward.onclick = function() {
    if (parseInt(slider.value) < max) {
        slider.value = parseInt(slider.value) + 1;
        value.textContent = slider.value;
        img.setAttribute("src", "plots/" + slider.value + ".svg");
    }
}

back.onclick = function() {
    if (parseInt(slider.value) > min) {
        slider.value = parseInt(slider.value) - 1;
        value.textContent = slider.value;
        img.setAttribute("src", "plots/" + slider.value + ".svg");
    }
}

play.onclick = function() {
    if (interval) {
        clearInterval(interval);
        interval = null;
        return;
    }

    var i = parseInt(slider.value);
    interval = setInterval(function() {
        if (i < max) {
            i++;
            slider.value = i;
            value.textContent = i;
            img.setAttribute("src", "plots/" + i + ".svg");
        } else {
            clearInterval(interval);
        }
    }, 100);
}

// hold buttons to move slider

back.onmousedown = function() {
    holdTimeout = setTimeout(function() {
        slider.value = min;
        value.textContent = slider.value;
        img.setAttribute("src", "plots/" + slider.value + ".svg");
    }, holdTime);
}

back.onmouseup = function() {
    clearTimeout(holdTimeout);
}

forward.onmousedown = function() {
    holdTimeout = setTimeout(function() {
        slider.value = max;
        value.textContent = slider.value;
        img.setAttribute("src", "plots/" + slider.value + ".svg");
    }, holdTime);
}

forward.onmouseup = function() {
    clearTimeout(holdTimeout);
}
