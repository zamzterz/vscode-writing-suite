export class RunningWordCount {
	/**
	 * initial word count count per file
	 */
	private initialWordCount: Map<string, number>;
	/**
	 * current word count per file
	 */
	private _currentWordCount: Map<string, number>;

	constructor() {
		this._currentWordCount = new Map<string, number>();
		this.initialWordCount = new Map<string, number>();
	}

	public update(filename: string, text: string, onChangeCallback?: () => void) {
		const currentCount = this.countWords(text);
		const initialCount = this.initialWordCount.get(filename);
		if (initialCount === undefined) {
			// this is the first time document is edited, there won't be any change
			this.initialWordCount.set(filename, currentCount);
			this._currentWordCount.set(filename, currentCount);
		} else {
			const previousCount = this._currentWordCount.get(filename);
			this._currentWordCount.set(filename, currentCount);
			if (currentCount !== previousCount && onChangeCallback) {
				onChangeCallback();
			}
		}
	}

	public get runningTotal(): number {
		const wordCountDiff = new Map<string, number>();

		for (const filename of this.initialWordCount.keys()) {
			const currentDiff = this.runningCount(filename);
			if (currentDiff !== undefined) {
				wordCountDiff.set(filename, currentDiff);
			}
		}
		const result = Array.from(wordCountDiff.values())
			.reduce((previousValue: number, currentValue: number) => {
				return previousValue + currentValue;
		  	}, 0);
		return result;
	}

	public runningCount(filename: string): number | undefined {
		const currentWordCount = this._currentWordCount.get(filename);
		const initialWordCount = this.initialWordCount.get(filename);
		if (currentWordCount === undefined || initialWordCount === undefined) {
			return undefined;
		}

		return currentWordCount - initialWordCount;
	}

	public reset() {
		this.initialWordCount.clear();
		this._currentWordCount.clear();
	}

	private countWords(text: string): number {
        if (!text) {
			return 0;
            
        }

		const matchedWords = text.match(/[\w'-]+/g);
		if (matchedWords) {
			return matchedWords.length;
		}
		return 0;
	}
}
