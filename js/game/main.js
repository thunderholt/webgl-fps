var engine = new Engine();
var util = new Util();
var math3D = new Math3D();

var DoorState = {
    Idle: 0,
    Opening: 1,
    Closing: 2
}

engine.gameControllersById['GameController'] = new GameController();

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

        var $ = this.$playerShoot;

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
        particle.physics.mode = ParticlePhysicsMode.MoveThroughMap;
        particle.creator = ParticleCreator.Player;
        particle.creatorActorId = null;
        particle.canCollideWithPlayer = false

        vec3.copy(particle.position, player.position);

        math3D.buildAxesFromRotations($.playerAxes, player.rotation);
        vec3.copy(particle.direction, $.playerAxes.zAxis);
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

    // Function locals.
    this.$playerShoot = {
        playerAxes: new Axes()
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
            defaultValue: 0.05,
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

        var frameDelta = engine.frameTimer.frameDelta;
        var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];

        // Detemrine if we should change direction.
        actor.data.changeDirectionCountdown -= frameDelta;

        if (actor.data.changeDirectionCountdown <= 0) {
            actor.data.changeDirectionCountdown = 40;

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
        vec3.set(actorRenderState.physics.movementNormal, 0, 0, 1);
        vec3.rotateY(
            actorRenderState.physics.movementNormal,
            actorRenderState.physics.movementNormal,
            math3D.zeroVec3,
            actor.rotation[1]);

        // Setup the general physics stuff.
        actorRenderState.physics.mode = ActorPhysicsMode.PushThroughMap;
        actorRenderState.physics.speed = actor.data.speed;
        actorRenderState.physics.applyGravity = true;

        // Determine if we should attack.
        if (actor.data.attackCountdown == -1) {
            actor.data.attackCountdown = Math.random() * 20;
        }

        actor.data.attackCountdown -= frameDelta;
        if (actor.data.attackCountdown <= 0) {
            actor.data.attackCountdown = 20;

            this.attack(actor, actorRenderState.physics.movementNormal);
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
        particle.physics.mode = ParticlePhysicsMode.MoveThroughMap;
        particle.creator = ParticleCreator.Actor;
        particle.creatorActorId = actor.id; // To make sure the particle doesn't collide with this actor.
        particle.canCollideWithPlayer = true;

        vec3.copy(particle.position, actor.position);

        // Make sure the particle is emitted from the actor's shooting position and not from their feet.
        particle.position[1] += 0.45;

        // Spaen the particle a little bit in front of the actor.
        vec3.scaleAndAdd(particle.position, particle.position, directionNormal, 0.1);

        vec3.copy(particle.direction, directionNormal);
    }

    this.handleProjectileParticleCollision = function (actor, particle) {

        if (particle.creator == ParticleCreator.Player) {

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

        var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];
        actorRenderState.physics.mode = ActorPhysicsMode.OffsetThroughEther;
        actorRenderState.physics.speed = actor.data.speed;

        if (actor.data.state == DoorState.Opening) {

            vec3.set(actorRenderState.physics.targetPositionOffset, 0, 4, 0);

        } else if (actor.data.state == DoorState.Closing) {

            vec3.set(actorRenderState.physics.targetPositionOffset, 0, 0, 0);
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

    }

    this.heartbeat = function (emitter, particleIndex) {

        var particle = emitter.particles[particleIndex];

        if (particle.physics.lastCollisionType != ParticleCollisionType.None) {
            particle.active = false;
        }

        if (particle.physics.lastCollisionType == ParticleCollisionType.Actor) {

            // Tell the colliding actor to handle the collision.
            var collidingActor = engine.map.actorsById[particle.physics.collidingActorId];
            var actorController = engine.actorControllersById[collidingActor.controllerId];

            if (actorController != null && actorController.handleProjectileParticleCollision != null) {

                actorController.handleProjectileParticleCollision(collidingActor, particle);
            }

        } else if (particle.physics.lastCollisionType == ParticleCollisionType.Player) {

            var gameController = engine.gameControllersById[engine.map.gameControllerId];
            gameController.handlePlayerProjectileParticleCollision(particle);
        }
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