function MathCollisionLine() {

    this.buildCollisionLineFromPoints = function (from, to) {

        var freeVector = vec3.create();
        vec3.sub(freeVector, to, from);
        var length = vec3.length(freeVector);

        var normal = vec3.create();
        vec3.normalize(normal, freeVector);

        var line = new CollisionLine(from, to, new Ray(from, normal), length);

        return line;
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

        if (out != null) {
            vec3.copy(out, facePlaneIntersection);
        }

        return isFrontSideCollision ? FaceIntersectionType.FrontSide : FaceIntersectionType.BackSide;
    }
}