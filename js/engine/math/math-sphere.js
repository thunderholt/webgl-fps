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
}