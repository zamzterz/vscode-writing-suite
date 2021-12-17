import { promises as fs } from 'fs';

import matter from 'gray-matter';
import * as path from 'path';

export class OutlineItem {
    public readonly title: string;

    constructor(public readonly relativePath: string, title?: string, private synopsis?: string) {
        this.title = title ?? path.parse(relativePath).name;
    }

    toString(): string {
        return `${this.title}:\n${this.synopsis ?? ''}`;
    }

    toMarkdown(): string {
        return `# ${this.title}\n${this.synopsis ?? ''}`;
    }
}

export default class Outline {
    constructor(public readonly outlineFilename: string, public readonly items: OutlineItem[]) { }

    static async fromFileList(outlineFilename: string, outlineItems: Array<string>): Promise<Outline> {
        const rootPath = path.dirname(outlineFilename);
        const itemWithSynopsis = outlineItems.map(async (relativePath) => {
            const fileData = await fs.readFile(path.join(rootPath, relativePath), { encoding: 'utf-8' });
            const parsedFrontMatter = matter(fileData);
            const synopsis = parsedFrontMatter.data.synopsis;
            const title = parsedFrontMatter.data.title;
            return new OutlineItem(relativePath, title, synopsis);
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

    serialize(): string {
        return this.items.map((item) => item.relativePath).join('\n');
    }

    toString(): string {
        return this.items.map((item) => item.toString()).join('\n\n');
    }

    toMarkdown(): string {
        return this.items.map((item) => item.toMarkdown()).join('\n\n');
    }
}
