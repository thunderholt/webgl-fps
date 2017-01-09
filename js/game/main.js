var engine = new Engine();
var util = new Util();
var math3D = new Math3D();

var ProjectileParticleSource = {
    None: 0,
    Player: 1,
    Enemy: 2
}

var DoorState = {
    Idle: 0,
    Opening: 1,
    Closing: 2
}

engine.gameControllersById['GameController'] = new GameController();

//engine.actorControllersById['TestActorController'] = new TestActorController();
engine.actorControllersById['EnemyActorController'] = new EnemyActorController();
engine.actorControllersById['DoorActorController'] = new DoorActorController();

engine.particleControllersById['ProjectileParticleController'] = new ProjectileParticleController();

engine.triggerControllersById['DoorOpenerTriggerController'] = new DoorOpenerTriggerController();

engine.init(function () {

    engine.enterMainLoop();

    if (typeof(isEditor) == 'undefined') {

        engine.loadMap('test-map-2', function () {

            engine.startMap();
        });
    }
});


function GameController() {

    this.dataSchema = {
        playerShootCountdown: {
            defaultValue: 0
        }
    }

    this.heartbeat = function () {

        var gameData = engine.map.gameData;
        var frameDelta = engine.frameTimer.frameDelta;

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

        var player = engine.map.player;

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
        particle.data.source = ProjectileParticleSource.Player;

        vec3.copy(particle.position, player.position);

        var playerAxes = math3D.buildAxesFromRotations(player.rotation);
        vec3.copy(particle.direction, playerAxes.zAxis);
    }
}

function EnemyActorController() {

    this.dataSchema = {

        health: {
            defaultValue: 3,
            editorType: 'number',
            editorLabel: 'Health'
        },
        speed: {
            defaultValue: 0.01,
            editorType: 'number',
            editorLabel: 'Speed'
        },
        changeDirectionCountdown: {
            defaultValue: 0
        },
        targetYRotation: {
            defaultValue: 0
        }
    }

    this.heartbeat = function (actor) {

        var $ = this.$heartbeat;

        var frameDelta = engine.frameTimer.frameDelta;

        // Detemrine if we should change direction.
        actor.data.changeDirectionCountdown -= frameDelta;

        if (actor.data.changeDirectionCountdown <= 0) {
            actor.data.changeDirectionCountdown = 200;

            actor.data.targetYRotation = (Math.random() * Math.PI * 2) - Math.PI;
        }

        // Update the Y rotation.
        if (actor.rotation[1] > actor.data.targetYRotation) {
            actor.rotation[1] -= 0.1 * frameDelta;
            actor.rotation[1] = Math.max(actor.rotation[1], actor.data.targetYRotation);
        } else if (actor.rotation[1] < actor.data.targetYRotation) {
            actor.rotation[1] += 0.1 * frameDelta;
            actor.rotation[1] = Math.min(actor.rotation[1], actor.data.targetYRotation);
        }

        // Calculate the movement normal from the Y rotation.
        vec3.set($.movementNormal, 0, 0, 1);
        vec3.rotateY($.movementNormal, $.movementNormal, math3D.zeroVec3, actor.rotation[1]);

        // Calculate the movement amount.
        var movementAmount = actor.data.speed * frameDelta;

        // Build the collision test sphere.
        vec3.copy($.collisionTestSphere.position, actor.position);
        $.collisionTestSphere.position[1] += $.collisionTestSphere.radius;

        // Move the sphere through the map.
        engine.mapManager.moveSphereThroughMap($.collisionTestSphere, $.movementNormal, movementAmount, true);

        // Update the actor's position.
        vec3.copy(actor.position, $.collisionTestSphere.position);
        actor.position[1] -= $.collisionTestSphere.radius;
    }

    this.handleProjectileParticleCollision = function (actor, particle) {

        if (particle.data.source == ProjectileParticleSource.Player) {

            actor.data.health--;

            if (actor.data.health > 0) {
                console.log('Ouch! Health: ' + actor.data.health);
            } else {
                console.log('I\'m dead!');
                actor.active = false;
            }
        }
    }

    // Function locals.
    this.$heartbeat = {
        movementNormal: vec3.fromValues(0, 0, 0),
        collisionTestSphere: new Sphere(vec3.create(), 0.45)
    }
}

