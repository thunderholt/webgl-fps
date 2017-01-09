editorApp.directive('objectDataEditor', ['$rootScope', function ($rootScope) {
    return {
        templateUrl: 'html/editor/directives/object-data-editor.html',
        scope: {
            obj: '=obj',
            schema: '=schema'
        },
        controller: function ($scope) {

            $scope.chooseActor = function (propertyName) {

                $rootScope.$broadcast('choose-actor', {
                    callback: function (actor) {
                        $scope.obj.data[propertyName] = actor.id;
                    }
                });
            }

            $scope.clearValue = function (propertyName) {

                $scope.obj.data[propertyName] = '';
            }
        },
        link: function ($scope, element, attrs) {

        }
    }
}]);