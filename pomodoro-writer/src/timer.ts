export class Timer {
	private timerId: NodeJS.Timer | null = null;
	private _remainingSeconds: number;

	constructor(private startSeconds: number = 0, private intervalMillis: number = 1000) {
		this.timerId = null;
		this._remainingSeconds = startSeconds;
	}
	
	public get remainingSeconds(): number {
		return this._remainingSeconds;
	}

	public start(tickCallback: () => void) {
		if (this.timerId === null) {
			this.timerId = setInterval(() => {
				this.tick();
				tickCallback();
			}, this.intervalMillis);
		}
		else {
			console.error("Timer is already running.");
		}
	}

	public stop() {
		if (this.timerId !== null) {
			clearInterval(this.timerId);
		}

		this.timerId = null;
	}

	public reset(newStartSeconds?: number) {
		this.stop();
		this._remainingSeconds = newStartSeconds || this.startSeconds;
	}

	private tick() {
		this._remainingSeconds -= this.intervalMillis / 1000;
		if (this._remainingSeconds <= 0) {
			this.stop();
		}
	}
}
