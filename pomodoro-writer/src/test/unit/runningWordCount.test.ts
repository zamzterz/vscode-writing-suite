import * as assert from 'assert';
import { RunningWordCount } from '../../runningWordCount';

suite('RunningWordCount Test Suite', () => {
	const filename = 'test';

	test('diff from non-existing to empty text', () => {
		const diff = new RunningWordCount();
		diff.update(filename, '');
		assert.strictEqual(diff.runningCount(filename), 0);
	});

	test('diff from non-existing to non-empty text', () => {
		const diff = new RunningWordCount();
		diff.update(filename, 'test test');
		assert.strictEqual(diff.runningCount(filename), 0);
	});

	test('diff from existing to empty text', () => {
		const diff = new RunningWordCount();
		diff.update(filename, 'test test');
		diff.update(filename, '');
		assert.strictEqual(diff.runningCount(filename), -2);
	});

	test('diff from existing to less text', () => {
		const diff = new RunningWordCount();
		diff.update(filename, 'test');
		diff.update(filename, '');
		assert.strictEqual(diff.runningCount(filename), -1);
	});

	test('runningTotal', () => {
		const diff = new RunningWordCount();
		diff.update('file1', 'test1');
		diff.update('file1', 'test1 test1');
		diff.update('file2', 'test2');
		diff.update('file2', 'test2 test2');
		assert.strictEqual(diff.runningTotal, 2);
	});
});
