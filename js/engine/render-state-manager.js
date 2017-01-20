function RenderStateManager(engine) {

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

    this.updateRenderStates = function () {

        this.checkShadowMapAllocations();

        this.updateLightBoundingSpheres();
        this.updateActorPositionsAndBoundingVolumes();
        this.updateActorResidentSectorIndexField();

        this.updateLightRenderStates();
        this.updateWorldStaticMeshRenderStates();
        this.updateActorRenderStates();
        this.updateGuiRenderStates();

        this.updateActorAnimationFrameIndexes();
        this.updateGuiAnimationFrameIndexes();
    }

    this.ensureResourcesAreLoaded = function () {

        var allResourcesAreLoaded = true;

        for (var staticMeshId in engine.staticMeshManager.staticMeshesById) {

            var staticMesh = engine.staticMeshManager.staticMeshesById[staticMeshId];

            for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {
                var chunk = staticMesh.chunks[chunkIndex];
                if (engine.materialManager.materialsById[chunk.materialId] == null) {
                    engine.materialManager.loadMaterial(chunk.materialId);
                    allResourcesAreLoaded = false;
                }
            }
        }

        for (var materialId in engine.materialManager.materialsById) {
            var material = engine.materialManager.materialsById[materialId];

            if (!util.stringIsNullOrEmpty(material.diffuseTextureId) && engine.textureManager.texturesById[material.diffuseTextureId] == null) {
                engine.textureManager.loadTexture(material.diffuseTextureId);
                allResourcesAreLoaded = false;
            }

            if (!util.stringIsNullOrEmpty(material.normalTextureId) && engine.textureManager.texturesById[material.normalTextureId] == null) {
                engine.textureManager.loadTexture(material.normalTextureId);
                allResourcesAreLoaded = false;
            }

            if (!util.stringIsNullOrEmpty(material.selfIlluminationTextureId) && engine.textureManager.texturesById[material.selfIlluminationTextureId] == null) {
                engine.textureManager.loadTexture(material.selfIlluminationTextureId);
                allResourcesAreLoaded = false;
            }
        }

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            if (!util.stringIsNullOrEmpty(actor.staticMeshId) && engine.staticMeshManager.staticMeshesById[actor.staticMeshId] == null) {

                engine.staticMeshManager.loadStaticMesh(actor.staticMeshId, {
                    buildChunkAABBs: true,
                    buildChunkCollisionFaces: true,
                    buildRotationSafeBoundingSphere: true
                });

                allResourcesAreLoaded = false;
            }

            if (!util.stringIsNullOrEmpty(actor.skinnedMeshId) && engine.skinnedMeshManager.getSkinnedMesh(actor.skinnedMeshId) == null) {
                engine.skinnedMeshManager.loadSkinnedMesh(actor.skinnedMeshId, { buildRotationSafeBoundingSphere: true });
                allResourcesAreLoaded = false;
            }

            if (!util.stringIsNullOrEmpty(actor.skinnedMeshAnimationId) && engine.skinnedMeshAnimationManager.skinnedMeshAnimationsById[actor.skinnedMeshAnimationId] == null) {
                engine.skinnedMeshAnimationManager.loadSkinnedMeshAnimation(actor.skinnedMeshAnimationId, {});
                allResourcesAreLoaded = false;
            }
        }

        for (var guiId in engine.map.guisById) {

            var gui = engine.map.guisById[guiId];

            if (engine.guiLayoutManager.guiLayoutsById[gui.layoutId] == null) {
                engine.guiLayoutManager.loadGuiLayout(gui.layoutId);
                allResourcesAreLoaded = false;
            } 
        }

        for (var guiLayoutId in engine.guiLayoutManager.guiLayoutsById) {

            var guiLayout = engine.guiLayoutManager.guiLayoutsById[guiLayoutId];

            for (var animationId in guiLayout.animationsById) {
                if (engine.guiLayoutAnimationManager.getGuiLayoutAnimationExpansion(guiLayout.id, animationId) == null) {
                    engine.guiLayoutAnimationManager.buildGuiLayoutAnimationExpansion(guiLayout.id, animationId);
                    allResourcesAreLoaded = false;
                }
            }

            if (engine.spriteSheetManager.getSpriteSheet(guiLayout.spriteSheetId) == null) {
                engine.spriteSheetManager.loadSpriteSheet(guiLayout.spriteSheetId);
                allResourcesAreLoaded = false;
            }
        }

        for (var spriteSheetId in engine.spriteSheetManager.spriteSheetsById) {

            var spriteSheet = engine.spriteSheetManager.spriteSheetsById[spriteSheetId];

            if (engine.textureManager.getTexture(spriteSheet.textureId) == null) {
                engine.textureManager.loadTexture(spriteSheet.textureId);
                allResourcesAreLoaded = false;
            }
        }

        return allResourcesAreLoaded;
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

                vec3.copy(lightRenderState.boundingSphere.position, light.position);
                lightRenderState.boundingSphere.radius = light.radius;
            }
        }
    }

    this.updateActorPositionsAndBoundingVolumes = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            if (!actor.active) {
                continue;
            }

            var actorRenderState = this.coalesceActorRenderState(actorId);

            // Update the actor's position.
            vec3.copy(actorRenderState.position, actor.position);
            vec3.add(actorRenderState.position, actorRenderState.position, actor.positionOffset);

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
        }
    }

    this.updateActorResidentSectorIndexField = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            if (!actor.active) {
                continue;
            }

            var actorRenderState = this.coalesceActorRenderState(actorId);

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

            var lightRenderState = this.coalesceLightRenderState(light.id);

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
            var chunkRenderState = this.coalesceWorldStaticMeshChunkRenderState(chunkIndex);

            chunkRenderState.effectiveLightIds.length = 0;

            // TODO - don't loop through every single light - use sectors to find relevant ones.
            for (var lightId in engine.map.lightsById) {

                var light = engine.map.lightsById[lightId];

                var lightRenderState = this.coalesceLightRenderState(light.id);

                if (light.enabled) {

                    var lightRenderState = this.coalesceLightRenderState(light.id);
                 
                    if (!lightRenderState.visibleWorldStaticMeshChunkField.getBit(chunkIndex)) {
                        continue;
                    }

                    /*if (!math3D.checkSphereIntersectsAABB(lightRenderState.boundingSphere, chunk.aabb)) {
                        continue;
                    }*/

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

            // Update the actor's world matrix.
            math3D.buildWorldMatrix(actorRenderState.worldMatrix, actorRenderState.position, actor.rotation);
            mat4.invert(actorRenderState.inverseWorldMatrix, actorRenderState.worldMatrix);
        }
    }

    this.updateGuiRenderStates = function () {

        for (guiId in engine.map.guisById) {

            var gui = engine.map.guisById[guiId];

            var guiRenderState = this.coalesceGuiRenderState(guiId);

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
                transformedHitBox: new AABB()
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