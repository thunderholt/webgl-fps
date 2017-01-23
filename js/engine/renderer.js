function Renderer(engine) {
    
    var self = this;
    var gl = null;

    this.viewportInfo = null;
    this.maxStandardMaterialLights = 5;
    this.maxSkinnedMeshBones = 30;

    this.renderingOptions = {
        renderLightVolumeForLightId: null,
        renderLightVolumes: false,
        renderWorldStaticMeshAABBs: false,
        renderActorBoundingSpheres: false,
        renderActorHitBoxes: false,
        renderActorCollisionSpheres: true,
        renderSectors: false,
        renderTriggers: false
    };

    this.renderingParameters = {
        mode: '',
        viewProjMatrix: mat4.create()
    };

    this.shadowMapMasksForStaticObjectsByChannel = {
        0: [1.0, 0.0, 0.0, 0.0],
        1: [0.0, 0.0, 1.0, 0.0],
    }

    this.shadowMapMasksForDynamicObjectsByChannel = {
        0: [0.0, 1.0, 0.0, 0.0],
        1: [0.0, 0.0, 0.0, 1.0],
    }

    this.pointLightShadowMapFaces = null;

    this.shadowMapBuildBuffers = {
        backPassFrameBuffer: null,
        backPassBufferTexture: null,
        depthRenderBuffer: null
    }

    this.globalIlluminationNormals = [];
    this.globalIlluminationColours = [];

    this.visibleWorldStaticMeshChunkFieldForCamera = new BitField();
    this.visibleActorIdsForCamera = new FixedLengthArray(EngineLimits.MaxVisibleActorsIdsForCamera, null);
    this.visibleLightIdsForCamera = new FixedLengthArray(EngineLimits.MaxVisibleLightIdsForCamera, null);

    this.renderStaticMeshOptions = {
        staticMeshChunkRenderStatesByIndex: null,
        visibleChunkField: null,
        effectiveLightIds: null,
        //position: null,
        //rotation: null
        worldMatrix: null
    }

    /*this.renderStaticMeshMatrices = {
        //translationMatrix: mat4.create(),
        //rotationMatrix: mat4.create(),
        //worldMatrix: mat4.create()
    }*/

    this.renderSkinnedMeshOptions = {
        effectiveLightIds: null,
        //position: null,
        //rotation: null,
        frameIndex: null,
        worldMatrix: null
    }

    this.renderSkinnedMeshMatrices = {
        relativeBoneMatrices: [],
        hierachicalBoneMatrices: []
    }

    this.renderSkinnedMeshTempValues = {
        inversePosition: vec3.create(),
        boneRotationMatrix: mat4.create(),
        slerpedRotationQuaternion: quat.create(),
        concatenatedBoneMatrices: []
    }

    this.renderSectorsTempValues = {
        cubeFrom: vec3.create()
    }

    this.standardMaterialShaderData = {
        lightEnableds: [],
        lightPositions: [],
        lightRadiusSqrs: [],
        lightColours: [],
        lightCastsShadows: [],
        lightStaticObjectShadowMapMasks: [],
        lightDynamicObjectShadowMapMasks: [],
        pointLightShadowMapSamplers: []
    }

    this.particleVertexBuffers = {
        offsets: null,
        texCoords: null
    };

    this.guiVertexBuffers = {
        sizeMultipliers: null
    }

    this.init = function (callback) {

        gl = engine.glManager.gl;

        var initFunctions = [
            this.initSystemTextures,
            this.initPointLightShadowMapFaces,
            this.initShadowMapBuildBuffers,
            this.initGlobalIllumination,
            this.initStandardMaterialShaderData,
            this.initRenderSkinnedMeshMatrices,
            this.initRenderSkinnedMeshTempValues,
            this.initParticleVertexBuffers,
            this.initGuiVertexBuffers];

        util.recurse(function (recursor, recursionCount) {
            if (recursionCount < initFunctions.length) {
                initFunctions[recursionCount](recursor);
            } else {
                callback();
            }
        });
    }

    this.initSystemTextures = function (callback) {

        self.log('Loading system textures...');

        var systemTextureIds = [
            'system/missing-diffuse-texture',
            'system/missing-normal-texture',
            'system/dummy-cube'
        ];

        engine.textureManager.loadTextures(systemTextureIds, function () {

            self.log('... done.');

            callback();
        });
    }

    this.initPointLightShadowMapFaces = function (callback) {

        self.pointLightShadowMapFaces = [
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, lookAt: [1.0, 0.0, 0.0], up: [0.0, -1.0, 0.0] },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, lookAt: [-1.0, 0.0, 0.0], up: [0.0, -1.0, 0.0] },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, lookAt: [0.0, 1.0, 0.0], up: [0.0, 0.0, 1.0] },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, lookAt: [0.0, -1.0, 0.0], up: [0.0, 0.0, -1.0] },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, lookAt: [0.0, 0.0, 1.0], up: [0.0, -1.0, 0.0] },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, lookAt: [0.0, 0.0, -1.0], up: [0.0, -1.0, 0.0] }
        ];

        callback();
    }

    this.initShadowMapBuildBuffers = function (callback) {

        var bufferSize = engine.shadowMapManager.bufferSize;

        // Init the back pass frame buffer.
        self.shadowMapBuildBuffers.backPassFrameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, self.shadowMapBuildBuffers.backPassFrameBuffer);

        // Init the back pass buffer texture.
        self.shadowMapBuildBuffers.backPassBufferTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, self.shadowMapBuildBuffers.backPassBufferTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferSize, bufferSize, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, self.shadowMapBuildBuffers.backPassBufferTexture, 0);

        // Create the depth render buffer.
        self.shadowMapBuildBuffers.depthRenderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, self.shadowMapBuildBuffers.depthRenderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, bufferSize, bufferSize);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, self.shadowMapBuildBuffers.depthRenderBuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        callback();
    }

    this.initGlobalIllumination = function (callback) {

        var normals = [
            [-1.0, 1.0, 1.0], // Near, top, left.
            [1.0, 1.0, 1.0], // Near, top, right.
            [-1.0, -1.0, 1.0], // Near, bottom, left.
            [1.0, -1.0, 1.0], // Near, bottom, right.
            [-1.0, 1.0, -1.0], // Far, top, left.
            [1.0, 1.0, -1.0], // Far, top, right.
            [-1.0, -1.0, -1.0], // Far, bottom, left.
            [1.0, -1.0, -1.0], // Far, bottom, right.
        ];

        for (var i = 0; i < normals.length; i++) {
            var normal = normals[i];
            vec3.normalize(normal, normal);

            util.arrayPushMany(self.globalIlluminationNormals, normal);
        }

        for (var i = 0; i < 8 * 3; i++) {
            self.globalIlluminationColours[i] = 0;
        }

        callback();
    }

    this.initStandardMaterialShaderData = function (callback) {

        for (var i = 0; i < self.maxStandardMaterialLights; i++) {

            self.standardMaterialShaderData.lightEnableds.push(0);
            util.arrayPushMany(self.standardMaterialShaderData.lightPositions, [0, 0, 0]);
            self.standardMaterialShaderData.lightRadiusSqrs.push(0);
            util.arrayPushMany(self.standardMaterialShaderData.lightColours, [0, 0, 0]);
            self.standardMaterialShaderData.lightCastsShadows.push(0);
            util.arrayPushMany(self.standardMaterialShaderData.lightStaticObjectShadowMapMasks, [0, 0, 0, 0]);
            util.arrayPushMany(self.standardMaterialShaderData.lightDynamicObjectShadowMapMasks, [0, 0, 0, 0]);
            self.standardMaterialShaderData.pointLightShadowMapSamplers.push(0);
        }

        callback();
    }

    this.initRenderSkinnedMeshMatrices = function (callback) {

        for (var i = 0; i < self.maxSkinnedMeshBones; i++) {
            self.renderSkinnedMeshMatrices.relativeBoneMatrices.push(mat4.create());
            self.renderSkinnedMeshMatrices.hierachicalBoneMatrices.push(mat4.create());
        }

        callback();
    }

    this.initRenderSkinnedMeshTempValues = function (callback) {

        for (var i = 0; i < self.maxSkinnedMeshBones * 16; i++) {
            self.renderSkinnedMeshTempValues.concatenatedBoneMatrices[i] = 0;
        }

        callback();
    }

    this.initParticleVertexBuffers = function (callback) {

        // Create the offsets buffer.
        var offsets = [
			-1, 1,
            1, -1,
            1, 1,

            1, -1,
            -1, 1,
            -1, -1
        ];

        self.particleVertexBuffers.offsets = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, self.particleVertexBuffers.offsets);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(offsets), gl.STATIC_DRAW);

        // Create the texture coords buffer.
        var texCoords = [
			0, 0,
            1, 1,
            1, 0,

            1, 1,
            0, 0,
            0, 1
        ];

        self.particleVertexBuffers.texCoords = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, self.particleVertexBuffers.texCoords);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        callback();
    }

    this.initGuiVertexBuffers = function (callback) {

        var sizeMultipliers = [
			0, 0,
            1, 1,
            1, 0,

            1, 1,
            0, 0,
            0, 1
        ];

        self.guiVertexBuffers.sizeMultipliers = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, self.guiVertexBuffers.sizeMultipliers);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizeMultipliers), gl.STATIC_DRAW);

        callback();
    }

    this.renderScene = function () {
     
        var $ = this.$renderScene;

        for (var i = 0; i < engine.map.globalIlluminationColours.length; i++) {
            var srcColour = engine.map.globalIlluminationColours[i];
            
            this.globalIlluminationColours[i] = srcColour[0];
            this.globalIlluminationColours[i + 1] = srcColour[1];
            this.globalIlluminationColours[i + 2] = srcColour[2];
        }

        math3D.buildFrustumFromViewProjMatrix($.cameraFrustum, engine.camera.viewProjMatrix);

        engine.visibilityManager.buildVisibleWorldStaticMeshChunkField(
            this.visibleWorldStaticMeshChunkFieldForCamera, engine.camera.position, $.cameraFrustum, null);

        engine.visibilityManager.gatherVisibleActorIds(
            this.visibleActorIdsForCamera, engine.camera.position, $.cameraFrustum, null);

         engine.visibilityManager.gatherVisibleLightIdsFromVisibleObjectsIds(
            this.visibleLightIdsForCamera, this.visibleWorldStaticMeshChunkFieldForCamera, this.visibleActorIdsForCamera);

        engine.stats.numberOfVisibleWorldStaticMeshChunks = this.visibleWorldStaticMeshChunkFieldForCamera.countSetBits();
        engine.stats.numberOfVisibleActors = this.visibleActorIdsForCamera.length;
        engine.stats.numberOfVisibleLights = this.visibleLightIdsForCamera.length;

        this.buildShadowMaps(this.visibleLightIdsForCamera);

        this.renderingParameters.mode = 'main-render';

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.viewport(0, 0, engine.glManager.viewportInfo.width, engine.glManager.viewportInfo.height);

        gl.colorMask(true, true, true, true);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.disable(gl.BLEND);
        
        mat4.copy(this.renderingParameters.viewProjMatrix, engine.camera.viewProjMatrix);
        //this.renderingParameters.viewProjMatrix = cameraViewProjMatrix;

        this.prepareForStaticMeshMainRender();

        this.renderWorldStaticMesh(this.visibleWorldStaticMeshChunkFieldForCamera);

        this.renderActorStaticMeshes(this.visibleActorIdsForCamera);

        this.prepareForSkinnedMeshMainRender();

        this.renderActorSkinnedMeshes(this.visibleActorIdsForCamera);

        this.renderParticles();

        this.renderHudGuis();

        this.renderLightVolumes();
  
        this.renderWorldStaticMeshChunkAABBs();

        this.renderActorIdentifiers();

        this.renderActorBoundingSpheres();

        this.renderActorHitBoxes();

        this.renderActorCollisionSpheres();

        this.renderSectors();

        this.renderTriggers();

        //------ TEST CODE --------
        var worldStaticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);
        engine.stats.cameraIsWithinMap = engine.staticMeshMathHelper.determineIfPointIsWithinStaticMesh(engine.camera.position, worldStaticMesh);
        engine.lineDrawer.drawSphere(this.renderingParameters, worldStaticMesh.pointCompletelyOutsideOfExtremities, 0.1, RgbColours.Red, false);
        //-------------------------
    }

    this.buildShadowMaps = function (visibleLightIds) {

        engine.stats.numberOfShadowMapsBuiltThisFrame = 0;

        this.renderingParameters.mode = 'shadow-map-build';

        for (var i = 0; i < visibleLightIds.length; i++) {

            var lightId = visibleLightIds.items[i];

            var light = engine.map.lightsById[lightId];

            if (!light.enabled) {
                continue;
            }

            this.buildShadowMapForLight(light);
        }
    }

    this.buildShadowMapForLight = function (light) {

        if (light == null) {
            throw 'Light not found.';
        }

        var lightRenderState = engine.renderStateManager.lightRenderStatesById[light.id];

        if (lightRenderState == null) {
            throw 'Light render state not found.';
        }

        if (light.type == 'point') {

            this.buildPointLightShadowMapForLight(light, lightRenderState);
        }
    }

    this.buildPointLightShadowMapForLight = function (light, lightRenderState) {

        var shadowMap = engine.shadowMapManager.shadowMaps[lightRenderState.shadowMapIndex];

        for (var faceIndex = 0; faceIndex < 6; faceIndex++) {

            var face = this.pointLightShadowMapFaces[faceIndex];

            var faceRenderState = lightRenderState.pointLightShadowMapFaceStates[faceIndex];

            for (var phase = 0; phase < 2; phase++) {

                var isWorldStaticMeshPhase = phase == 0;

                if (isWorldStaticMeshPhase && !faceRenderState.rebuildForStaticObjectsThisFrame) {
                    continue;
                }

                if (!isWorldStaticMeshPhase && !faceRenderState.rebuildForDynamicObjectsThisFrame) {
                    continue;
                }

                engine.stats.numberOfShadowMapsBuiltThisFrame++;

                for (var pass = 0; pass < 2; pass++) {

                    var isBackPass = pass == 0;

                    this.buildPointLightShadowMapFacePass(shadowMap, light, lightRenderState, face, faceRenderState, isBackPass, isWorldStaticMeshPhase);
                }
            }
        }
    }

    this.buildPointLightShadowMapFacePass = function (shadowMap, light, lightRenderState, face, faceRenderState, isBackPass, isWorldStaticMeshPhase) {

        engine.shadowMapManager.buildViewProjMatrixForPointLightCubeMapFaceBuild(
            this.renderingParameters.viewProjMatrix, light.position, face);

        var bufferSize = engine.shadowMapManager.bufferSize;

        gl.viewport(0, 0, bufferSize, bufferSize);
        gl.clearColor(10000.0, 10000.0, 10000.0, 10000.0);

        if (isWorldStaticMeshPhase) {
            gl.colorMask(lightRenderState.shadowMapChannel == 0, false, lightRenderState.shadowMapChannel == 1, false);
        } else {
            gl.colorMask(false, lightRenderState.shadowMapChannel == 0, false, lightRenderState.shadowMapChannel == 1);
        }

        gl.disable(gl.BLEND);

        if (isBackPass) {

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapBuildBuffers.backPassFrameBuffer);
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.FRONT);

            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);

        } else {

            gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMap.frameBuffer);

            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face.target, shadowMap.cubeTexture, 0);

            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);

            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.shadowMapBuildBuffers.backPassBufferTexture);
        }

        if (isWorldStaticMeshPhase) {

            if (isBackPass) {

                this.effect = engine.effectManager.useEffect('static-mesh-shadow-map-build-back-pass');

            } else {

                this.effect = engine.effectManager.useEffect('static-mesh-shadow-map-build-front-pass');
            }

            gl.uniform3fv(this.effect.uniforms.lightWorldPosition, light.position);
            gl.uniform4fv(this.effect.uniforms.shadowMapMask, this.shadowMapMasksForStaticObjectsByChannel[lightRenderState.shadowMapChannel]);
            gl.uniform1f(this.effect.uniforms.shadowMapSize, engine.shadowMapManager.bufferSize);
            
            this.renderWorldStaticMesh(faceRenderState.visibleWorldStaticMeshChunkField);

            faceRenderState.lastStaticObjectBuildResult = ShadowMapBuildResult.Built;
        }
        else {

            // Render static actor meshes.
            if (isBackPass) {

                this.effect = engine.effectManager.useEffect('static-mesh-shadow-map-build-back-pass');

            } else {

                this.effect = engine.effectManager.useEffect('static-mesh-shadow-map-build-front-pass');
            }

            gl.uniform3fv(this.effect.uniforms.lightWorldPosition, light.position);
            gl.uniform4fv(this.effect.uniforms.shadowMapMask, this.shadowMapMasksForDynamicObjectsByChannel[lightRenderState.shadowMapChannel]);
            gl.uniform1f(this.effect.uniforms.shadowMapSize, engine.shadowMapManager.bufferSize);

            this.renderActorStaticMeshes(faceRenderState.visibleActorIds);

            // Render static skinned meshes.
            if (isBackPass) {

                this.effect = engine.effectManager.useEffect('skinned-mesh-shadow-map-build-back-pass');

            } else {

                this.effect = engine.effectManager.useEffect('skinned-mesh-shadow-map-build-front-pass');
            }

            gl.uniform3fv(this.effect.uniforms.lightWorldPosition, light.position);
            gl.uniform4fv(this.effect.uniforms.shadowMapMask, this.shadowMapMasksForDynamicObjectsByChannel[lightRenderState.shadowMapChannel]);
            gl.uniform1f(this.effect.uniforms.shadowMapSize, engine.shadowMapManager.bufferSize);

            this.renderActorSkinnedMeshes(faceRenderState.visibleActorIds);

            if (faceRenderState.visibleActorIds.length > 0) {

                faceRenderState.lastDynamicObjectBuildResult = ShadowMapBuildResult.BuiltWithDynamicObjects;

            } else {

                faceRenderState.lastDynamicObjectBuildResult = ShadowMapBuildResult.BuiltWithoutDynamicObjects;
            }
        }
    }

    this.prepareForStaticMeshMainRender = function (options) {

        this.effect = engine.effectManager.useEffect('static-mesh-main-render');
    }

    this.prepareForSkinnedMeshMainRender = function (options) {

        this.effect = engine.effectManager.useEffect('skinned-mesh-main-render');
    }

    this.renderWorldStaticMesh = function (visibleChunkField) {

        var staticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (staticMesh == null) {
            throw "World static mesh not loaded";
        }

        this.renderStaticMeshOptions.staticMeshChunkRenderStatesByIndex = engine.renderStateManager.worldStaticMeshChunkRenderStatesByIndex;
        this.renderStaticMeshOptions.visibleChunkField = visibleChunkField;
        this.renderStaticMeshOptions.effectiveLightIds = null;
        this.renderStaticMeshOptions.worldMatrix = math3D.identityMat4;
        
        this.renderStaticMesh(staticMesh);
    }

    this.renderActorStaticMeshes = function (actorIds) {

        for (var i = 0; i < actorIds.length; i++) {

            var actorId = actorIds.items[i];

            var actor = engine.map.actorsById[actorId];

            if (!actor.active || actor.staticMeshId == null) {
                continue;
            }

            var staticMesh = engine.staticMeshManager.getStaticMesh(actor.staticMeshId);

            if (staticMesh == null) {
                continue;
            }

            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];

            this.renderStaticMeshOptions.staticMeshChunkRenderStatesByIndex = null;
            this.renderStaticMeshOptions.visibleChunkField = null;
            this.renderStaticMeshOptions.effectiveLightIds = actorRenderState.effectiveLightIds;
            this.renderStaticMeshOptions.worldMatrix = actorRenderState.worldMatrix;

            this.renderStaticMesh(staticMesh);
        }
    }

    this.renderActorSkinnedMeshes = function (actorIds) {

        for (var i = 0; i < actorIds.length; i++) {

            var actorId = actorIds.items[i];

            var actor = engine.map.actorsById[actorId];

            if (!actor.active || actor.skinnedMeshId == null) {
                continue;
            }

            var skinnedMesh = engine.skinnedMeshManager.getSkinnedMesh(actor.skinnedMeshId);

            if (skinnedMesh == null) {
                continue;
            }

            var skinnedMeshAnimation = engine.skinnedMeshAnimationManager.getSkinnedMeshAnimation(actor.skinnedMeshAnimationId);

            if (skinnedMeshAnimation == null) {
                continue;
            }

            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];
      
            this.renderSkinnedMeshOptions.effectiveLightIds = actorRenderState.effectiveLightIds;
            this.renderSkinnedMeshOptions.frameIndex = actor.frameIndex;
            this.renderSkinnedMeshOptions.worldMatrix = actorRenderState.worldMatrix;
            
            this.renderSkinnedMesh(skinnedMesh, skinnedMeshAnimation);
        }
    }

    this.renderStaticMesh = function (staticMesh) {

        // Check the parameters.
        if (staticMesh == null) {
            throw "Static mesh is null!";
        }

        if (this.renderStaticMeshOptions.effectiveLightIds == null && this.renderStaticMeshOptions.staticMeshChunkRenderStatesByIndex == null) {
            throw "We can't render a static mesh without render states!";
        }

        // Set the uniforms.
        if (this.effect.uniforms.worldMatrix != null) {
            gl.uniformMatrix4fv(this.effect.uniforms.worldMatrix, false, this.renderStaticMeshOptions.worldMatrix);
        }

        if (this.effect.uniforms.viewProjMatrix != null) {
            gl.uniformMatrix4fv(this.effect.uniforms.viewProjMatrix, false, this.renderingParameters.viewProjMatrix);
        }

        // Bind the static mesh's buffers to the effect.
        this.bindStaticMeshBuffersToEffect(staticMesh);

        // Render the chunks.
        for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

            if (this.renderStaticMeshOptions.visibleChunkField == null ||
                this.renderStaticMeshOptions.visibleChunkField.getBit(chunkIndex)) {

                this.renderStaticMeshChunk(staticMesh, chunkIndex);
            }
        }
    }

    this.renderStaticMeshChunk = function (staticMesh, chunkIndex) {

        var chunk = staticMesh.chunks[chunkIndex];

        if (this.renderingParameters.mode == 'main-render') {

            this.prepareStaticMeshChunkForMainRender(chunk, chunkIndex);
        }

        gl.drawElements(gl.TRIANGLES, chunk.numFaces * 3, gl.UNSIGNED_SHORT, chunk.startIndex * 2);
    }

    this.prepareStaticMeshChunkForMainRender = function (chunk, chunkIndex) {

        // Resolve the effective light IDs, either from the chunk render states (e.g. for the world static mesh) or 
        // from the static mesh render state (for actors ands such like).
        var effectiveLightIds = null;

        if (this.renderStaticMeshOptions.staticMeshChunkRenderStatesByIndex != null) {

            var chunkRenderState = this.renderStaticMeshOptions.staticMeshChunkRenderStatesByIndex[chunkIndex];

            if (chunkRenderState == null) {
                throw "Render state not found for chunk.";
            }

            effectiveLightIds = chunkRenderState.effectiveLightIds;

        } else {

            effectiveLightIds = this.renderStaticMeshOptions.effectiveLightIds;
        }

        var material = this.coalesceMaterial(chunk.materialId);

        this.prepareStandardMaterial(material, this.effect, effectiveLightIds, engine.camera);
    }
   
    this.renderSkinnedMesh = function (skinnedMesh, skinnedMeshAnimation) {

        // Check the parameters.
        if (skinnedMesh == null) {
            throw "Skinned mesh is null!";
        }

        if (skinnedMeshAnimation == null) {
            throw "Skinned mesh animation is null!";
        }

        // Set the uniforms.
        if (this.effect.uniforms.worldMatrix != null) {
            gl.uniformMatrix4fv(this.effect.uniforms.worldMatrix, false, this.renderSkinnedMeshOptions.worldMatrix);
        }

        if (this.effect.uniforms.viewProjMatrix != null) {
            gl.uniformMatrix4fv(this.effect.uniforms.viewProjMatrix, false, this.renderingParameters.viewProjMatrix);
        }

        if (this.effect.uniforms.boneMatrices != null) {

            this.buildSkinnedMeshAnimationBoneMatrixSetForFrame(
                skinnedMesh, skinnedMeshAnimation, this.renderSkinnedMeshOptions.frameIndex);

            math3D.concatenateMatricesToSingleArray(
                this.renderSkinnedMeshTempValues.concatenatedBoneMatrices,
                this.renderSkinnedMeshMatrices.hierachicalBoneMatrices);

            gl.uniformMatrix4fv(
                this.effect.uniforms.boneMatrices, false,
                this.renderSkinnedMeshTempValues.concatenatedBoneMatrices);
        }

        // Bind the skinned mesh's buffers to the effect.
        this.bindSkinnedMeshBuffersToEffect(skinnedMesh);

        var material = this.coalesceMaterial('tiled-floor-1'); // FIXME!

        if (this.renderingParameters.mode == 'main-render') {

            this.prepareStandardMaterial(material, this.effect, this.renderSkinnedMeshOptions.effectiveLightIds, engine.camera);
        }

        // Draw the skinned mesh's triangles.
        gl.drawArrays(gl.TRIANGLES, 0, skinnedMesh.numberOfVerts);
    }

    this.buildSkinnedMeshAnimationBoneMatrixSetForFrame = function (skinnedMesh, skinnedMeshAnimation, frameIndex) {

        var fromFrameIndex = Math.floor(frameIndex);
        var toFrameIndex = fromFrameIndex + 1;
        if (toFrameIndex >= skinnedMeshAnimation.frames.length) {
            toFrameIndex = 0;
        }

        var lerpFactor = frameIndex - fromFrameIndex;

        var fromAnimationFrame = skinnedMeshAnimation.frames[fromFrameIndex];
        var toAnimationFrame = skinnedMeshAnimation.frames[toFrameIndex];

        for (var boneIndex = 0; boneIndex < this.maxSkinnedMeshBones; boneIndex++) {

            var boneMatrix = this.renderSkinnedMeshMatrices.relativeBoneMatrices[boneIndex];
            
            mat4.identity(boneMatrix);

            var bone = skinnedMesh.bones[boneIndex];
            if (bone == null) {
                continue;
            }

            vec3.scale(this.renderSkinnedMeshTempValues.inversePosition, bone.position, -1);

            var fromBoneTransform = fromAnimationFrame.trans[boneIndex];
            var toBoneTransform = toAnimationFrame.trans[boneIndex];

            // Create the slerped rotation quaternion.
            quat.slerp(
                this.renderSkinnedMeshTempValues.slerpedRotationQuaternion,
                fromBoneTransform.quat, toBoneTransform.quat, lerpFactor);

            // Calculate the bone rotation matrix.
            mat4.fromQuat(
                this.renderSkinnedMeshTempValues.boneRotationMatrix,
                this.renderSkinnedMeshTempValues.slerpedRotationQuaternion);

            // Calculate the bone matrix.
            mat4.translate(boneMatrix, boneMatrix, bone.position);            
            mat4.multiply(boneMatrix, boneMatrix, this.renderSkinnedMeshTempValues.boneRotationMatrix);
            mat4.translate(boneMatrix, boneMatrix, this.renderSkinnedMeshTempValues.inversePosition);
        }

        // Apply the hierachy to the bone matrices.
        this.applyHierachyToSkinnedMeshRelativeBoneMatrices(skinnedMesh);
    }

    this.applyHierachyToSkinnedMeshRelativeBoneMatrices = function (skinnedMesh) {

        for (var boneIndex = 0; boneIndex < this.maxSkinnedMeshBones; boneIndex++) {

            var hierachicalBoneMatrix = this.renderSkinnedMeshMatrices.hierachicalBoneMatrices[boneIndex];

            var bone = skinnedMesh.bones[boneIndex];
            if (bone == null) {
                continue;
            }

            mat4.copy(hierachicalBoneMatrix, this.renderSkinnedMeshMatrices.relativeBoneMatrices[boneIndex]);

            var ancestorBoneIndex = bone.parentBoneIndex;

            while (ancestorBoneIndex != -1) {

                var ancestorBone = skinnedMesh.bones[ancestorBoneIndex];
                var ancestorMatrix = this.renderSkinnedMeshMatrices.relativeBoneMatrices[ancestorBoneIndex];

                mat4.multiply(hierachicalBoneMatrix, ancestorMatrix, hierachicalBoneMatrix);

                ancestorBoneIndex = ancestorBone.parentBoneIndex;
            }
        }
    }

    this.bindStaticMeshBuffersToEffect = function (staticMesh) {

        // Bind the vertex buffer.
        if (this.effect.attributes.vertexPosition != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.vertexBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexPosition,
                3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexPosition);
        }

        // Bind the normals buffer.
        if (this.effect.attributes.vertexNormal != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.normalsBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexNormal,
                3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexNormal);
        }

        // Bind the tangents buffer.
        if (this.effect.attributes.vertexTangent != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.tangentsBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexTangent,
                3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexTangent);
        }

        // Bind the bitangents buffer.
        if (this.effect.attributes.vertexBitangent != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.bitangentsBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexBitangent,
                3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexBitangent);
        }

        // Bind the tex coord buffer.
        if (this.effect.attributes.vertexTexCoord != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.texCoordBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexTexCoord,
                2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexTexCoord);
        }

        // Bind the index buffer.
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, staticMesh.buffers.indexBuffer);
    }

    this.bindSkinnedMeshBuffersToEffect = function (skinnedMesh) {

        // Bind the vertex buffer.
        if (this.effect.attributes.vertexPosition != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.vertexBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexPosition,
                3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexPosition);
        }

        // Bind the normals buffer.
        if (this.effect.attributes.vertexNormal != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.normalsBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexNormal,
                3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexNormal);
        }

        // Bind the tex coord buffer.
        if (this.effect.attributes.vertexTexCoord != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.texCoordBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexTexCoord,
                2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexTexCoord);
        }

        // Bind the first bone indexes.
        if (this.effect.attributes.firstBoneIndex != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.firstBoneIndexes);
            gl.vertexAttribPointer(
                this.effect.attributes.firstBoneIndex,
                1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.firstBoneIndex);
        }

        // Bind the second bone indexes.
        if (this.effect.attributes.secondBoneIndex != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.secondBoneIndexes);
            gl.vertexAttribPointer(
                this.effect.attributes.secondBoneIndex,
                1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.secondBoneIndex);
        }

        // Bind the third bone indexes.
        if (this.effect.attributes.thirdBoneIndex != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.thirdBoneIndexes);
            gl.vertexAttribPointer(
                this.effect.attributes.thirdBoneIndex,
                1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.thirdBoneIndex);
        }

        // Bind the fourth bone indexes.
        if (this.effect.attributes.fourthBoneIndex != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.fourthBoneIndexes);
            gl.vertexAttribPointer(
                this.effect.attributes.fourthBoneIndex,
                1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.fourthBoneIndex);
        }

        // Bind the fifth bone indexes.
        if (this.effect.attributes.fifthBoneIndex != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.fifthBoneIndexes);
            gl.vertexAttribPointer(
                this.effect.attributes.fifthBoneIndex,
                1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.fifthBoneIndex);
        }

        // Bind the first weights.
        if (this.effect.attributes.firstWeight != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.firstWeights);
            gl.vertexAttribPointer(
                this.effect.attributes.firstWeight,
                1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.firstWeight);
        }

        // Bind the second weights.
        if (this.effect.attributes.secondWeight != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.secondWeights);
            gl.vertexAttribPointer(
                this.effect.attributes.secondWeight,
                1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.secondWeight);
        }

        // Bind the third weights.
        if (this.effect.attributes.thirdWeight != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.thirdWeights);
            gl.vertexAttribPointer(
                this.effect.attributes.thirdWeight,
                1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.thirdWeight);
        }

        // Bind the fourth weights.
        if (this.effect.attributes.fourthWeight != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.fourthWeights);
            gl.vertexAttribPointer(
                this.effect.attributes.fourthWeight,
                1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.fourthWeight);
        }

        // Bind the fifth weights.
        if (this.effect.attributes.fifthWeight != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.fifthWeights);
            gl.vertexAttribPointer(
                this.effect.attributes.fifthWeight,
                1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.fifthWeight);
        }
    }

    this.renderParticles = function () {

        var effect = engine.effectManager.useEffect('particle');

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        gl.enable(gl.DEPTH_TEST);

        // Set the uniforms.
        gl.uniformMatrix4fv(effect.uniforms.viewProjMatrix, false, this.renderingParameters.viewProjMatrix);
        gl.uniform3fv(effect.uniforms.cameraXAxis, engine.camera.axes.xAxis);
        gl.uniform3fv(effect.uniforms.cameraYAxis, engine.camera.axes.yAxis);
        gl.uniform2f(effect.uniforms.size, 1, 1); // FIXME
      
        // Bind the offsets buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVertexBuffers.offsets);
        gl.vertexAttribPointer(effect.attributes.vertexOffset, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(effect.attributes.vertexOffset);

        // Bind the texture cords buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particleVertexBuffers.texCoords);
        gl.vertexAttribPointer(effect.attributes.vertexTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(effect.attributes.vertexTexCoord);

        // Bind texture 1.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.coalesceTexture('particle-1', 'system/missing-diffuse-texture')); // FIXME

        // Bind texture 2.
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.coalesceTexture('particle-2', 'system/missing-diffuse-texture')); // FIXME

        gl.uniform1i(effect.uniforms.texture1Sampler, 0);
        gl.uniform1i(effect.uniforms.texture2Sampler, 1);

        for (var emitterId in engine.map.emittersById) {

            var emitter = engine.map.emittersById[emitterId];

            for (var i = 0; i < emitter.particles.length; i++) {

                var particle = emitter.particles[i];

                if (!particle.active) {
                    continue;
                }

                gl.uniform3fv(effect.uniforms.position, particle.position);

                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        }
    }

    this.renderHudGuis = function () {

        for (var guiId in engine.map.guisById) {

            var gui = engine.map.guisById[guiId];

            this.renderGui(gui); // FIXME - only HUDs!
        }
    }
    
    this.renderGui = function (gui) {

        var guiLayout = engine.guiLayoutManager.getGuiLayout(gui.layoutId);
        if (guiLayout == null) {
            return;
        }

        var spriteSheet = engine.spriteSheetManager.getSpriteSheet(guiLayout.spriteSheetId);
        if (spriteSheet == null) {
            return;
        }

        var guiRenderState = engine.renderStateManager.guiRenderStatesById[gui.id];

        var effect = engine.effectManager.useEffect('gui');

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);

        // Bind the texture.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.coalesceTexture(spriteSheet.textureId, 'system/missing-diffuse-texture'));

        // Bind the size multipliers buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.guiVertexBuffers.sizeMultipliers);
        gl.vertexAttribPointer(effect.attributes.sizeMultipliers, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(effect.attributes.sizeMultipliers);

        // Execute the draw specs.
        for (var i = 0; i < guiRenderState.drawSpecs.length; i++) {

            var drawSpec = guiRenderState.drawSpecs.items[i];

            if (!drawSpec.visible) {
                continue;
            }

            gl.uniform2fv(effect.uniforms.position, drawSpec.position);
            gl.uniform2fv(effect.uniforms.size, drawSpec.size);

            gl.uniform2f(effect.uniforms.xAxis, Math.cos(drawSpec.rotation), Math.sin(drawSpec.rotation));
            gl.uniform2f(effect.uniforms.yAxis, -Math.sin(drawSpec.rotation), Math.cos(drawSpec.rotation));

            gl.uniform2f(effect.uniforms.scale, 1.0, engine.glManager.viewportInfo.width / engine.glManager.viewportInfo.height);
            gl.uniform2fv(effect.uniforms.uvPosition, drawSpec.uvPosition);
            gl.uniform2fv(effect.uniforms.uvSize, drawSpec.uvSize);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

    this.renderLightVolumes = function () {

        for (var lightId in engine.map.lightsById) {

            var light = engine.map.lightsById[lightId];

            if (this.renderingOptions.renderLightVolumes || this.renderingOptions.renderLightVolumeForLightId == light.id) {

                engine.lineDrawer.drawSphere(this.renderingParameters, light.position, 0.1, light.colour, true);
                engine.lineDrawer.drawSphere(this.renderingParameters, light.position, light.radius, RgbColours.Red, true);
            }
        }
    }

    this.renderWorldStaticMeshChunkAABBs = function () {

        var $ = this.$renderWorldStaticMeshChunkAABBs;

        if (!this.renderingOptions.renderWorldMeshChunkAABBs) {
            return;
        }

        var staticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (staticMesh == null) {
            return;
        }

        for (var i = 0; i < staticMesh.chunks.length; i++) {

            var chunk = staticMesh.chunks[i];

            math3D.calculateAABBSize($.aabbSize, chunk.aabb);

            engine.lineDrawer.drawCube(this.renderingParameters, chunk.aabb.from, $.aabbSize, RgbColours.Red, false);
        }
    }

    this.renderActorIdentifiers = function () {

        if (!this.renderingOptions.renderActorIdentifiers) {
            return;
        }

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];
            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];

            /*if (!actor.active) {
                continue;
            }*/

            engine.lineDrawer.drawSphere(this.renderingParameters, actorRenderState.position, 0.1, RgbColours.Red, false);
        }
    }

    this.renderActorBoundingSpheres = function () {

        if (!this.renderingOptions.renderActorBoundingSpheres) {
            return;
        }

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];;
            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];

            /*if (!actor.enabled) {
                continue;
            }*/

            var sphereRadius = 0;

            if (!util.stringIsNullOrEmpty(actor.staticMeshId)) {

                var staticMesh = engine.staticMeshManager.getStaticMesh(actor.staticMeshId);

                if (staticMesh != null) {
                    sphereRadius = staticMesh.rotationSafeBoundingSphereRadius;
                }

            } else if (!util.stringIsNullOrEmpty(actor.skinnedMeshId)) {

                var skinnedMesh = engine.skinnedMeshManager.getSkinnedMesh(actor.skinnedMeshId);

                if (skinnedMesh != null) {
                    sphereRadius = skinnedMesh.rotationSafeBoundingSphereRadius;
                }
            }

            if (sphereRadius > 0) {
                engine.lineDrawer.drawSphere(this.renderingParameters, actorRenderState.position, sphereRadius, RgbColours.Red, false);
            }
        }
    }

    this.renderActorHitBoxes = function () {

        var $ = this.$renderActorHitBoxes;

        if (!this.renderingOptions.renderActorHitBoxes) {
            return;
        }

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];;
            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];

            if (actor.hitBox != null) {

                math3D.calculateAABBSize($.aabbSize, actorRenderState.transformedHitBox);

                engine.lineDrawer.drawCube(this.renderingParameters, actorRenderState.transformedHitBox.from, $.aabbSize, RgbColours.Red, false);
            }
        }
    }

    this.renderActorCollisionSpheres = function () {

        var $ = this.$renderActorHitBoxes;

        if (!this.renderingOptions.renderActorCollisionSpheres) {
            return;
        }

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];;
            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];

            if (actor.collisionSphere != null) {

                engine.lineDrawer.drawSphere(this.renderingParameters, actorRenderState.transformedCollisionSphere.position, actorRenderState.transformedCollisionSphere.radius, RgbColours.Red, false);
            }
        }
    }

    this.renderSectors = function () {

        if (!this.renderingOptions.renderSectors) {
            return;
        }

        var cameraSectorIndex = engine.visibilityManager.getSectorIndexAtPosition(engine.camera.position);

        var cameraSector = engine.sectorSet.sectors[cameraSectorIndex];

        for (var sectorIndex = 0; sectorIndex < engine.sectorSet.sectors.length; sectorIndex++) {

            var sectorState = engine.visibilityManager.sectorStatesBySectorIndex[sectorIndex];

            var colour = null;
            if (sectorIndex == cameraSectorIndex) {
                colour = RgbColours.Green;
            } else {

                if (cameraSector != null && util.arrayIndexOf(cameraSector.visibleSectorIndexes, sectorIndex) != -1) {
                    colour = RgbColours.Blue;
                } else {
                    colour = RgbColours.Red;
                }
            }

            engine.lineDrawer.drawCube(this.renderingParameters, sectorState.origin, engine.sectorSet.metrics.sectorSize, colour, false);
        }
    }

    this.renderTriggers = function () {

        if (!this.renderingOptions.renderTriggers) {
            return;
        }

        for (var triggerId in engine.map.triggersById) {

            var trigger = engine.map.triggersById[triggerId];

            engine.lineDrawer.drawCube(this.renderingParameters, trigger.position, trigger.size, RgbColours.Red, false);
        }
    }

    this.prepareStandardMaterial = function (material, effect, effectiveLightIds, camera) {

        for (var i = 0; i < this.maxStandardMaterialLights; i++) {

            var lightId = i < effectiveLightIds.length ? effectiveLightIds.items[i] : null;

            var light = lightId != null ? engine.map.lightsById[lightId] : null;

            if (light != null && light.enabled && light.radius > 0) {

                var lightRenderState = engine.renderStateManager.lightRenderStatesById[light.id];

                this.standardMaterialShaderData.lightEnableds[i] = 1;
                util.arraySetMany(this.standardMaterialShaderData.lightPositions, i * 3, light.position);
                this.standardMaterialShaderData.lightRadiusSqrs[i] = light.radius * light.radius;
                util.arraySetMany(this.standardMaterialShaderData.lightColours, i * 3, light.colour);
                this.standardMaterialShaderData.lightCastsShadows[i] = light.castsShadows ? 1 : 0;

                if (light.castsShadows) {

                    util.arraySetMany(this.standardMaterialShaderData.lightStaticObjectShadowMapMasks, i * 4, this.shadowMapMasksForStaticObjectsByChannel[lightRenderState.shadowMapChannel]);
                    util.arraySetMany(this.standardMaterialShaderData.lightDynamicObjectShadowMapMasks, i * 4, this.shadowMapMasksForDynamicObjectsByChannel[lightRenderState.shadowMapChannel]);
                    this.standardMaterialShaderData.pointLightShadowMapSamplers[i] = 6 + i;

                    gl.activeTexture(gl.TEXTURE6 + i);
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, engine.shadowMapManager.shadowMaps[lightRenderState.shadowMapIndex].cubeTexture);

                } else {

                    util.arraySetMany(this.standardMaterialShaderData.lightStaticObjectShadowMapMasks, i * 4, math3D.zeroVec4);
                    util.arraySetMany(this.standardMaterialShaderData.lightDynamicObjectShadowMapMasks, i * 4, math3D.zeroVec4);
                    this.standardMaterialShaderData.pointLightShadowMapSamplers[i] = 3; // Point it at the reflection-cube texture unit, so that it always has something to point to, even if it isn't used.
                }

            } else {

                this.standardMaterialShaderData.lightEnableds[i] = 0;
                util.arraySetMany(this.standardMaterialShaderData.lightPositions, i * 3, math3D.zeroVec3);
                this.standardMaterialShaderData.lightRadiusSqrs[i] = 0;
                util.arraySetMany(this.standardMaterialShaderData.lightColours, i * 3, math3D.zeroVec3);
                this.standardMaterialShaderData.lightCastsShadows[i] = 0;
                util.arraySetMany(this.standardMaterialShaderData.lightStaticObjectShadowMapMasks, i * 4, math3D.zeroVec4);
                util.arraySetMany(this.standardMaterialShaderData.lightDynamicObjectShadowMapMasks, i * 4, math3D.zeroVec4);
                this.standardMaterialShaderData.pointLightShadowMapSamplers[i] = 3; // Point it at the reflection-cube texture unit, so that it always has something to point to, even if it isn't used.
            }
        }

        gl.uniform1iv(effect.uniforms.lightEnableds, this.standardMaterialShaderData.lightEnableds);
        gl.uniform3fv(effect.uniforms.lightWorldSpacePositions, this.standardMaterialShaderData.lightPositions);
        gl.uniform1fv(effect.uniforms.lightRadiusSqrs, this.standardMaterialShaderData.lightRadiusSqrs);
        gl.uniform3fv(effect.uniforms.lightColours, this.standardMaterialShaderData.lightColours);
        gl.uniform1iv(effect.uniforms.lightCastsShadows, this.standardMaterialShaderData.lightCastsShadows);
        gl.uniform4fv(effect.uniforms.lightStaticObjectShadowMapMasks, this.standardMaterialShaderData.lightStaticObjectShadowMapMasks);
        gl.uniform4fv(effect.uniforms.lightDynamicObjectShadowMapMasks, this.standardMaterialShaderData.lightDynamicObjectShadowMapMasks);
        gl.uniform3fv(effect.uniforms.cameraWorldSpacePosition, camera.position);
        gl.uniform3fv(effect.uniforms.globalIlluminationNormals, this.globalIlluminationNormals);
        gl.uniform3fv(effect.uniforms.globalIlluminationColours, this.globalIlluminationColours);
        
        

        //gl.uniform3fv(effect.uniforms.globalIlluminationColour, engine.map.globalIllumination.colour);
       
        gl.uniform1i(effect.uniforms.hasSelfIllumination, material.selfIlluminationTextureId != null);

        gl.uniform1i(effect.uniforms.diffuseSampler, 0);
        gl.uniform1i(effect.uniforms.normalSampler, 1);
        gl.uniform1i(effect.uniforms.selfIlluminationSampler, 2);
        //gl.uniform1i(effect.uniforms.globalIlluminationSampler, 5);
        gl.uniform1iv(effect.uniforms.pointLightShadowMapSamplers, this.standardMaterialShaderData.pointLightShadowMapSamplers);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.coalesceTexture(material.diffuseTextureId, 'system/missing-diffuse-texture'));

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.coalesceTexture(material.normalTextureId, 'system/missing-normal-texture'));

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.coalesceTexture(material.selfIlluminationTextureId, 'system/missing-diffuse-texture'));

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.coalesceTexture(null, 'system/dummy-cube')); // FIXME

        //gl.activeTexture(gl.TEXTURE5);
        //gl.bindTexture(gl.TEXTURE_CUBE_MAP, engine.textureManager.getTexture('system/gi-cube'));
    }

    this.coalesceMaterial = function (materialId) {

        var material = engine.materialManager.getMaterial(materialId);
        
        if (material == null) {

            engine.materialManager.loadMaterial(materialId);

            material = {
            
            }
        }

        return material;
    }

    this.coalesceTexture = function (textureId, fallbackTextureId) {

        var texture = engine.textureManager.getTexture(textureId);
 
        if (texture == null) {

            engine.textureManager.loadTexture(textureId);

            texture = engine.textureManager.getTexture(fallbackTextureId);
        }

        return texture;
    }

    this.log = function (message) {

        console.log('Renderer: ' + message);
    }

    // Function locals.
    this.$renderScene = {
        cameraFrustum: new Frustum()
    }

    this.$renderWorldStaticMeshChunkAABBs = {
        aabbSize: vec3.create()
    }

    this.$renderActorHitBoxes = {
        aabbSize: vec3.create()
    }
}