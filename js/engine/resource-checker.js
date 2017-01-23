function ResourceChecker(engine) {

    this.ensureResourcesAreLoaded = function () {

        var allResourcesAreLoaded = true;

        // Check static meshes.
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

        // Check materials.
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

        // Check actors.
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

        // Check GUIs.
        for (var guiId in engine.map.guisById) {

            var gui = engine.map.guisById[guiId];

            if (engine.guiLayoutManager.guiLayoutsById[gui.layoutId] == null) {
                engine.guiLayoutManager.loadGuiLayout(gui.layoutId);
                allResourcesAreLoaded = false;
            }
        }

        // Check GUI layouts.
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

        // Check sprite sheets.
        for (var spriteSheetId in engine.spriteSheetManager.spriteSheetsById) {

            var spriteSheet = engine.spriteSheetManager.spriteSheetsById[spriteSheetId];

            if (engine.textureManager.getTexture(spriteSheet.textureId) == null) {
                engine.textureManager.loadTexture(spriteSheet.textureId);
                allResourcesAreLoaded = false;
            }
        }

        return allResourcesAreLoaded;
    }
}