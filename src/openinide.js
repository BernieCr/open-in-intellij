"use strict";

(function() {


    var consoleLog = function(sLogfn, args) {
        var messageJson = JSON.stringify(args);
        messageJson = messageJson.split('\'').join('\\\'');
        messageJson = messageJson.split('\\n').join('\\\\n');
        var cmd = sLogfn+'(JSON.parse(\''+messageJson+'\'));';

        chrome.devtools.inspectedWindow.eval(cmd);
    };

    var devConsoleError = function(message) {
        console.error(message);
        consoleLog('console.error', message);
    };

    var devConsoleLog = function(message) {
        console.log(message);
        consoleLog('console.log', message);
    };
    
    console.log('Open In IntelliJ - Extension loaded');
    
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
        
        console.log('Open In IntelliJ - calling IntelliJ API:', url);
        
        var xhr = new XMLHttpRequest();

        var xhrEvent = function() {

            var bOK = false;

            if (xhr.readyState == XMLHttpRequest.DONE) {
                switch (xhr.status) {
                    case 200:
                        console.log('Open In IntelliJ - IntelliJ API response:', 'HTTP 200 OK - file opened in IntelliJ successfully');
                        bOK = true;
                        break;
                    case 0:
                        console.log('Open In IntelliJ - IntelliJ API response:', 'Error 0');
                        devConsoleError('Couldn\'t open file in IntelliJ! Please first start your IDE and open the project.\n(IntelliJ API Request URL: ' + url + ')');
                        break;
                    case 404:
                    console.log('Open In IntelliJ - IntelliJ API response:', 'HTTP Error 404');
                        var sErrorAdd = 'Please first open the project in your IDE.';
                        if (!bHasRootPath) {
                            sErrorAdd += '\nAlso make sure the file '+filePath+' can be found relative to your project root. Otherwise please map your web document root to the appropriate folder within your project. See options: chrome-extension://jeanncccmcklcoklpimhmpkgphdingci/options.html\n';
                        }
                        devConsoleError('Couldn\'t open file in IntelliJ: File not found! '+sErrorAdd+'\n(IntelliJ API Request URL: ' + url + ')');
                        break;
                    default:
                        console.log('Open In IntelliJ - IntelliJ API response:', 'HTTP Error '+xhr.status);
                        devConsoleError('Couldn\'t open file in IntelliJ! HTTP error ' + xhr.status + ' for IntelliJ API Request URL ' + url);
                        break;
                }
                xhr = null;

                if (!bOK) {
                    console.log('Open In IntelliJ - failed, opening resource in Chrome instead');
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
    
    
    
    //
    // https://developer.chrome.com/extensions/devtools_panels#method-setOpenResourceHandler
    //
    chrome.devtools.panels.setOpenResourceHandler(function onOpenResource(resource, lineNumber) {
    
        var url = resource.url;
        
        console.log('Open In IntelliJ - received open resource event:', url, lineNumber);
             
        var urlParse = parseUri(url);
    
        var bOpenInChrome = false;
        
        var isAbsolute = false;
    
        if ((urlParse.protocol == "file") || (urlParse.path[0] == '/')) {
            // Absolute path on file system (Chrome Devtools workspace mapping)
            isAbsolute = true;
        }

        if (localStorage["enabled"] != "1") {
            // Extension is disabled => Open in Chrome Resource Panel
            bOpenInChrome = true;
            console.log('Open In IntelliJ - You disabled this extension, resources will open in Chrome. To enable this extension again click the "Open In IntelliJ" tab in the Devtools');
        }
        if (urlParse.protocol == "debugger") {
            // Links like 'debugger:///VM1192' => is internal Chrome stuff, open in Chrome
            bOpenInChrome = true;
        }
        if (typeof lineNumber === "undefined") {
            // No line number => Resource was most likely opened via right-click "Open Using Open In IntelliJ"
            //    => force open with intellij
            bOpenInChrome = false;
        }
         if (urlParse.protocol == "webpack") {
            // Links like 'webpack:///./node_modules/react-dom/cjs/react-dom.development.js' or 'webpack:///(webpack)-dev-server/client?0ee4'
             isAbsolute = true;
             urlParse.path = urlParse.path.substr(1);
             urlParse.path = urlParse.path.replace(/[\(\)']+/g, '');
        }
       

        if (bOpenInChrome) {
            console.log('Open In IntelliJ - opening resource in Chrome:', url, lineNumber)
            openInChromePanel(url, lineNumber);
        }
        else {
            var fileString = '';
            
            if (isAbsolute) {
                fileString = urlParse.path;
            }
            else {
                var filePath = urlParse.path;
                
                fileString = filePath;
                
                if (resource.type && resource.type == 'sm-stylesheet') { // Source mapped
                    fileString = fileString.replace(/^(\/source\/)/,'');
                }
    
                if (fileString[0] == '/') {
                    fileString = fileString.substr(1);
                }
            }
            
            var rootPaths = {};
            if (typeof localStorage["rootPaths"] !== "undefined") {
                rootPaths = JSON.parse(localStorage["rootPaths"]);
            }

            var bHasRootPath = false;            
            var thisServer = urlParse.host + (urlParse.port ? ':' + urlParse.port : '');
            
            var foundRootPath = rootPaths[thisServer];  // check for user path mappings
            if (!foundRootPath) {
                thisServer = urlParse.protocol + "://" + thisServer;
                foundRootPath = rootPaths[thisServer];
            }
            if (!foundRootPath) {
                foundRootPath = rootPaths[thisServer + "/"];
            }
            if (!foundRootPath) {
                foundRootPath = rootPaths[thisServer + urlParse.directory];
            }
            if (foundRootPath) {
                fileString = foundRootPath.replace(/\/$/, "") + "/" + fileString.replace(/^\//,"");
                bHasRootPath = true;
            }
            
            console.log('Open In IntelliJ - destination resource path:', fileString);
            
            var intellijServer = localStorage["intellijserver"] || 'http://localhost:63342';
            
            //
            // IntelliJ REST API!
            // http://develar.org/idea-rest-api/
            //
            var ideOpenUrl = intellijServer + '/api/file?file=' + encodeURI(fileString);
    
            if (lineNumber) {
                ideOpenUrl += '&line=' + lineNumber;
            }
            
            readURLContent(ideOpenUrl, thisServer, filePath, bHasRootPath, url, lineNumber);
        }
    });
    
    
    
    var port = chrome.runtime.connect({name: 'openinintellij'});
    
    port.onMessage.addListener(function(msg) {
        
        console.log('Open In IntelliJ - opening file from IntelliJ in Chrome', msg);
        
        var file = 'file://'+decodeURIComponent(msg.file);
        var line = parseInt(msg.line);
        if (line > 0) {
            line--;
        }
        
        chrome.devtools.panels.openResource(file, line, function(res) {
            if (res.code == "E_NOTFOUND") {
                devConsoleLog(res);
                alert("\n\n----------------------------------------------------\n\nDevTools couldn't open "+file+".\n\nMake sure the file is within one of your Workspaces in DevTools.\n\n----------------------------------------------------\n\n\n\n");
            }
        });
    });
    
    
    
    
})();