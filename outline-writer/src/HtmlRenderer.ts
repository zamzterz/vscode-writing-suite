import path from 'path';
import * as vscode from 'vscode';
import Outline from './Outline';
import { RGBA } from './Color';

export default abstract class HtmlRenderer implements vscode.Disposable {
    private panel: vscode.WebviewPanel | null = null;

    constructor(protected extensionUri: vscode.Uri, protected title: string) { }

    async render(outline: Outline, docUri: vscode.Uri, createIfNotExists: boolean = true) {
        const filename = path.basename(docUri.path);
        const title = `${this.title}: ${filename}`
        if (!this.panel) {
            if (!createIfNotExists) {
                // do nothing if the panel has been disposed or not created yet
                return;
            }

            this.panel = vscode.window.createWebviewPanel(
                'outline',
                title,
                vscode.ViewColumn.One,
                {
                    enableFindWidget: true,
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
                }
            );
            this.panel.onDidDispose(() => {
                this.panel = null;
            });
        }

        this.panel.title = title;
        this.panel.webview.html = await this.getHtmlForWebview(outline, this.panel.webview);
    }

    abstract getHtmlForWebview(outline: Outline, webview: vscode.Webview): Promise<string>

    protected formatColorString(color: RGBA): string {
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a.toFixed(2)})`;
    }

    dispose() {
        this.panel?.dispose();
    }
}
