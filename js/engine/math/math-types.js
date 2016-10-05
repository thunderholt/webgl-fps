function Sphere(position, radius) {

    this.position = position;
    this.radius = radius;
}

function AABB(from, to) {

    this.from = from;
    this.to = to;
}

function Plane(normal, d) {

    this.normal = normal;
    this.d = d;
}

function Frustum(planes) {

    this.planes = planes;
}

function Ray(origin, normal) {

    this.origin = origin;
    this.normal = normal;
}