import type { Config } from "prettier";

const config: Config = {
	printWidth: 80,
	arrowParens: "always",
	endOfLine: "lf",
	objectWrap: "preserve",
	useTabs: true,
	tabWidth: 2,
	singleQuote: false,
	plugins: ["@ianvs/prettier-plugin-sort-imports"],
	importOrder: [
		"<TYPES>^(bun:)",
		"<TYPES>^(node:)",
		"<TYPES>",
		"<TYPES>^[.]",
		"",
		"<BUILTIN_MODULES>",
		"",
		"<THIRD_PARTY_MODULES>",
		"",
		"^(@src)(/.*)$",
		"",
		"^[.]",
	],
};

export default config;
