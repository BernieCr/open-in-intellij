"use strict";

(function() {

    var ideUrls = {};

    var openInIde = function(ideUrl) {
        window.location.assign(ideUrl);
    };

    var readURLContent = function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                console.log(xhr.responseText);
                callback(xhr.responseText);
            }
        };
        xhr.open('GET', url, true);
        xhr.send(null);
    };

    chrome.devtools.panels.setOpenResourceHandler(function(resource, lineNumber) {
        var url = resource.url;
        console.log(url);

        var parser = document.createElement('a');
        parser.href = url;

        var thisUrl = parser.protocol+'//'+parser.hostname+(parser.port ? ':'+parser.port: '');

        var regex = new RegExp(thisUrl, 'i');
        var fileString = url.replace(regex, '');
        fileString += ':'+lineNumber;

        if (ideUrls[thisUrl]) {
            openInIde(ideUrls[thisUrl]+fileString);
        }
        else {
            console.log(thisUrl+'/get-app-paths');
            readURLContent(thisUrl+'/get-app-paths', function(sPaths) {
                var paths = JSON.parse(sPaths);
                ideUrls[thisUrl] = 'ide://'+paths.appFolder+'/';
                openInIde(ideUrls[thisUrl]+fileString);
            });
        }


    });

    // require('electron').remote.BrowserWindow.addDevToolsExtension('/Users/johnny/Coding/_Tools/chrome-openinide/src');


})();