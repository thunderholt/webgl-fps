var engine = new Engine();
var util = new Util();
var math3D = new Math3D();

engine.actorControllersById['TestActorController'] = new TestActorController();
engine.actorControllersById['EnemyActorController'] = new EnemyActorController();

engine.init(function () {

    engine.enterMainLoop();

    if (typeof(isEditor) == 'undefined') {

        engine.loadMap('test-map-2', function () {

            engine.startMap();
        });
    }
});

function TestActorController() {

    this.heartbeat = function (actor) {

        if (actor.data.direction == null) {
            actor.data.direction = 1;
        }

        if (actor.position[0] > 3) {
            actor.data.direction = -1;
        }

        if (actor.position[0] < 0) {
            actor.data.direction = 1;
        }

        actor.data.speed = 0.01;

        actor.position[0] += actor.data.direction * actor.data.speed;

        actor.rotation[1] += 0.01;

        actor.rotation[2] += 0.01;
    }
}

function EnemyActorController() {

    this.heartbeat = function (actor) {

        if (actor.data.movementNormal == null) {
            actor.data.movementNormal = vec3.fromValues(1, 0, 0);
        }

        actor.data.movementAmount = 0.01;

        if (actor.data.collisionTestSphere == null) {
            actor.data.collisionTestSphere = new Sphere(vec3.create(), 0.45);
        }

        vec3.copy(actor.data.collisionTestSphere.position, actor.position);
        actor.data.collisionTestSphere.position[1] -= 2.5;

        engine.mapManager.moveSphereThroughMap(actor.data.collisionTestSphere, actor.data.movementNormal, actor.data.movementAmount, true);

        vec3.copy(actor.position, actor.data.collisionTestSphere.position);
        actor.position[1] += 2.5;
    }
}