import * as vscode from 'vscode';
import OutlineController from './OutlineController';


export function activate(context: vscode.ExtensionContext) {
    const controller = new OutlineController();
    context.subscriptions.push(controller);

    context.subscriptions.push(
        vscode.commands.registerCommand(`${OutlineController.extensionName}.showOutline`, async (uri) => {
            if (!uri) {
                console.error('No outline file selected');
                return;
            }

            await controller.loadOutline(uri.fsPath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(`${OutlineController.extensionName}.openOutlineFile`, async () => {
            await controller.selectOutlineFile();
        })
    );
}

// this method is called when your extension is deactivated
export function deactivate() { }
