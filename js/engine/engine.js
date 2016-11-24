function Engine() {

    var self = this;

    // Data.
    this.map = null;
    this.sectorSet = null;
    this.mapIsReady = false;
    this.actorControllersById = {};
    this.mode = 'editor';
    this.stats = {
        numberOfVisibleWorldStaticMeshChunks: 0,
        numberOfVisibleActors: 0,
        numberOfShadowMapsBuiltThisFrame: 0,
        numberOfVisibleLights: 0
    }

    // Game logic.
    this.glManager = new GlManager(this);
    this.textureManager = new TextureManager(this);
    this.effectManager = new EffectManager(this);
    this.shadowMapManager = new ShadowMapManager(this);
    this.lineDrawer = new LineDrawer(this);
    this.staticMeshManager = new StaticMeshManager(this);
    this.skinnedMeshManager = new SkinnedMeshManager(this);
    this.skinnedMeshAnimationManager = new SkinnedMeshAnimationManager(this);
    this.resourceLoader = new ResourceLoader(this);
    this.materialManager = new MaterialManager(this);
    this.visibilityManager = new VisibilityManager(this);
    this.renderer = new Renderer(this);
    this.renderStateManager = new RenderStateManager(this);
    this.mapManager = new MapManager(this);
    this.camera = new Camera(this);
    this.freeLookCameraController = new FreeLookCameraController(this);
    this.playerController = new PlayerController(this);
    this.keyboard = new Keyboard(this);
    this.mouse = new Mouse(this);
    this.frameTimer = new FrameTimer(this);
    this.editorHelper = new EditorHelper(this);
    this.unitTests = new UnitTests();

    this.init = function (callback) {

        this.unitTests.run();

        var initObjects = [
            this.glManager, this.textureManager, this.effectManager, this.shadowMapManager,
            this.lineDrawer, this.staticMeshManager, this.skinnedMeshManager, this.skinnedMeshAnimationManager,
            this.renderer, this.renderStateManager, this.mapManager,
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

        /*var frameFunction = null;

        frameFunction = function () {
            self.heartbeat();
            requestAnimationFrame(frameFunction);
        }*/

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

        if (this.mode == 'editor') {

            this.freeLookCameraController.heartbeat();

        } else if (this.mode == 'game') {

            this.playerController.heartbeat();

            for (var actorId in this.map.actorsById) {

                var actor = this.map.actorsById[actorId];

                var controller = this.actorControllersById[actor.controllerId];

                if (controller != null) {

                    controller.heartbeat(actor);
                }
            }
        }

        this.camera.updateMatrixes(
            Math.PI / 2.5, engine.glManager.viewportInfo.width / engine.glManager.viewportInfo.height, 0.1, 1000.0);

        this.renderStateManager.updateRenderStates();

        this.renderer.renderScene();

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
            buildChunkCollisionFaces: true
        }

        self.resourceLoader.loadJsonResource('map', mapId, function (map) {

            self.staticMeshManager.loadStaticMesh(map.worldStaticMeshId, worldStaticMeshLoadOptions, function () {

                self.resourceLoader.loadJsonResource('sector-set', map.sectorSetId, function (sectorSet) {

                    self.map = map;
                    self.sectorSet = sectorSet;
                    self.mapIsReady = true;

                    if (callback != null) {
                        callback();
                    }
                });
            });
        });
    }

    
}