function VisibilityManager(engine) {

    this.getSectorIndexAtPosition = function (position) {

        var rootOrigin = engine.sectorSet.metrics.rootOrigin;
        var sectorSize = engine.sectorSet.metrics.sectorSize;

        var x = Math.floor((position[0] - rootOrigin[0]) / sectorSize[0]);
        var y = Math.floor((position[1] - rootOrigin[1]) / sectorSize[1]);
        var z = Math.floor(-(position[2] - rootOrigin[2]) / sectorSize[2]);

        return this.getSectorIndexFromComponents(x, y, z);
    }

    this.getSectorIndexFromComponents = function (x, y, z) {

        var sectorCount = engine.sectorSet.metrics.sectorCount;

        if (x < 0 || y < 0 || z < 0 || x > sectorCount[0] || y > sectorCount[1] || z > sectorCount[2]) {
            return -1;
        }

        var index =
            x * sectorCount[1] * sectorCount[2] +
            y * sectorCount[1] +
            z;

        return index;
    }

    this.gatherVisibleWorldStaticMeshChunkIndexes = function (out, position, frustum) {

        // TODO - allow sphere to be passed for extra culling for lights.

        var staticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (staticMesh == null) {
            throw "World static mesh not loaded";
        }

        out.length = 0;

        for (var chunkIndex = 0;
            chunkIndex < staticMesh.chunks.length &&
            out.length < out.maxLength;
            chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];

            var chunkIsVisible = math3D.checkFrustumIntersectsAABB(frustum, chunk.aabb);

            if (chunkIsVisible) {
                out.items[out.length++] = chunkIndex;
            }
        }
    }

    this.gatherVisibleActorIds = function (out, position, frustum) {

        // TODO - allow sphere to be passed for extra culling for lights.

        out.length = 0;

        for (var actorId in engine.map.actorsById) {

            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actorId];

            var actorIsVisible = math3D.checkFrustumIntersectsSphere(frustum, actorRenderState.boundingSphere);

            if (actorIsVisible) {
                out.items[out.length++] = actorId;
            }

            if (out.length >= out.maxLength) {
                break;
            }
        }
    }

    this.gatherVisibleLightIdsFromVisibleObjectsIds = function (
        out, visibleWorldStaticMeshChunkIndexes, visibleActorIds) {

        //var lightIdLookup = {};

        util.clearFixedLengthArray(out, null);

        for (var i = 0; i < visibleWorldStaticMeshChunkIndexes.length; i++) {

            var chunkIndex = visibleWorldStaticMeshChunkIndexes.items[i];

            var chunkRenderState = engine.renderStateManager.worldStaticMeshChunkRenderStatesByIndex[chunkIndex];

            if (chunkRenderState == null) {
                continue;
            }

            for (var j = 0; j < chunkRenderState.effectiveLightIds.length; j++) {

                var lightId = chunkRenderState.effectiveLightIds.items[j];

                /*if (lightIdLookup[lightId] == null) {
                    lightIdLookup[lightId] = true;
                }*/

                if (util.fixedLengthArrayIndexOf(out, lightId) == -1) {
                    out.items[out.length++] = lightId;
                }
            }
        }

        for (var i = 0; i < visibleActorIds.length; i++) {

            var actorId = visibleActorIds.items[i];

            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actorId];

            for (var j = 0; j < actorRenderState.effectiveLightIds.length; j++) {

                var lightId = actorRenderState.effectiveLightIds.items[j];

                if (util.fixedLengthArrayIndexOf(out, lightId) == -1) {
                    out.items[out.length++] = lightId;
                }
                /*if (lightIdLookup[lightId] == null) {
                    lightIdLookup[lightId] = true;
                }*/
            }
        }

        /*var lightIds = [];
        for (var lightId in lightIdLookup) {

            lightIds.push(lightId);
        }

        return lightIds;*/
    }
}