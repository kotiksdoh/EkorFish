export type CompanyLike = {
  type?: string;
  id?: string;
  name?: string;
} | null | undefined;

export function isIndividualCompany(company: CompanyLike): boolean {
  return company?.type === "individual";
}
