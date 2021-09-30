import * as vscode from 'vscode';

interface ZenModeConfig {
	autoEnabled: boolean,
	fontSize?: number
}

/**
 * Manages the automatic toggling of Zen Mode.
 */
export class ZenMode {
	private _isActive: boolean = false;
	private defaultFontSize: number | undefined;

	constructor(private config: ZenModeConfig) {
		this.defaultFontSize = vscode.workspace.getConfiguration('editor').get('fontSize');
	}

	public toggle() {
		if (!this.config.autoEnabled) {
			return; // do nothing
		}

		this._isActive = !this._isActive;
			vscode.commands.executeCommand('workbench.action.toggleZenMode');

			const editorConfig = vscode.workspace.getConfiguration('editor');
			const configTarget = editorConfig.inspect('fontSize')?.workspaceValue === undefined ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace;
			if (this._isActive && this.config.fontSize) {
				// set configured font-size
				vscode.workspace.getConfiguration('editor').update(
					'fontSize',
					this.config.fontSize,
					configTarget);
			} else {
				// restore default font-size
				vscode.workspace.getConfiguration('editor').update(
					'fontSize',
					this.defaultFontSize,
					configTarget);
			}
	}

	public get isActive(): boolean {
		return this._isActive;
	}

	public update(zenModeConfig: ZenModeConfig) {
		this.config = zenModeConfig;
	}
}
