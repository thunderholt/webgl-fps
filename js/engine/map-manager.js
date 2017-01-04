function MapManager(engine) {

    this.moveSphereThroughMap = function (sphere, movementNormal, movementAmount, applyGravity) {

        this.moveSphereThroughMapInternal(
			sphere, movementNormal, movementAmount, true);

        if (applyGravity) {

            var gravity = 0.4;

            this.moveSphereThroughMapInternal(
                sphere, math3D.downVec3, gravity * engine.frameTimer.frameDelta, false);
        }
    }

    this.moveSphereThroughMapInternal = function (sphere, movementNormal, movementAmount, allowSliding) {

        var $ = this.$moveSphereThroughMapInternal;

        var worldStaticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        $.staticMeshes.length = 0;
        $.staticMeshWorldMatrices.length = 0;
        $.staticMeshInverseWorldMatrices.length = 0;

        // Push the world static mesh.
        util.fixedLengthArrayPush($.staticMeshes, worldStaticMesh);
        util.fixedLengthArrayPush($.staticMeshWorldMatrices, math3D.identityMat4);
        util.fixedLengthArrayPush($.staticMeshInverseWorldMatrices, math3D.identityMat4);

        // Push any collidable actor static meshes.
        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];
            if (!actor.active || !actor.collidesWithPlayer || actor.staticMeshId == null) {
                continue;
            }

            var staticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);
            if (staticMesh == null) {
                continue;
            }

            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];

            util.fixedLengthArrayPush($.staticMeshes, staticMesh);
            util.fixedLengthArrayPush($.staticMeshWorldMatrices, actorRenderState.worldMatrix);
            util.fixedLengthArrayPush($.staticMeshInverseWorldMatrices, actorRenderState.inverWorldMatrix);
        }

        engine.staticMeshMathHelper.moveSphereThroughStaticMeshes(
			sphere, $.staticMeshes, $.staticMeshWorldMatrices, $.staticMeshInverseWorldMatrices,
            movementNormal, movementAmount, allowSliding);
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
            if (!actor.active) {
                continue;
            }

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

    // Function locals
    this.$moveSphereThroughMapInternal = {
        staticMeshes: new FixedLengthArray(1000, null),
        staticMeshWorldMatrices: new FixedLengthArray(1000, null),
        staticMeshInverseWorldMatrices: new FixedLengthArray(1000, null),
    }
}