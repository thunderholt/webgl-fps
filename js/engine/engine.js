function Engine() {

    var self = this;

    // Data.
    this.map = null;
    this.sectorSet = null;
    this.mapIsReady = false;
    this.gameControllersById = {};
    this.actorControllersById = {};
    this.emitterControllersById = {};
    this.particleControllersById = {};
    this.triggerControllersById = {};
    this.mode = 'editor';
    this.stats = {
        numberOfVisibleWorldStaticMeshChunks: 0,
        numberOfVisibleActors: 0,
        numberOfShadowMapsBuiltThisFrame: 0,
        numberOfVisibleLights: 0,
        cameraIsWithinMap: false
    }

    // Game logic.
    this.canvasInitialiser = new CanvasInitialiser(this);
    this.glManager = new GlManager(this);
    this.textureManager = new TextureManager(this);
    this.effectManager = new EffectManager(this);
    this.shadowMapManager = new ShadowMapManager(this);
    this.lineDrawer = new LineDrawer(this);
    this.staticMeshManager = new StaticMeshManager(this);
    this.staticMeshMathHelper = new StaticMeshMathHelper(this);
    this.skinnedMeshManager = new SkinnedMeshManager(this);
    this.skinnedMeshAnimationManager = new SkinnedMeshAnimationManager(this);
    this.resourceLoader = new ResourceLoader(this);
    this.resourceChecker = new ResourceChecker(this);
    this.materialManager = new MaterialManager(this);
    this.guiLayoutManager = new GuiLayoutManager(this);
    this.guiLayoutAnimationManager = new GuiLayoutAnimationManager(this);
    this.spriteSheetManager = new SpriteSheetManager(this);
    this.guiDrawSpecBuilder = new GuiDrawSpecBuilder(this);
    this.visibilityManager = new VisibilityManager(this);
    this.renderer = new Renderer(this);
    this.renderStateManager = new RenderStateManager(this);
    this.camera = new Camera(this);
    this.freeLookCameraController = new FreeLookCameraController(this);
    this.playerController = new PlayerController(this);
    this.keyboard = new Keyboard(this);
    this.mouse = new Mouse(this);
    this.frameTimer = new FrameTimer(this);
    this.editorHelper = new EditorHelper(this);
    this.mapManager = new MapManager(this);
    this.particleManager = new ParticleManager(this);
    this.triggerManager = new TriggerManager(this);
    this.physicsManager = new PhysicsManager(this);
    this.mapDataHelper = new MapDataHelper(this);
    this.unitTests = new UnitTests();

    this.init = function (callback) {

        this.unitTests.run();

        var initObjects = [
            this.canvasInitialiser, this.glManager, this.textureManager, this.effectManager, this.shadowMapManager,
            this.lineDrawer, this.staticMeshManager, this.staticMeshMathHelper,
            this.skinnedMeshManager, this.skinnedMeshAnimationManager,
            this.renderer, this.renderStateManager,
            this.camera, this.freeLookCameraController, this.playerController,
            this.keyboard, this.mouse, this.frameTimer, this.editorHelper];

        util.recurse(function (recursor, recursionCount) {
            if (recursionCount < initObjects.length) {
                initObjects[recursionCount].init(recursor);
            } else {
                callback();
            }
        });
    }

    this.enterMainLoop = function () {

        requestAnimationFrame(this.frameFunction);
    }

    this.frameFunction = function () {

        self.heartbeat();
        requestAnimationFrame(self.frameFunction);
    }

    this.startMap = function () {

        if (this.map == null) {
            alert('No map loaded');
            return;
        }

        this.mode = 'game';
    }

    this.heartbeat = function () {

        if (!this.mapIsReady) {
            return;
        }

        this.frameTimer.startFrame();

        if (!this.resourceChecker.ensureResourcesAreLoaded()) {
            return; // TODO - loading screen.
        }

        this.renderStateManager.coalesceRenderStates();

        this.renderStateManager.calculateActorFinalPositions();

        this.renderStateManager.rebuildBoundingVolumes();

        this.renderStateManager.updateActorResidentSectors();

        this.camera.updateMatrixes(
            Math.PI / 2, engine.glManager.viewportInfo.width / engine.glManager.viewportInfo.height, 0.1, 1000.0);

        this.renderStateManager.updateRenderStates();

        this.renderStateManager.updateAnimations();

        this.renderStateManager.checkShadowMapAllocations();

        this.renderer.renderScene();

        if (this.mode == 'editor') {

            this.freeLookCameraController.heartbeat();

        } else if (this.mode == 'game') {

            var gameController = this.gameControllersById[this.map.gameControllerId];
            gameController.heartbeat();

            this.playerController.heartbeat();

            this.triggerManager.heartbeat();

            for (var actorId in this.map.actorsById) {

                var actor = this.map.actorsById[actorId];

                if (actor.active) {
                    var controller = this.actorControllersById[actor.controllerId];

                    if (controller != null) {

                        controller.heartbeat(actor);
                    }
                }
            }

            this.particleManager.heartbeat();

            this.physicsManager.runPhysics();

            /*var gameController = this.gameControllersById[this.map.gameControllerId];
            gameController.heartbeat();

            

            this.triggerManager.heartbeat();

            this.particleManager.updateParticles();

            */
        }

        this.frameTimer.updateStats();
    }

    this.loadMap = function (mapId, callback) {

        self.mapIsReady = false;
        self.map = null;
        self.mode == 'editor';

        self.textureManager.cleanUp();
        self.staticMeshManager.cleanUp();
        self.skinnedMeshManager.cleanUp();
        self.skinnedMeshAnimationManager.cleanUp();

        var worldStaticMeshLoadOptions = {
            buildChunkAABBs: true,
            buildChunkCollisionFaces: true,
            findPointCompletelyOutsideOfExtremities: true
        }

        self.resourceLoader.loadJsonResource('map', mapId, function (map) {

            self.staticMeshManager.loadStaticMesh(map.worldStaticMeshId, worldStaticMeshLoadOptions, function () {

                self.resourceLoader.loadJsonResource('sector-set', map.sectorSetId, function (sectorSet) {

                    self.map = map;
                    self.sectorSet = sectorSet;
                    self.mapDataHelper.checkMapData();
                    self.visibilityManager.rebuildSectorStates();
                    self.mapIsReady = true;

                    if (callback != null) {
                        callback();
                    }
                });
            });
        });
    }

   
}