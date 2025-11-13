/**
 * Compliance Rules Engine
 *
 * Calculates and manages tax compliance obligations based on:
 * - Entity characteristics (type, jurisdiction, turnover)
 * - Country-specific tax laws (UAE, KSA, Egypt)
 * - Filing frequency and deadlines
 * - Applicable thresholds and exemptions
 */

import { CountryCode, TaxObligation, getCountry, getObligations } from '@/lib/registries/countries';
import { Entity, EntityLicense } from '@prisma/client';

export interface ComplianceObligation {
  id: string;
  type: string;
  country: CountryCode;
  description: string;
  dueDate: Date;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ON_DEMAND';
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'OVERDUE';
  daysUntilDue: number;
  requiresDocumentation: boolean;
  automationSupported: boolean;
}

export interface ComplianceRule {
  id: string;
  name: string;
  country: CountryCode;
  condition: (entity: Entity, params?: any) => boolean;
  obligations: string[];
  description: string;
}

/**
 * VAT Registration Rules
 * - UAE: Mandatory if turnover > AED 375,000
 * - KSA: Mandatory if turnover > SAR 1,000,000 (but can volunteer below)
 * - Egypt: Mandatory if turnover > EGP 500,000
 */
const VAT_THRESHOLDS: Record<CountryCode, number> = {
  'AE': 375000,
  'SA': 1000000,
  'EG': 500000,
};

/**
 * Helper to get entity type from metadata or legalForm
 */
function getEntityType(entity: Entity): string {
  const metadata = entity.metadata as any;
  if (metadata?.entityType) {
    return metadata.entityType;
  }
  // Derive from legalForm if metadata not available
  const legalForm = entity.legalForm?.toLowerCase() || '';
  if (legalForm.includes('individual') || legalForm.includes('sole')) {
    return 'individual';
  }
  if (legalForm.includes('partnership')) {
    return 'partnership';
  }
  if (legalForm.includes('freelancer') || legalForm.includes('contractor')) {
    return 'freelancer';
  }
  return 'company'; // Default to company
}

/**
 * Corporate Tax Rules
 * - UAE: 9% corporate tax (2023+) on taxable income > AED 375,000
 * - KSA: No corporate tax for Saudi entities, flat Zakat 2.5% applies
 * - Egypt: Graduated corporate tax (22-25%) applies to all companies
 */
export function calculateCorporateTaxObligation(entity: Entity, turnover: number): boolean {
  switch (entity.country) {
    case 'AE':
      return turnover > 375000; // AED threshold
    case 'SA':
      return false; // No corporate tax, Zakat applies instead
    case 'EG':
      const entityType = getEntityType(entity);
      return entityType === 'company' || entityType === 'partnership'; // All companies
    default:
      return false;
  }
}

/**
 * VAT Registration Obligation
 */
export function isVATRegistrationRequired(entity: Entity, annualTurnover: number): boolean {
  const threshold = VAT_THRESHOLDS[entity.country];
  return annualTurnover > threshold;
}

/**
 * ESR (Economic Substance Requirement) - UAE Only
 * Applies to companies with significant UAE-source income
 */
export function isESRRequired(entity: Entity): boolean {
  if (entity.country !== 'AE') return false;
  return entity.type === 'company' || entity.type === 'partnership';
}

/**
 * UBO (Ultimate Beneficial Owner) Register - UAE Only
 * Annual update requirement for all registered entities
 */
export function isUBORegisterRequired(entity: Entity): boolean {
  if (entity.country !== 'AE') return false;
  return true; // Required for all entities
}

/**
 * Zakat Obligation - KSA Only
 * 2.5% of net assets for Saudi entities
 */
export function isZakatRequired(entity: Entity): boolean {
  if (entity.country !== 'SA') return false;
  // Zakat is mandatory for all Saudi entities with net assets > SAR 25,000
  return true;
}

/**
 * Withholding Tax - KSA and Egypt
 * - KSA: 5% on certain service payments
 * - Egypt: Various rates (5-10%) on specific transactions
 */
