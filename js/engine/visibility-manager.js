function VisibilityManager(engine) {

    this.gatherVisibleWorldStaticMeshChunkIndexes = function (position, frustum) {

        // TODO - allow sphere to be passed for extra culling for lights.

        var staticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (staticMesh == null) {
            throw "World static mesh not loaded";
        }

        var visibleChunkIndexes = []

        for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];

            var chunkIsVisible = math3D.checkFrustumIntersectsAABB(frustum, chunk.aabb);

            if (chunkIsVisible) {
                visibleChunkIndexes.push(chunkIndex);
            }
        }

        return visibleChunkIndexes;
    }

    this.gatherVisibleActorIds = function (position, frustum) {

        // TODO - allow sphere to be passed for extra culling for lights.

        var visibleActorIds = [];

        for (var actorId in engine.map.actorsById) {

            //var actor = engine.map.actorsById[actorId];
            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actorId];

            var actorIsVisible = math3D.checkFrustumIntersectsSphere(frustum, actorRenderState.boundingSphere);

            /*if (actor.staticMeshId != null) {

                var staticMesh = engine.staticMeshManager.getStaticMesh(actor.staticMeshId);

                if (staticMesh == null) {
                    continue;
                }

                var actorBoundingSphere = new Sphere(actor.position, staticMesh.rotationSafeBoundingSphereRadius);

                actorIsVisible = math3D.checkFrustumIntersectsSphere(frustum, actorBoundingSphere);
            }*/

            if (actorIsVisible) {
                visibleActorIds.push(actorId);
            }
        }

        return visibleActorIds;
    }

    this.gatherVisibleLightIdsFromVisibleObjectsIds = function (
        visibleWorldStaticMeshChunkIndexes, visibleActorIds) {

        var lightIdLookup = {};

        for (var i = 0; i < visibleWorldStaticMeshChunkIndexes.length; i++) {

            var chunkIndex = visibleWorldStaticMeshChunkIndexes[i];

            var chunkRenderState = engine.renderStateManager.worldStaticMeshChunkRenderStatesByIndex[chunkIndex];

            if (chunkRenderState == null) {
                continue;
            }

            for (var j = 0; j < chunkRenderState.effectiveLightIds.length; j++) {

                var lightId = chunkRenderState.effectiveLightIds[j];

                if (lightIdLookup[lightId] == null) {
                    lightIdLookup[lightId] = true;
                }
            }
        }

        for (var i = 0; i < visibleActorIds.length; i++) {

            var actorId = visibleActorIds[i];

            //var actor = engine.map.actorsById[actorId];
            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actorId];

            for (var j = 0; j < actorRenderState.effectiveLightIds.length; j++) {

                var lightId = actorRenderState.effectiveLightIds[j];

                if (lightIdLookup[lightId] == null) {
                    lightIdLookup[lightId] = true;
                }
            }

            /*if (actor.staticMeshId != null) {

                var staticMesh = engine.staticMeshManager.getStaticMesh(actor.staticMeshId);

                if (staticMesh == null) {
                    continue;
                }

                // TODO - rebuilding this is inefficient.
                var staticMeshRenderState = engine.renderStateManager.buildStaticMeshRenderState(staticMesh, actor.position);

                for (var j = 0; j < staticMeshRenderState.effectiveLightIds.length; j++) {

                    var lightId = staticMeshRenderState.effectiveLightIds[j];

                    if (lightIdLookup[lightId] == null) {
                        lightIdLookup[lightId] = true;
                    }
                }
            }*/
        }

        var lightIds = [];
        for (var lightId in lightIdLookup) {

            lightIds.push(lightId);
        }

        return lightIds;
    }
}