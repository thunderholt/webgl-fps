function ResourceLoader(engine) {

    this.loadTextResource = function (resourceType, resourceId, callback) {

        this.loadTextResourceInternal(resourceType, resourceId, 'txt', function (text) {
            callback(text);
        });
    }

    this.loadJsonResource = function (resourceType, resourceId, callback) {

        this.loadTextResourceInternal(resourceType, resourceId, 'json', function (json) {

            if (json == null) {
                callback(null);
            } else {
                var obj = JSON.parse(json);
                callback(obj);
            }
        });
    }

    this.loadImageResource = function (resourceType, resourceId, callback) {

        var url = this.getResourceUrl(resourceType, resourceId, 'png');

        var image = new Image();

        image.onload = function () {
            callback(image);
        }

        image.onerror = function () {
            console.log('Failed to load resource: ' + resourceId);
            callback(null);
        }

        image.src = url;
    }

    this.loadTextResourceInternal = function (resourceType, resourceId, dataType, callback) {

        var request = new XMLHttpRequest();

        request.onload = function () {

            if (request.status == 404) {
                console.log('Failed to load resource: ' + resourceId);
                callback(null);
            } else {
                callback(this.responseText);
            }
        }

        var url = this.getResourceUrl(resourceType, resourceId, dataType);

        request.open('get', url, true);
        request.send();
    }

    this.getResourceUrl = function (resourceType, resourceId, dataType) {
        
        return 'resources/' + this.getFolderNameForResourceType(resourceType) + '/' + resourceId + '.' + dataType + '?noCache=' + Math.random();
    }

    this.getFolderNameForResourceType = function (resourceType) {

        var resourceFoldersByResourceType = {
            'map': 'maps',
            'static-mesh': 'static-meshes',
            'skinned-mesh': 'skinned-meshes',
            'skinned-mesh-animation': 'skinned-mesh-animations',
            'shader': 'shaders',
            'material': 'materials',
            'texture': 'textures',
            'system': 'system'
        }

        return resourceFoldersByResourceType[resourceType];
    }
}