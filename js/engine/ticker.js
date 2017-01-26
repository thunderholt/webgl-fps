function Ticker(ticksPerSecond) {

	this.ticksPerSecond = ticksPerSecond;
	this.t = -1;
}

Ticker.prototype.tick = function () {

	var isTick = false;

	if (this.t == -1) {

		this.t = (1000 / this.ticksPerSecond) * Math.random();

	} else {

		this.t -= engine.frameTimer.lastFrameDurationMillis;
		if (this.t <= 0) {
			this.t = 1000 / this.ticksPerSecond;
			isTick = true;
		}
	}

	return isTick;
}