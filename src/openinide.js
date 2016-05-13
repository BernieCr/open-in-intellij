"use strict";

(function() {



    var devConsoleError = function(message) {
        var messageJson = JSON.stringify(message);
        messageJson = messageJson.split('\'').join('\\\'');
        messageJson = messageJson.split('\\n').join('\\\\n');
        var cmd = 'console.error(JSON.parse(\''+messageJson+'\'));';
        //console.log(cmd);
        chrome.devtools.inspectedWindow.eval(cmd);
    };

    //console.log(localStorage["enabled"]);

    if (typeof localStorage["enabled"] === "undefined") {
        localStorage["enabled"] = "1"; // default
    }

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


    var openInChromePanel = function(url, lineNumber) {
        chrome.devtools.panels.openResource(url, lineNumber);
    };


    var readURLContent = function(url, thisServer, filePath, bHasRootPath, urlOrig, lineNumber) {

        var xhr = new XMLHttpRequest();

        var xhrEvent = function() {

            var bOK = false;

            if (xhr.readyState == XMLHttpRequest.DONE) {
                switch (xhr.status) {
                    case 200:
                        bOK = true;
                        break;
                    case 0:
                        devConsoleError('Couldn\'t open file in IntelliJ! Please first start your IDE and open the project.\n(IntelliJ API Request URL: ' + url + ')');
                        break;
                    case 404:
                        var sErrorAdd = 'Please first open the project in your IDE.';
                        if (!bHasRootPath) {
                            sErrorAdd += '\nAlso make sure the file '+filePath+' can be found relative to your project root. Otherwise please map your web document root to the appropriate folder within your project. See options: chrome-extension://jeanncccmcklcoklpimhmpkgphdingci/options.html\n';
                        }
                        devConsoleError('Couldn\'t open file in IntelliJ: File not found! '+sErrorAdd+'\n(IntelliJ API Request URL: ' + url + ')');
                        break;
                    default:
                        devConsoleError('Couldn\'t open file in IntelliJ! HTTP error ' + xhr.status + ' for IntelliJ API Request URL ' + url);
                        break;
                }
                xhr = null;

                if (!bOK) {
                    openInChromePanel(urlOrig, lineNumber);
                }
            }
        };

        xhr.onreadystatechange = xhrEvent;
        xhr.onerror = xhrEvent;
        xhr.open('GET', url, true);
        xhr.send(null);
    };


    
    chrome.devtools.panels.create("Open In IntelliJ", "logo-48px.png", "panel.html");
    
    
    chrome.devtools.panels.setOpenResourceHandler(function(resource, lineNumber) {
        
        var url = resource.url;

        if (localStorage["enabled"] != "1") {
            // disabled => Open in Chrome Resource Panel
            openInChromePanel(url, lineNumber);
        }
        else {

            var urlParse = parseUri(url);

            var thisServer = urlParse.host + (urlParse.port ? ':' + urlParse.port : '');
            var thisUrl = urlParse.protocol + '://' + thisServer;

            var regex = new RegExp(thisUrl, 'i');
            var filePath = url.replace(regex, ''); // http://xxx aus URL löschen => nur Dateipfad erhalten
            var fileString = filePath;
            if (lineNumber) {
                fileString += ':' + lineNumber;
            }

            if (fileString[0] == '/') {
                fileString = fileString.substr(1);
            }

            var rootPaths = {};
            if (typeof localStorage["rootPaths"] !== "undefined") {
                rootPaths = JSON.parse(localStorage["rootPaths"]);
            }
            //console.log(rootPaths);

            var bHasRootPath = false;
            // nachsehen, ob wir für den aktuellen Host einen Pfad hinterlegt haben und ggf. verwenden
            if (rootPaths[thisServer]) {
                fileString = rootPaths[thisServer] + fileString;
                bHasRootPath = true;
            }

            //
            // IntelliJ REST API!
            // http://develar.org/idea-rest-api/
            //
            var ideOpenUrl = 'http://localhost:63342/api/file/' + fileString;

            // devConsoleLog(ideOpenUrl);

            readURLContent(ideOpenUrl, thisServer, filePath, bHasRootPath, url, lineNumber);
        }
    });



})();