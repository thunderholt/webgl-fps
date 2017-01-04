var engine = new Engine();
var util = new Util();
var math3D = new Math3D();

engine.gameControllersById['GameController'] = new GameController();

//engine.actorControllersById['TestActorController'] = new TestActorController();
engine.actorControllersById['EnemyActorController'] = new EnemyActorController();
engine.actorControllersById['DoorActorController'] = new DoorActorController();

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

        var gameData = engine.map.gameData;
        var frameDelta = engine.frameTimer.frameDelta;

        if (gameData.playerShootCountdown == null) {

            gameData.playerShootCountdown = 0;
        }

        if (gameData.playerShootCountdown > 0) {

            gameData.playerShootCountdown -= frameDelta;

        } else {

            if (engine.mouse.mouseIsDown) {

                this.playerShoot();

                gameData.playerShootCountdown = 10;
            }
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
        if (particle.data == null) {
            particle.data = {
                source: 'player'
            }
        }

        // Set the particle's initial position.
        var player = engine.map.player;

        vec3.copy(particle.position, player.position);

        // Set the particle's movement normal.
        if (particle.data.movementNormal == null) {
            particle.data.movementNormal = vec3.create();
        }

        var playerAxes = math3D.buildAxesFromRotations(player.rotation);
        vec3.copy(particle.data.movementNormal, playerAxes.zAxis);

    }
}

/*function TestActorController() {

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
}*/

function EnemyActorController() {

    this.heartbeat = function (actor) {

        var frameDelta = engine.frameTimer.frameDelta;

        if (actor.data == null) {
            actor.data = {};
        }

        if (actor.data.movementNormal == null) {
            actor.data.movementNormal = vec3.fromValues(0, 0, 0);
        }

        vec3.set(actor.data.movementNormal, 0, 0, 1);
        vec3.rotateY(actor.data.movementNormal, actor.data.movementNormal, math3D.zeroVec3, actor.rotation[1]);

        

        if (actor.data.targetYRotation == null) {
            actor.data.targetYRotation = 0;
        }

        if (actor.data.changeDirectionCountdown == null) {
            actor.data.changeDirectionCountdown = 0;
        }

        actor.data.changeDirectionCountdown -= frameDelta;

        if (actor.data.changeDirectionCountdown <= 0) {
            actor.data.changeDirectionCountdown = 200;

            actor.data.targetYRotation = (Math.random() * Math.PI * 2) - Math.PI;
        }

        if (actor.rotation[1] > actor.data.targetYRotation) {
            actor.rotation[1] -= 0.1 * frameDelta;
            actor.rotation[1] = Math.max(actor.rotation[1], actor.data.targetYRotation);
        } else if (actor.rotation[1] < actor.data.targetYRotation) {
            actor.rotation[1] += 0.1 * frameDelta;
            actor.rotation[1] = Math.min(actor.rotation[1], actor.data.targetYRotation);
        }

        actor.data.movementAmount = 0.03;

        if (actor.data.collisionTestSphere == null) {
            actor.data.collisionTestSphere = new Sphere(vec3.create(), 0.45);
        }

        vec3.copy(actor.data.collisionTestSphere.position, actor.position);
        actor.data.collisionTestSphere.position[1] += actor.data.collisionTestSphere.radius;

        engine.mapManager.moveSphereThroughMap(actor.data.collisionTestSphere, actor.data.movementNormal, actor.data.movementAmount, true);

        vec3.copy(actor.position, actor.data.collisionTestSphere.position);
        actor.position[1] -= actor.data.collisionTestSphere.radius;
    }

    this.handleProjectileParticleCollision = function (actor, particle) {

        if (actor.data.health == null) {
            actor.data.health = 3;
        }

        if (particle.data.source == 'player') {

            actor.data.health--;

            if (actor.data.health > 0) {
                console.log('Ouch! Health: ' + actor.data.health);
            } else {
                console.log('I\'m dead!');
                actor.active = false;
            }
        }
    }
}

function DoorActorController() {

    this.heartbeat = function (actor) {

        var frameDelta = engine.frameTimer.frameDelta;

        if (actor.data.direction == null) {
            actor.data.direction = 1;
        }

        if (actor.data.originalYPos == null) {
            actor.data.originalYPos = actor.position[1];
        }

        if (actor.data.offset == null) {
            actor.data.offset = 0;
        }

        if (actor.data.offset == 4) {
            actor.data.direction = -1;
        }

        if (actor.data.offset == 0) {
            actor.data.direction = 1;
        }

        actor.position[1] = actor.data.originalYPos + actor.data.offset;

        actor.data.speed = 0.2;
        actor.data.offset += actor.data.speed * frameDelta * actor.data.direction;

        if (actor.data.offset > 4) {
            actor.data.offset = 4;
        } else if (actor.data.offset < 0) {
            actor.data.offset = 0;
        }
    }
}

function ProjectileParticleController() {

    this.heartbeat = function (emitter, particle) {

        var frameDelta = engine.frameTimer.frameDelta;

        if (particle.data.collisionLine == null) {
            particle.data.collisionLine = new CollisionLine(null, null, null, null);
        }

        vec3.copy(particle.data.collisionLine.from, particle.position);
        
        vec3.scaleAndAdd(particle.data.collisionLine.to, particle.position, particle.data.movementNormal, 0.7 * frameDelta);

        math3D.buildCollisionLineFromFromAndToPoints(particle.data.collisionLine);

        // See if the particle collides with an actor.
        if (particle.data.actorCollisionPoint == null) {
            particle.data.actorCollisionPoint = vec3.create();
        }

        var collidingActor = engine.mapManager.findNearestLineIntersectionWithActor(particle.data.actorCollisionPoint, particle.data.collisionLine);
        var collidesWithActor = collidingActor != null;

        // See if the particle collides with the map.
        if (particle.data.mapCollisionPoint == null) {
            particle.data.mapCollisionPoint = vec3.create();
        }

        var collidesWithMap = engine.mapManager.findNearestLineIntersectionWithMap(particle.data.mapCollisionPoint, particle.data.collisionLine);

        // If the particle collides with both an actor and the map, see which is nearest.
        if (collidesWithActor && collidesWithMap) {

            var actorCollisionPointDistanceSqr = vec3.sqrDist(particle.position, particle.data.actorCollisionPoint);
            var mapCollisionPointDistanceSqr = vec3.sqrDist(particle.position, particle.data.mapCollisionPoint);

            collidesWithActor = actorCollisionPointDistanceSqr < mapCollisionPointDistanceSqr;
            collidesWithMap = actorCollisionPointDistanceSqr > mapCollisionPointDistanceSqr;
        }

        // Handle the collision.
        if (collidesWithActor) {

            vec3.copy(particle.position, particle.data.actorCollisionPoint);

            particle.active = false;

            console.log('Particle collided with actor: ' + collidingActor.id);

            // Tell the colliding actor to handle the collision.
            var actorController = engine.actorControllersById[collidingActor.controllerId];

            if (actorController != null && actorController.handleProjectileParticleCollision != null) {

                actorController.handleProjectileParticleCollision(collidingActor, particle);
            }

        } else if (collidesWithMap) {

            vec3.copy(particle.position, particle.data.mapCollisionPoint);

            particle.active = false;
            console.log('Particle collided with map!');

        } else {

            // No collision, just move the particle to its new position.
            vec3.copy(particle.position, particle.data.collisionLine.to);
        }
    }
}