import * as assert from 'assert';
import * as path from 'path';

import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Word Count Tests', () => {
	test('Word count', async () => {
		const document = await vscode.workspace.openTextDocument(path.resolve(__dirname, '../../../src/test/suite/testdata.txt'));
		const editor = await vscode.window.showTextDocument(document);

		const text = "\nAdditional words are added at the beginning";
		await editor.edit(edit => {
			edit.insert(new vscode.Position(1, 0), text);
		});

		// TODO add end-to-end test
	});
});
