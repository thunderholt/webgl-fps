editorApp.controller('MapController', ['$scope', '$rootScope', 'sectorSetBuilder', function ($scope, $rootScope, sectorSetBuilder) {
    
    $scope.chooseWorldStaticMesh = function () {

        $rootScope.$broadcast('choose-resource', {
            resourceType: 'static-mesh',
            callback: function (staticMeshId) {

                $scope.map.worldStaticMeshId = staticMeshId;
                engine.reloadWorldMeshSet();
            }
        });
    }

    $scope.rebuildSectorSet = function () {

        engine.resourceLoader.loadJsonResource('static-mesh', $scope.map.worldStaticMeshId, function (staticMesh) {

            sectorSetBuilder.buildSectorSetForStaticMesh(staticMesh);
        });
    }
}]);