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

            var actorStaticMesh = engine.staticMeshManager.getStaticMesh(actor.staticMeshId);
            if (actorStaticMesh == null) {
                continue;
            }

            var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];

            util.fixedLengthArrayPush($.staticMeshes, actorStaticMesh);
            util.fixedLengthArrayPush($.staticMeshWorldMatrices, actorRenderState.worldMatrix);
            util.fixedLengthArrayPush($.staticMeshInverseWorldMatrices, actorRenderState.inverseWorldMatrix);
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

        var $ = this.$findNearestLineIntersectionWithActor;

        vec3.set($.intersectionPoint, 0.0, 0.0, 0.0);
        vec3.set($.nearestIntersectionPoint, 0.0, 0.0, 0.0);
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

            if (math3D.determineIfCollisionLineIntersectsSphere(collisionLine, actorRenderState.boundingSphere)) {
                
                var collisionFound = false;

                if (actor.staticMeshId != null && actor.staticMeshId != '') {

                    // If static mesh, check collision with that.
                    var staticMesh = engine.staticMeshManager.getStaticMesh(actor.staticMeshId);
                    if (staticMesh != null) {

                        // Transform the collision line into local space.
                        vec3.transformMat4($.transformedCollisionLine.from, collisionLine.from, actorRenderState.inverseWorldMatrix);
                        vec3.transformMat4($.transformedCollisionLine.to, collisionLine.to, actorRenderState.inverseWorldMatrix);
                        math3D.buildCollisionLineFromFromAndToPoints($.transformedCollisionLine);

                        collisionFound = engine.staticMeshMathHelper.findNearestLineIntersectionWithStaticMesh(
                            $.intersectionPoint, $.transformedCollisionLine, staticMesh);
                        
                        if (collisionFound) {
                            // Transform the collision point back into world space.
                            vec3.transformMat4($.intersectionPoint, $.intersectionPoint, actorRenderState.worldMatrix);
                        }
                    }

                } else if (actor.skinnedMeshId != null && actor.skinnedMeshId != '') {

                    // TODO - if skinned mesh, check hit box.
                    collisionFound = true;
                    vec3.copy($.intersectionPoint, actor.position); // FIXME
                }

                if (collisionFound) {

                    nearestIntersectionActor = actor;

                    var intersectionPointDistanceSqr = vec3.sqrDist(collisionLine.from, $.intersectionPoint);

                    if (nearestIntersectionPointDistanceSqr == -1 || intersectionPointDistanceSqr < nearestIntersectionPointDistanceSqr) {
                        vec3.copy($.nearestIntersectionPoint, $.intersectionPoint);
                        nearestIntersectionPointDistanceSqr = intersectionPointDistanceSqr;
                    }
                }
            }
        }

        if (nearestIntersectionActor != null && out != null) {
            vec3.copy(out, $.nearestIntersectionPoint);
        }

        return nearestIntersectionActor;
    }

    // Function locals
    this.$moveSphereThroughMapInternal = {
        staticMeshes: new FixedLengthArray(1000, null),
        staticMeshWorldMatrices: new FixedLengthArray(1000, null),
        staticMeshInverseWorldMatrices: new FixedLengthArray(1000, null),
    }

    this.$findNearestLineIntersectionWithActor = {
        intersectionPoint: vec3.create(),
        nearestIntersectionPoint: vec3.create(),
        transformedCollisionLine: new CollisionLine(null, null, null, null)
    }
}