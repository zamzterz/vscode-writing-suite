import { promises as fs } from 'fs';
import Outline from './Outline';
import OutlineConfig from './OutlineConfig';

export default class OutlineParser {
    private config: OutlineConfig = {}

    setConfig(config: OutlineConfig) {
        this.config = config;
    }

    async getOutline(outlineFilename: string): Promise<Outline | null> {
        let outlineList = null;
        try {
            outlineList = await fs.readFile(outlineFilename, { encoding: 'utf-8' });
        } catch (err: any) {
            console.error(`Could not load outline: ${err}`);
            return null;
        }

        return await Outline.fromList(outlineFilename, this.filterEmptyLines(outlineList), this.config);
    }

    private filterEmptyLines(files: string): string[] {
        if (!files) {
            return [];
        }

        // filter out empty lines
        return files.split('\n').filter((f) => f.trim().length > 0);
    }
}
