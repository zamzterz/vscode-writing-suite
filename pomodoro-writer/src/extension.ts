import { window, workspace, commands, ConfigurationChangeEvent, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, TextDocumentChangeEvent } from 'vscode';
import { RunningWordCount } from './runningWordCount';
import { throttledFunction } from './throttledFunction';
import { Timer } from './timer';
import { ZenMode } from './zenMode';

const extensionName = 'pomodoro-writer';
const defaultConfig = {
	zenMode: { autoEnabled: false },
};

export function activate(context: ExtensionContext) {
	const workMinutes = context.workspaceState.get(`${extensionName}.workMinutes`, 20);
	const wordCountGoal = context.workspaceState.get(`${extensionName}.wordCountGoal`, 250);
	
	const pomodoroWriter = new PomodoroWriter(workMinutes, wordCountGoal);
	const pomodoroWriterController = new PomodoroWriterController(pomodoroWriter);
	context.subscriptions.push(pomodoroWriter, pomodoroWriterController);

	const startDisposable = commands.registerCommand(`${extensionName}.start`, () => {
		pomodoroWriter.start();
	});

	const pauseDisposable = commands.registerCommand(`${extensionName}.pause`, () => {
		pomodoroWriter.pause();
	});

	const resetDisposable = commands.registerCommand(`${extensionName}.reset`, () => {
		pomodoroWriter.reset();
	});

	const toggleZenModeDisposable = commands.registerCommand(`${extensionName}.toggleZenMode`, () => {
		pomodoroWriter.toggleZenMode();
	});

	const setWorkMinutesDisposable = commands.registerCommand(`${extensionName}.setWorkMinutes`, () => {
		pomodoroWriter.setWorkMinutes().then(newWorkMinutes => {
			if (newWorkMinutes !== null) {
				context.workspaceState.update(`${extensionName}.workMinutes`, newWorkMinutes);
			}
		});
	});

	const setWordCountGoalDisposable = commands.registerCommand(`${extensionName}.setWordCountGoal`, () => {
		pomodoroWriter.setWordCountGoal().then(newWordCountGoal => {
			if (newWordCountGoal !== null) {
				context.workspaceState.update(`${extensionName}.wordCountGoal`, newWordCountGoal);
			}
		});
	});

	context.subscriptions.push(startDisposable, pauseDisposable, resetDisposable, setWorkMinutesDisposable, setWordCountGoalDisposable, toggleZenModeDisposable);
}

export function deactivate() {}

class PomodoroWriterController {
	private disposable: Disposable;

	constructor(pomodoroWriter: PomodoroWriter) {
		let subscriptions: Disposable[] = [];

		workspace.onDidChangeTextDocument((event: TextDocumentChangeEvent) => {
			pomodoroWriter.updateWordCount(event.document);
		}, this, subscriptions);
		workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
			if (event.affectsConfiguration(`${extensionName}`)) {
				pomodoroWriter.reloadConfig();
			}
		}, this, subscriptions);
		workspace.onDidOpenTextDocument((document: TextDocument) => {
			// store initial word count for document
			pomodoroWriter.updateWordCount(document);
		}, this, subscriptions);

		this.disposable = Disposable.from(...subscriptions);
	}

	public dispose() {
		this.disposable.dispose();
	}
}

class PomodoroWriter { 
	private timer: Timer;
	private runningWordCount: RunningWordCount;
	private zenMode: ZenMode;
	private throttledWordCountOperation: (document: TextDocument) => void;

	// UI properties
	private statusBarTimerText: StatusBarItem;
	private statusBarWordCountText: StatusBarItem;
	private statusBarStartButton: StatusBarItem;
	private statusBarPauseButton: StatusBarItem;
	private statusBarResetButton: StatusBarItem;

	constructor(workMinutes: number = 25,
				private wordCountGoal: number = 250) {
		this.timer = new Timer(workMinutes * 60);
		this.runningWordCount = new RunningWordCount();
		this.zenMode = new ZenMode(defaultConfig.zenMode);
		this.throttledWordCountOperation = throttledFunction((document) => {
			this.runningWordCount.update(document.fileName, document.getText(), () => {
				this.displayWordCount();

				if (this.wordCountGoal && this.runningWordCount.runningTotal === this.wordCountGoal) {
					let message = 'You\'ve reached the word goal, keep up the great work!';
					window.showInformationMessage(message);
				}
			});
		}, 100);

		this.reloadConfig();

		// create UI
		this.statusBarTimerText = window.createStatusBarItem(StatusBarAlignment.Left);
		this.statusBarTimerText.command = `${extensionName}.setWorkMinutes`;
		this.statusBarTimerText.tooltip = 'Change work minutes';
		this.displayRemainingTime();

		this.statusBarWordCountText = window.createStatusBarItem(StatusBarAlignment.Left);
		this.statusBarWordCountText.command = `${extensionName}.setWordCountGoal`;
		this.statusBarWordCountText.tooltip = 'Change word count goal';
		this.displayWordCount();

		this.statusBarStartButton = window.createStatusBarItem(StatusBarAlignment.Left);
		this.statusBarStartButton.text = '$(play)';
		this.statusBarStartButton.command = `${extensionName}.start`;
		this.statusBarStartButton.tooltip = 'Start pomodoro';
		this.statusBarStartButton.show();

		this.statusBarPauseButton = window.createStatusBarItem(StatusBarAlignment.Left);
		this.statusBarPauseButton.text = '$(debug-pause)';
		this.statusBarPauseButton.command = `${extensionName}.pause`;
		this.statusBarPauseButton.tooltip = 'Pause pomodoro';

		this.statusBarResetButton = window.createStatusBarItem(StatusBarAlignment.Left);
		this.statusBarResetButton.text = '$(debug-restart)';
		this.statusBarResetButton.command = `${extensionName}.reset`;
		this.statusBarResetButton.tooltip = 'Reset pomodoro';
	}

