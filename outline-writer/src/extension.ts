import * as path from 'path';
import * as vscode from 'vscode';
import getOutline from './OutlineParser';
import OutlineProvider from './OutlineProvider';


const EXTENSION_NAME = 'outline-writer';

function virtualDocUri(rootPath: string, extension: string): vscode.Uri {
    return vscode.Uri.parse(`${EXTENSION_NAME}:${rootPath}.${extension}`);
}

async function showOutline(docUri: vscode.Uri) {
    if (docUri.path.endsWith('md')) {
        await vscode.commands.executeCommand('markdown.showPreview', docUri);
        // force refresh as the outline might already be showing with stale content
        vscode.commands.executeCommand('markdown.preview.refresh');
    } else {
        const doc = await vscode.workspace.openTextDocument(docUri);
        vscode.window.showTextDocument(doc, { preview: false });
    }
}

export function activate(context: vscode.ExtensionContext) {
    let outlineFormat = vscode.workspace.getConfiguration(EXTENSION_NAME).get<string>('outlineFormat') ?? 'txt';
    vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
        if (event.affectsConfiguration(EXTENSION_NAME)) {
            outlineFormat = vscode.workspace.getConfiguration(EXTENSION_NAME).get<string>('outlineFormat') ?? 'txt';
        }
    }, undefined, context.subscriptions);

    const outlineProvider = new OutlineProvider();
    const outlineTreeView = vscode.window.createTreeView(
        `${EXTENSION_NAME}.outlineList`,
        { treeDataProvider: outlineProvider.treeDataProvider }
    );
    outlineTreeView.onDidChangeVisibility((e) => {
        if (e.visible) {
            // show rendered outline again (might have been closed by the user)
            const currentProjectPath = outlineProvider.outline?.outlineFilename;
            if (!currentProjectPath) {
                return;
            }

            showOutline(virtualDocUri(currentProjectPath, outlineFormat));
        }
    });
    context.subscriptions.push(outlineTreeView);

    const outlineDocument = vscode.workspace.registerTextDocumentContentProvider(
        EXTENSION_NAME,
        outlineProvider.documentProvider
    );
    context.subscriptions.push(outlineDocument);

    const showOutlineCommand = vscode.commands.registerCommand(`${EXTENSION_NAME}.showOutline`, async (uri) => {
        if (!uri) {
            console.error('No outline file selected');
            return;
        }

        const outline = await getOutline(uri.fsPath);
        if (outline === null) {
            vscode.window.showWarningMessage(`Could not read outline file.`);
            return;
        }

        const docUri = virtualDocUri(uri.fsPath, outlineFormat);
        outlineProvider.refresh(outline, docUri);
        showOutline(docUri);

        // watch for changes to the outline file to automatically update the Outline object
        const outlineFilename = path.parse(uri.fsPath);
        const outlineFileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(outlineFilename.dir, `${outlineFilename.base}`),
            true,
            false,
            true
        );
        outlineFileWatcher.onDidChange(async (e) => {
            if (e.fsPath === uri.fsPath) {
                // outline file changed
                const outline = await getOutline(uri.fsPath);
                if (outline === null) {
                    console.error('Could not reload outline');
                    return;
                }

                outlineProvider.refresh(outline, docUri);
            }
        });
        context.subscriptions.push(outlineFileWatcher);
    });
    context.subscriptions.push(showOutlineCommand);

    const openOutlineCommand = vscode.commands.registerCommand(`${EXTENSION_NAME}.openOutlineFile`, async () => {
        const selected = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectMany: false,
            defaultUri: vscode.workspace.workspaceFolders?.[0].uri
        });

        if (selected === undefined) {
            console.log('No outline file selected');
            return;
        }

        vscode.commands.executeCommand(`${EXTENSION_NAME}.showOutline`, selected[0]);
    });
    context.subscriptions.push(openOutlineCommand);
}

// this method is called when your extension is deactivated
export function deactivate() { }
