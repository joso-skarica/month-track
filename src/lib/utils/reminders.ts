export interface TemplateVars {
  company_name: string;
  month_name: string;
  year: string | number;
  missing_documents_list: string;
  firm_signature: string;
}

export function renderTemplate(
  template: string,
  vars: TemplateVars,
): string {
  return template
    .replaceAll('{{company_name}}', vars.company_name)
    .replaceAll('{{month_name}}', vars.month_name)
    .replaceAll('{{year}}', String(vars.year))
    .replaceAll('{{missing_documents_list}}', vars.missing_documents_list)
    .replaceAll('{{firm_signature}}', vars.firm_signature);
}
