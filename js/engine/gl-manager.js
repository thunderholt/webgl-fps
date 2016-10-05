function GlManager(engine) {

    var self = this;

    this.gl = null;
    this.viewportInfo = null

    this.init = function (callback) {

        self.log('Initialising WebGL...');

        var canvas = document.getElementById('canvas');

        self.gl = canvas.getContext('experimental-webgl');

        var requiredExtensionNames = [
        	'OES_texture_float',
            'OES_texture_float_linear',
            //'WEBGL_draw_buffers',
            'WEBGL_depth_texture'];

        for (var i = 0; i < requiredExtensionNames.length; i++) {
            var extensionName = requiredExtensionNames[i];
            if (self.gl.getExtension(extensionName) == null) {
                throw 'Extention not available: ' + extensionName;
            }
        }

        //canvas.width = canvas.clientWidth;
        //canvas.height = canvas.clientHeight;

        self.viewportInfo = {
            width: canvas.width,
            height: canvas.height
        }

        self.gl.viewport(0, 0, self.viewportInfo.width, self.viewportInfo.height);

        self.log('... done.');

        callback();
    }

    this.log = function (message) {

        console.log('GL Manger: ' + message);
    }
}