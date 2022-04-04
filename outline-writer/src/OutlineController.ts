import path from 'path';
import * as vscode from 'vscode';
import config from './config';
import Outline from './Outline';
import OutlineProvider from './OutlineProvider';
import OutlineParser from './OutlineParser';
import { parseHex } from './Color';
import OutlineHtmlRenderer from './OutlineHtmlRenderer';
import TimelineHtmlRenderer from './TimelineHtmlRenderer';
import { OutlineFormat } from './OutlineFormat';

export default class OutlineController implements vscode.Disposable {
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

        vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
            if (event.affectsConfiguration(config.extensionName)) {
                this.updateConfig();
            }
        }, null, disposables);

        this.outlineParser = new OutlineParser();

        this.outlineHtmlRenderer = new OutlineHtmlRenderer(extensionUri, 'Outline');
        disposables.push(this.outlineHtmlRenderer);
        this.timelineHtmlRenderer = new TimelineHtmlRenderer(extensionUri, 'Timeline');
        disposables.push(this.timelineHtmlRenderer);

        disposables.push(this.outlineProvider);
        this.disposable = vscode.Disposable.from(...disposables);

        this.updateConfig();
    }

    async showOutline() {
        if (!this.loadedOutline) {
            return;
        }

        const docUri = this.outlineProvider.outlineVirtualDocUri(this.loadedOutline.outlineFilename, this.outlineFormat);
        switch (this.outlineFormat) {
            case OutlineFormat.markdown:
                await vscode.commands.executeCommand('markdown.showPreview', docUri, null, { locked: true });
                // force refresh as the outline might already be showing with stale content
                vscode.commands.executeCommand('markdown.preview.refresh');
                break;
            case OutlineFormat.html:
                this.outlineHtmlRenderer.render(this.loadedOutline);
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

        switch (this.outlineFormat) {
            case OutlineFormat.html:
                this.timelineHtmlRenderer.render(this.loadedOutline);
                break;
            default:
                const docUri = this.outlineProvider.outlineVirtualDocUri(this.loadedOutline.outlineFilename, this.outlineFormat);
                const doc = await vscode.workspace.openTextDocument(docUri);
                vscode.window.showTextDocument(doc, { preview: false });
        }
    }

    updateConfig() {
        const updatedConfig = vscode.workspace.getConfiguration(config.extensionName);
        this.outlineFormat = updatedConfig.get<OutlineFormat>('outlineFormat') ?? OutlineFormat.plaintext;

        const outlineConfig = {
            noteColor: parseHex(updatedConfig.noteColor) ?? undefined,
            defaultColor: parseHex(updatedConfig.defaultColor) ?? undefined,
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

        this.outlineProvider.refresh(this.loadedOutline, this.outlineFormat);
        // replace outline file watcher
        this.outlineFileWatcher?.dispose();
        this.outlineFileWatcher = this.createOutlineFileWatcher(filename);
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

    private createOutlineFileWatcher(filename: string): vscode.FileSystemWatcher {
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

                this.outlineProvider.refresh(outline, this.outlineFormat);
                this.outlineHtmlRenderer.render(outline, false);
                this.timelineHtmlRenderer.render(outline, false);
            }
        });

        return outlineFileWatcher;
    }

    dispose() {
        this.disposable.dispose();
        this.outlineFileWatcher?.dispose();
    }
}
