import * as vscode from 'vscode';
import OutlineController from './OutlineController';
import config from './config';

export function activate(context: vscode.ExtensionContext) {
    const outlineController = new OutlineController(context.extensionUri);
    context.subscriptions.push(outlineController);

    context.subscriptions.push(
        vscode.commands.registerCommand(`${config.extensionName}.showOutline`, async (uri) => {
            if (!uri) {
                console.error('No outline file selected');
                return;
            }

            await outlineController.loadOutline(uri.fsPath);
            outlineController.showOutline();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(`${config.extensionName}.openOutlineFile`, async () => {
            await outlineController.selectOutlineFile();
            outlineController.showOutline();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(`${config.extensionName}.showTimeline`, async (uri) => {
            if (!uri) {
                console.error('No outline file selected');
                return;
            }

            await outlineController.loadOutline(uri.fsPath);
            outlineController.showTimeline();
        })
    );
}

// this method is called when your extension is deactivated
export function deactivate() { }
