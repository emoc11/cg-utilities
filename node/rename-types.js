import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const distDir = path.resolve(__dirname, '../dist');
const prefix = 'Emoc11Utils';

function extractTypeNames(fileContent) {
	const typeNames = new Set();

	const regex = /\b(type|interface|declare\s+namespace|extends)\s+(\w+)/g;
	let match;

	while ((match = regex.exec(fileContent)) !== null) {
		typeNames.add(match[2]);
	}

	return typeNames;
}

function renameTypesInFile(filePath) {
	const fileContent = fs.readFileSync(filePath, 'utf-8');

	const typeNames = extractTypeNames(fileContent);

	console.group(
		'\x1b[1;36m%s\x1b[0m',
		`\u2699 File : ${path.basename(filePath)}`
	);

	let modifiedContent = fileContent.replace(/\b(\w+)\b/g, (match) => {
		if (typeNames.has(match) && !match.startsWith(prefix)) {
			return `${prefix}${match}`;
		}
		return match;
	});

	console.groupEnd();

	fs.writeFileSync(filePath, modifiedContent);
}

function processTypes() {
	fs.readdirSync(distDir).forEach((file) => {
		const filePath = path.join(distDir, file);

		if (
			filePath.endsWith('.d.ts') ||
			filePath.endsWith('.d.cts') ||
			filePath.endsWith('.d.mts')
		) {
			renameTypesInFile(filePath);
		}
	});
}

console.group('\x1b[1;36m%s\x1b[0m', `\u2699 TYPES RENAMING`);

processTypes();

console.groupEnd();
console.log('\x1b[1;32m%s\x1b[0m', `\u2705 "${prefix}" ADDED`);
