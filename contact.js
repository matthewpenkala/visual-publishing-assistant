(function () {
  "use strict";

  // The contact address must never exist as a literal string in the HTML or
  // in this script: it is stored only as reversed, rolling-XOR character
  // codes, assembled in memory on a trusted user gesture, and displayed by
  // painting onto a canvas — never written into DOM text, attributes, or the
  // accessibility tree.
  var CODES = [78, 92, 31, 83, 88, 90, 80, 70, 119, 76, 77, 91, 86];
  var KEY = 47;

  function decode() {
    var out = [];
    for (var i = 0; i < CODES.length; i += 1) {
      out.push(String.fromCharCode(CODES[i] ^ (KEY + i)));
    }
    return out.reverse().join("");
  }

  function openMail(event) {
    event.preventDefault();
    // Synthetic clicks dispatched by page scripts are not trusted.
    if (!event.isTrusted) return;
    window.location.href = ["mai", "lto:"].join("") + decode();
  }

  function paint(canvas) {
    var context = canvas.getContext("2d");
    if (!context) return;
    var style = window.getComputedStyle(canvas);
    var size = parseFloat(style.fontSize);
    var font =
      style.fontStyle + " " + style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
    context.font = font;
    var text = decode();
    var width = Math.ceil(context.measureText(text).width);
    var height = Math.ceil(size * 1.3);
    var ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    context.scale(ratio, ratio);
    context.font = font;
    context.fillStyle = style.color;
    context.textBaseline = "alphabetic";
    context.fillText(text, 0, size * 1.02);
  }

  function init() {
    var targets = document.querySelectorAll("[data-contact]");
    for (var i = 0; i < targets.length; i += 1) {
      var el = targets[i];
      el.addEventListener("click", openMail);
      if (el.hasAttribute("data-contact-display")) {
        var canvas = document.createElement("canvas");
        canvas.className = "email-canvas";
        canvas.setAttribute("aria-hidden", "true");
        el.textContent = "";
        el.appendChild(canvas);
        paint(canvas);
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(
            (function (c) {
              return function () {
                paint(c);
              };
            })(canvas),
          );
        }
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
