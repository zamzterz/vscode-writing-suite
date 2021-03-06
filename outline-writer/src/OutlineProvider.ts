import * as vscode from 'vscode';
import config from './config';
import Outline from './Outline';
import { OutlineFormat } from './OutlineFormat';

export default class OutlineProvider implements vscode.Disposable {
    private treeDataProvider;
    private outlineDocumentProvider;
    private timelineDocumentProvider;

    private disposable: vscode.Disposable;

    constructor(private _outline?: Outline) {
        this.treeDataProvider = new OutlineTreeDataProvider();
        this.outlineDocumentProvider = new OutlineDocumentProvider();
        this.timelineDocumentProvider = new TimelineDocumentProvider();

        const disposables: vscode.Disposable[] = [];
        disposables.push(vscode.workspace.registerTextDocumentContentProvider(
            OutlineDocumentProvider.supportedScheme,
            this.outlineDocumentProvider)
        );
        disposables.push(vscode.workspace.registerTextDocumentContentProvider(
            TimelineDocumentProvider.supportedScheme,
            this.timelineDocumentProvider)
        );

        const outlineTreeView = vscode.window.createTreeView(
            `${config.extensionName}.outlineList`,
            { treeDataProvider: this.treeDataProvider }
        );
        disposables.push(outlineTreeView);

        this.disposable = vscode.Disposable.from(...disposables);
    }

    public get outline(): Outline | undefined {
        return this._outline;
    }

    public outlineVirtualDocUri(outlineFilename: string, outlineFormat: OutlineFormat): vscode.Uri {
        return this.outlineDocumentProvider.virtualDocUri(outlineFilename, outlineFormat);
    }

    public timelineVirtualDocUri(outlineFilename: string, outlineFormat: OutlineFormat): vscode.Uri {
        return this.timelineDocumentProvider.virtualDocUri(outlineFilename, outlineFormat);
    }

    refresh(outline: Outline, outlineFormat: OutlineFormat) {
        this._outline = outline;
        this.treeDataProvider.refresh(outline);
        this.outlineDocumentProvider.refresh(outline, outlineFormat);
        this.timelineDocumentProvider.refresh(outline, outlineFormat);
    }

    dispose() {
        this.disposable.dispose();
    }
}

// TODO implement drag and drop: https://github.com/Microsoft/vscode/issues/32592
class OutlineTreeDataProvider implements vscode.TreeDataProvider<OutlineTreeItem> {
    private onDidChangeEmitter = new vscode.EventEmitter<OutlineTreeItem | undefined | null | void>();

    constructor(private outline?: Outline) { }

    getTreeItem(element: OutlineTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: OutlineTreeItem): Thenable<OutlineTreeItem[]> {
        if (!this.outline) {
            return Promise.resolve([]);
        }

        return Promise.resolve(this.outline.items.map((item) => {
            let resourceUri;
            if (item.filePath) {
                resourceUri = vscode.Uri.parse(`file://${item.filePath}`, true);
            }

            let label = item.metadata.title;
            if (!item.filePath && item.metadata.text) {
                /* This is a non-empty inline note.
                   Include its text directly in the
                   label since there is no associated
                   file. */
                label += `: ${item.metadata.text}`;
            }
            return new OutlineTreeItem(`${label}`, resourceUri);
        }));
    }

    readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

    refresh(outline: Outline): void {
        this.outline = outline;
        this.onDidChangeEmitter.fire();
    }
}

class OutlineTreeItem extends vscode.TreeItem {
    constructor(label: string, public readonly resourceUri?: vscode.Uri) {
        super(label, vscode.TreeItemCollapsibleState.None);
        if (this.resourceUri) {
            this.command = {
                title: 'Open file',
                command: 'vscode.open',
                arguments: [this.resourceUri],
            };
        }
    }
}

class OutlineDocumentProvider implements vscode.TextDocumentContentProvider {
    public static supportedScheme = `${config.extensionName}-outline`;
    private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

    constructor(private outline?: Outline) { }

    provideTextDocumentContent(uri: vscode.Uri): string {
        if (!this.outline) {
            return '';
        }

        if (uri.path.endsWith('.md')) {
            return this.outline.toMarkdown();
        }

        return this.outline.toString();
    }

    readonly onDidChange = this.onDidChangeEmitter.event;

    refresh(outline: Outline, outlineFormat: OutlineFormat) {
        this.outline = outline;
        this.onDidChangeEmitter.fire(this.virtualDocUri(outline.outlineFilename, outlineFormat));
    }

    virtualDocUri(outlineFilename: string, outlineFormat: OutlineFormat): vscode.Uri {
        return vscode.Uri.parse(`${OutlineDocumentProvider.supportedScheme}:${outlineFilename}.${outlineFormat}`);
    }
}

class TimelineDocumentProvider implements vscode.TextDocumentContentProvider {
    public static supportedScheme = `${config.extensionName}-timeline`;
    private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

    constructor(private outline?: Outline) { }

    provideTextDocumentContent(uri: vscode.Uri): string {
        if (!this.outline) {
            return '';
        }

        const timeline = this.outline.items.map((item) => `${item.metadata.title}: ${item.metadata.date ?? ''}`);
        return timeline.join('\n');
    }

    readonly onDidChange = this.onDidChangeEmitter.event;

    refresh(outline: Outline, outlineFormat: OutlineFormat) {
        this.outline = outline;
        this.onDidChangeEmitter.fire(this.virtualDocUri(outline.outlineFilename, outlineFormat));
    }

    virtualDocUri(outlineFilename: string, outlineFormat: OutlineFormat): vscode.Uri {
        return vscode.Uri.parse(`${TimelineDocumentProvider.supportedScheme}:${outlineFilename}.${outlineFormat}`);
    }
}
