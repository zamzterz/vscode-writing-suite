/**
 * Throttle invocations of the given function with a minimum delay.
 * 
 * @param f function to throttle
 * @param delayMillis minimum time between invocations
 */
export function throttledFunction(f: (...args: any[]) => void, delayMillis: number) {
	let throttled = false;

	return (...args: any[]) => {
		if (throttled) {
			return;
		}

		f(...args);

		throttled = true;
		setTimeout(() => {
			throttled = false;
		}, delayMillis);
	};
}
