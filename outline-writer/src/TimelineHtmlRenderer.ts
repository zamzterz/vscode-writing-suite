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

        const outlineHtml = `
        <div class="timeline">
            <ul>
                ${itemsHtml}
            </ul>
        </div>
        `;

        return outlineHtml;
    }

    private async timelineItemHtml(item: OutlineItem, index: number): Promise<string> {
        const customStyle = item.metadata.color ? `style="background-color: ${this.formatColorString(item.metadata.color)};"` : '';

        let innerItemContent = '';
        if (item.metadata.text) {
            const renderedText = await vscode.commands.executeCommand('markdown.api.render', item.metadata.text);
            const collapsibleId = `collapsible${index}`;
            innerItemContent = `
            <input id="${collapsibleId}" class="toggle" type="checkbox">
            <label for="${collapsibleId}" class="label-toggle"><h1>${item.metadata.title}</h1></label>
            <div class="collapsible-content">${renderedText}</div>
            `
        } else {
            innerItemContent = `
            <h1>${item.metadata.title}</h1>
            `
        }

        const itemHtml = `
        <li ${customStyle}>
            <div class="timeline-date">${item.metadata.date ?? ''}</div>
            <div class="timeline-content">
                ${innerItemContent}
            </div>
        </li>
        `;

        return itemHtml;
    }
}
