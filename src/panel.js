

(function() {


    var onEnableDisable = function () {
        var bEnable = document.getElementById("ext-enable").checked;

        localStorage["enabled"] = (bEnable) ? "1" : "0";
        document.getElementById("enable-container").className = (bEnable) ? '' : 'disabled';
    };

    document.addEventListener("DOMContentLoaded", function () {

        var enabled = localStorage["enabled"];

        document.getElementById("ext-enable").checked = (enabled == "1");
        onEnableDisable();

        document.getElementById("ext-enable").addEventListener('click', onEnableDisable);
    });


})();