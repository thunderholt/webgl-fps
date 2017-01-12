function SpriteSheetManager(engine) {

    var self = this;

    this.spriteSheetsById = {};
    this.loadingSpriteSheetIds = {};
    this.failedSpriteSheetIds = {};

    this.loadSpriteSheet = function (spriteSheetId, callback) {

        callback = callback || function () { }

        if (spriteSheetId == null) {
            callback(null);
            return;
        }

        var spriteSheet = this.spriteSheetsById[spriteSheetId];

        if (spriteSheet != null) {
            callback(spriteSheet);
            return;
        }

        if (this.loadingSpriteSheetIds[spriteSheetId] || this.failedSpriteSheetIds[spriteSheetId]) {
            callback(null);
            return;
        }

        this.log('Loading sprite sheet: ' + spriteSheetId);

        this.loadingSpriteSheetIds[spriteSheetId] = spriteSheetId;

        engine.resourceLoader.loadJsonResource('sprite-sheet', spriteSheetId, function (spriteSheet) {

            if (spriteSheet == null) {

                self.failedSpriteSheetIds[spriteSheetId] = true;

            } else {

                self.spriteSheetsById[spriteSheetId] = spriteSheet;
            }

            delete self.loadingSpriteSheetIds[spriteSheetId];

            callback(spriteSheet);
        });
    }

    this.getSpriteSheet = function (spriteSheetId) {

        if (spriteSheetId == null) {
            return null;
        }

        return this.spriteSheetsById[spriteSheetId];
    }

    this.log = function (message) {

        console.log('Sprite Sheet Manager: ' + message);
    }
}