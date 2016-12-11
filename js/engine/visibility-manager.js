function VisibilityManager(engine) {

    this.sectorStatesBySectorIndex = null;

    this.rebuildSectorStates = function () {

        this.sectorStatesBySectorIndex = new Array(engine.sectorSet.sectors.length);

        var staticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        for (var x = 0; x < engine.sectorSet.metrics.sectorCount[0]; x++) {

            for (var y = 0; y < engine.sectorSet.metrics.sectorCount[1]; y++) {

                for (var z = 0; z < engine.sectorSet.metrics.sectorCount[2]; z++) {

                    var sectorIndex = engine.visibilityManager.getSectorIndexFromComponents(x, y, z);

                    var sectorState = {
                        origin: vec3.create(),
                        aabb: null,
                        intersectingWorldStaticMeshChunkField: new BitField()
                    }

                    // Calculate the origin.
                    vec3.set(sectorState.origin, x, y, -z);
                    vec3.multiply(sectorState.origin, sectorState.origin, engine.sectorSet.metrics.sectorSize);
                    vec3.add(sectorState.origin, engine.sectorSet.metrics.rootOrigin, sectorState.origin);

                    // Calculate the AABB.
                    var to = vec3.create();
                    to[0] = sectorState.origin[0] + engine.sectorSet.metrics.sectorSize[0];
                    to[1] = sectorState.origin[1] + engine.sectorSet.metrics.sectorSize[1];
                    to[2] = sectorState.origin[2] - engine.sectorSet.metrics.sectorSize[2];
                    sectorState.aabb = new AABB(sectorState.origin, to);

                    // Build the intersecting world static mesh chunk field.
                    sectorState.intersectingWorldStaticMeshChunkField.reset(staticMesh.chunks.length);

                    for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

                        var chunk = staticMesh.chunks[chunkIndex];

                        if (math3D.checkAAABIntersectsAABB(chunk.aabb, sectorState.aabb)) {
                            sectorState.intersectingWorldStaticMeshChunkField.setBit(chunkIndex);
                        }
                    }

                    // The sector state is built!
                    this.sectorStatesBySectorIndex[sectorIndex] = sectorState;
                }
            }
        }
    }

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

        if (x < 0 || y < 0 || z < 0 || x >= sectorCount[0] || y >= sectorCount[1] || z >= sectorCount[2]) {
            return -1;
        }

        var index =
            x * sectorCount[1] * sectorCount[2] +
            y * sectorCount[2] +
            z;

        return index;
    }

    this.buildVisibleWorldStaticMeshChunkField = function (out, position, frustum, boundingSphere) {

        var staticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (staticMesh == null) {
            throw "World static mesh not loaded";
        }

        var sectorIndex = this.getSectorIndexAtPosition(position);
        var sector = engine.sectorSet.sectors[sectorIndex];

        out.reset(staticMesh.chunks.length);

        for (var chunkIndex = 0;
            chunkIndex < staticMesh.chunks.length;
            chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];

            if (sector != null) {

                var chunkIsPotentiallyVisible = false;

                for (var i = 0; i < sector.visibleSectorIndexes.length; i++) {
                    var visibleSectorIndex = sector.visibleSectorIndexes[i];
                    var visibleSectorState = this.sectorStatesBySectorIndex[visibleSectorIndex];

                    if (visibleSectorState == null) {
                        console.log('Arrgh.');
                    }

                    if (visibleSectorState.intersectingWorldStaticMeshChunkField.getBit(chunkIndex)) {
                        chunkIsPotentiallyVisible = true;
                        break;
                    }
                }
         
                if (!chunkIsPotentiallyVisible) {
                    continue;
                }
            } 

            if (frustum != null && !math3D.checkFrustumIntersectsAABB(frustum, chunk.aabb)) {
                continue;
            }

            if (boundingSphere != null && !math3D.checkSphereIntersectsAABB(boundingSphere, chunk.aabb)) {
                continue;
            }

            out.setBit(chunkIndex);
        }
    }

    this.gatherVisibleActorIds = function (out, position, frustum, boundingSphere) {

        var sectorIndex = this.getSectorIndexAtPosition(position);
        var sector = engine.sectorSet.sectors[sectorIndex];

        out.length = 0;

        for (var actorId in engine.map.actorsById) {

            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actorId];

            if (sector != null) {

                var actorIsPotentiallyVisible = false;

                for (var i = 0; i < sector.visibleSectorIndexes.length; i++) {
                    var visibleSectorIndex = sector.visibleSectorIndexes[i];

                    if (actorRenderState.residentSectorIndexField.getBit(visibleSectorIndex)) {
                        actorIsPotentiallyVisible = true;
                        break;
                    }
                }

                if (!actorIsPotentiallyVisible) {
                    continue;
                }
            }

            if (frustum != null && !math3D.checkFrustumIntersectsSphere(frustum, actorRenderState.boundingSphere)) {
                continue;
            }

            if (boundingSphere != null && !math3D.checkSphereIntersectsSphere(boundingSphere, actorRenderState.boundingSphere)) {
                continue;
            }

            out.items[out.length++] = actorId;
            
            if (out.length >= out.maxLength) {
                break;
            }
        }
    }

    this.gatherVisibleLightIdsFromVisibleObjectsIds = function (
        out, visibleWorldStaticMeshChunkIndexes, visibleActorIds) {

        util.clearFixedLengthArray(out, null);

        //for (var i = 0; i < visibleWorldStaticMeshChunkIndexes.length; i++) {

            //var chunkIndex = visibleWorldStaticMeshChunkIndexes.items[i];

        for (var chunkIndex = 0; chunkIndex < visibleWorldStaticMeshChunkIndexes.length; chunkIndex++) {

            if (!visibleWorldStaticMeshChunkIndexes.getBit(chunkIndex)) {
                continue;
            }

            var chunkRenderState = engine.renderStateManager.worldStaticMeshChunkRenderStatesByIndex[chunkIndex];

            if (chunkRenderState == null) {
                continue;
            }

            for (var j = 0; j < chunkRenderState.effectiveLightIds.length; j++) {

                var lightId = chunkRenderState.effectiveLightIds.items[j];

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
            }
        }
    }
}