function DoorActorController() {

    this.dataSchema = {
        
        state: {
            defaultValue: DoorState.Idle
        },
        speed: {
            defaultValue: 1.0,
            editorType: 'number',
            editorLabel: 'Speed'
        }
    }

    this.heartbeat = function (actor) {

        var frameDelta = engine.frameTimer.frameDelta;

        if (actor.data.state == DoorState.Opening) {
            
            actor.positionOffset[1] += actor.data.speed * frameDelta;
            if (actor.positionOffset[1] >= 4) {
                actor.positionOffset[1] = 4;
                actor.data.state = DoorState.Idle;
            }

        } else if (actor.data.state == DoorState.Closing) {

            actor.positionOffset[1] -= actor.data.speed * frameDelta;
            if (actor.positionOffset[1] <= 0) {
                actor.positionOffset[1] = 0;
                actor.data.state = DoorState.Idle;
            }
        }
    }

    this.open = function (actor) {
        actor.data.state = DoorState.Opening;
    }

    this.close = function (actor) {
        actor.data.state = DoorState.Closing;
    }
}

function ProjectileParticleController() {

    this.dataSchema = {

        source: {
            defaultValue: ProjectileParticleSource.None
        }
    }

    this.heartbeat = function (emitter, particleIndex) {

        var $ = this.$heartbeat;

        var particle = emitter.particles[particleIndex];

        var frameDelta = engine.frameTimer.frameDelta;


        vec3.copy($.collisionLine.from, particle.position);
        
        vec3.scaleAndAdd($.collisionLine.to, particle.position, particle.direction, 0.7 * frameDelta);

        math3D.buildCollisionLineFromFromAndToPoints($.collisionLine);

        // See if the particle collides with an actor.
        var collidingActor = engine.mapManager.findNearestLineIntersectionWithActor($.actorCollisionPoint, $.collisionLine);
        var collidesWithActor = collidingActor != null;

        // See if the particle collides with the map.
        var collidesWithMap = engine.mapManager.findNearestLineIntersectionWithMap($.mapCollisionPoint, $.collisionLine);

        // If the particle collides with both an actor and the map, see which is nearest.
        if (collidesWithActor && collidesWithMap) {

            var actorCollisionPointDistanceSqr = vec3.sqrDist(particle.position, $.actorCollisionPoint);
            var mapCollisionPointDistanceSqr = vec3.sqrDist(particle.position, $.mapCollisionPoint);

            collidesWithActor = actorCollisionPointDistanceSqr < mapCollisionPointDistanceSqr;
            collidesWithMap = actorCollisionPointDistanceSqr > mapCollisionPointDistanceSqr;
        }

        // Handle the collision.
        if (collidesWithActor) {

            vec3.copy(particle.position, $.actorCollisionPoint);

            particle.active = false;

            console.log('Particle collided with actor: ' + collidingActor.id);

            // Tell the colliding actor to handle the collision.
            var actorController = engine.actorControllersById[collidingActor.controllerId];

            if (actorController != null && actorController.handleProjectileParticleCollision != null) {

                actorController.handleProjectileParticleCollision(collidingActor, particle);
            }

        } else if (collidesWithMap) {

            vec3.copy(particle.position, $.mapCollisionPoint);

            particle.active = false;
            console.log('Particle collided with map!');

        } else {

            // No collision, just move the particle to its new position.
            vec3.copy(particle.position, $.collisionLine.to);
        }
    }

    // Function locals.
    this.$heartbeat = {
        collisionLine: new CollisionLine(null, null, null, null),
        actorCollisionPoint: vec3.create(),
        mapCollisionPoint: vec3.create()
    }
}

function DoorOpenerTriggerController() {

    this.dataSchema = {

        targetDoorActorId: {
            defaultValue: '',
            editorType: 'actor-picker',
            editorLabel: 'Target Door Actor'
        }
    }

    this.handlePlayerEnter = function (trigger) {

        console.log('Player has entered ' + trigger.id);

        var doorActor = engine.map.actorsById[trigger.data.targetDoorActorId];
        if (doorActor == null) {
            return;
        }

        var doorActorController = engine.actorControllersById[doorActor.controllerId];

        if (doorActorController != null && doorActorController.open != null) {
            doorActorController.open(doorActor);
        }
    }

    this.handlePlayerLeave = function (trigger) {

        console.log('Player has left ' + trigger.id);

        var doorActor = engine.map.actorsById[trigger.data.targetDoorActorId];
        if (doorActor == null) {
            return;
        }

        var doorActorController = engine.actorControllersById[doorActor.controllerId];

        if (doorActorController != null && doorActorController.close != null) {
            doorActorController.close(doorActor);
        }
    }
}