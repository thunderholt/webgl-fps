function Mouse(engine) {

    this.mouseMouseListeners = [];

    this.init = function (callback) {

        var self = this;

        var canvas = document.getElementById("canvas");

        canvas.onclick = function () {

            canvas.requestPointerLock =
                canvas.requestPointerLock ||
                canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock;

            canvas.requestPointerLock();
        }

        document.addEventListener("mousemove", function (event) {

            document.pointerLockElement =
                document.pointerLockElement ||
                document.mozPointerLockElement ||
                document.webkitPointerLockElement;

            if (document.pointerLockElement !== canvas) {
                return;
            }

            for (var i = 0; i < self.mouseMouseListeners.length; i++) {
                self.mouseMouseListeners[i](event);
            }

        }, false);

        callback();
    }

    this.addMouseMoveListener = function (callback) {
        
        this.mouseMouseListeners.push(callback);
    }
}