export function isWHTRequired(entity: Entity, transactionType?: string): boolean {
  if (entity.country === 'SA') {
    return true; // KSA requires WHT reporting
  }
  if (entity.country === 'EG') {
    return true; // Egypt requires WHT reporting
  }
  return false;
}

/**
 * E-Invoicing Obligation
 * - KSA: Mandatory for large taxpayers (turnover > SAR 100M)
 * - Egypt: Mandatory for all B2B transactions > EGP 2,000
 */
export function isEInvoicingRequired(entity: Entity, transactionAmount?: number): boolean {
  if (entity.country === 'SA') {
    // Mandatory for large taxpayers
    return true;
  }
  if (entity.country === 'EG') {
    // Mandatory for B2B transactions > EGP 2,000
    return transactionAmount ? transactionAmount > 2000 : true;
  }
  return false;
}

/**
 * Calculate all applicable compliance obligations for an entity
 */
export function calculateObligations(
  entity: Entity,
  params?: {
    annualTurnover?: number;
    numberOfEmployees?: number;
    entityLicenses?: EntityLicense[];
  }
): ComplianceObligation[] {
  const obligations: ComplianceObligation[] = [];
  const turnover = params?.annualTurnover || 0;
  const countryData = getCountry(entity.country);

  if (!countryData) {
    return obligations;
  }

  // VAT Obligation
  if (isVATRegistrationRequired(entity, turnover)) {
    obligations.push({
      id: `vat-${entity.id}`,
      type: 'VAT',
      country: entity.country,
      description: `VAT filing for ${entity.name}`,
      dueDate: calculateNextFilingDate(entity.country, 'VAT'),
      frequency: 'MONTHLY',
      status: 'PENDING',
      daysUntilDue: Math.floor(
        (calculateNextFilingDate(entity.country, 'VAT').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      requiresDocumentation: true,
      automationSupported: false,
    });
  }

  // Corporate Tax
  if (calculateCorporateTaxObligation(entity, turnover)) {
    obligations.push({
      id: `ct-${entity.id}`,
      type: 'CORPORATE_TAX',
      country: entity.country,
      description: `Corporate tax return for ${entity.name}`,
      dueDate: calculateNextFilingDate(entity.country, 'CORPORATE_TAX'),
      frequency: 'ANNUALLY',
      status: 'PENDING',
      daysUntilDue: Math.floor(
        (calculateNextFilingDate(entity.country, 'CORPORATE_TAX').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      requiresDocumentation: true,
      automationSupported: false,
    });
  }

  // ESR (UAE only)
  if (isESRRequired(entity)) {
    obligations.push({
      id: `esr-${entity.id}`,
      type: 'ESR',
      country: entity.country,
      description: 'Economic Substance Report',
      dueDate: calculateNextFilingDate(entity.country, 'ESR'),
      frequency: 'ANNUALLY',
      status: 'PENDING',
      daysUntilDue: Math.floor(
        (calculateNextFilingDate(entity.country, 'ESR').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      requiresDocumentation: true,
      automationSupported: false,
    });
  }

  // UBO Register (UAE only)
  if (isUBORegisterRequired(entity)) {
    obligations.push({
      id: `ubo-${entity.id}`,
      type: 'UBO',
      country: entity.country,
      description: 'Ultimate Beneficial Owner Register Update',
      dueDate: calculateNextFilingDate(entity.country, 'UBO'),
      frequency: 'ANNUALLY',
      status: 'PENDING',
      daysUntilDue: Math.floor(
        (calculateNextFilingDate(entity.country, 'UBO').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      requiresDocumentation: true,
      automationSupported: false,
    });
  }

  // Zakat (KSA only)
  if (isZakatRequired(entity)) {
    obligations.push({
      id: `zakat-${entity.id}`,
      type: 'ZAKAT',
      country: entity.country,
      description: 'Zakat Return',
      dueDate: calculateNextFilingDate(entity.country, 'ZAKAT'),
      frequency: 'ANNUALLY',
      status: 'PENDING',
      daysUntilDue: Math.floor(
        (calculateNextFilingDate(entity.country, 'ZAKAT').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      requiresDocumentation: true,
      automationSupported: false,
    });
  }

  // Withholding Tax
  if (isWHTRequired(entity)) {
    obligations.push({
      id: `wht-${entity.id}`,
      type: 'WHT',
      country: entity.country,
      description: 'Withholding Tax Return',
      dueDate: calculateNextFilingDate(entity.country, 'WHT'),
      frequency: 'MONTHLY',
      status: 'PENDING',
      daysUntilDue: Math.floor(
        (calculateNextFilingDate(entity.country, 'WHT').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      requiresDocumentation: true,
      automationSupported: false,
    });
  }

  // E-Invoicing
  if (isEInvoicingRequired(entity)) {
    obligations.push({
      id: `einv-${entity.id}`,
      type: 'E_INVOICE',
      country: entity.country,
      description: 'E-Invoicing Compliance',
      dueDate: calculateNextFilingDate(entity.country, 'E_INVOICE'),
      frequency: 'ON_DEMAND',
      status: 'PENDING',
      daysUntilDue: 0,
      requiresDocumentation: false,
      automationSupported: true,
    });
  }

  return obligations;
}

/**
 * Calculate next filing date based on country and obligation type
 */
function calculateNextFilingDate(country: CountryCode, obligationType: string): Date {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  switch (country) {
    case 'AE':
      if (obligationType === 'VAT') {
        // Next month, 28th day
        const nextMonth = new Date(currentYear, currentMonth + 1, 28);
        return nextMonth > now ? nextMonth : new Date(currentYear, currentMonth + 2, 28);
      } else if (obligationType === 'ESR' || obligationType === 'UBO') {
        // 31 December of current year
        return new Date(currentYear + 1, 11, 31);
      }
      break;

    case 'SA':
      if (obligationType === 'VAT' || obligationType === 'WHT') {
        // Next month, 15th day
        const nextMonth = new Date(currentYear, currentMonth + 1, 15);
        return nextMonth > now ? nextMonth : new Date(currentYear, currentMonth + 2, 15);
      } else if (obligationType === 'ZAKAT') {
        // End of Islamic year (approximate with Hijri calendar)
        return new Date(currentYear + 1, 0, 31);
      }
      break;

    case 'EG':
      if (obligationType === 'VAT') {
        // Last day of next month
        const nextMonth = new Date(currentYear, currentMonth + 2, 0);
        return nextMonth > now ? nextMonth : new Date(currentYear, currentMonth + 3, 0);
      } else if (obligationType === 'CORPORATE_TAX') {
        // 30 April of next year
        return new Date(currentYear + 1, 3, 30);
      }
      break;
  }

  // Default: 30 days from now
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);
  return defaultDate;
}

/**
 * Check if an entity has overdue obligations
 */
export function hasOverdueObligations(obligations: ComplianceObligation[]): boolean {
  const now = new Date();
  return obligations.some(
    (ob) => ob.dueDate < now && (ob.status === 'PENDING' || ob.status === 'OVERDUE')
  );
}

/**
 * Get compliance status summary
 */
export function getComplianceStatus(obligations: ComplianceObligation[]): {
  total: number;
  pending: number;
  submitted: number;
  overdue: number;
  complianceScore: number;
} {
  const now = new Date();
  const total = obligations.length;
  const submitted = obligations.filter((ob) => ob.status === 'SUBMITTED' || ob.status === 'APPROVED').length;
  const overdue = obligations.filter((ob) => ob.status === 'OVERDUE' || (ob.dueDate < now && ob.status === 'PENDING')).length;
  const pending = total - submitted;

  const complianceScore = total > 0 ? Math.round((submitted / total) * 100) : 100;

  return { total, pending, submitted, overdue, complianceScore };
}

/**
 * Calculate compliance risk level
 */
export function calculateRiskLevel(status: ReturnType<typeof getComplianceStatus>): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (status.overdue > 0) return 'CRITICAL';
  if (status.complianceScore < 50) return 'HIGH';
  if (status.complianceScore < 80) return 'MEDIUM';
  return 'LOW';
}
