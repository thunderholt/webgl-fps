function MathCollisionLine() {

    this.buildCollisionLineFromFromAndToPoints = function (out) {

        vec3.copy(out.ray.origin, out.from);

        vec3.sub(out.ray.normal, out.to, out.from);
        out.length = vec3.length(out.ray.normal);

        vec3.normalize(out.ray.normal, out.ray.normal);
    }

    this.calculateCollisionLineIntersectionWithCollisionFace = function (out, line, face) {

        var isFrontSideCollision = math3D.calculatePointDistanceFromPlane(face.facePlane, line.from) > 0;

        var facePlaneIntersection = vec3.create(); // FIXME

        var lineIntersects = math3D.calculateRayIntersectionWithPlane(facePlaneIntersection, line.ray, face.facePlane);

        if (!lineIntersects) {
            return FaceIntersectionType.None;
        }

        if (!math3D.determineIfPointOnFacePlaneIsWithinCollisionFace(face, facePlaneIntersection)) {
            return FaceIntersectionType.None;
        }

        var distanceToFacePlaneIntersectionSqr = vec3.squaredDistance(line.from, facePlaneIntersection);

        var lineLengthSqr = line.length * line.length;

        if (distanceToFacePlaneIntersectionSqr > lineLengthSqr) {
            return FaceIntersectionType.None;
        }
        
        if (out != null) {
            vec3.copy(out, facePlaneIntersection);
        }

        return isFrontSideCollision ? FaceIntersectionType.FrontSide : FaceIntersectionType.BackSide;
    }

    this.determineIfCollisionLineIntersectsSphere = function (line, sphere) {

        var sphereSadiusSqr = sphere.radius * sphere.radius;
        var fromPointDistanceSqr = vec3.sqrDist(line.from, sphere.position);
        if (fromPointDistanceSqr <= sphereSadiusSqr) {
            return true;
        }

        var toPointDistanceSqr = vec3.sqrDist(line.from, sphere.position);
        if (toPointDistanceSqr <= sphereSadiusSqr) {
            return true;
        }

        var intersectionPoint = vec3.create(); // FIXME
        var rayIntersectsSphere = math3D.calculateRayIntersectionWithSphere(intersectionPoint, line.ray, sphere);

        if (!rayIntersectsSphere) {
            return false;
        }

        var distanceToIntersectionPointSqr = vec3.squaredDistance(line.from, intersectionPoint);

        var lineLengthSqr = line.length * line.length;

        if (distanceToIntersectionPointSqr > lineLengthSqr) {
            return false;
        }

        return true;
    }
}