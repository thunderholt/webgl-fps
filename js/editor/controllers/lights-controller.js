editorApp.controller('LightsController', ['$scope', 'util', function ($scope, util) {

    $scope.editLight = function (lightId) {

        $scope.$broadcast('edit-light', {
            lightId: lightId
        });
    }

    $scope.createLight = function () {

        var light = {
            id: 'light-' + (util.countHashTableKeys(engine.map.lightsById) + 1),
            type: 'point',
            position: [0, 0, 0],
            radius: 1,
            colour: [1, 1, 1]
        }

        engine.editorHelper.addLight(light);
    }

    $scope.removeLight = function (lightId) {

        engine.editorHelper.removeLight(lightId);
    }
}]);