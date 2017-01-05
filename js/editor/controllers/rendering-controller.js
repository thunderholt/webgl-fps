editorApp.controller('RenderingController', ['$scope', function ($scope) {

    $scope.renderingOptions = {
        renderLightVolumes: false,
        renderWorldMeshChunkAABBs: false,
        renderActorIdentifiers: false,
        renderActorBoundingSpheres: false,
        renderTriggers: false
    }

    $scope.init = function () {

        $scope.$watch('renderingOptions', function () {

            util.copyObjectPropertiesToOtherObject($scope.renderingOptions, engine.renderer.renderingOptions)

        }, true);
    }

    $scope.init();
}]);