function MathRay() {

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
}