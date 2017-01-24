function CanvasInitialiser(engine) {

    this.init = function (callback) {

        if (document.getElementById('canvas') != null) {
            callback();
            return;
        }

        var fullscreenMode = document.getElementById('cb-fullscreen').checked;
        var resolutionMultiplier = document.getElementById('lb-resolution-scale').value;

        var canvasSize = {
            width: 0,
            height: 0
        }

        if (fullscreenMode) {

            canvasSize.width = window.screen.width;
            canvasSize.height = window.screen.height;

        } else {

            canvasSize.width = 960;//240
            canvasSize.height = canvasSize.width * 0.5625;
        }

        var canvasResolution = {
            width: canvasSize.width * resolutionMultiplier,
            height: canvasSize.height * resolutionMultiplier
        }

        var canvasContainer = document.getElementById('canvas-container');
        canvasContainer.innerHTML = '<canvas id="canvas" width="' + canvasResolution.width + '" height="' + canvasResolution.height + '" style="display: block; width: ' + canvasSize.width + 'px; height: ' + canvasSize.height + 'px; "></canvas>';

        if (!fullscreenMode) {
            canvasContainer.style.width = canvasSize.width + 'px';
            canvasContainer.style.height = canvasSize.height + 'px';
            canvasContainer.style.borderWidth = '4px';
            canvasContainer.style.borderColor = 'grey';
            canvasContainer.style.borderStyle = 'solid'
            canvasContainer.style.marginTop = '100px';
            canvasContainer.style.marginLeft = 'auto';
            canvasContainer.style.marginRight = 'auto';
        }

        var settingsContainer = document.getElementById('settings-container');
        settingsContainer.style.display = 'none';

        var statsContainer = document.getElementById('stats-container');
        statsContainer.style.display = 'block';

        if (fullscreenMode) {

            document.addEventListener('fullscreenchange', function () {
                callback();
            });

            var mainContainer = document.getElementById('main-container');
            mainContainer.requestFullscreen =
                mainContainer.requestFullscreen ||
                mainContainer.mozRequestFullscreen ||
                mainContainer.webkitRequestFullscreen;

            mainContainer.requestFullscreen();

        } else {
            callback();
        }
    }
}