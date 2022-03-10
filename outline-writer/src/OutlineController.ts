import path from 'path';
import * as vscode from 'vscode';
import Outline from './Outline';
import OutlineProvider from './OutlineProvider';
import OutlineParser from './OutlineParser';
import { parseHex } from './Color';
import OutlineHtmlRenderer from './OutlineHtmlRenderer';
import TimelineHtmlRenderer from './TimelineHtmlRenderer';

enum OutlineFormat {
    markdown = 'md',
    plaintext = 'txt',
    html = 'html'
}

export default class OutlineController implements vscode.Disposable {
    public static extensionName = 'outline-writer';

    private disposable: vscode.Disposable;
    private outlineFileWatcher?: vscode.FileSystemWatcher;

    private loadedOutline: Outline | null = null;
    private outlineFormat: OutlineFormat = OutlineFormat.plaintext;
    private outlineProvider = new OutlineProvider();
    private outlineParser: OutlineParser;
    private outlineHtmlRenderer: OutlineHtmlRenderer;
    private timelineHtmlRenderer: TimelineHtmlRenderer;

    constructor(extensionUri: vscode.Uri) {
        const disposables: vscode.Disposable[] = [];

        const outlineTreeView = vscode.window.createTreeView(
            `${OutlineController.extensionName}.outlineList`,
            { treeDataProvider: this.outlineProvider.treeDataProvider }
        );
        disposables.push(outlineTreeView);

        const outlineDocument = vscode.workspace.registerTextDocumentContentProvider(
            OutlineController.extensionName,
            this.outlineProvider.documentProvider
        );
        disposables.push(outlineDocument);

        vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
            if (event.affectsConfiguration(OutlineController.extensionName)) {
                this.updateConfig();
            }
        }, null, disposables);

        this.outlineParser = new OutlineParser();

        this.outlineHtmlRenderer = new OutlineHtmlRenderer(extensionUri, 'Outline');
        disposables.push(this.outlineHtmlRenderer);
        this.timelineHtmlRenderer = new TimelineHtmlRenderer(extensionUri, 'Timeline');
        disposables.push(this.timelineHtmlRenderer);

        this.disposable = vscode.Disposable.from(...disposables);

        this.updateConfig();
    }

    async showOutline() {
        if (!this.loadedOutline) {
            return;
        }

        const docUri = this.virtualDocUri(this.loadedOutline.outlineFilename);

        switch (this.outlineFormat) {
            case OutlineFormat.markdown:
                await vscode.commands.executeCommand('markdown.showPreview', docUri, null, { locked: true });
                // force refresh as the outline might already be showing with stale content
                vscode.commands.executeCommand('markdown.preview.refresh');
                break;
            case OutlineFormat.html:
                this.outlineHtmlRenderer.render(this.loadedOutline, docUri);
                break;
            default:
                const doc = await vscode.workspace.openTextDocument(docUri);
                vscode.window.showTextDocument(doc, { preview: false });
        }
    }

    async showTimeline() {
        if (!this.loadedOutline) {
            return;
        }
        const docUri = this.virtualDocUri(this.loadedOutline.outlineFilename);
        this.timelineHtmlRenderer.render(this.loadedOutline, docUri);
    }

    private virtualDocUri(outlineFilename: string): vscode.Uri {
        return vscode.Uri.parse(`${OutlineController.extensionName}:${outlineFilename}.${this.outlineFormat}`);
    }

    updateConfig() {
        const config = vscode.workspace.getConfiguration(OutlineController.extensionName);
        this.outlineFormat = config.get<OutlineFormat>('outlineFormat') ?? OutlineFormat.plaintext;

        const outlineConfig = {
            noteColor: parseHex(config.noteColor) ?? undefined,
            defaultColor: parseHex(config.defaultColor) ?? undefined,
        };
        this.outlineParser.setConfig(outlineConfig);
    }

    async loadOutline(filename: string) {
        if (filename === this.loadedOutline?.outlineFilename) {
            // same outline is already loaded
            return;
        }

        this.loadedOutline = await this.outlineParser.getOutline(filename);
        if (this.loadedOutline === null) {
            vscode.window.showWarningMessage(`Could not read outline file.`);
            return;
        }

        const docUri = this.virtualDocUri(filename);
        this.outlineProvider.refresh(this.loadedOutline, docUri);
        // replace outline file watcher
        this.outlineFileWatcher?.dispose();
        this.outlineFileWatcher = this.createOutlineFileWatcher(filename, docUri);
    }

    async selectOutlineFile() {
        const selected = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectMany: false,
            defaultUri: vscode.workspace.workspaceFolders?.[0].uri
        });

        if (selected === undefined) {
            console.log('No outline file selected');
            return;
        }

        await this.loadOutline(selected[0].fsPath);
    }

    private createOutlineFileWatcher(filename: string, docUri: vscode.Uri): vscode.FileSystemWatcher {
        // watch for changes to the outline file to automatically update the Outline object
        const parsedFilename = path.parse(filename);
        const outlineFileWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(parsedFilename.dir, `${parsedFilename.base}`),
            true,
            false,
            true
        );
        outlineFileWatcher.onDidChange(async (e) => {
            if (e.fsPath === filename) {
                // outline file changed
                const outline = await this.outlineParser.getOutline(filename);
                if (outline === null) {
                    console.error('Could not reload outline');
                    return;
                }

                this.outlineProvider.refresh(outline, docUri);
                this.outlineHtmlRenderer.render(outline, docUri, false);
                this.timelineHtmlRenderer.render(outline, docUri, false);
            }
        });

        return outlineFileWatcher;
    }

    dispose() {
        this.disposable.dispose();
        this.outlineFileWatcher?.dispose();
    }
}
