"use strict";

(function() {

    var ideUrls = {};

    var openInIde = function(ideUrl) {
        window.location.assign(ideUrl);
        //chrome.devtools.inspectedWindow.eval('console.log("'+ideUrl+'")');
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
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                window.OPENINIDE_APP_PATHS_RETURN = xhr.responseText;
                //callback(xhr.responseText);
            }
        };
        xhr.open('GET', url, true);
        xhr.send(null);
    };


    chrome.devtools.panels.setOpenResourceHandler(function(resource, lineNumber) {

        var iRetry = 0;

        var checkUrlResponse = function() {
            chrome.devtools.inspectedWindow.eval('(window.OPENINIDE_APP_PATHS_RETURN || "")', function (ret) {
                if (ret) {
                    var paths = JSON.parse(ret);
                    ideUrls[thisUrl] = 'ide://'+paths.appFolder;

                    openInIde(ideUrls[thisUrl]+fileString);

                    chrome.devtools.inspectedWindow.eval('(delete window.OPENINIDE_APP_PATHS_RETURN)');
                }
                else {
                    iRetry++;
                    if (iRetry < 10) {
                        setTimeout(checkUrlResponse, 125);
                    }
                    else {
                        openInIde('ide://'+fileString);
                        chrome.devtools.inspectedWindow.eval('console.error("OpenInIde: Couldn\'t get app paths from '+thisUrl+'");');
                    }
                }
            });
        };


        var url = resource.url;

        var urlParse = parseUri(url);
        var thisUrl = urlParse.protocol+'://'+urlParse.host+(urlParse.port ? ':'+urlParse.port: '');

        var regex = new RegExp(thisUrl, 'i');
        var fileString = url.replace(regex, '');
        fileString += ':'+lineNumber;

        if (ideUrls[thisUrl]) {
            openInIde(ideUrls[thisUrl]+fileString);
        }
        else {
            chrome.devtools.inspectedWindow.eval('('+readURLContent.toString()+')("'+thisUrl+'/get-app-paths'+'");');
            checkUrlResponse();
        }


    });

    // require('electron').remote.BrowserWindow.addDevToolsExtension('/Users/johnny/Coding/_Tools/chrome-openinide/src');
    // require('electron').remote.BrowserWindow.removeDevToolsExtension('Open In IDE');


})();