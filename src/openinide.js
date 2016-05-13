"use strict";

(function() {


    var rootPaths = {
        'www.eventnoted.com': 'dist/'

    };

    var devConsoleError = function(message) {
        chrome.devtools.inspectedWindow.eval('console.error("'+message+'");');
    };

    var devConsoleLog = function(message) {
        chrome.devtools.inspectedWindow.eval('console.log("'+message+'");');
    };


    // parseUri 1.2.2
    // (c) Steven Levithan <stevenlevithan.com>
    // MIT License
    var parseUri = function(str) {
        var o = {
            key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
            q:   {
                name:   "queryKey",
                parser: /(?:^|&)([^&=]*)=?([^&]*)/g
            },
            parser: {
                strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/
            }
        };

        var	m   = o.parser["strict"].exec(str),
            uri = {},
            i   = 14;

        while (i--) uri[o.key[i]] = m[i] || "";

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) uri[o.q.name][$1] = $2;
        });

        return uri;
    };

    var readURLContent = function(url) {

        var xhr = new XMLHttpRequest();

        var xhrEvent = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                switch (xhr.status) {
                    case 200:
                        // OK
                        //devConsoleLog('Opening '+url);
                        break;
                    case 0:
                        devConsoleError('Couldn\'t open file in IntelliJ! Please first start your IDE and open the project. (IntelliJ API Request URL: ' + url + ')');
                        break;
                    case 404:
                        devConsoleError('Couldn\'t open file in IntelliJ! File not found. Please make sure the project is opened or specify root path. (IntelliJ API Request URL: ' + url + ')');
                        break;
                    default:
                        devConsoleError('Couldn\'t open file in IntelliJ! HTTP error ' + xhr.status + ' for IntelliJ API Request URL ' + url);
                        break;
                }
                xhr = null;
            }
        };

        xhr.onreadystatechange = xhrEvent;
        xhr.onerror = xhrEvent;
        xhr.open('GET', url, true);
        xhr.send(null);
    };


    chrome.devtools.panels.setOpenResourceHandler(function(resource, lineNumber) {
        
        var url = resource.url;

        var urlParse = parseUri(url);

        var thisServer = urlParse.host+(urlParse.port ? ':'+urlParse.port: '');
        var thisUrl = urlParse.protocol+'://'+thisServer;

        var regex = new RegExp(thisUrl, 'i');
        var fileString = url.replace(regex, ''); // http://xxx aus URL löschen => nur Dateipfad erhalten
        if (lineNumber) {
            fileString += ':' + lineNumber;
        }

        if (fileString[0] == '/') {
            fileString = fileString.substr(1);
        }

        // nachsehen, ob wir für den aktuellen Host einen Pfad hinterlegt haben und ggf. verwenden
        if (rootPaths[thisServer]) {
            fileString = rootPaths[thisServer]+fileString;
        }

        //
        // IntelliJ REST API!
        // http://develar.org/idea-rest-api/
        //
        var ideOpenUrl = 'http://localhost:63342/api/file/'+fileString;

       // devConsoleLog(ideOpenUrl);

        readURLContent(ideOpenUrl);
        
    });



})();