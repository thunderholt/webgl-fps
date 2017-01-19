function MathCollisionLine() {

    this.buildCollisionLineFromFromAndToPoints = function (out) {

        vec3.copy(out.ray.origin, out.from);

        vec3.sub(out.ray.normal, out.to, out.from);
        out.length = vec3.length(out.ray.normal);

        vec3.normalize(out.ray.normal, out.ray.normal);
    }

    this.calculateCollisionLineIntersectionWithCollisionFace = function (out, line, face) {

        var $ = this.$calculateCollisionLineIntersectionWithCollisionFace;

        var isFrontSideCollision = math3D.calculatePointDistanceFromPlane(face.facePlane, line.from) > 0;

        var lineIntersects = math3D.calculateRayIntersectionWithPlane($.facePlaneIntersection, line.ray, face.facePlane);

        if (!lineIntersects) {
            return FaceIntersectionType.None;
        }

        if (!math3D.determineIfPointOnFacePlaneIsWithinCollisionFace(face, $.facePlaneIntersection)) {
            return FaceIntersectionType.None;
        }

        var distanceToFacePlaneIntersectionSqr = vec3.squaredDistance(line.from, $.facePlaneIntersection);

        var lineLengthSqr = line.length * line.length;

        if (distanceToFacePlaneIntersectionSqr > lineLengthSqr) {
            return FaceIntersectionType.None;
        }
        
        if (out != null) {
            vec3.copy(out, $.facePlaneIntersection);
        }

        return isFrontSideCollision ? FaceIntersectionType.FrontSide : FaceIntersectionType.BackSide;
    }

    this.determineIfCollisionLineIntersectsSphere = function (line, sphere) {

        var $ = this.$determineIfCollisionLineIntersectsSphere;

        var sphereSadiusSqr = sphere.radius * sphere.radius;
        var fromPointDistanceSqr = vec3.sqrDist(line.from, sphere.position);
        if (fromPointDistanceSqr <= sphereSadiusSqr) {
            return true;
        }

        var toPointDistanceSqr = vec3.sqrDist(line.from, sphere.position);
        if (toPointDistanceSqr <= sphereSadiusSqr) {
            return true;
        }

        var rayIntersectsSphere = math3D.calculateRayIntersectionWithSphere($.intersectionPoint, line.ray, sphere);

        if (!rayIntersectsSphere) {
            return false;
        }

        var distanceToIntersectionPointSqr = vec3.squaredDistance(line.from, $.intersectionPoint);

        var lineLengthSqr = line.length * line.length;

        if (distanceToIntersectionPointSqr > lineLengthSqr) {
            return false;
        }

        return true;
    }

    this.checkIfCollisionLineIntersectsAABB = function (line, aabb) {

        var $ = this.$checkIfCollisionLineIntersectsAABB;

        // Test if the ray intersection with any of the AABB's planes is within the AABB.
        this.buildPlaneFromNormalAndPoint($.planes[0], this.axes3D.positiveZ, aabb.from); // Front
        this.buildPlaneFromNormalAndPoint($.planes[1], this.axes3D.negativeZ, aabb.to); // Back
        this.buildPlaneFromNormalAndPoint($.planes[2], this.axes3D.negativeX, aabb.from); // Left
        this.buildPlaneFromNormalAndPoint($.planes[3], this.axes3D.positiveX, aabb.to); // Right
        this.buildPlaneFromNormalAndPoint($.planes[4], this.axes3D.positiveY, aabb.from); // Top
        this.buildPlaneFromNormalAndPoint($.planes[5], this.axes3D.negativeY, aabb.to); // Bottom

        for (var i = 0; i < $.planes.length; i++) {
            var lineIntersects = this.calculateRayIntersectionWithPlane($.planeIntersection, line.ray, $.plane);
            if (lineIntersects && this.checkPointIsWithinAABB(aabb, $.planeIntersection)) {
                return true;
            }
        }

        return false;
    }

    // Function locals.
    this.$calculateCollisionLineIntersectionWithCollisionFace = {
        facePlaneIntersection: vec3.create()
    }

    this.$determineIfCollisionLineIntersectsSphere = {
        intersectionPoint: vec3.create()
    }

    this.$checkIfCollisionLineIntersectsAABB = {
        planes: [new Plane(), new Plane(), new Plane(), new Plane(), new Plane(), new Plane()],
        planeIntersection: vec3.create()
   }
}