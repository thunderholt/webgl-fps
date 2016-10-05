function FrameTimer(engine) {

    // Members.
    this.frameDelta = 0;
    this.lastFrameStartTime = null;
    this.lastTenFramesTotalDuration = 0;
    this.fpsCounterTickUp = 0;

    this.init = function (callback) {

        callback();
    }

    this.startFrame = function () {

        var lastFrameDurationMillis = 0;

        if (this.lastFrameStartTime == null) {

            this.frameDelta = 0;

        } else {

            lastFrameDurationMillis = performance.now() - this.lastFrameStartTime;

            var desiredFrameDurationMillis = 1 / 60 * 1000;

            this.frameDelta = lastFrameDurationMillis / desiredFrameDurationMillis;
        }

        this.lastTenFramesTotalDuration += lastFrameDurationMillis;
        this.fpsCounterTickUp++;

        this.lastFrameStartTime = performance.now();
    }

    this.updateStats = function () {

        if (this.fpsCounterTickUp < 10) {
            return;
        }

        var averageFrameDuration = this.lastTenFramesTotalDuration / 10;
        var averagefps = 1000 / averageFrameDuration;

        var averageRenderingTimeElement = document.getElementById('average-rendering-time');
        if (averageRenderingTimeElement != null) {
            averageRenderingTimeElement.innerHTML = Math.round(averageFrameDuration) + 'ms';
        }

        var averageFpsElement = document.getElementById('average-fps');
        if (averageFpsElement != null) {
            averageFpsElement.innerHTML = Math.round(averagefps) + ' fps';
        }

        var numberOfVisibleWorldStaticMeshChunksElement = document.getElementById('number-of-visible-world-static-mesh-chunks');
        if (numberOfVisibleWorldStaticMeshChunksElement != null) {
            numberOfVisibleWorldStaticMeshChunksElement.innerHTML = engine.stats.numberOfVisibleWorldStaticMeshChunks;
        }

        var numberOfVisibleActorsElement = document.getElementById('number-of-visible-actors');
        if (numberOfVisibleActorsElement != null) {
            numberOfVisibleActorsElement.innerHTML = engine.stats.numberOfVisibleActors;
        }

        var numberOfVisibleLightsElement = document.getElementById('number-of-visible-lights');
        if (numberOfVisibleLightsElement != null) {
            numberOfVisibleLightsElement.innerHTML = engine.stats.numberOfVisibleLights;
        }

        var numberOfShadowMapsBuiltThisFrameElement = document.getElementById('number-of-shadow-maps-built-this-frame');
        if (numberOfShadowMapsBuiltThisFrameElement != null) {
            numberOfShadowMapsBuiltThisFrameElement.innerHTML = engine.stats.numberOfShadowMapsBuiltThisFrame;
        }

        this.lastTenFramesTotalDuration = 0;
        this.fpsCounterTickUp = 0;
    }
}