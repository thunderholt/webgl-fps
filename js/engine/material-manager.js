function MaterialManager(engine) {

    var self = this;

    this.materialsById = {};
    this.loadingMaterialIds = {};
    this.failedMaterialIds = {};

    this.loadMaterial = function (materialId, callback) {

        callback = callback || function () { }

        if (materialId == null) {
            callback(null);
            return;
        }

        var material = this.materialsById[materialId];

        if (material != null) {
            callback(material);
            return;
        }

        if (this.loadingMaterialIds[materialId] || this.failedMaterialIds[materialId]) {
            callback(null);
            return;
        }

        this.log('Loading material: ' + materialId);

        this.loadingMaterialIds[materialId] = materialId;

        engine.resourceLoader.loadJsonResource('material', materialId, function (material) {

            if (material == null) {

                self.failedMaterialIds[materialId] = true;

            } else {

                self.materialsById[materialId] = material;
            }

            delete self.loadingMaterialIds[materialId];

            callback(material);
        });
    }

    this.getMaterial = function (materialId) {

        if (materialId == null) {
            return null;
        }

        return this.materialsById[materialId];
    }

    this.log = function (message) {

        console.log('Material Manager: ' + message);
    }
}