editorApp.controller('MapController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    
    $scope.chooseWorldStaticMesh = function () {

        $rootScope.$broadcast('choose-resource', {
            resourceType: 'static-mesh',
            callback: function (staticMeshId) {

                $scope.map.worldStaticMeshId = staticMeshId;
                engine.reloadWorldMeshSet();
            }
        });

        
    }
}]);