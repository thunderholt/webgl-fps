function Mouse(engine) {

    this.mouseMoveListeners = [];
    this.mouseIsDown = false;

    this.init = function (callback) {

        var self = this;

        var canvas = document.getElementById('canvas');

        canvas.onclick = function () {

            canvas.requestPointerLock =
                canvas.requestPointerLock ||
                canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock;

            canvas.requestPointerLock();
        }

        document.addEventListener('mousemove', function (event) {

            document.pointerLockElement =
                document.pointerLockElement ||
                document.mozPointerLockElement ||
                document.webkitPointerLockElement;

            if (document.pointerLockElement !== canvas) {
                return;
            }

            for (var i = 0; i < self.mouseMoveListeners.length; i++) {
                self.mouseMoveListeners[i](event);
            }

        }, false);

        document.addEventListener('mousedown', function (event) {

            self.mouseIsDown = true;

        }, false);

        document.addEventListener('mouseup', function (event) {

            self.mouseIsDown = false;

        }, false);

        callback();
    }

    this.addMouseMoveListener = function (callback) {
        
        this.mouseMoveListeners.push(callback);
    }
}