import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const srcDir = path.resolve(__dirname, '../src');

const ignoreFiles = ['index.ts'];

function generateExports() {
	const tsFiles = fs
		.readdirSync(srcDir)
		.filter((file) => file.endsWith('.ts') && !ignoreFiles.includes(file));

	console.group('\x1b[1;36m%s\x1b[0m', '\u2699 File : index.ts');

	const indexTsContent = tsFiles
		.map((file) => {
			console.log('\x1b[2;3;36m%s\x1b[0m', `\u2937 Added ${file}`);
			return `\texport * from './${file.replace('.ts', '')}';`;
		})
		.join('\n');
	fs.writeFileSync(
		path.resolve(__dirname, '../src', 'index.ts'),
		indexTsContent
	);

	console.groupEnd();
	console.log('\x1b[1;32m%s\x1b[0m', '\u2705 Done');

	const packageJsonPath = path.resolve(__dirname, '../package.json');
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

	console.group('\x1b[1;36m%s\x1b[0m', '\u2699 File : package.json');

	packageJson.exports = {
		'.': {
			import: './dist/index.mjs',
			require: './dist/index.cjs',
			types: './dist/index.d.ts',
		},
	};
	tsFiles.forEach((file) => {
		const base = file.replace('.ts', '');
		packageJson.exports[`./${base}`] = {
			import: `./dist/${base}.mjs`,
			require: `./dist/${base}.cjs`,
			types: `./dist/${base}.d.ts`,
		};
		console.log('\x1b[2;3;36m%s\x1b[0m', `\u2937 Added ${base}`);
	});

	fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));

	console.groupEnd();
	console.log('\x1b[1;32m%s\x1b[0m', '\u2705 Done');
}

console.group('\x1b[1;36m%s\x1b[0m', '\u2699 EXPORTS GENERATIONS');

// Exécution
generateExports();

console.groupEnd();
console.log('\x1b[1;32m%s\x1b[0m', '\u2705 DONE');
