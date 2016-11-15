function ShadowMapManager(engine) {

    var self = this;
    var gl = null;

    this.bufferSize = 512;

    this.nextAvailableShadowMapChannel = null;

    this.shadowMaps = [];

    this.init = function (callback) {

        self.log('Initialising point light shadow map manager...');

        gl = engine.glManager.gl;

        self.log('... done.');

        callback();
    }

    this.allocateShadowMap = function (lightType) {

        if (this.nextAvailableShadowMapChannel == null) {

            this.createNewShadowMap(lightType);

            this.nextAvailableShadowMapChannel = 0;
        }

        var allocation = {
            index: this.shadowMaps.length - 1,
            channel: this.nextAvailableShadowMapChannel
        }

        this.log("Allocated shadow map " + allocation.index + ", channel: " + allocation.channel + ".");

        this.nextAvailableShadowMapChannel++;
        if (this.nextAvailableShadowMapChannel == 2) {
            this.nextAvailableShadowMapChannel = null;
        }

        return allocation;
    }

    this.createNewShadowMap = function (lightType) {

        if (lightType == 'point') {

            this.createPointLightShadowMap();
        
        } else {

            throw 'Unknown light type: ' + lightType;
        }
    }

    this.createPointLightShadowMap = function () {

        var shadowMap = {
            lightType: 'point',
            frameBuffer: null,
            cubeTexture: null
        };

        shadowMap.frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMap.frameBuffer);

        shadowMap.cubeTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMap.cubeTexture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, this.bufferSize, this.bufferSize, 0, gl.RGBA, gl.FLOAT, null);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, this.bufferSize, this.bufferSize, 0, gl.RGBA, gl.FLOAT, null);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, this.bufferSize, this.bufferSize, 0, gl.RGBA, gl.FLOAT, null);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, this.bufferSize, this.bufferSize, 0, gl.RGBA, gl.FLOAT, null);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, this.bufferSize, this.bufferSize, 0, gl.RGBA, gl.FLOAT, null);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, this.bufferSize, this.bufferSize, 0, gl.RGBA, gl.FLOAT, null);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, engine.renderer.shadowMapBuildBuffers.depthRenderBuffer);

        this.shadowMaps.push(shadowMap);

        this.log('Created new point light shadow map.');
    }

    this.buildViewProjMatrixForPointLightCubeMapFaceBuild = function (out, position, face) {

        var lookAt = vec3.create();
        vec3.add(lookAt, position, face.lookAt);

        var viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, position, lookAt, face.up);

        var projMatrix = mat4.create();
        mat4.perspective(projMatrix, Math.PI / 2.0, 1.0, 0.1, 10000.0);

        //var viewProjMatrix = mat4.create();
        mat4.multiply(out, projMatrix, viewMatrix);

        //return viewProjMatrix;
    }

    this.cleanUp = function () {

        this.log('Cleaning up...');

        for (var i = 0; i < this.shadowMaps.length; i++) {

            var shadowMap = this.shadowMaps[i];

            if (shadowMap.lightType == 'point') {
                gl.deleteFramebuffer(shadowMap.frameBuffer);
                gl.deleteTexture(shadowMap.cubeTexture);
            }
        }

        this.shadowMaps = [];

        this.log('... done.');
    }

    this.log = function (message) {

        console.log('Shadow Map Manager: ' + message);
    }
}