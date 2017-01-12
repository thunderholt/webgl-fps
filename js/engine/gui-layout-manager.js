function GuiLayoutManager(engine) {

    var self = this;

    this.guiLayoutsById = {};
    this.loadingGuiLayoutIds = {};
    this.failedGuiLayoutIds = {};

    this.loadGuiLayout = function (guiLayoutId, callback) {

        callback = callback || function () { }

        if (guiLayoutId == null) {
            callback(null);
            return;
        }

        var guiLayout = this.guiLayoutsById[guiLayoutId];

        if (guiLayout != null) {
            callback(guiLayout);
            return;
        }

        if (this.loadingGuiLayoutIds[guiLayoutId] || this.failedGuiLayoutIds[guiLayoutId]) {
            callback(null);
            return;
        }

        this.log('Loading GUI layout: ' + guiLayoutId);

        this.loadingGuiLayoutIds[guiLayoutId] = guiLayoutId;

        engine.resourceLoader.loadJsonResource('gui-layout', guiLayoutId, function (guiLayout) {

            if (guiLayout == null) {

                self.failedGuiLayoutIds[guiLayoutId] = true;

            } else {

                self.guiLayoutsById[guiLayoutId] = guiLayout;
            }

            delete self.loadingGuiLayoutIds[guiLayoutId];

            callback(guiLayout);
        });
    }

    this.getGuiLayout = function (guiLayoutId) {

        if (guiLayoutId == null) {
            return null;
        }

        return this.guiLayoutsById[guiLayoutId];
    }

    this.log = function (message) {

        console.log('GUI Layout Manager: ' + message);
    }
}