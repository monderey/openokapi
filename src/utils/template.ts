export function extractTemplateVariables(template: string): string[] {
  const matches = template.matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g);
  const variables = new Set<string>();

  for (const match of matches) {
    const variableName = match[1];
    if (variableName) {
      variables.add(variableName);
    }
  }

  return Array.from(variables).sort((left, right) => left.localeCompare(right));
}

export function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(
    /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g,
    (_, rawName: string) => {
      const key = rawName.trim();
      return variables[key] ?? "";
    },
  );
}
