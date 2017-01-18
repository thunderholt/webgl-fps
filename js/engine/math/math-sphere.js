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

    this.calculateSphereCollisionWithCollisionFace = function (out, sphere, face, movementDirection) {

        var $ = this.$calculateSphereCollisionWithCollisionFace;

        // If the face plane faces away from the sphere movement direction, then there is no collision.
        if (vec3.dot(movementDirection, face.facePlane.normal) >= 0) {
            return false;
        }

        // Find the sphere/face-plane intersection.
        var sphereIntersectsFacePlane = false;

        var distanceFromSpherePositionToFacePlane = math3D.calculatePointDistanceFromPlane(face.facePlane, sphere.position);

        if (distanceFromSpherePositionToFacePlane <= sphere.radius && distanceFromSpherePositionToFacePlane >= 0) {

            vec3.copy($.facePlaneIntersectionRay.origin, sphere.position);
            vec3.scale($.facePlaneIntersectionRay.normal, face.facePlane.normal, -1);

            sphereIntersectsFacePlane = math3D.calculateRayIntersectionWithPlane(
                $.sphereFacePlaneIntersection, $.facePlaneIntersectionRay, face.facePlane);
        
        } else {

            sphereIntersectsFacePlane = math3D.calculateSphereCollisionWithPlane(
                $.sphereFacePlaneIntersection, sphere, face.facePlane, movementDirection);
        }

        if (!sphereIntersectsFacePlane) {
            return false;
        }

        // Determine if the sphere/face-plane intersection is within the face.
        if (math3D.determineIfPointOnFacePlaneIsWithinCollisionFace(face, $.sphereFacePlaneIntersection)) {

            vec3.copy(out.intersection, $.sphereFacePlaneIntersection);
            out.distance = vec3.distance($.sphereFacePlaneIntersection, sphere.position) - sphere.radius;

            // Handle the case where the face-plane already intersects the sphere.
            if (out.distance < 0.0) {
                out.distance = 0.0;
            }

            math3D.copyPlane(out.collisionPlane, face.facePlane);

        } else {

            // Nope, find the nearest point on the face's perimeter to the sphere/face-plane intersection.
            math3D.findNearestPointOnCollisionFacePerimeterToPoint($.nearestPointOnFacePerimeter, face, $.sphereFacePlaneIntersection);

            // Cast a ray from the nearest point on face perimeter back to the sphere, using the reverse of the 
            // movement direction, to find the point on the sphere where the intersection will happen.
            vec3.copy($.sphereIntersectionRay.origin, $.nearestPointOnFacePerimeter);
            vec3.scale($.sphereIntersectionRay.normal, movementDirection, -1);

            if (!math3D.calculateRayIntersectionWithSphereDistance($.intersectionDistance, $.sphereIntersectionRay, sphere)) {
                return false;
            }

            vec3.copy(out.intersection, $.nearestPointOnFacePerimeter);
            out.distance = $.intersectionDistance.value;

            // Handle the case where the face-plane already intersects the sphere.
            if (out.distance < 0.0) {
                out.distance = 0.0;
            }

            // Calculate the collision plane.
            vec3.scaleAndAdd($.sphereOriginAfterAllowedMovement, sphere.position, movementDirection, out.distance);

            vec3.subtract($.collisionPlaneNormal, $.sphereOriginAfterAllowedMovement, out.intersection);
            vec3.normalize($.collisionPlaneNormal, $.collisionPlaneNormal);

            math3D.buildPlaneFromNormalAndPoint(out.collisionPlane, $.collisionPlaneNormal, out.intersection);
        }

        return true;
    }

    // Function locals.
    this.$checkSphereIntersectsAABB = {
        nearestPointInAABB: vec3.create(),
        nearestPointInAABBToSpherePosition: vec3.create()
    }

    this.$calculateSphereCollisionWithPlane = {
        sphereMovementRay: new Ray(),
        sphereMovementRayPlaneIntersection: vec3.create(),
        invPlaneNormal: vec3.create(),
        spherePlaneIntersection: vec3.create()
    }

    this.$calculateSphereCollisionWithCollisionFace = {
        facePlaneIntersectionRay: new Ray(),
        sphereFacePlaneIntersection: vec3.create(),
        nearestPointOnFacePerimeter: vec3.create(),
        intersectionDistance: new Scalar(0),
        sphereIntersectionRay: new Ray(),
        sphereOriginAfterAllowedMovement: vec3.create(),
        collisionPlaneNormal: vec3.create()
    }
}