function StaticMeshMathHelper(engine) {

    this.init = function (callback) {

        callback();
    }

    this.buildStaticMeshRotationSafeBoundingSphereRadius = function (staticMesh) {

        var verts = staticMesh.verts;
        var points = [];

        for (var i = 0; i < staticMesh.verts.length; i += 3) {

            var point = [verts[i], verts[i + 1], verts[i + 2]];

            points.push(point);
        }

        var radius = math3D.buildBoundingSphereRadiusAtOriginFromPoints(points);

        staticMesh.rotationSafeBoundingSphereRadius = radius;
    }

    this.buildStaticMeshChunkAABBs = function (staticMesh) {

        var indecies = staticMesh.indecies;
        var verts = staticMesh.verts;

        for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];

            var chunkPoints = [];

            for (var i = chunk.startIndex; i < chunk.startIndex + chunk.numFaces * 3; i += 3) {

                var vertIndex0 = indecies[i] * 3;
                var vertIndex1 = indecies[i + 1] * 3;
                var vertIndex2 = indecies[i + 2] * 3;

                var facePoints = [
					[verts[vertIndex0], verts[vertIndex0 + 1], verts[vertIndex0 + 2]],
					[verts[vertIndex1], verts[vertIndex1 + 1], verts[vertIndex1 + 2]],
					[verts[vertIndex2], verts[vertIndex2 + 1], verts[vertIndex2 + 2]]
                ];

                util.arrayPushMany(chunkPoints, facePoints);
            }

            chunk.aabb = math3D.buildAABBFromPoints(chunkPoints);
        }
    }

    this.buildStaticMeshChunkCollisionFaces = function (staticMesh) {

        var indecies = staticMesh.indecies;
        var verts = staticMesh.verts;

        for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];

            chunk.collisionFaces = [];

            for (var i = chunk.startIndex; i < chunk.startIndex + chunk.numFaces * 3; i += 3) {

                var vertIndex0 = indecies[i] * 3;
                var vertIndex1 = indecies[i + 1] * 3;
                var vertIndex2 = indecies[i + 2] * 3;

                var facePoints = [
					[verts[vertIndex0], verts[vertIndex0 + 1], verts[vertIndex0 + 2]],
					[verts[vertIndex1], verts[vertIndex1 + 1], verts[vertIndex1 + 2]],
					[verts[vertIndex2], verts[vertIndex2 + 1], verts[vertIndex2 + 2]]
                ];

                var collisionFace = math3D.buildCollisionFaceFromPoints(facePoints);

                chunk.collisionFaces.push(collisionFace);
            }
        }
    }

    this.findStaticMeshPointCompletelyOutsideOfExtremities = function (staticMesh) {

        var max = null;

        for (var i = 0; i < staticMesh.verts.length; i += 3) {

            var vert = [staticMesh.verts[i], staticMesh.verts[i + 1], staticMesh.verts[i + 2]];

            if (max == null) {
                max = vert;
            } else if (vert[0] > max[0]) {
                max[0] = vert[0];
            } else if (vert[1] > max[1]) {
                max[1] = vert[1];
            } else if (vert[2] < max[2]) {
                max[2] = vert[2];
            }
        }

        vec3.add(max, max, [10, 10, -10]);

        staticMesh.pointCompletelyOutsideOfExtremities = max;
    }

    this.moveSphereThroughStaticMesh = function (sphere, staticMesh, desiredDirection, desiredDistance, allowSliding, recursionDepth) {

        if (desiredDirection[0] == 0 &&
			desiredDirection[1] == 0 &&
			desiredDirection[2] == 0) {
            return;
        }

        if (recursionDepth == null) {
            recursionDepth = 0;
        }

        var nearestCollisionResult = null;

        // TODO - don't check all the chunks, use sectors!
        for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];

            // TODO - AABB check

            for (var faceIndex = 0; faceIndex < chunk.collisionFaces.length; faceIndex++) {

                var collisionFace = chunk.collisionFaces[faceIndex];

                var collisionResult = math3D.calculateSphereCollisionWithCollisionFace(sphere, collisionFace, desiredDirection);

                if (collisionResult != null) {

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

        if (recursionDepth > 4) {
            console.log("Recursion limit hit, remainingDistance = " + remainingDistance);
            return;
        }

        if (allowSliding && remainingDistance > 0.0) {

            var slideReaction = math3D.calculatePlaneIntersectionSlideReaction(
                nearestCollisionResult.collisionPlane, nearestCollisionResult.intersection, desiredDirection, remainingDistance);

            if (slideReaction != null && slideReaction.distance > 0) {

                this.moveSphereThroughStaticMesh(sphere, staticMesh, slideReaction.direction, slideReaction.distance, true, recursionDepth + 1);
            }
        }
    }

    this.findNearestLineIntersectionWithStaticMesh = function (out, collisionLine, staticMesh) {

        var faceIntersection = vec3.create();
        var intersectionFound = false;
        var nearestFaceIntersection = vec3.create();
        var nearestFaceIntersectionDistanceSqr = null;

        for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];

            // TODO - AABB check

            for (var faceIndex = 0; faceIndex < chunk.collisionFaces.length; faceIndex++) {

                var collisionFace = chunk.collisionFaces[faceIndex];

                var faceIntersectionType = math3D.calculateCollisionLineIntersectionWithCollisionFace(faceIntersection, collisionLine, collisionFace)

                if (faceIntersectionType != FaceIntersectionType.None) {

                    intersectionFound = true;

                    var faceIntersectionDistanceSqr = vec3.sqrDist(collisionLine.from, faceIntersection);

                    if (nearestFaceIntersectionDistanceSqr == null || faceIntersectionDistanceSqr < nearestFaceIntersectionDistanceSqr) {
                        nearestFaceIntersectionType = faceIntersectionType;
                        nearestFaceIntersectionDistanceSqr = faceIntersectionDistanceSqr;
                        vec3.copy(nearestFaceIntersection, faceIntersection);
                    }
                }
            }
        }

        if (out != null) {
            vec3.copy(out, nearestFaceIntersection);
        }

        return intersectionFound;
    }

    this.determineIfPointIsWithinStaticMesh = function (point, staticMesh) {

        var collisionLine = new CollisionLine(point, staticMesh.pointCompletelyOutsideOfExtremities);

        math3D.buildCollisionLineFromFromAndToPoints(collisionLine);

        var faceIntersection = vec3.create();
        var nearestFaceIntersectionDistanceSqr = null;
        var nearestFaceIntersectionType = null;

        for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];

            // TODO - AABB check

            for (var faceIndex = 0; faceIndex < chunk.collisionFaces.length; faceIndex++) {

                var collisionFace = chunk.collisionFaces[faceIndex];

                var faceIntersectionType = math3D.calculateCollisionLineIntersectionWithCollisionFace(faceIntersection, collisionLine, collisionFace)

                if (faceIntersectionType != FaceIntersectionType.None) {
                    
                    var faceIntersectionDistanceSqr = vec3.sqrDist(point, faceIntersection);
                    if (nearestFaceIntersectionDistanceSqr == null || faceIntersectionDistanceSqr < nearestFaceIntersectionDistanceSqr) {
                        nearestFaceIntersectionType = faceIntersectionType;
                        nearestFaceIntersectionDistanceSqr = faceIntersectionDistanceSqr;
                    }
                }
            }
        }

        return nearestFaceIntersectionType == FaceIntersectionType.FrontSide;
    }
}