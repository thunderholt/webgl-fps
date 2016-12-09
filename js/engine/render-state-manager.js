function RenderStateManager(engine) {

    this.actorRenderStatesById = {};
    this.lightRenderStatesById = {};
    this.worldStaticMeshChunkRenderStatesByIndex = [];

    this.updateLightRenderStatesTempValues = {
        viewProjMatrixForPointLightCubeMapFaceBuild: mat4.create()
    }

    this.init = function (callback) {

        callback();
    }

    this.updateRenderStates = function () {

        this.ensureActorResourcesAreLoaded();

        this.checkShadowMapAllocations();

        this.updateLightBoundingSpheres();
        this.updateActorBoundingSpheres();

        this.updateLightRenderStates();
        this.updateWorldStaticMeshRenderStates();
        this.updateActorRenderStates();

        this.updateActorAnimationFrameIndexes();
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
                    engine.skinnedMeshManager.loadSkinnedMesh(actor.skinnedMeshId, { buildRotationSafeBoundingSphere: true });
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

    this.checkShadowMapAllocations = function () {

        for (var lightId in engine.map.lightsById) {

            var light = engine.map.lightsById[lightId];

            if (!light.enabled || !light.castsShadows) {
                continue;
            }

            var lightRenderState = this.coalesceLightRenderState(light.id);

            if (lightRenderState.shadowMapIndex == null) {

                var allocation = engine.shadowMapManager.allocateShadowMap(light.type);

                lightRenderState.shadowMapIndex = allocation.index;
                lightRenderState.shadowMapChannel = allocation.channel;
            }
        }
    }

    this.updateLightBoundingSpheres = function () {

        for (var lightId in engine.map.lightsById) {

            var light = engine.map.lightsById[lightId];

            var lightRenderState = this.coalesceLightRenderState(light.id);

            if (light.type == 'point') {

                lightRenderState.boundingSphere.position = light.position;
                lightRenderState.boundingSphere.radius = light.radius;
            }
        }
    }

    this.updateActorBoundingSpheres = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            var actorRenderState = this.coalesceActorRenderState(actorId);

            // Update the actor's bounding sphere.
            var boundingSphereRadius = 0;

            if (!util.stringIsNullOrEmpty(actor.staticMeshId)) {

                var staticMesh = engine.staticMeshManager.getStaticMesh(actor.staticMeshId);

                if (staticMesh != null) {
                    boundingSphereRadius = staticMesh.rotationSafeBoundingSphereRadius;
                }

            } else if (!util.stringIsNullOrEmpty(actor.skinnedMeshId)) {

                var skinnedMesh = engine.skinnedMeshManager.getSkinnedMesh(actor.skinnedMeshId);

                if (skinnedMesh != null) {
                    boundingSphereRadius = skinnedMesh.rotationSafeBoundingSphereRadius;
                }
            }

            actorRenderState.boundingSphere.position = actor.position;
            actorRenderState.boundingSphere.radius = boundingSphereRadius;
        }
    }

    this.updateLightRenderStates = function () {

        for (var lightId in engine.map.lightsById) {

            var light = engine.map.lightsById[lightId];

            if (!light.enabled) {
                continue;
            }

            var lightRenderState = this.coalesceLightRenderState(light.id);

            if (light.type == 'point') {

                for (var faceIndex = 0; faceIndex < 6; faceIndex++) {

                    var face = engine.renderer.pointLightShadowMapFaces[faceIndex];

                    var faceRenderState = lightRenderState.pointLightShadowMapFaceStates[faceIndex];

                    if (lightRenderState.isDirty) {

                        engine.shadowMapManager.buildViewProjMatrixForPointLightCubeMapFaceBuild(
                            this.updateLightRenderStatesTempValues.viewProjMatrixForPointLightCubeMapFaceBuild, light.position, face);

                        faceRenderState.frustum = math3D.buildFrustumFromViewProjMatrix(
                            this.updateLightRenderStatesTempValues.viewProjMatrixForPointLightCubeMapFaceBuild);

                        engine.visibilityManager.buildVisibleWorldStaticMeshChunkField(
                            faceRenderState.visibleWorldStaticMeshChunkField, light.position,
                            faceRenderState.frustum, lightRenderState.boundingSphere);
                    }

                    engine.visibilityManager.gatherVisibleActorIds(
                        faceRenderState.visibleActorIds, light.position,
                        faceRenderState.frustum, lightRenderState.boundingSphere);

                    if (light.castsShadows) {

                        faceRenderState.rebuildForStaticObjectsThisFrame =
                            lightRenderState.isDirty ||
                            faceRenderState.lastStaticObjectBuildResult == ShadowMapBuildResult.NotBuilt;

                        faceRenderState.rebuildForDynamicObjectsThisFrame =
                            faceRenderState.visibleActorIds.length > 0 ||
                            (faceRenderState.visibleActorIds.length == 0 && faceRenderState.lastDynamicObjectBuildResult == ShadowMapBuildResult.BuiltWithDynamicObjects) ||
                            faceRenderState.lastDynamicObjectBuildResult == ShadowMapBuildResult.NotBuilt;

                    } else {

                        faceRenderState.rebuildForStaticObjectsThisFrame = false;
                        faceRenderState.rebuildForDynamicObjectsThisFrame = false;
                    }
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

            chunkRenderState.effectiveLightIds.length = 0;

            // TODO - don't loop through every single light - use sectors to find relevant ones.
            for (var lightId in engine.map.lightsById) {

                var light = engine.map.lightsById[lightId];

                var lightRenderState = this.coalesceLightRenderState(light.id);

                /*if (!lightRenderState.rebuildWorldStaticMeshEffectivenessThisFrame) {
                    continue;
                }*/

                //var chunkIsEffectedByLight = false;

                if (light.enabled) {

                    var lightRenderState = this.coalesceLightRenderState(light.id);
                    //var lightSphere = new Sphere(light.position, light.radius);

                    var chunkIsEffectedByLight = math3D.checkSphereIntersectsAABB(lightRenderState.boundingSphere, chunk.aabb);

                    if (chunkIsEffectedByLight) {

                        chunkRenderState.effectiveLightIds.items[chunkRenderState.effectiveLightIds.length++] = light.id;

                        if (chunkRenderState.effectiveLightIds.length >= chunkRenderState.effectiveLightIds.maxLength) {
                            break;
                        }
                    }
                }

                /*var existingEffectiveLightIdIndex = util.arrayIndexOf(chunkRenderState.effectiveLightIds, light.id);

                if (chunkIsEffectedByLight) {

                    if (existingEffectiveLightIdIndex == -1) {
                        chunkRenderState.effectiveLightIds.push(light.id);
                    }

                } else {

                    if (existingEffectiveLightIdIndex != -1) {
                        chunkRenderState.effectiveLightIds.splice(existingEffectiveLightIdIndex, 1);
                    }
                }*/
            }
        }
    }

    this.updateActorRenderStates = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            var actorRenderState = this.coalesceActorRenderState(actorId);

            // Update the actor's effective lights.
            // TODO - don't loop through all of the lights. Use the sectors to find the relevant ones.
            actorRenderState.effectiveLightIds.length = 0;

            for (var lightId in engine.map.lightsById) {

                var light = engine.map.lightsById[lightId];

                if (!light.enabled) {
                    continue;
                }

                var lightRenderState = this.coalesceLightRenderState(light.id);

                //var lightSphere = new Sphere(light.position, light.radius);

                var isEffectedByLight = math3D.checkSphereIntersectsSphere(lightRenderState.boundingSphere, actorRenderState.boundingSphere);

                if (isEffectedByLight) {
                    actorRenderState.effectiveLightIds.items[actorRenderState.effectiveLightIds.length++] = light.id;

                    if (actorRenderState.effectiveLightIds.length >= actorRenderState.effectiveLightIds.maxLength) {
                        break;
                    }
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

                while (actor.frameIndex >= skinnedMeshAnimation.frames.length) {
                    actor.frameIndex -= skinnedMeshAnimation.frames.length;
                }
            }
        }
    }

    this.coalesceActorRenderState = function (actorId) {

        var actorRenderState = this.actorRenderStatesById[actorId];

        if (actorRenderState == null) {

            actorRenderState = {
                boundingSphere: new Sphere([0, 0, 0], 0),
                effectiveLightIds: new FixedLengthArray(EngineLimits.MaxEffectiveLightsPerObject, null)
            };

            this.actorRenderStatesById[actorId] = actorRenderState;
        }

        return actorRenderState;
    }

    this.coalesceLightRenderState = function (lightId) {

        var lightRenderState = this.lightRenderStatesById[lightId];

        if (lightRenderState == null) {

            lightRenderState = {
                isDirty: true,
                shadowMapIndex: null,
                shadowMapChannel: null,
                //rebuildWorldStaticMeshEffectivenessThisFrame: false,
                pointLightShadowMapFaceStates: [],
                boundingSphere: new Sphere([0, 0, 0], 0)
            };

            for (var i = 0; i < 6; i++) {

                var pointLightShadowMapFaceState = {
                    rebuildForStaticObjectsThisFrame: false,
                    rebuildForDynamicObjectsThisFrame: false,
                    frustum: null,
                    visibleWorldStaticMeshChunkField: new BitField(),//new FixedLengthArray(EngineLimits.MaxVisibleWorldStaticMeshChunkIndexesPerLight, 0),
                    visibleActorIds: new FixedLengthArray(EngineLimits.MaxVisibleActorsIdsPerLight, null),
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
                effectiveLightIds: new FixedLengthArray(EngineLimits.MaxEffectiveLightsPerObject, null)
            };

            this.worldStaticMeshChunkRenderStatesByIndex[chunkIndex] = chunkRenderState;
        }

        return chunkRenderState;
    }

    this.cleanUp = function () {

        this.actorRenderStatesById = {};
        this.lightRenderStatesById = {};
        this.worldStaticMeshChunkRenderStatesByIndex = [];
    }
}