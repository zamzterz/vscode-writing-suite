import * as vscode from 'vscode';
import HtmlRenderer from './HtmlRenderer';
import Outline, { OutlineItem } from './Outline';

export default class OutlineHtmlRenderer extends HtmlRenderer {
    async getHtmlForWebview(outline: Outline, webview: vscode.Webview): Promise<string> {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'outline.css'));
        const scrollStateJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'scrollState.js'));

        const outlineContent = await this.outlineHtml(outline);
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="
                    default-src 'none';
                    style-src ${webview.cspSource} 'unsafe-inline';
                    script-src ${webview.cspSource};
                    ">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <script defer src="${scrollStateJsUri}"></script>

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
        let renderedText = '';
        if (item.metadata.text) {
            renderedText = await vscode.commands.executeCommand('markdown.api.render', item.metadata.text);
        }

        const customStyle = item.metadata.color ? `style="background-color: ${this.formatColorString(item.metadata.color)};"` : '';
        const itemHtml = `
        <div class="outline-item" ${customStyle}>
            <div class="outline-title-row">
                <div class="outline-title">${item.metadata.title}</div>
                <div>(${item.metadata.index})</div>
            </div>
            <div class="outline-date">${item.metadata.date ?? ''}</div>
            <div class="outline-text">${renderedText}</div>
        </div>
        `;

        return itemHtml;
    }
}
