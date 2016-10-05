editorApp.controller('ResourcesController', ['$rootScope', '$scope', 'ws', function ($rootScope, $scope, ws) {
    
    $scope.resourceType = 'map';
    $scope.resourceIds = [];
    $scope.newMaterial = {
        materialId: ''
    }

    $scope.init = function () {

        $scope.$watch('resourceType', function () {
            $scope.loadResourceList();
        });
    }

    $scope.loadResourceList = function () {

        ws.loadResourceIdList($scope.resourceType)
            .then(function (resourceIds) {
                $scope.resourceIds = resourceIds;
            });
    }

    $scope.editResource = function (resourceId) {

        if ($scope.resourceType == 'material') {

            $scope.$broadcast('load-and-edit-material', {
                materialId: resourceId,
                callback: function () {
                    $scope.loadResourceList();
                }
            });
        }
    }

    $scope.importStaticMesh = function () {

        $rootScope.$broadcast('import-static-mesh');
    }

    $scope.importSkinnedMesh = function () {

        $rootScope.$broadcast('import-skinned-mesh');
    }

    $scope.importSkinnedMeshAnimation = function () {

        $rootScope.$broadcast('import-skinned-mesh-animation');
    }

    $scope.createMaterial = function () {

        var materialId = $scope.newMaterial.materialId;

        if (materialId == '') {
            alert('Please enter a name for the new material.');
            return;
        }

        var material = {

        }

        ws.saveJsonResource('material', materialId, material, null)
            .then(function () { $scope.loadResourceList(); });
    }

    $scope.init();
}]);