function MathCollisionLine() {

    this.buildCollisionLineFromFromAndToPoints = function (out) {

        vec3.copy(out.ray.origin, out.from);

        vec3.sub(out.ray.normal, out.to, out.from);
        out.length = vec3.length(out.ray.normal);

        vec3.normalize(out.ray.normal, out.ray.normal);
    }

    this.calculateCollisionLineIntersectionWithCollisionFace = function (out, line, face) {

        var isFrontSideCollision = math3D.calculatePointDistanceFromPlane(face.facePlane, line.from) > 0;

        var facePlaneIntersection = math3D.calculateRayIntersectionWithPlane(line.ray, face.facePlane);

        if (facePlaneIntersection == null) {
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

    this.calculateCollisionLineIntersectionWithSphere = function (out, line, sphere) {

        var intersectionPoint = math3D.calculateRayIntersectionWithSphere(line.ray, sphere);

        if (intersectionPoint == null) {
            return false;
        }

        var distanceToIntersectionPointSqr = vec3.squaredDistance(line.from, intersectionPoint);

        var lineLengthSqr = line.length * line.length;

        if (distanceToIntersectionPointSqr > lineLengthSqr) {
            return false;
        }

        if (out != null) {
            vec3.copy(out, intersectionPoint);
        }

        return true;
    }
}