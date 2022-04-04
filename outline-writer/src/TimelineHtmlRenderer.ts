import * as vscode from 'vscode';
import HtmlRenderer from './HtmlRenderer';
import Outline, { OutlineItem } from './Outline';

export default class TimelineHtmlRenderer extends HtmlRenderer {
    async getHtmlForWebview(outline: Outline, webview: vscode.Webview): Promise<string> {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'timeline.css'));
        const scrollStateJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'scrollState.js'));

        const timelineContent = await this.timelineHtml(outline);
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

                <title>Timeline View</title>
            </head>
            <body>
                ${timelineContent}
            </body>
            </html>
        `;

        return html;
    }

    private async timelineHtml(outline: Outline): Promise<string> {
        let itemsHtml = '';
        for (const [index, item] of outline.items.entries()) {
            itemsHtml += await this.timelineItemHtml(item, index);
        }

        const timelineHtml = `
        <div class="container">
            <ul class="timeline">
                ${itemsHtml}
            </ul>
        </div>
        `;

        return timelineHtml;
    }

    private async timelineItemHtml(item: OutlineItem, index: number): Promise<string> {
        const customStyle = item.metadata.color ? `style="background-color: ${this.formatColorString(item.metadata.color)};"` : '';

        const header = `<h2>${item.metadata.title}</h2>`;
        let innerItemContent = '';
        if (item.metadata.text) {
            const renderedText = await vscode.commands.executeCommand('markdown.api.render', item.metadata.text);
            const collapsibleId = `collapsible${index}`;
            innerItemContent = `
            <input id="${collapsibleId}" class="toggle" type="checkbox">
            <label for="${collapsibleId}" class="label-toggle">${header}</label>
            <div class="collapsible-content">${renderedText}</div>
            `;
        } else {
            innerItemContent = header;
        }

        const itemHtml = `
        <li>
            <div class="date">${item.metadata.date ?? ''}</div>
            <div class="timeline-mark"></div>
            <div class="content">
                ${innerItemContent}
                <div class="item-index">(${item.metadata.index})</div>
            </div>
        </li>
        `;

        return itemHtml;
    }
}
