function MathCollisionFace() {

    this.buildCollisionFaceFromPoints = function (points) {

        // Calculate face normal.
        var freeEdgeAB = vec3.create();
        vec3.sub(freeEdgeAB, points[1], points[0]);

        var freeEdgeAC = vec3.create();
        vec3.sub(freeEdgeAC, points[2], points[0]);

        var faceNormal = vec3.create();
        vec3.cross(faceNormal, freeEdgeAB, freeEdgeAC);
        vec3.normalize(faceNormal, faceNormal);

        var facePlane = math3D.buildPlaneFromNormalAndPoint(faceNormal, points[0]);

        // Calculate the edge planes and edge lengths.
        var freeNormalisedEdges = [vec3.create(), vec3.create(), vec3.create()];
        var edgeLengths = [];

        vec3.sub(freeNormalisedEdges[0], points[1], points[0]);
        edgeLengths[0] = vec3.length(freeNormalisedEdges[0]);
        vec3.normalize(freeNormalisedEdges[0], freeNormalisedEdges[0]);

        vec3.sub(freeNormalisedEdges[1], points[2], points[1]);
        edgeLengths[1] = vec3.length(freeNormalisedEdges[1]);
        vec3.normalize(freeNormalisedEdges[1], freeNormalisedEdges[1]);

        vec3.sub(freeNormalisedEdges[2], points[0], points[2]);
        edgeLengths[2] = vec3.length(freeNormalisedEdges[2]);
        vec3.normalize(freeNormalisedEdges[2], freeNormalisedEdges[2]);

        var edgePlaneNormals = [vec3.create(), vec3.create(), vec3.create()];

        vec3.cross(edgePlaneNormals[0], freeNormalisedEdges[0], faceNormal);
        vec3.cross(edgePlaneNormals[1], freeNormalisedEdges[1], faceNormal);
        vec3.cross(edgePlaneNormals[2], freeNormalisedEdges[2], faceNormal);

        var edgePlanes = [
            math3D.buildPlaneFromNormalAndPoint(edgePlaneNormals[0], points[0]),
            math3D.buildPlaneFromNormalAndPoint(edgePlaneNormals[1], points[1]),
            math3D.buildPlaneFromNormalAndPoint(edgePlaneNormals[2], points[2])
        ];

        return new CollisionFace(points, facePlane, edgePlanes, freeNormalisedEdges, edgeLengths);
    }

    this.findNearestPointOnCollisionFacePerimeterToPoint = function (collisionFace, point) {

        var nearestPoint = null;
        var nearestPointDistanceSqr = -1

        for (var i = 0; i < 3; i++) {

            // FIXME
            var ray = new Ray(
                collisionFace.points[i],
                collisionFace.freeNormalisedEdges[i]);

            var potentialNearestPoint = vec3.create(); // FIXME
            math3D.calculateNearestPointOnRayToOtherPoint(potentialNearestPoint, ray, point, collisionFace.edgeLengths[i]);

            var potentialNearestPointToPoint = [0, 0, 0]; // FIXME
            vec3.sub(potentialNearestPointToPoint, point, potentialNearestPoint);

            var potentialNearestPointDistanceSqr = vec3.dot(potentialNearestPointToPoint, potentialNearestPointToPoint);

            if (nearestPointDistanceSqr == -1 || potentialNearestPointDistanceSqr < nearestPointDistanceSqr) {
                nearestPointDistanceSqr = potentialNearestPointDistanceSqr;
                nearestPoint = potentialNearestPoint;
            }
        }

        return nearestPoint;
    }

    this.determineIfPointOnFacePlaneIsWithinCollisionFace = function (collisionFace, point) {

        for (var i = 0; i < collisionFace.edgePlanes.length; i++) {

            var edgePlane = collisionFace.edgePlanes[i];

            var distanceToEdgePlane = math3D.calculatePointDistanceFromPlane(edgePlane, point);

            if (distanceToEdgePlane > 0) {
                return false;
            }
        }

        return true;
    }
}