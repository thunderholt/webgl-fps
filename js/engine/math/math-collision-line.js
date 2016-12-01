function MathCollisionLine() {

    this.buildCollisionLineFromFromAndToPoints = function (out) {

        //var freeVector = vec3.create();
        vec3.copy(out.ray.origin, out.from);

        vec3.sub(out.ray.normal, out.to, out.from);
        out.length = vec3.length(out.ray.normal);

        //var normal = vec3.create();
        vec3.normalize(out.ray.normal, out.ray.normal);

        

        //var line = new CollisionLine(from, to, new Ray(from, normal), length);

        //return out;
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

        //var lineFromToFacePlaneIntersection = vec3.create();

        //vec3.sub(lineFromToFacePlaneIntersection, facePlaneIntersection, line.from);

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
}