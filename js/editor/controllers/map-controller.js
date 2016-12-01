editorApp.controller('MapController', ['$scope', '$rootScope', 'sectorSetBuilder', 'ws', function ($scope, $rootScope, sectorSetBuilder, ws) {
    
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

            var sectorSet = sectorSetBuilder.buildSectorSetForStaticMesh(staticMesh);

            ws.saveJsonResource('sector-set', $scope.map.sectorSetId, sectorSet, $scope.map.sectorSetId);
        });
    }
}]);