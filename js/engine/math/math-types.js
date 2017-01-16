function Scalar(value) {

    this.value = value;
}

function Sphere(position, radius) {

    this.position = position || vec3.create();
    this.radius = radius || 0;
}

function AABB(from, to) {

    this.from = from || vec3.create();
    this.to = to || vec3.create();
}

function Plane(normal, d) {

    this.normal = normal || vec3.create();
    this.d = d || 0;
}

function Frustum(planes) {

    this.planes = planes || [new Plane(), new Plane(), new Plane(), new Plane(), new Plane(), new Plane()];
}

function Ray(origin, normal) {

    this.origin = origin || vec3.create();
    this.normal = normal || vec3.create();
}

function CollisionLine(from, to, ray, length) {

    this.from = from || vec3.create();
    this.to = to || vec3.create()
    this.ray = ray || new Ray();
    this.length = length || 0;
}

function CollisionFace(points, facePlane, edgePlanes, freeNormalisedEdges, edgeLengths) {

    this.points = points;
    this.facePlane = facePlane;
    this.edgePlanes = edgePlanes;
    this.freeNormalisedEdges = freeNormalisedEdges;
    this.edgeLengths = edgeLengths;
}