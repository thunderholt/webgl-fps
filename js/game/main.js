var engine = new Engine();
var util = new Util();
var math3D = new Math3D();

var ProjectileParticleSource = {
    None: 0,
    Player: 1,
    Enemy: 2
}

var ProjectileParticleCollisionType = {
    Actor: 0,
    Map: 1,
    Player: 2
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
        },
        playerHealth: {
            defaultValue: -1
        },
        playerMaxHealth: {
            defaultValue: 5
        },
        playerIsDead: {
            defaultValue: false
        }
    }

    this.heartbeat = function () {

        var gameData = engine.map.gameData;
        var frameDelta = engine.frameTimer.frameDelta;

        if (gameData.playerHealth == -1) {
            gameData.playerHealth = gameData.playerMaxHealth;
        }

        this.updatePlayerHealthBar();
        this.updatePlayerDeathMessage();

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
        particle.data.sourceActorId = null;

        vec3.copy(particle.position, player.position);

        var playerAxes = new Axes();
        math3D.buildAxesFromRotations(playerAxes, player.rotation);
        vec3.copy(particle.direction, playerAxes.zAxis);
    }

    this.handlePlayerProjectileParticleCollision = function (particle) {

        var gameData = engine.map.gameData;

        if (gameData.playerHealth > 0) {
            gameData.playerHealth--;
        }

        if (gameData.playerHealth == 0) {
            console.log('Player dead!');
            gameData.playerIsDead = true;
        } else {
            console.log('Player ouch!');
        }
    }

    this.updatePlayerHealthBar = function () {

        var gameData = engine.map.gameData;

        var hudGui = engine.map.guisById['hud'];
        if (hudGui != null) {

            var healthFraction = gameData.playerHealth / gameData.playerMaxHealth;
            var animationState = hudGui.animationStatesById['health-bar-grow'];
            if (animationState != null) {

                var hudGuiLayout = engine.guiLayoutManager.getGuiLayout(hudGui.layoutId);
                if (hudGuiLayout != null) {
                    var animation = hudGuiLayout.animationsById['health-bar-grow'];

                    animationState.frameIndex = ((animation.numberOfFrames - 1) * (1 - healthFraction));
                }
            }
        }
    }

    this.updatePlayerDeathMessage = function () {

        var gameData = engine.map.gameData;

        var hudGui = engine.map.guisById['hud'];
        if (hudGui != null) {

            var healthFraction = gameData.playerHealth / gameData.playerMaxHealth;
            var animationState = hudGui.animationStatesById['player-death-message-toggle'];
            if (animationState != null) {

                animationState.frameIndex = gameData.playerIsDead ? 1 : 0;
            }
        }

        
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
            defaultValue: 200
        },
        attackCountdown: {
            defaultValue: -1
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

        // Determine if we should attack.
        if (actor.data.attackCountdown == -1) {
            actor.data.attackCountdown = Math.random() * 20;
        }

        actor.data.attackCountdown -= frameDelta;
        if (actor.data.attackCountdown <= 0) {
            actor.data.attackCountdown = 20;

            this.attack(actor, $.movementNormal);
        }
    }

    this.attack = function (actor, movementNormal) {

        var $ = this.$attack;

        var player = engine.map.player;

        // See if we have line of sight to the player
        vec3.copy($.lineOfSightToPlayerLine.from, actor.position);
        $.lineOfSightToPlayerLine.from[1] += 0.45; // To avoid collision with floor.
        vec3.copy($.lineOfSightToPlayerLine.to, player.position);
        math3D.buildCollisionLineFromFromAndToPoints($.lineOfSightToPlayerLine);

        var obstructionFound = engine.mapManager.findNearestLineIntersectionWithMap(null, $.lineOfSightToPlayerLine); // FIXME - find *any* intersection will be faster.

        if (!obstructionFound) {
            
            // We have line of sight, lets see if the actor is facing the player.
            var delta = vec3.dot(movementNormal, $.lineOfSightToPlayerLine.ray.normal);
            
            if (delta > 0.9) {
                
                // The actor is facing player, shoot!
                this.spawnParticle(actor, $.lineOfSightToPlayerLine.ray.normal);
            }
        }
    }

    this.spawnParticle = function (actor, directionNormal) {

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
        particle.data.source = ProjectileParticleSource.Enemy;
        particle.data.sourceActorId = actor.id; // To make sure the particle doesn't collide with this actor.

        vec3.copy(particle.position, actor.position);

        // Make sure the particle is emitted from the actor's shooting position and not from their feet.
        particle.position[1] += 0.45;

        // Spaen the particle a little bit in front of the actor.
        vec3.scaleAndAdd(particle.position, particle.position, directionNormal, 0.1);

        vec3.copy(particle.direction, directionNormal);
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

    this.$attack = {
        lineOfSightToPlayerLine: new CollisionLine(null, null, null, null)
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
        },
        sourceActorId: {
            defaultValue: null
        }
    }

    this.heartbeat = function (emitter, particleIndex) {

        var $ = this.$heartbeat;

        var particle = emitter.particles[particleIndex];
        var frameDelta = engine.frameTimer.frameDelta;
        var player = engine.map.player;

        vec3.copy($.collisionLine.from, particle.position);
        vec3.scaleAndAdd($.collisionLine.to, particle.position, particle.direction, 0.7 * frameDelta);
        math3D.buildCollisionLineFromFromAndToPoints($.collisionLine);

        // See if the particle collides with an actor.
        var collidingActor = engine.mapManager.findNearestLineIntersectionWithActor($.actorCollisionPoint, $.collisionLine);
        var collidesWithActor = collidingActor != null && collidingActor.id != particle.data.sourceActorId;

        // See if the particle collides with the map.
        var collidesWithMap = engine.mapManager.findNearestLineIntersectionWithMap($.mapCollisionPoint, $.collisionLine);

        // See if the particle collides with the player.
        var collidesWithPlayer = false;
        if (particle.data.source == ProjectileParticleSource.Enemy) {

            vec3.copy($.playerHitSphere.position, player.position);
            collidesWithPlayer = math3D.determineIfCollisionLineIntersectsSphere($.collisionLine, $.playerHitSphere);
            $.playerCollisionPoint = player.position; // Hmm, slightly dubious.
        }

        // If the particle collides with multiple things, see which is nearest.
        var nearestCollisionType = ProjectileParticleCollisionType.None;
        var nearestCollisionPointDistanceSqr = -1;

        if (collidesWithActor) {
            nearestCollisionType = ProjectileParticleCollisionType.Actor;
            nearestCollisionPointDistanceSqr = vec3.sqrDist(particle.position, $.actorCollisionPoint);
        }

        if (collidesWithMap) {

            var distanceSqr = vec3.sqrDist(particle.position, $.mapCollisionPoint);
            if (distanceSqr < nearestCollisionPointDistanceSqr || nearestCollisionPointDistanceSqr == -1) {
                nearestCollisionType = ProjectileParticleCollisionType.Map;
                nearestCollisionPointDistanceSqr = distanceSqr;
            }
        }

        if (collidesWithPlayer) {

            var distanceSqr = vec3.sqrDist(particle.position, $.playerCollisionPoint);
            if (distanceSqr < nearestCollisionPointDistanceSqr || nearestCollisionPointDistanceSqr == -1) {
                nearestCollisionType = ProjectileParticleCollisionType.Player;
                nearestCollisionPointDistanceSqr = distanceSqr;
            }
        }

        // Handle the collision.
        if (nearestCollisionType == ProjectileParticleCollisionType.Actor) {

            vec3.copy(particle.position, $.actorCollisionPoint);

            particle.active = false;

            console.log('Particle collided with actor: ' + collidingActor.id);

            // Tell the colliding actor to handle the collision.
            var actorController = engine.actorControllersById[collidingActor.controllerId];

            if (actorController != null && actorController.handleProjectileParticleCollision != null) {

                actorController.handleProjectileParticleCollision(collidingActor, particle);
            }

        } else if (nearestCollisionType == ProjectileParticleCollisionType.Map) {

            vec3.copy(particle.position, $.mapCollisionPoint);

            particle.active = false;
            console.log('Particle collided with map!');

        } else if (nearestCollisionType == ProjectileParticleCollisionType.Player) {

            particle.active = false;
            console.log('Particle collided with player!');

            var gameController = engine.gameControllersById[engine.map.gameControllerId];
            gameController.handlePlayerProjectileParticleCollision(particle);

        } else {

            // No collision, just move the particle to its new position.
            vec3.copy(particle.position, $.collisionLine.to);
        }
    }

    // Function locals.
    this.$heartbeat = {
        collisionLine: new CollisionLine(null, null, null, null),
        actorCollisionPoint: vec3.create(),
        mapCollisionPoint: vec3.create(),
        playerCollisionPoint: vec3.create(),
        playerHitSphere: new Sphere(null, 0.2)
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