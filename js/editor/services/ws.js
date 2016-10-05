editorApp.factory('ws', ['$http', '$q', function ($http, $q) {

    $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8;';

    var ws = {

        loadResourceIdList: function (resourceType) {

            return this.get(
                'api/resources.ashx',
                {
                    action: 'load-resource-id-list',
                    folder: engine.resourceLoader.getFolderNameForResourceType(resourceType)
                });
        },

        saveJsonResource: function (resourceType, newResourceId, resource, oldResourceId) {

            return this.post(
                'api/resources.ashx',
                {
                    action: 'save-json-resource',
                    folder: engine.resourceLoader.getFolderNameForResourceType(resourceType),
                    newResourceId: newResourceId,
                    oldResourceId: oldResourceId,
                    json: angular.toJson(resource)
                });
        },

        get: function (url, parameters) {

            var deferred = $q.defer();

            $http.get(
                url + '?noCache=' + Math.round(Math.random() * 10000),
                {
                    params: parameters
                })
                .success(function (response) {
                    deferred.resolve(response);
                });

            return deferred.promise;
        },

        post: function (url, parameters) {

            var deferred = $q.defer();

            var postDataChunks = [];
            for (var propertyName in parameters) {
                postDataChunks.push(encodeURIComponent(propertyName) + '=' + encodeURIComponent(parameters[propertyName]));
            }
            var postData = postDataChunks.join("&");

            $http.post(
                url + '?noCache=' + Math.round(Math.random() * 10000),
                postData)
                .success(function (response) {
                    deferred.resolve(response);
                });

            return deferred.promise;
        }
    }

    return ws;
}]);