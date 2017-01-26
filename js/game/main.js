var engine = new Engine();
var util = new Util();
var math3D = new Math3D();

var DoorState = {
    Idle: 0,
    Opening: 1,
    Closing: 2
}

var EnemyAiState = {
    Idle: 0,
    Attacking: 1
}

var EnemyLineOfSightToPlayerStatus = {
    Unknown: 0,
    HasLineOfSight: 1,
    LostLineOfSight: 2
}

engine.gameControllersById['GameController'] = new GameController();

engine.actorControllersById['EnemyActorController'] = new EnemyActorController();
engine.actorControllersById['DoorActorController'] = new DoorActorController();

engine.particleControllersById['ProjectileParticleController'] = new ProjectileParticleController();

engine.triggerControllersById['DoorOpenerTriggerController'] = new DoorOpenerTriggerController();



function launch() {

    engine.init(function () {
        
        engine.enterMainLoop();

        if (typeof (isEditor) == 'undefined') {

            engine.loadMap('test-map-2', function () {

                engine.startMap();
            });
        }
    });
}

if (typeof (isEditor) != 'undefined') {

    launch();
}


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
        /*changeDirectionCountdown: {
            defaultValue: 200
        },*/
        findNewWanderTargetCountdown: {
            defaultValue: -1
        },
        attackCountdown: {
            defaultValue: -1
        },
        aiState: {
            defaultValue: EnemyAiState.Idle
        }/*,
        targetYRotation: {
            defaultValue: 0
        }*/
    }

    this.heartbeat = function (actor) {

        var $ = this.$heartbeat;

        var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];
        var player = engine.map.player;

        // Coalesce tickers.
        if (actorRenderState.tickers.checkIfPlayerHasBeenSpotted == null) {
            actorRenderState.tickers.checkIfPlayerHasBeenSpotted = new Ticker(1);
        }

        if (actorRenderState.tickers.findNewWanderToPoint == null) {
            actorRenderState.tickers.findNewWanderToPoint = new Ticker(0.35);
        }

        if (actorRenderState.tickers.checkHasLineOfSightToPlayer == null) {
            actorRenderState.tickers.checkHasLineOfSightToPlayer = new Ticker(3);
        }

        if (actorRenderState.tickers.tryToFindLineOfSightToPlayer == null) {
            actorRenderState.tickers.tryToFindLineOfSightToPlayer = new Ticker(2);
        }
        
        if (actorRenderState.tickers.shootAtPlayer == null) {
            actorRenderState.tickers.shootAtPlayer = new Ticker(1);
        }

        // Standard physics setup.
        actorRenderState.physics.speed = actor.data.speed;
        actorRenderState.physics.applyGravity = true;

        if (actor.data.aiState == EnemyAiState.Idle) {

            var playerSpotted = false;

            if (actorRenderState.tickers.checkIfPlayerHasBeenSpotted.tick()) {

                playerSpotted = this.checkIfPlayerIsSpotable(actor, actorRenderState);
                if (playerSpotted) {

                    console.log(actor.id + ': player spotted');
                    this.beginAttacking(actor);
                }
            }

            if (!playerSpotted) {

                if (actorRenderState.tickers.findNewWanderToPoint.tick()) {
                    console.log(actor.id + ': meh, finding a new wander-to point');

                    if (engine.mapManager.tryToFindRelativePointWithNoObstruction(
                        actorRenderState.physics.desiredDestination,
                        actorRenderState.transformedCollisionSphere.position,
                        4, // Maximum attempts
                        10 // Maximum distance
                    )) {

                        console.log(actor.id + ': having a wander');
                        actorRenderState.physics.mode = ActorPhysicsMode.PushThroughMapTowardsDestination;
                        actorRenderState.physics.turnToFaceDesiredDestnation = true;

                    } else {

                        console.log(actor.id + ': no where to wander to');
                        actorRenderState.physics.mode = ActorPhysicsMode.None;
                    }
                }
            }

        } else if (actor.data.aiState == EnemyAiState.Attacking) {

            if (actor.data.lineOfSightToPlayerStatus == EnemyLineOfSightToPlayerStatus.Unknown ||
                actorRenderState.tickers.checkHasLineOfSightToPlayer.tick()) {

                if (this.checkHasLineOfSightToPlayer(actor, actorRenderState)) {
                    actor.data.lineOfSightToPlayerStatus = EnemyLineOfSightToPlayerStatus.HasLineOfSight;
                } else {
                    actor.data.lineOfSightToPlayerStatus = EnemyLineOfSightToPlayerStatus.LostLineOfSight;
                    console.log(actor.id + ': I lost line of sight to the player!');
                }
            }

            if (actor.data.lineOfSightToPlayerStatus == EnemyLineOfSightToPlayerStatus.HasLineOfSight) {

                actorRenderState.physics.mode = ActorPhysicsMode.None;
                this.turnToFacePlayer(actor, actorRenderState);

                if (actorRenderState.tickers.shootAtPlayer.tick() &&
                    this.checkPlayerIsWithinActorFacingCone($.actorToPlayerNormal, actor, actorRenderState, 0.9)) {

                    this.shootAtPlayer(actor, actorRenderState, $.actorToPlayerNormal);
                }

            } else if (actor.data.lineOfSightToPlayerStatus == EnemyLineOfSightToPlayerStatus.LostLineOfSight) {

                if (actorRenderState.tickers.tryToFindLineOfSightToPlayer.tick()) {

                    if (engine.mapManager.tryToFindRelativePointWithLineOfSight(
                        actorRenderState.physics.desiredDestination, 
                        actorRenderState.transformedCollisionSphere.position,
                        player.position,
                        8, // Maximum attempts
                        10 // Maximum distance
                        )) {

                        actorRenderState.physics.mode = ActorPhysicsMode.PushThroughMapTowardsDestination;
                        actorRenderState.physics.turnToFaceDesiredDestnation = false; // Because we'll be facing the player, shooting at them.

                    } else {

                        // TODO - move somewhere random
                        console.log(actor.id + ': I don\'t know where the player went!');
                    }
                }
            }
        }

        
    }

    this.beginAttacking = function (actor) {

        if (actor.data.aiState != EnemyAiState.Attacking) {
            actor.data.aiState = EnemyAiState.Attacking;
            actor.data.lineOfSightToPlayerStatus = EnemyLineOfSightToPlayerStatus.Unknown;
            console.log(actor.id + ': I\'m now attcking!');
        }
    }

    this.turnToFacePlayer = function (actor, actorRenderState) {

        var frameDelta = engine.frameTimer.frameDelta;
        var player = engine.map.player;

        // Calculate the target angle.
        var targetAngle = math3D.calculateYAxisFacingAngle(
            actorRenderState.transformedCollisionSphere.position, player.position)

        actor.rotation[1] = math3D.rotateTowardsTargetAngle(
            actor.rotation[1], targetAngle, 0.1 * frameDelta);

        /*// Update the actor's Y rotation.
        if (actor.rotation[1] > targetAngle) {
            actor.rotation[1] -= 0.1 * frameDelta;
            actor.rotation[1] = Math.max(actor.rotation[1], targetAngle);
        } else if (actor.rotation[1] < targetAngle) {
            actor.rotation[1] += 0.1 * frameDelta;
            actor.rotation[1] = Math.min(actor.rotation[1], targetAngle);
        }*/
    }

    this.checkIfPlayerIsSpotable = function (actor, actorRenderState) {

        var $ = this.$checkIfPlayerIsSpotable;

        var player = engine.map.player;

        if (!this.checkHasLineOfSightToPlayer(actor, actorRenderState)) {
            return false;
        }

        if (!this.checkPlayerIsWithinActorFacingCone(null, actor, actorRenderState, 0.5)) {
            return false;
        }

        return true;
    }

    this.checkHasLineOfSightToPlayer = function (actor, actorRenderState) {

        var player = engine.map.player;

        var hasLineOfSight = engine.mapManager.checkLineOfSight(
            actorRenderState.transformedCollisionSphere.position, player.position);

        return hasLineOfSight;
    }

    this.checkPlayerIsWithinActorFacingCone = function (outActorToPlayerNormal, actor, actorRenderState, maxDelta) {

        var $ = this.$checkPlayerIsWithinActorFacingCone;

        var player = engine.map.player;

        this.calculateFacingNormal($.actorFacingNormal, actor);

        vec3.sub($.actorToPlayerNormal, player.position, actorRenderState.transformedCollisionSphere.position);
        vec3.normalize($.actorToPlayerNormal, $.actorToPlayerNormal);

        var delta = vec3.dot($.actorFacingNormal, $.actorToPlayerNormal);

        if (delta < maxDelta) {

            return false;
        }

        if (outActorToPlayerNormal != null) {
            vec3.copy(outActorToPlayerNormal, $.actorToPlayerNormal);
        }

        return true;
    }

    this.shootAtPlayer = function (actor, actorRenderState, direction) {
        //console.log(actor.id + ': shoot!');

        this.spawnParticle(actor, direction);
    }

    this.calculateFacingNormal = function (out, actor) {

        vec3.set(out, 0, 0, 1);
        vec3.rotateY(
            out,
            out,
            math3D.zeroVec3,
            actor.rotation[1]);
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

                console.log(actor.id + ': Ouch! Health: ' + actor.data.health);

                this.beginAttacking(actor);

            } else {
                console.log(actor.id + 'I\'m dead!');
                actor.active = false;
            }
        }
    }

    // Function locals.
    this.$heartbeat = {
        //newWanderTargetDirection: vec3.create(),
        actorToPlayerNormal: vec3.create()
    }

    this.$checkPlayerIsWithinActorFacingCone = {
        actorFacingNormal: vec3.create(),
        actorToPlayerNormal: vec3.create()
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