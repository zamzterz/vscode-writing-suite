import { promises as fs } from 'fs';
import matter from 'gray-matter';
import * as path from 'path';
import { parseHex, RGBA } from './Color';
import OutlineConfig from './OutlineConfig';

export interface OutlineItemMetadata {
    readonly title: string,
    readonly text?: string,
    readonly date?: string,
    readonly color?: RGBA
}

export class OutlineItem {
    constructor(public metadata: OutlineItemMetadata, public readonly filePath?: string) { }

    private formattedDateString: string = this.metadata.date ? ` (${this.metadata.date})` : '';

    toString(): string {
        return `${this.metadata.title}${this.formattedDateString}:\n${this.metadata.text ?? ''}`;
    }

    toMarkdown(): string {
        return `# ${this.metadata.title}${this.formattedDateString}\n${this.metadata.text ?? ''}`;
    }
}

export default class Outline {
    constructor(public readonly outlineFilename: string, public readonly items: Array<OutlineItem>) { }

    static async fromList(outlineFilename: string, outlineItems: Array<string>, config: OutlineConfig): Promise<Outline> {
        const rootPath = path.dirname(outlineFilename);
        const itemWithSynopsis = outlineItems.map(async (item) => {
            if (item.startsWith('note:')) {
                const metadata = {
                    title: 'NOTE',
                    text: item.substring(5).trim(),
                    color: config.noteColor ?? config.defaultColor,
                };
                return new OutlineItem(metadata, undefined);
            }

            const filePath = path.join(rootPath, item)
            const fileData = await fs.readFile(filePath, { encoding: 'utf-8' });
            const parsedFrontMatter = matter(fileData);
            const metadata = {
                title: parsedFrontMatter.data.title ?? path.parse(item).name,
                text: parsedFrontMatter.data.synopsis,
                date: parsedFrontMatter.data.date,
                color: parseHex(parsedFrontMatter.data.color) ?? config.defaultColor,
            }
            return new OutlineItem(metadata, filePath);
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
