﻿function Keyboard(engine) {

    this.state = {};

    this.A = 65;
    this.D = 68;
    this.W = 83;
    this.S = 87;

    this.movementAxisMultipliers = vec3.create();

    this.init = function (callback) {

        var self = this;

        window.addEventListener('keydown', function (event) {

            self.state[event.which] = true;

            if (event.which == self.A) {
                self.movementAxisMultipliers[0] = -1;
            } else if (event.which == self.D) {
                self.movementAxisMultipliers[0] = 1;
            } else if (event.which == self.W) {
                self.movementAxisMultipliers[2] = -1;
            } else if (event.which == self.S) {
                self.movementAxisMultipliers[2] = 1;
            }
        });

        window.addEventListener('keyup', function (event) {

            self.state[event.which] = false;

            if (event.which == self.A && self.movementAxisMultipliers[0] == -1) {
                self.movementAxisMultipliers[0] = 0;
            } else if (event.which == self.D && self.movementAxisMultipliers[0] == 1) {
                self.movementAxisMultipliers[0] = 0;
            } else if (event.which == self.W && self.movementAxisMultipliers[2] == -1) {
                self.movementAxisMultipliers[2] = 0;
            } else if (event.which == self.S && self.movementAxisMultipliers[2] == 1) {
                self.movementAxisMultipliers[2] = 0;
            }
        });

        callback();
    }
}