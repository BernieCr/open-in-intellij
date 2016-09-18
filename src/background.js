
(function() {
    
    var thePort = null;
    chrome.runtime.onConnect.addListener(function(port) {
        if (port.name !== "openinintellij") return;
        thePort = port;
    });
    
    var sendMessage = function(msg) {
        if (thePort) {
            thePort.postMessage(msg);
        }
        else {
            alert('Sorry, please open DevTools first!');
        }
    };
    
    
    chrome.tabs.onCreated.addListener(function (tab) {
        if (tab && tab.url) {
         
            var url = tab.url; // http://openfile/?/Users/johnny/Coding/_Tools/chrome-openinintellij/src/openinide.js&200
            if (url.startsWith('http://openfile/')) {
                
                chrome.tabs.remove(tab.id);
                
                var parts = url.split('?');
                var params = parts[1].split('&');
                var filePath = params[0];
                var lineNumber = params[1];
    
                sendMessage({
                    file: filePath,
                    line: lineNumber
                });
            }
            
        }
    });
    
    
    
})();