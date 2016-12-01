var engine = new Engine();
var util = new Util();
var math3D = new Math3D();

engine.actorControllersById['TestActorController'] = new TestActorController();

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