var engine = new Engine();
var util = new Util();
var math3D = new Math3D();

engine.gameControllersById['GameController'] = new GameController();

engine.actorControllersById['TestActorController'] = new TestActorController();
engine.actorControllersById['EnemyActorController'] = new EnemyActorController();

engine.particleControllersById['ProjectileParticleController'] = new ProjectileParticleController();


engine.init(function () {

    engine.enterMainLoop();

    if (typeof(isEditor) == 'undefined') {

        engine.loadMap('test-map-2', function () {

            engine.startMap();
        });
    }
});

function GameController() {

    this.heartbeat = function () {

        if (engine.mouse.mouseIsDown) {
            
            this.playerShoot();
        }
    }

    this.playerShoot = function () {

        // Grab the projectiles emitter.
        var emitter = engine.map.emittersById['projectiles'];

        if (emitter == null) {
            console.log('Projectiles emitter not found!');
            return;
        }

        // Spawn a particle.
        var particle = engine.particleManager.spawnParticle(emitter);

        if (particle == null) {
            return;
        }

        // Init the particle's data.
        particle.data = particle.data || {
            movementNormal: vec3.create()
        }

        // Set the particle's initial position.
        var player = engine.map.player;

        vec3.copy(particle.position, player.position);

        // Set the particle's movement normal.
        var playerAxes = math3D.buildAxesFromRotations(player.rotation);
        vec3.copy(particle.data.movementNormal, playerAxes.zAxis);
    }
}

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
        actor.data.collisionTestSphere.position[1] += actor.data.collisionTestSphere.radius;

        engine.mapManager.moveSphereThroughMap(actor.data.collisionTestSphere, actor.data.movementNormal, actor.data.movementAmount, true);

        vec3.copy(actor.position, actor.data.collisionTestSphere.position);
        actor.position[1] -= actor.data.collisionTestSphere.radius;
    }
}

function ProjectileParticleController() {

    this.heartbeat = function (emitter, particle) {

        vec3.scaleAndAdd(particle.position, particle.position, particle.data.movementNormal, 0.1);
    }
}