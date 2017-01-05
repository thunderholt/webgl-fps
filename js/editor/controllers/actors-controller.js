editorApp.controller('ActorsController', ['$scope', 'util', function ($scope, util) {

    $scope.editActor = function (actorId) {

        $scope.$broadcast('edit-actor', {
            actorId: actorId
        });
    }

    $scope.createActor = function () {

        var actor = {
            id: 'actor-' + (util.countHashTableKeys(engine.map.actorsById) + 1),
            position: [0, 0, 0],
            positionOffset: [0, 0, 0],
            rotation: [0, 0, 0],
            staticMeshId: null,
            skinnedMeshId: null,
            skinnedMeshAnimationId: null,
            frameIndex: 0,
            controllerId: null,
            data: {}
        }

        engine.editorHelper.addActor(actor);
    }

    $scope.removeActor = function (actorId) {

        engine.editorHelper.removeActor(actorId);
    }
}]);