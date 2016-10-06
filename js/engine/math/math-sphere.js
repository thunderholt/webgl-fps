function MathSphere() {

    this.checkSphereIntersectsAABB = function (sphere, aabb) {

        var nearestPointInAABB = this.clampPointToAABB(sphere.position, aabb);

        var nearestPointInAABBToSpherePosition = [0, 0, 0];
        vec3.sub(nearestPointInAABBToSpherePosition, sphere.position, nearestPointInAABB);

        var sphereRadiusSqr = sphere.radius * sphere.radius;
        var nearestPointInAABBToSpherePositionLengthSqr = vec3.sqrLen(nearestPointInAABBToSpherePosition);

        return nearestPointInAABBToSpherePositionLengthSqr <= sphereRadiusSqr;
    }

    this.checkSphereIntersectsSphere = function (sphere1, sphere2) {

        var sphere1ToSphere2 = vec3.create();
        vec3.subtract(sphere1ToSphere2, sphere2.position, sphere1.position);

        var distanceBetweenSpheres = vec3.length(sphere1ToSphere2);

        return distanceBetweenSpheres <= sphere1.radius + sphere2.radius;
    }

    this.calculateSphereCollisionWithPlane = function (sphere, plane, movementDirection) {

        var currentDistanceToPlane = this.calculatePointDistanceFromPlane(plane, sphere.position);
        if (currentDistanceToPlane < sphere.radius) {
            return null;
        }

        var sphereMovementRay = new Ray(
            vec3.clone(sphere.position),
            vec3.clone(movementDirection));

        var sphereMovementRayPlaneIntersection = this.calculateRayIntersectionWithPlane(sphereMovementRay, plane);
        if (sphereMovementRayPlaneIntersection == null) {
            return null;
        }

        var invPlaneNormal = [0, 0, 0];
        vec3.scale(invPlaneNormal, plane.normal, -1);

        var cosA = vec3.dot(sphereMovementRay.normal, invPlaneNormal);

        if (cosA == 1) {
            return sphereMovementRayPlaneIntersection;
        }

        var hypotenuse = sphere.radius / cosA;

        var spherePositionToSphereMovementRayPlaneIntersection = [0, 0, 0];
        vec3.sub(spherePositionToSphereMovementRayPlaneIntersection, sphereMovementRayPlaneIntersection, sphere.position);

        var t = vec3.length(spherePositionToSphereMovementRayPlaneIntersection) - hypotenuse;

        var spherePlaneIntersection = [0, 0, 0];
        vec3.scale(spherePlaneIntersection, sphereMovementRay.normal, t);
        vec3.add(spherePlaneIntersection, spherePlaneIntersection, sphere.position);
        vec3.scaleAndAdd(spherePlaneIntersection, spherePlaneIntersection, invPlaneNormal, sphere.radius);

        return spherePlaneIntersection;
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

            sphereFacePlaneIntersection = math3D.calculateRayIntersectionWithPlane(facePlaneIntersectionRay, face.facePlane);

        } else {

            sphereFacePlaneIntersection = math3D.calculateSphereCollisionWithPlane(sphere, face.facePlane, movementDirection)
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
            var nearestPointOnFacePerimeter = math3D.findNearestPointOnCollisionFacePerimeterToPoint(face, sphereFacePlaneIntersection);

            // Cast a ray from the nearest point on face perimeter back to the sphere, using the reverse of the 
            // movement direction, to find the point on the sphere where the intersection will happen.
            var sphereIntersectionRay = new Ray(
                nearestPointOnFacePerimeter,
                vec3.clone(movementDirection));

            vec3.scale(sphereIntersectionRay.normal, sphereIntersectionRay.normal, -1);

            var intersectionDistance = math3D.calculateRayIntersectionWithSphereDistance(sphereIntersectionRay, sphere);
            if (intersectionDistance == null) {
                return null;
            }

            result.intersection = nearestPointOnFacePerimeter;
            result.distance = intersectionDistance;

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
}