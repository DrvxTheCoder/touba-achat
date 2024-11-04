// utils/odm.ts
export enum ODMPersonCategory {
    DIRECTOR = "DIRECTOR",
    TEAM_MANAGER = "TEAM_MANAGER",
    FIELD_AGENT = "FIELD_AGENT",
    FREELANCER = "FREELANCER"
  }
  
  export const ODM_CATEGORY_LABELS: Record<ODMPersonCategory, string> = {
    [ODMPersonCategory.DIRECTOR]: "Directeur",
    [ODMPersonCategory.TEAM_MANAGER]: "Responsable",
    [ODMPersonCategory.FIELD_AGENT]: "Agent / Assistant",
    [ODMPersonCategory.FREELANCER]: "Prestataire",
  };
  
  export const ODM_DAILY_RATES: Record<ODMPersonCategory, number> = {
    [ODMPersonCategory.DIRECTOR]: 25000,
    [ODMPersonCategory.TEAM_MANAGER]: 20000,
    [ODMPersonCategory.FIELD_AGENT]: 15000,
    [ODMPersonCategory.FREELANCER]: 10000,
  };
  
  export interface AccompanyingPerson {
    name: string;
    category: ODMPersonCategory;
    costPerDay: number;
  }
  
  export function calculateMissionDuration(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  
  export function calculateAccompanyingCosts(
    persons: AccompanyingPerson[],
    days: number
  ): number {
    return persons.reduce((total, person) => {
      return total + (person.costPerDay * days);
    }, 0);
  }