function Mouse(engine) {

    this.mouseMoveListeners = [];
    this.mouseIsDown = false;
    this.canvas = null;

    this.init = function (callback) {

        var self = this;

        this.canvas = document.getElementById('canvas');

        this.canvas.onclick = function () {

            self.canvas.requestPointerLock =
                self.canvas.requestPointerLock ||
                self.canvas.mozRequestPointerLock ||
                self.canvas.webkitRequestPointerLock;

            self.canvas.requestPointerLock();
        }

        document.addEventListener('mousemove', function (event) {

            if (self.hasPointerLock()) {
                for (var i = 0; i < self.mouseMoveListeners.length; i++) {
                    self.mouseMoveListeners[i](event);
                }
            }

        }, false);

        document.addEventListener('mousedown', function (event) {

            if (self.hasPointerLock()) {
                self.mouseIsDown = true;
            }

        }, false);

        document.addEventListener('mouseup', function (event) {

            self.mouseIsDown = false;

        }, false);

        callback();
    }

    this.addMouseMoveListener = function (callback) {
        
        this.mouseMoveListeners.push(callback);
    }

    this.hasPointerLock = function () {

        document.pointerLockElement =
              document.pointerLockElement ||
              document.mozPointerLockElement ||
              document.webkitPointerLockElement;

        if (document.pointerLockElement !== this.canvas) {
            return false;
        }

        return true;
    }
}