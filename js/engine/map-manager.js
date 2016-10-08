function MapManager(engine) {

    this.init = function (callback) {

        callback();
    }

    this.moveSphereThroughMap = function (sphere, desiredDirection, desiredDistance, allowSliding, recursionDepth) {

        if (desiredDirection[0] == 0 &&
			desiredDirection[1] == 0 &&
			desiredDirection[2] == 0) {
            return;
        }

        if (recursionDepth == null) {
            recursionDepth = 0;
        }

        var nearestCollisionResult = null;

        var staticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (staticMesh == null) {
            return;
        }

        for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];

            // TODO - AABB check

            for (var faceIndex = 0; faceIndex < chunk.collisionFaces.length; faceIndex++) {

                var collisionFace = chunk.collisionFaces[faceIndex];

                var collisionResult = math3D.calculateSphereCollisionWithCollisionFace(sphere, collisionFace, desiredDirection);

                if (collisionResult != null) {

                    /*if (collisionResult.distance < 0) {
                        console.log("Wierd distance");
                    }*/

                    if (nearestCollisionResult == null || collisionResult.distance < nearestCollisionResult.distance) {
                        nearestCollisionResult = collisionResult;
                    }
                }
            }
        }

        var maximumDesiredDirectionMovementDistance = desiredDistance;

        if (nearestCollisionResult != null) {

            nearestCollisionResult.distance -= 0.01;

            if (nearestCollisionResult.distance < 0) {
                nearestCollisionResult.distance = 0;
            }

            if (maximumDesiredDirectionMovementDistance > nearestCollisionResult.distance) {
                maximumDesiredDirectionMovementDistance = nearestCollisionResult.distance;
            }
        }

        var positionDelta = vec3.create();
        vec3.scale(positionDelta, desiredDirection, maximumDesiredDirectionMovementDistance);
        vec3.add(sphere.position, sphere.position, positionDelta);

        var remainingDistance = desiredDistance - maximumDesiredDirectionMovementDistance;

        if (recursionDepth > 10) {
            console.log("Recursion limit hit, remainingDistance = " + remainingDistance);
            return;
        }

        if (allowSliding && remainingDistance > 0.0) {

            var slideReaction = math3D.calculatePlaneIntersectionSlideReaction(
                nearestCollisionResult.collisionPlane, nearestCollisionResult.intersection, desiredDirection, remainingDistance);

            if (slideReaction != null && slideReaction.distance > 0) {

                this.moveSphereThroughMap(sphere, slideReaction.direction, slideReaction.distance, true, recursionDepth + 1);
            }
        }
    }
}