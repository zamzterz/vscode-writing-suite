import * as vscode from 'vscode';
import Outline from './Outline';

export default class OutlineProvider {
    public readonly treeDataProvider;
    public readonly documentProvider;

    constructor(private _outline?: Outline) {
        this.treeDataProvider = new OutlineTreeDataProvider();
        this.documentProvider = new OutlineDocumentProvider();
    }

    public get outline(): Outline | undefined {
        return this._outline;
    }

    refresh(outline: Outline, docUri: vscode.Uri) {
        this._outline = outline;
        this.treeDataProvider.refresh(outline);
        this.documentProvider.refresh(docUri, outline);
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
            return new OutlineTreeItem(`"${item.title}"`, resourceUri);
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
            }
        }
    }
}

class OutlineDocumentProvider implements vscode.TextDocumentContentProvider {
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

    refresh(uri: vscode.Uri, outline: Outline) {
        this.outline = outline;
        this.onDidChangeEmitter.fire(uri);
    }
}
