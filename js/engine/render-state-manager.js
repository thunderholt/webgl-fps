﻿function RenderStateManager(engine) {

    this.actorRenderStatesById = {};
    this.lightRenderStatesById = {};
    this.worldStaticMeshChunkRenderStatesByIndex = [];
    this.guiRenderStatesById = {}

    this.updateLightRenderStatesTempValues = {
        viewProjMatrixForPointLightCubeMapFaceBuild: mat4.create()
    }

    this.init = function (callback) {

        callback();
    }

    this.coalesceRenderStates = function () {

        for (var actorId in engine.map.actorsById) {
            this.coalesceActorRenderState(actorId);
        }

        for (var lightId in engine.map.lightsById) {
            this.coalesceLightRenderState(lightId);
        }
 
        var worldStaticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        for (var chunkIndex = 0; chunkIndex < worldStaticMesh.chunks.length; chunkIndex++) {
            this.coalesceWorldStaticMeshChunkRenderState(chunkIndex);
        }

        for (var guiId in engine.map.guisById) {
            this.coalesceGuiRenderState(guiId);
        }
    }

    this.calculateActorFinalPositions = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            if (!actor.active) {
                continue;
            }

            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actorId];

            // Update the actor's final position.
            vec3.copy(actorRenderState.position, actor.position);
            vec3.add(actorRenderState.position, actorRenderState.position, actor.positionOffset);
        }
    }

    this.rebuildBoundingVolumes = function () {
        this.updateLightBoundingSpheres();
        this.updateActorBoundingVolumes();
    }

    this.updateRenderStates = function () {

        this.updateLightRenderStates();
        this.updateWorldStaticMeshRenderStates();
        this.updateActorRenderStates();
        this.updateGuiRenderStates();
    }

    this.updateAnimations = function () {

        this.updateActorAnimationFrameIndexes();
        this.updateGuiAnimationFrameIndexes();
    }

    this.checkShadowMapAllocations = function () {

        for (var lightId in engine.map.lightsById) {

            var light = engine.map.lightsById[lightId];

            if (!light.enabled || !light.castsShadows) {
                continue;
            }

            var lightRenderState = this.lightRenderStatesById[light.id];

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

            var lightRenderState = this.lightRenderStatesById[light.id];

            if (light.type == 'point') {

                vec3.copy(lightRenderState.boundingSphere.position, light.position);
                lightRenderState.boundingSphere.radius = light.radius;
            }
        }
    }

    this.updateActorBoundingVolumes = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            if (!actor.active) {
                continue;
            }

            var actorRenderState = this.actorRenderStatesById[actorId];

            /*// Update the actor's position.
            vec3.copy(actorRenderState.position, actor.position);
            vec3.add(actorRenderState.position, actorRenderState.position, actor.positionOffset);*/

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

            vec3.copy(actorRenderState.boundingSphere.position, actorRenderState.position);
            actorRenderState.boundingSphere.radius = boundingSphereRadius;

            // Update the actor's hit box.
            if (actor.hitBox != null) {
                vec3.copy(actorRenderState.transformedHitBox.from, actor.hitBox.from);
                vec3.copy(actorRenderState.transformedHitBox.to, actor.hitBox.to);
                vec3.add(actorRenderState.transformedHitBox.from, actorRenderState.transformedHitBox.from, actorRenderState.position);
                vec3.add(actorRenderState.transformedHitBox.to, actorRenderState.transformedHitBox.to, actorRenderState.position);
            }

            // Update the actor's collision sphere.
            if (actor.collisionSphere != null) {
                vec3.copy(actorRenderState.transformedCollisionSphere.position, actor.collisionSphere.position);
                vec3.add(actorRenderState.transformedCollisionSphere.position, actorRenderState.transformedCollisionSphere.position, actorRenderState.position);
                actorRenderState.transformedCollisionSphere.radius = actor.collisionSphere.radius;
            }
        }
    }

    this.updateActorResidentSectors = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            if (!actor.active) {
                continue;
            }

            var actorRenderState = this.actorRenderStatesById[actorId];

            actorRenderState.residentSectorIndexField.reset(engine.sectorSet.sectors.length);

            for (var sectorIndex = 0; sectorIndex < engine.sectorSet.sectors.length; sectorIndex++) {

                var sectorState = engine.visibilityManager.sectorStatesBySectorIndex[sectorIndex];

                if (math3D.checkSphereIntersectsAABB(actorRenderState.boundingSphere, sectorState.aabb)) {

                    actorRenderState.residentSectorIndexField.setBit(sectorIndex);
                }
            }
        }
    }

    this.updateLightRenderStates = function () {

        for (var lightId in engine.map.lightsById) {

            var light = engine.map.lightsById[lightId];

            if (!light.enabled) {
                continue;
            }

            var lightRenderState = this.lightRenderStatesById[light.id];

            if (light.type == 'point') {

                if (lightRenderState.isDirty) {

                    engine.visibilityManager.buildVisibleWorldStaticMeshChunkField(
                        lightRenderState.visibleWorldStaticMeshChunkField, light.position,
                        null, lightRenderState.boundingSphere);
                }

                for (var faceIndex = 0; faceIndex < 6; faceIndex++) {

                    var face = engine.renderer.pointLightShadowMapFaces[faceIndex];

                    var faceRenderState = lightRenderState.pointLightShadowMapFaceStates[faceIndex];

                    if (lightRenderState.isDirty) {

                        engine.shadowMapManager.buildViewProjMatrixForPointLightCubeMapFaceBuild(
                            this.updateLightRenderStatesTempValues.viewProjMatrixForPointLightCubeMapFaceBuild, light.position, face);

                        math3D.buildFrustumFromViewProjMatrix(
                            faceRenderState.frustum,
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
            var chunkRenderState = this.worldStaticMeshChunkRenderStatesByIndex[chunkIndex];

            chunkRenderState.effectiveLightIds.length = 0;

            // TODO - don't loop through every single light - use sectors to find relevant ones.
            for (var lightId in engine.map.lightsById) {

                var light = engine.map.lightsById[lightId];

                if (light.enabled) {

                    var lightRenderState = this.lightRenderStatesById[light.id];
                 
                    if (!lightRenderState.visibleWorldStaticMeshChunkField.getBit(chunkIndex)) {
                        continue;
                    }

                    chunkRenderState.effectiveLightIds.items[chunkRenderState.effectiveLightIds.length++] = light.id;

                    if (chunkRenderState.effectiveLightIds.length >= chunkRenderState.effectiveLightIds.maxLength) {
                        break;
                    }
                }
            }
        }
    }

    this.updateActorRenderStates = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            if (!actor.active) {
                continue;
            }

            var actorRenderState = this.actorRenderStatesById[actorId];

            // Update the actor's effective lights.
            // TODO - don't loop through all of the lights. Use the sectors to find the relevant ones.
            actorRenderState.effectiveLightIds.length = 0;

            for (var lightId in engine.map.lightsById) {

                var light = engine.map.lightsById[lightId];

                if (!light.enabled) {
                    continue;
                }

                var lightRenderState = this.lightRenderStatesById[light.id];

                //var lightSphere = new Sphere(light.position, light.radius);

                var isEffectedByLight = math3D.checkSphereIntersectsSphere(lightRenderState.boundingSphere, actorRenderState.boundingSphere);

                if (isEffectedByLight) {
                    actorRenderState.effectiveLightIds.items[actorRenderState.effectiveLightIds.length++] = light.id;

                    if (actorRenderState.effectiveLightIds.length >= actorRenderState.effectiveLightIds.maxLength) {
                        break;
                    }
                }
            }

            // Update the actor's world matrix.
            math3D.buildWorldMatrix(actorRenderState.worldMatrix, actorRenderState.position, actor.rotation);
            mat4.invert(actorRenderState.inverseWorldMatrix, actorRenderState.worldMatrix);
        }
    }

    this.updateGuiRenderStates = function () {

        for (guiId in engine.map.guisById) {

            var gui = engine.map.guisById[guiId];

            var guiRenderState = this.guiRenderStatesById[guiId];

            engine.guiDrawSpecBuilder.buildGuiDrawSpecs(guiRenderState.drawSpecs, gui);
        }
    }

    this.updateActorAnimationFrameIndexes = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            if (!actor.active) {
                continue;
            }

            if (actor.skinnedMeshAnimationId != null) {

                var skinnedMeshAnimation = engine.skinnedMeshAnimationManager.getSkinnedMeshAnimation(actor.skinnedMeshAnimationId);

                if (skinnedMeshAnimation == null) {
                    continue;
                }

                actor.frameIndex += engine.frameTimer.frameDelta / 10;

                while (actor.frameIndex >= skinnedMeshAnimation.frames.length) {
                    actor.frameIndex -= skinnedMeshAnimation.frames.length;
                }
            }
        }
    }

    this.updateGuiAnimationFrameIndexes = function () {

        for (var guiId in engine.map.guisById) {

            var gui = engine.map.guisById[guiId];
            var guiLayout = engine.guiLayoutManager.getGuiLayout(gui.layoutId);
            if (guiLayout == null) {
                continue;
            }

            for (var animationId in guiLayout.animationsById) {

                var animationState = gui.animationStatesById[animationId];
                if (animationState == null || !animationState.active || animationState.paused) {
                    continue;
                }

                var animation = guiLayout.animationsById[animationId];

                animationState.frameIndex += engine.frameTimer.frameDelta;

                while (animationState.frameIndex >= animation.numberOfFrames) {
                    animationState.frameIndex -= animation.numberOfFrames;
                }
            }
        }
    }

    this.coalesceActorRenderState = function (actorId) {

        var actorRenderState = this.actorRenderStatesById[actorId];

        if (actorRenderState == null) {

            actorRenderState = {
                position: vec3.create(),
                boundingSphere: new Sphere([0, 0, 0], 0),
                effectiveLightIds: new FixedLengthArray(EngineLimits.MaxEffectiveLightsPerObject, null),
                residentSectorIndexField: new BitField(),
                worldMatrix: mat4.create(),
                inverseWorldMatrix: mat4.create(),
                transformedHitBox: new AABB(),
                transformedCollisionSphere: new Sphere(),
                physics: {
                    mode: ActorPhysicsMode.None,
                    targetPositionOffset: vec3.create(),
                    speed: 0,
                    direction: vec3.create(),
                    desiredDestination: vec3.create(),
                    targetYRotation: 0,
                    applyGravity: true,
                    hasArrivedAtDestination: false
                },
                tickers: {

                }
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
                pointLightShadowMapFaceStates: [],
                boundingSphere: new Sphere(),
                visibleWorldStaticMeshChunkField: new BitField()
            };

            for (var i = 0; i < 6; i++) {

                var pointLightShadowMapFaceState = {
                    rebuildForStaticObjectsThisFrame: false,
                    rebuildForDynamicObjectsThisFrame: false,
                    frustum: new Frustum(),
                    visibleWorldStaticMeshChunkField: new BitField(),
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

    this.coalesceGuiRenderState = function (guiId) {

        var guiRenderState = this.guiRenderStatesById[guiId];

        if (guiRenderState == null) {

            guiRenderState = {
                drawSpecs: new FixedLengthArray(500, null)
            }

            this.guiRenderStatesById[guiId] = guiRenderState;
        }

        return guiRenderState;
    }

    this.cleanUp = function () {

        this.actorRenderStatesById = {};
        this.lightRenderStatesById = {};
        this.worldStaticMeshChunkRenderStatesByIndex = [];
        this.guiRenderStatesById = {};
    }
}