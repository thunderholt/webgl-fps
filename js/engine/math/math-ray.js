function MathRay() {

    this.calculateRayIntersectionWithSphereDistance = function (ray, sphere) {

        /*
		O = Ray origin
		N = ray normal
		t = distance along ray
		P = intersection point
		S = Sphere position
		R = sphere radius

		* Equation 1: Using P and values from the ray:
		O + Nt = P

		* Equation 2: Using P and values from the sphere:
		(P - S).(P - S) = R^2

		* Substitute P from equation 1 into equation 2:
		(O + Nt - S).(O + Nt - S) = R^2

		* We need to extract t, so first of all expand the dot products using the dot product distributive law:
		(O + Nt - S).O + (O + Nt - S).Nt + (O + Nt - S).(-S) = R^2

		* Do a second round of extracting t using the dot product distributive law:
		(O - S).O + (O - S).Nt + (O - S).(-S) + Nt.O + Nt.Nt + Nt.(-S) = R^2

		* Collect terms (use the dot product distributive law in the opposite direction to 
		turn Nt.O + Nt.(-S) into (O - S).Nt, which can then be collected into 2(O - S).Nt):
		(O - S).O + 2(O - S).Nt + (O - S).(-S) + Nt.Nt = R^2

		* Extract t from the dot products:
		(O - S).O + t(2(O - S).N) + (O - S).(-S) + t^2(N.N) = R^2

		* Move R^2 over to the left hand side.
		(O - S).O + t(2(O - S).N) + (O - S).(-S) + t^2(N.N) - R^2 = 0

		* This can be solved using the quadratic formula: ax^2 + bx + c = 0. Reaaranged for the quadratic formula, we get:
		t^2(N.N) + t(2(O - S).N) + (O - S).O + (O - S).(-S) - R^2 = 0

		where
			a = N.N
			b = 2(O - S).N
			c = (O - S).O + (O - S).(-S) - R^2 = (O - S).(O - S) - R^2

		* The quadratic formula can be re-arrange to solve x as:
			x = (-b [+-] sqrt(b^2 - 4ac)) / 2a

			We need to find both the + and - solution and find the shortest positive value (since negative 
			means the sphere is behind the ray, which we aren't interested in).

			We also need to check if the calculation inside the sqrt is < 0, as that means 
			there is no intersection.

		*/

        // Compute O - S.
        var oMinusS = vec3.create();
        vec3.sub(oMinusS, ray.origin, sphere.position);

        // Compute a.
        var a = vec3.dot(ray.normal, ray.normal);

        // Compute b.
        var b = 2 * vec3.dot(oMinusS, ray.normal);

        // Compute c.
        var c = vec3.dot(oMinusS, oMinusS) - sphere.radius * sphere.radius;

        // Compute the determinant (the bit inside the square root).
        var determinant = b * b - 4 * a * c;

        if (determinant < 0) {
            return null;
        }

        // Compute the square root of the determinant.
        var determinantSqtr = Math.sqrt(determinant);

        // Compute t0 (the + version).
        var t0 = (-b + determinantSqtr) / (2 * a);

        // Compute t1 (the - version).
        var t1 = (-b - determinantSqtr) / (2 * a);

        // Find t (the lowest positive value of t0 and t1). Remember that t0 or t1, or both could be
        // negative, which we don't want.

        var t = t0;

        if (t0 < 0) {

            if (t1 < 0) {
                return null;
            } else {
                t = t1;
            }

        } else if (t1 > 0 && t1 < t0) {
            t = t1;
        }

        return t;
    }

    this.calculateRayIntersectionWithSphere = function (ray, sphere) {

        var t = math3D.calculateRayIntersectionWithSphereDistance(ray, sphere);

        if (t == null) {
            return null;
        }

        // Compute the intersection.
        var intersection = vec3.create();
        vec3.scaleAndAdd(intersection, ray.origin, ray.normal, t);

        // We're done!
        return intersection;
    }

    this.calculateRayIntersectionWithPlaneDistance = function (ray, plane) {

        /*
		O = Ray origin
		N = ray normal
		t = distance along ray
		P = intersection point
		S = plane normal
		d = plane d

		* Equation 1: Using P and values from the ray:
		O + Nt = P

		* Equation 2: Using P and values from the plane:
		P.S + d = 0

		* Substitute P from equation 1 into equation 2:
		(O + Nt).S + d = 0

		* We need to extract t, so use the dot product distributive law to get it out of the bracketed bit.
		O.S + Nt.S + d = 0
	
		* Extract t from the dot product:
		O.S + t(N.S) + d = 0

		* Rearrange to get t on the left hand side
		1) -t(N.S) = O.S + d
		2) -t = (O.S + d) / N.S
		3) t = -((O.S + d) / N.S)
		*/

        var nDotS = vec3.dot(ray.normal, plane.normal);

        if (nDotS == 0) {
            return null;
        }

        var t = -((vec3.dot(ray.origin, plane.normal) + plane.d) / nDotS);

        return t;
    }

    this.calculateRayIntersectionWithPlane = function (ray, plane) {

        var t = this.calculateRayIntersectionWithPlaneDistance(ray, plane);

        if (t == null || t < 0) {
            return null;
        }

        // Compute the intersection.
        var intersection = vec3.create();
        vec3.scaleAndAdd(intersection, ray.origin, ray.normal, t);

        // We're done!
        return intersection;
    }

    this.calculateNearestPointOnRayToOtherPoint = function (ray, point, maxLengthAlongRay) {

        /*

		The ray, the point and the nearest intersection form a right-angled
		triangle. We can use trigonometry to find the intersection,

		H = Point - Ray Origin
		h = normalised(H)
		n = Ray normal

		cos(a) = n.h
		t = cos(a) * |H|

		*/

        var hypotenuse = vec3.create();
        vec3.sub(hypotenuse, point, ray.origin);

        var hypotenuseLength = vec3.length(hypotenuse);

        var normalizedHypotenuse = vec3.create();
        vec3.scale(normalizedHypotenuse, hypotenuse, 1 / hypotenuseLength);

        var cosA = vec3.dot(ray.normal, normalizedHypotenuse);

        var t = cosA * hypotenuseLength;

        if (t < 0) {
            t = 0;
        } else if (t > maxLengthAlongRay) {
            t = maxLengthAlongRay;
        }

        var nearestPoint = vec3.create();
        vec3.scaleAndAdd(nearestPoint, ray.origin, ray.normal, t);

        return nearestPoint;
    }
}