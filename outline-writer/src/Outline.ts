import { promises as fs } from 'fs';
import matter from 'gray-matter';
import * as path from 'path';
import { parseHex, RGBA } from './Color';
import OutlineConfig from './OutlineConfig';


export class OutlineItem {
    constructor(public readonly title: string, public readonly text?: string, public readonly filePath?: string, public readonly color?: RGBA) { }

    toString(): string {
        return `${this.title}:\n${this.text ?? ''}`;
    }

    toMarkdown(): string {
        return `# ${this.title}\n${this.text ?? ''}`;
    }
}

export default class Outline {
    constructor(public readonly outlineFilename: string, public readonly items: Array<OutlineItem>) { }

    static async fromList(outlineFilename: string, outlineItems: Array<string>, config: OutlineConfig): Promise<Outline> {
        const rootPath = path.dirname(outlineFilename);
        const itemWithSynopsis = outlineItems.map(async (item) => {
            if (item.startsWith('note:')) {
                return new OutlineItem('NOTE', item.substring(5).trim(), undefined, config.noteColor ?? config.defaultColor);
            }

            const filePath = path.join(rootPath, item)
            const fileData = await fs.readFile(filePath, { encoding: 'utf-8' });
            const parsedFrontMatter = matter(fileData);
            const synopsis = parsedFrontMatter.data.synopsis;
            const title = parsedFrontMatter.data.title;
            const itemTitle = title ?? path.parse(item).name;
            const color = parseHex(parsedFrontMatter.data.color) ?? config.defaultColor;
            return new OutlineItem(itemTitle, synopsis, filePath, color);
        });
        const items = await Promise.allSettled(itemWithSynopsis);

        const successfulResults = [];
        for (const [i, result] of items.entries()) {
            if (result.status === 'fulfilled') {
                successfulResults.push(result.value);
            } else {
                console.error(`Failed to load file '${outlineItems[i]}': ${result.reason}`);
            }
        }
        return new Outline(outlineFilename, successfulResults);
    }

    toString(): string {
        return this.items.map((item) => item.toString()).join('\n\n');
    }

    toMarkdown(): string {
        return this.items.map((item) => item.toMarkdown()).join('\n\n');
    }
}