	public start() {
		this.statusBarStartButton.hide();
		this.statusBarPauseButton.show();
		this.statusBarResetButton.hide();

		this.timer.start(() => {
			this.displayRemainingTime();

			if (this.timer.remainingSeconds <= 0) {
				let message = 'Pomodoro done, you\'ve deserved a break!';
				if (this.wordCountGoal) {
					message += ` Word count: ${this.runningWordCount.runningTotal}`;
				}

				window.showInformationMessage(message, 'Restart')
					.then((selection) => {
						if (selection === 'Restart') {
							this.reset();
							this.start();
						}
					});
				this.pause();
			}
		});

		this.displayWordCount();

		if (!this.zenMode.isActive) {
			this.toggleZenMode();
		}
	}

	public pause() {
		this.timer.stop();

		if (this.timer.remainingSeconds > 0) {
			this.statusBarStartButton.show();
		}
		this.statusBarPauseButton.hide();
		this.statusBarResetButton.show();
		
		this.displayWordCount();
	}

	public reset(newStartSeconds?: number) {
		this.statusBarStartButton.show();
		this.statusBarResetButton.hide();
		this.statusBarPauseButton.hide();
		
		this.timer.reset(newStartSeconds);
		this.displayRemainingTime();
		this.runningWordCount.reset();
		this.displayWordCount();
	}

	public updateWordCount(document: TextDocument) {
		this.throttledWordCountOperation(document);
	}

	public reloadConfig() {
		const config = workspace.getConfiguration();
		const zenModeConfig = config.get(`${extensionName}.zenMode`, defaultConfig.zenMode);
		this.zenMode.update(zenModeConfig);
	}

	public async setWorkMinutes(): Promise<number | null> {
		let newTime = await window.showInputBox({ 
			title: 'Pomodoro time',
			prompt: 'Work time in minutes',
			validateInput: (value) => {
				if (value) {
					const parsed = parseInt(value, 10);
					if (!isNaN(parsed) && parsed > 0 && parsed <= 90) { 
						return null;
					}
				}

				return 'Must be an integer value between 0 and 90';
			}
		});

		if (newTime) {
			const parsed = parseInt(newTime, 10);
			this.reset(parsed * 60);
			return parsed;
		}

		return null;
	}

	public async setWordCountGoal(): Promise<number | null> {
		let newWordGoal = await window.showInputBox({ 
			title: 'Pomodoro word count goal',
			prompt: 'Number of words, set 0 to disable',
			validateInput: (value) => {
				if (value) {
					const parsed = parseInt(value, 10);
					if (isNaN(parsed)) { 
						return 'Must be an integer value';
					}
				} 

				return null;
			}
		});

		if (newWordGoal) {
			const parsed = parseInt(newWordGoal, 10);
			this.wordCountGoal = parsed;
			this.displayWordCount();
			return parsed;
		}

		return null;
	}

	public toggleZenMode() {
		this.zenMode.toggle();
	}

	public dispose() {
		this.timer.stop();

		// reset UI
		this.statusBarTimerText.dispose();
		this.statusBarWordCountText.dispose();
		this.statusBarStartButton.dispose();
		this.statusBarPauseButton.dispose();
		this.statusBarResetButton.dispose();
	}

	private displayRemainingTime() {
		const seconds = this.timer.remainingSeconds % 60;
		const minutes = (this.timer.remainingSeconds - seconds) / 60;

		const text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		this.statusBarTimerText.text = text;
		this.statusBarTimerText.show();
	}

	private displayWordCount() {
		if (this.wordCountGoal) {
			this.statusBarWordCountText.text = `${this.runningWordCount.runningTotal}/${this.wordCountGoal}`;
		} else {
			this.statusBarWordCountText.text = '-/-';
		}
		this.statusBarWordCountText.show();
	}
}
