editorApp.controller('RenderingController', ['$scope', function ($scope) {

    $scope.renderingParameters = {
        renderLightVolumes: false,
        renderWorldMeshChunkAABBs: false,
        renderActorIdentifiers: true
    }

    $scope.init = function () {

        $scope.$watch('renderingParameters', function () {

            util.copyObjectPropertiesToOtherObject($scope.renderingParameters, engine.renderer.renderingParameters)

        }, true);
    }

    $scope.init();
}]);