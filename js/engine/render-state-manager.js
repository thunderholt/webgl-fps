function RenderStateManager(engine) {

    this.lightRenderStatesById = {};
    this.worldStaticMeshChunkRenderStatesByIndex = [];

    this.init = function (callback) {

        callback();
    }

    /*this.invalidateAllLightRenderStates = function () {
        for (var lightId in this.lightRenderStatesById) {
            var lightRenderState = this.lightRenderStatesById[lightId];
            lightRenderState.validFor = null;
        }
    }*/

    this.updateRenderStates = function () {

        this.ensureActorResourcesAreLoaded();

        this.checkShadowMapAllocations();

        this.updateLightRenderStates();

        this.updateWorldStaticMeshRenderStates();

        this.updateActorAnimationFrameIndexes();

        //var invalidLightIds = this.findInvalidLightIds();

        //this.updateWorldStaticMeshChunkRenderStates(invalidLightIds);

        //this.updateLightRenderStates(invalidLightIds);
    }

    this.ensureActorResourcesAreLoaded = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            if (!util.stringIsNullOrEmpty(actor.staticMeshId)) {

                var staticMesh = engine.staticMeshManager.getStaticMesh(actor.staticMeshId);

                if (staticMesh == null) {
                    engine.staticMeshManager.loadStaticMesh(actor.staticMeshId, { buildRotationSafeBoundingSphere: true });
                }
            }

            if (!util.stringIsNullOrEmpty(actor.skinnedMeshId)) {

                var skinnedMesh = engine.skinnedMeshManager.getSkinnedMesh(actor.skinnedMeshId);

                if (skinnedMesh == null) {
                    engine.skinnedMeshManager.loadSkinnedMesh(actor.skinnedMeshId, {});
                }
            }

            if (!util.stringIsNullOrEmpty(actor.skinnedMeshAnimationId)) {

                var skinnedMeshAnimation = engine.skinnedMeshAnimationManager.getSkinnedMeshAnimation(actor.skinnedMeshAnimationId);

                if (skinnedMeshAnimation == null) {
                    engine.skinnedMeshAnimationManager.loadSkinnedMeshAnimation(actor.skinnedMeshAnimationId, {});
                }
            }
        }
    }

    this.updateActorAnimationFrameIndexes = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            if (actor.skinnedMeshAnimationId != null) {

                var skinnedMeshAnimation = engine.skinnedMeshAnimationManager.getSkinnedMeshAnimation(actor.skinnedMeshAnimationId);

                if (skinnedMeshAnimation == null) {
                    continue;
                }

                actor.frameIndex += engine.frameTimer.frameDelta / 30;//10;

                if (actor.frameIndex >= skinnedMeshAnimation.frames.length) {
                    actor.frameIndex -= skinnedMeshAnimation.frames.length;
                }
            }
        }
    }

    this.checkShadowMapAllocations = function () {

        for (var lightId in engine.map.lightsById) {

            var light = engine.map.lightsById[lightId];

            var lightRenderState = this.coalesceLightRenderState(light.id);

            if (lightRenderState.shadowMapIndex == null) {

                var allocation = engine.shadowMapManager.allocateShadowMap(light.type);

                lightRenderState.shadowMapIndex = allocation.index;
                lightRenderState.shadowMapChannel = allocation.channel;
            }
        }
    }

    this.updateLightRenderStates = function () {

        for (var lightId in engine.map.lightsById) {

            var light = engine.map.lightsById[lightId];

            if (!light.enabled) {
                continue;
            }

            var lightRenderState = this.coalesceLightRenderState(light.id);

            lightRenderState.rebuildWorldStaticMeshEffectivenessThisFrame = lightRenderState.isDirty;

            if (light.type == 'point') {

                for (var faceIndex = 0; faceIndex < 6; faceIndex++) {

                    var face = engine.renderer.pointLightShadowMapFaces[faceIndex];

                    var faceRenderState = lightRenderState.pointLightShadowMapFaceStates[faceIndex];

                    if (lightRenderState.isDirty) {

                        var viewProjMatrix = engine.shadowMapManager.buildViewProjMatrixForPointLightCubeMapFaceBuild(light.position, face);

                        faceRenderState.frustum = math3D.buildFrustumFromViewProjMatrix(viewProjMatrix);

                        faceRenderState.visibleWorldStaticMeshChunkIndexes =
                            engine.visibilityManager.gatherVisibleWorldStaticMeshChunkIndexes(light.position, faceRenderState.frustum);
                    }

                    faceRenderState.visibleActorIds =
                        engine.visibilityManager.gatherVisibleActorIds(light.position, faceRenderState.frustum);

                    faceRenderState.rebuildForStaticObjectsThisFrame =
                        lightRenderState.isDirty ||
                        faceRenderState.lastStaticObjectBuildResult == ShadowMapBuildResult.NotBuilt;

                    faceRenderState.rebuildForDynamicObjectsThisFrame =
                        faceRenderState.visibleActorIds.length > 0 ||
                        (faceRenderState.visibleActorIds.length == 0 && faceRenderState.lastDynamicObjectBuildResult == ShadowMapBuildResult.BuiltWithDynamicObjects) ||
                        faceRenderState.lastDynamicObjectBuildResult == ShadowMapBuildResult.NotBuilt;
                }
            }

            lightRenderState.isDirty = false;
        }
    }

    this.updateWorldStaticMeshRenderStates = function () {

        var staticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (staticMesh == null) {
            return;
        }

        for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];
            var chunkRenderState = this.coalesceWorldStaticMeshChunkRenderState(chunkIndex);

            // TODO - don't loop through every single light - use sectors to find relevant ones.
            for (var lightId in engine.map.lightsById) {

                var light = engine.map.lightsById[lightId];

                var lightRenderState = this.coalesceLightRenderState(light.id);

                if (!lightRenderState.rebuildWorldStaticMeshEffectivenessThisFrame) {
                    continue;
                }

                var chunkIsEffectedByLight = false;

                if (light.enabled) {

                    var lightSphere = new Sphere(light.position, light.radius);

                    chunkIsEffectedByLight = math3D.checkSphereIntersectsAABB(lightSphere, chunk.aabb);
                }

                var existingEffectiveLightIdIndex = util.arrayIndexOf(chunkRenderState.effectiveLightIds, light.id);

                if (chunkIsEffectedByLight) {

                    if (existingEffectiveLightIdIndex == -1) {
                        chunkRenderState.effectiveLightIds.push(light.id);
                    }

                } else {

                    if (existingEffectiveLightIdIndex != -1) {
                        chunkRenderState.effectiveLightIds.splice(existingEffectiveLightIdIndex, 1);
                    }
                }
            }
        }    
    }
    
    this.buildStaticMeshRenderState = function (staticMesh, position) {

        var staticMeshRenderState = {
            effectiveLightIds: []
        };

        // TODO - don't loop through all of the lights. Use the sectors to find the relevant ones.
        for (var lightId in engine.map.lightsById) {

            var light = engine.map.lightsById[lightId];

            if (!light.enabled) {
                continue;
            }

            var lightSphere = new Sphere(light.position, light.radius);

            var staticMeshBoundingSphere = new Sphere(position, staticMesh.rotationSafeBoundingSphereRadius);

            var isEffectedByLight = math3D.checkSphereIntersectsSphere(lightSphere, staticMeshBoundingSphere);

            if (isEffectedByLight) {
                staticMeshRenderState.effectiveLightIds.push(light.id);
            }
        }

        return staticMeshRenderState;
    }

    this.coalesceLightRenderState = function (lightId) {

        var lightRenderState = this.lightRenderStatesById[lightId];

        if (lightRenderState == null) {

            lightRenderState = {
                isDirty: true,
                shadowMapIndex: null,
                shadowMapChannel: null,
                rebuildWorldStaticMeshEffectivenessThisFrame: false,
                pointLightShadowMapFaceStates: [],
                //validFor: null // FIXME - remove
            };

            for (var i = 0; i < 6; i++) {

                var pointLightShadowMapFaceState = {
                    rebuildForStaticObjectsThisFrame: false,
                    rebuildForDynamicObjectsThisFrame: false,
                    frustum: null,
                    visibleWorldStaticMeshChunkIndexes: [],
                    visibleActorIds: [],
                    lastStaticObjectBuildResult: ShadowMapBuildResult.NotBuilt,
                    lastDynamicObjectBuildResult: ShadowMapBuildResult.NotBuilt
                };

                lightRenderState.pointLightShadowMapFaceStates.push(pointLightShadowMapFaceState);
            }

            this.lightRenderStatesById[lightId] = lightRenderState;
        }

        return lightRenderState;
    }



    this.coalesceWorldStaticMeshChunkRenderState = function (chunkIndex) {

        var chunkRenderState = this.worldStaticMeshChunkRenderStatesByIndex[chunkIndex];

        if (chunkRenderState == null) {

            chunkRenderState = {
                effectiveLightIds: []
            };

            this.worldStaticMeshChunkRenderStatesByIndex[chunkIndex] = chunkRenderState;
        }

        return chunkRenderState;
    }

    this.cleanUp = function () {

        this.lightRenderStatesById = {};
        this.worldStaticMeshChunkRenderStatesByIndex = [];
    }
}