function SkinnedMeshAnimationManager(engine) {

    var self = this;
    var gl = null;

    this.skinnedMeshAnimationsById = {};
    this.loadingSkinnedMeshAnimationIds = {};
    this.failedSkinnedMeshAnimationIds = {};

    this.init = function (callback) {

        gl = engine.glManager.gl;

        callback();
    }

    this.loadSkinnedMeshAnimation = function (skinnedMeshAnimationId, options, callback) {

        options = options || {};

        callback = callback || function () { }

        if (skinnedMeshAnimationId == null) {
            callback(null);
            return;
        }

        var skinnedMeshAnimation = this.skinnedMeshAnimationsById[skinnedMeshAnimationId];

        if (skinnedMeshAnimation != null) {
            callback(skinnedMeshAnimation);
            return;
        }

        if (this.loadingSkinnedMeshAnimationIds[skinnedMeshAnimationId] || this.failedSkinnedMeshAnimationIds[skinnedMeshAnimationId]) {
            callback(null);
            return;
        }

        this.log('Loading skinned mesh animation: ' + skinnedMeshAnimationId);

        this.loadingSkinnedMeshAnimationIds[skinnedMeshAnimationId] = skinnedMeshAnimationId;

        engine.resourceLoader.loadJsonResource('skinned-mesh-animation', skinnedMeshAnimationId, function (skinnedMeshAnimation) {

            if (skinnedMeshAnimation == null) {

                self.failedSkinnedMeshAnimationIds[skinnedMeshAnimationId] = true;

            } else {

                self.skinnedMeshAnimationsById[skinnedMeshAnimationId] = skinnedMeshAnimation;
            }

            delete self.loadingSkinnedMeshAnimationIds[skinnedMeshAnimationId];

            callback(skinnedMeshAnimation);
        });
    }

    this.getSkinnedMeshAnimation = function (skinnedMeshAnimationId) {

        if (skinnedMeshAnimationId == null) {
            return null;
        }

        return this.skinnedMeshAnimationsById[skinnedMeshAnimationId];
    }

    this.cleanUp = function () {

        this.log('Cleaning up...');

        this.skinnedMeshAnimationsById = {};

        this.log('... done.')
    }

    this.log = function (message) {

        console.log('Skinned Mesh Animation Manager: ' + message);
    }
}