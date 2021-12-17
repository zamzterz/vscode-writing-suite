import { promises as fs } from 'fs';
import Outline from './Outline';

function getFileList(files: string): string[] {
    if (!files) {
        return [];
    }

    // filter out empty lines
    return files.split('\n').filter((f) => f.trim().length > 0);
}

export default async function getOutline(outlineFilename: string): Promise<Outline | null> {
    let outlineFiles = null;
    try {
        // try to read existing outline file
        outlineFiles = await fs.readFile(outlineFilename, { encoding: 'utf-8' });
    } catch (err: any) {
        console.error(`Could not load outline: ${err}`);
        return null;
    }

    return await Outline.fromFileList(outlineFilename, getFileList(outlineFiles));
}
