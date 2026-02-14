import type { Specifications } from "../../types";

function getSpecSectionItems(content: string, regex: RegExp) {
	const match = regex.exec(content);
	return (
		match?.[1]
			?.split("\n")
			.map((line) => line.replace(/^-+\s*/, "").trim())
			.filter((line) => line.length > 0) ?? []
	);
}

export function parseSpecifications(content: string): Specifications {
	const DESCRIPTION_REGEX = /^# [^\n]+\n([\s\S]+?)(?=\n## |\n$)/m;
	const FUNCTIONAL_REGEX =
		/(?:^|\n)## Functional Requirements[^\n]*(?:\n|$)([\s\S]+?)(?=\n## |$)/g;
	const NON_FUNCTIONAL_REGEX =
		/(?:^|\n)## Non-Functional Requirements[^\n]*(?:\n|$)([\s\S]+?)(?=\n## |$)/g;
	const ACCEPTANCE_REGEX =
		/(?:^|\n)## Acceptance Criteria[^\n]*(?:\n|$)([\s\S]+?)(?=\n## |$)/g;
	const OUT_OF_SCOPE_REGEX =
		/(?:^|\n)## Out of Scope[^\n]*(?:\n|$)([\s\S]+?)(?=\n#{2,3} |$)/g;

	const descriptionMatch = content.match(DESCRIPTION_REGEX);
	const description = descriptionMatch?.[1]?.trim() ?? "";

	const functionals = getSpecSectionItems(content, FUNCTIONAL_REGEX);
	const nonFunctionals = getSpecSectionItems(content, NON_FUNCTIONAL_REGEX);
	const acceptanceCriterias = getSpecSectionItems(content, ACCEPTANCE_REGEX);
	const outOfScope = getSpecSectionItems(content, OUT_OF_SCOPE_REGEX);

	return {
		description,
		functionals,
		nonFunctionals,
		acceptanceCriterias,
		outOfScope,
	};
}
