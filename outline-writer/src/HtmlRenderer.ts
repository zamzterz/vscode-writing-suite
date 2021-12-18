import path from 'path';
import * as vscode from 'vscode';
import Outline, { OutlineItem } from './Outline';

export default class HtmlRenderer implements vscode.Disposable {
    private panel: vscode.WebviewPanel | null = null;

    constructor(private extensionUri: vscode.Uri) { }

    async render(outline: Outline, docUri: vscode.Uri, createIfNotExists: boolean = true) {
        const title = path.basename(docUri.path);
        if (!this.panel) {
            if (!createIfNotExists) {
                // do nothing if the panel has been disposed or not created yet
                return;
            }

            this.panel = vscode.window.createWebviewPanel(
                'outline',
                `Outline: ${title}`,
                vscode.ViewColumn.One,
                {
                    localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')]
                }
            );
            this.panel.onDidDispose(() => {
                this.panel = null;
            });
        }

        this.panel.title = title;
        this.panel.webview.html = await this.getHtmlForWebview(outline, this.panel.webview);
    }

    private async getHtmlForWebview(outline: Outline, webview: vscode.Webview): Promise<string> {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'main.css'));

        const outlineContent = await this.outlineHtml(outline);
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="
                    default-src 'none';
                    style-src ${webview.cspSource};
                    ">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">

                <title>Outline View</title>
            </head>
            <body>
                ${outlineContent}
            </body>
            </html>
        `;

        return html;
    }

    private async outlineHtml(outline: Outline): Promise<string> {
        let itemsHtml = '';
        for (const item of outline.items) {
            itemsHtml += await this.outlineItemHtml(item);
        }

        const outlineHtml = `
        <div class="outline">
            ${itemsHtml}
        </div>
        `;

        return outlineHtml;
    }

    private async outlineItemHtml(item: OutlineItem): Promise<string> {
        let renderedSynopsis = '';
        if (item.synopsis) {
            renderedSynopsis = await vscode.commands.executeCommand('markdown.api.render', item.synopsis);
        }

        const itemHtml = `
        <div class="outline-item">
            <div class="outline-title">${item.title}</div>
            <div class="outline-synopsis">${renderedSynopsis}</div>
        </div>
        `;

        return itemHtml;
    }

    dispose() {
        this.panel?.dispose();
    }
}
