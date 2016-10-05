editorApp.controller('EditorController', ['$scope', 'ws', function ($scope, ws) {
    
    $scope.mapMetaData = {
        mapId: 'test-map-1'
    }

    $scope.map = null;

    $scope.startMap = function () {

        engine.startMap();
    }

    $scope.loadMap = function () {
        
        engine.loadMap($scope.mapMetaData.mapId, function () {

            $scope.map = engine.map;
            $scope.$apply();
        });
    }

    $scope.saveMap = function () {

        ws.saveJsonResource('map', $scope.mapMetaData.mapId, $scope.map, null)
            .then(function () {  });
    }

    /*$scope.chooseWorldMeshSet = function () {

        $scope.map.worldMeshSetId = 'map1';

        engine.reloadWorldMeshSet();
    }*/
}]);