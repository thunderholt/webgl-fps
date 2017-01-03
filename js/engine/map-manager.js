function MapManager(engine) {

    this.moveSphereThroughMap = function (sphere, movementNormal, movementAmount, applyGravity) {

        var worldStaticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (worldStaticMesh == null) {
            return;
        }

        engine.staticMeshMathHelper.moveSphereThroughStaticMesh(
			sphere, worldStaticMesh, movementNormal, movementAmount, true);

        if (applyGravity) {

            var gravity = 0.4;

            engine.staticMeshMathHelper.moveSphereThroughStaticMesh(
                sphere, worldStaticMesh,
                [0, -1, 0], gravity * engine.frameTimer.frameDelta, false);
        }
    }

    this.findNearestLineIntersectionWithMap = function (out, collisionLine) {

        var worldStaticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (worldStaticMesh == null) {
            return false;
        }

        var collidesWithWorldSaticMesh = engine.staticMeshMathHelper.findNearestLineIntersectionWithStaticMesh(out, collisionLine, worldStaticMesh);

        return collidesWithWorldSaticMesh;
    }

    this.findNearestLineIntersectionWithActor = function (out, collisionLine) {

        var intersectionPoint = vec3.create(); // FIXME
        var nearestIntersectionPoint = vec3.create(); // FIXME
        var nearestIntersectionPointDistanceSqr = -1;
        var nearestIntersectionActor = null;

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];
            if (actorRenderState == null) {
                continue;
            }

            if (math3D.calculateCollisionLineIntersectionWithSphere(intersectionPoint, collisionLine, actorRenderState.boundingSphere)) {

                nearestIntersectionActor = actor;

                var intersectionPointDistanceSqr = vec3.sqrDist(collisionLine.from, intersectionPoint);

                if (nearestIntersectionPointDistanceSqr == -1 || intersectionPointDistanceSqr < nearestIntersectionPointDistanceSqr) {
                    vec3.copy(nearestIntersectionPoint, intersectionPoint);
                    nearestIntersectionPointDistanceSqr = intersectionPointDistanceSqr;
                }
            }
        }

        if (nearestIntersectionActor != null && out != null) {
            vec3.copy(out, nearestIntersectionPoint);
        }

        return nearestIntersectionActor;
    }
}