

(function() {

//
// http://julip.co/2010/01/how-to-build-a-chrome-extension-part-2-options-and-localstorage/

    var iFields = 11;


    function loadOptions() {

        var rootPaths = null;

        if (localStorage["rootPaths"]) {
            rootPaths = JSON.parse(localStorage["rootPaths"]);
        }
        if (!rootPaths) {
            rootPaths = {};
        }

        var config = [];

        for (var site in rootPaths) {
            if (rootPaths.hasOwnProperty(site)) {
                config.push({
                    site: site,
                    rootPath: rootPaths[site]
                });
            }
        }

        console.log(config);

        for (var i = 0; i < iFields; i++) {
            document.getElementById('site' + i).value = (config[i] && config[i].site) || '';
            document.getElementById('root' + i).value = (config[i] && config[i].rootPath) || '';
        }
    }

    function saveOptions() {
        var rootPaths = {};

        for (var i = 0; i < iFields; i++) {
            var site = document.getElementById('site' + i).value;
            var rootPath = document.getElementById('root' + i).value;

            if (site != '') {
                if (rootPath != '') {
                    if (rootPath[0] == '/') {
                        rootPath = rootPath.substr(1);
                    }
                    if (rootPath[rootPath.length - 1] != '/') {
                        rootPath += '/';
                    }

                    console.log(typeof rootPaths, rootPaths, site, rootPath);
                    rootPaths[site] = rootPath;
                }
            }
        }

        console.log(rootPaths);

        localStorage["rootPaths"] = JSON.stringify(rootPaths);
        loadOptions(); // reload
    }

    function eraseOptions() {
        // localStorage.removeItem("rootPaths");
        // location.reload();
    }

    document.addEventListener("DOMContentLoaded", function () {

        loadOptions();

        document.getElementById("saveOptions").addEventListener('click', saveOptions);


        if (location.hash == '#fromdevtools') {
            document.getElementById("backlink-container").style.display = 'block';
            document.getElementById("backlink").addEventListener('click', function () {
                history.back();
                return false;
            });
        }
    });


})();