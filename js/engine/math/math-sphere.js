function MathSphere() {

    this.checkSphereIntersectsAABB = function (sphere, aabb) {

        var $ = this.$checkSphereIntersectsAABB;

        this.clampPointToAABB($.nearestPointInAABB, sphere.position, aabb);

        vec3.sub($.nearestPointInAABBToSpherePosition, sphere.position, $.nearestPointInAABB);

        var sphereRadiusSqr = sphere.radius * sphere.radius;
        var nearestPointInAABBToSpherePositionLengthSqr = vec3.sqrLen($.nearestPointInAABBToSpherePosition);

        return nearestPointInAABBToSpherePositionLengthSqr <= sphereRadiusSqr;
    }

    this.checkSphereIntersectsSphere = function (sphere1, sphere2) {

        var distanceBetweenSpheres = vec3.distance(sphere1.position, sphere2.position);

        return distanceBetweenSpheres <= sphere1.radius + sphere2.radius;
    }

    this.$calculateSphereCollisionWithPlane = {
        sphereMovementRay: new Ray(),
        sphereMovementRayPlaneIntersection: vec3.create(),
        invPlaneNormal: vec3.create(),
        spherePlaneIntersection: vec3.create()
    }

    this.calculateSphereCollisionWithPlane = function (out, sphere, plane, movementDirection) {

        var $ = this.$calculateSphereCollisionWithPlane;

        var currentDistanceToPlane = this.calculatePointDistanceFromPlane(plane, sphere.position);
        if (currentDistanceToPlane < sphere.radius) {
            return false;
        }

        vec3.copy($.sphereMovementRay.origin, sphere.position);
        vec3.copy($.sphereMovementRay.normal, movementDirection);

        var sphereMovementRayIntersectsPlane = this.calculateRayIntersectionWithPlane($.sphereMovementRayPlaneIntersection, $.sphereMovementRay, plane);
        if (!sphereMovementRayIntersectsPlane) {
            return false;
        }

        vec3.scale($.invPlaneNormal, plane.normal, -1);

        var cosA = vec3.dot($.sphereMovementRay.normal, $.invPlaneNormal);

        if (cosA == 1) {
            vec3.copy(out, $.sphereMovementRayPlaneIntersection);
            return true;
        } 

        var hypotenuse = sphere.radius / cosA;

        var t = vec3.distance($.sphereMovementRayPlaneIntersection, sphere.position) - hypotenuse;

        vec3.scale($.spherePlaneIntersection, $.sphereMovementRay.normal, t);
        vec3.add($.spherePlaneIntersection, $.spherePlaneIntersection, sphere.position);
        vec3.scaleAndAdd($.spherePlaneIntersection, $.spherePlaneIntersection, $.invPlaneNormal, sphere.radius);

        vec3.copy(out, $.spherePlaneIntersection);

        return true;
    }

    this.calculateSphereCollisionWithCollisionFace = function (sphere, face, movementDirection) {

        var result = {
            intersection: null,
            distance: 0,
            collisionPlane: null
        }

        // If the face plane faces away from the sphere movement direction, then there is no collision.
        var movementDirectionDotFacePlaneNormal = vec3.dot(movementDirection, face.facePlane.normal);

        if (movementDirectionDotFacePlaneNormal >= 0) {
            return null;
        }

        // Find the sphere/face-plane intersection.
        var sphereFacePlaneIntersection = null;

        var distanceFromSpherePositionToFacePlane = math3D.calculatePointDistanceFromPlane(face.facePlane, sphere.position);

        var canOnlyIntersectPerimeter = false;

        if (distanceFromSpherePositionToFacePlane <= sphere.radius && distanceFromSpherePositionToFacePlane >= 0) {

            var invFacePlaneNormal = [0, 0, 0];
            vec3.scale(invFacePlaneNormal, face.facePlane.normal, -1);

            var facePlaneIntersectionRay = new Ray(
                vec3.clone(sphere.position),
                invFacePlaneNormal);

            var temp = vec3.create(); // FIXME

            if (math3D.calculateRayIntersectionWithPlane(temp, facePlaneIntersectionRay, face.facePlane)) {
                sphereFacePlaneIntersection = temp;
            }

        } else {

            var temp = vec3.create(); // FIXME

            if (math3D.calculateSphereCollisionWithPlane(temp, sphere, face.facePlane, movementDirection)) {
                sphereFacePlaneIntersection = temp;
            }
        }

        if (sphereFacePlaneIntersection == null) {
            return null;
        }

        // Determine if the sphere/face-plane intersection is within the face.
        if (!canOnlyIntersectPerimeter && math3D.determineIfPointOnFacePlaneIsWithinCollisionFace(face, sphereFacePlaneIntersection)) {

            result.intersection = sphereFacePlaneIntersection;

            var sphereFacePlaneIntersectionToSphereOrigin = [0, 0, 0];
            vec3.sub(sphereFacePlaneIntersectionToSphereOrigin, sphereFacePlaneIntersection, sphere.position);
            result.distance = vec3.length(sphereFacePlaneIntersectionToSphereOrigin) - sphere.radius;

            // Handle the case where the face-plane already intersects the sphere.
            if (result.distance < 0.0) {
                result.distance = 0.0;
            }

            result.collisionPlane = face.facePlane;

        } else {

            // Nope, find the nearest point on the face's perimeter to the sphere/face-plane intersection.
            var nearestPointOnFacePerimeter = vec3.create(); // FIXME
            math3D.findNearestPointOnCollisionFacePerimeterToPoint(nearestPointOnFacePerimeter, face, sphereFacePlaneIntersection);

            // Cast a ray from the nearest point on face perimeter back to the sphere, using the reverse of the 
            // movement direction, to find the point on the sphere where the intersection will happen.
            var sphereIntersectionRay = new Ray(
                nearestPointOnFacePerimeter,
                vec3.clone(movementDirection));

            vec3.scale(sphereIntersectionRay.normal, sphereIntersectionRay.normal, -1);

            var intersectionDistance = new Scalar(0); // FIXME

            if (!math3D.calculateRayIntersectionWithSphereDistance(intersectionDistance, sphereIntersectionRay, sphere)) {
                return null;
            }

            result.intersection = nearestPointOnFacePerimeter;
            result.distance = intersectionDistance.value;

            // Handle the case where the face-plane already intersects the sphere.
            if (result.distance < 0.0) {
                result.distance = 0.0;
            }

            // Calculate the collision plane.
            var sphereOriginAfterAllowedMovement = [0, 0, 0];
            vec3.scaleAndAdd(sphereOriginAfterAllowedMovement, sphere.position, movementDirection, result.distance);

            var collisionPlaneNormal = [0, 0, 0];
            vec3.subtract(collisionPlaneNormal, sphereOriginAfterAllowedMovement, result.intersection);
            vec3.normalize(collisionPlaneNormal, collisionPlaneNormal);

            result.collisionPlane = math3D.buildPlaneFromNormalAndPoint(collisionPlaneNormal, result.intersection);
        }

        return result;
    }

    // Function locals.
    this.$checkSphereIntersectsAABB = {
        nearestPointInAABB: vec3.create(),
        nearestPointInAABBToSpherePosition: vec3.create()
    }
}