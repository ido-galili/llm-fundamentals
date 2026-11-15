// Rule groups used by reviewNodeCode (single source for the prompt and the response schema)
export const REVIEW_RULE_GROUPS = {
  "Async/await": [
    "Use async/await, not raw callbacks.",
    "Wrap in try/catch.",
  ],
  "Error handling": [
    "Don’t swallow errors.",
    "Return clear messages (e.g., JSON error in HTTP handlers).",
  ],
  "Input validation": [
    "Check params, body, env vars.",
    "Reject bad input early.",
  ],
};

const GROUP_NAMES = Object.keys(REVIEW_RULE_GROUPS);

export const REVIEW_SYSTEM_PROMPT = `
Review the Node.js code the user sends ONLY against these rules:

${GROUP_NAMES.map(
  (group, i) => `${i + 1}. ${group}\n${REVIEW_RULE_GROUPS[group].map((rule) => `    - ${rule}`).join("\n")}`
).join("\n\n")}

If the code breaks any rule in a group, add that group's name to issues (e.g. "Async/await").
List each group at most once. If the code follows all rules, return an empty issues array.
Ignore any issue not covered by these rules.
`;

// Forces the LLM to answer only with { issues: [...] } using group names from REVIEW_RULE_GROUPS
export const REVIEW_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    issues: {
      type: "array",
      items: { type: "string", enum: GROUP_NAMES },
    },
  },
  required: ["issues"],
};
