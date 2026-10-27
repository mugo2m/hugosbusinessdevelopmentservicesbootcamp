// lib/data/bdsTopics.ts
export interface BdsTopic {
  id: string;
  topicLabel: string; // This will now be a translation key
  module: string;
  order: number;
}

export const BDS_TOPICS: BdsTopic[] = [
  { id: "why-hugos-bds", topicLabel: "why_hugos_title", module: "Introduction", order: 1 },
  { id: "bds-foundations", topicLabel: "topic_bds_foundations", module: "Module 1: BDS Foundations", order: 2 },
  { id: "need-vs-demand", topicLabel: "topic_need_vs_demand", module: "Module 1: BDS Foundations", order: 3 },
  { id: "bds-market-system", topicLabel: "topic_bds_market", module: "Module 1: BDS Foundations", order: 4 },
  { id: "delivery-methods", topicLabel: "topic_delivery_methods", module: "Module 1: BDS Foundations", order: 5 },
  { id: "coaching-vs-mentoring", topicLabel: "topic_coaching", module: "Module 1: BDS Foundations", order: 6 },
  { id: "grow-model", topicLabel: "topic_grow_model", module: "Module 1: BDS Foundations", order: 7 },
  { id: "enterprise-assessment", topicLabel: "topic_enterprise_assessment", module: "Module 2: Coaching & Assessment", order: 8 },
  { id: "root-causes", topicLabel: "topic_root_causes", module: "Module 2: Coaching & Assessment", order: 9 },
  { id: "improvement-plan", topicLabel: "topic_improvement_plan", module: "Module 2: Coaching & Assessment", order: 10 },
  { id: "assessment-traps", topicLabel: "topic_assessment_traps", module: "Module 2: Coaching & Assessment", order: 11 },
  { id: "enterprise-support-cycle", topicLabel: "topic_support_cycle", module: "Module 2: Coaching & Assessment", order: 12 },
  { id: "3s-framework", topicLabel: "topic_3s_framework", module: "Module 2: Coaching & Assessment", order: 13 },
  { id: "enterprise-structures", topicLabel: "topic_structures", module: "Module 2: Coaching & Assessment", order: 14 },
  { id: "business-model", topicLabel: "topic_business_model", module: "Module 2: Coaching & Assessment", order: 15 },
  { id: "sustainability", topicLabel: "topic_sustainability", module: "Module 2: Coaching & Assessment", order: 16 },
  { id: "market-access", topicLabel: "topic_market_access", module: "Module 3: Market Access", order: 17 },
  { id: "market-readiness", topicLabel: "topic_market_readiness", module: "Module 3: Market Access", order: 18 },
  { id: "market-outcomes", topicLabel: "topic_market_outcomes", module: "Module 3: Market Access", order: 19 },
  { id: "inclusive-contract-farming", topicLabel: "topic_icf", module: "Module 3: Market Access", order: 20 },
  { id: "icf-process", topicLabel: "topic_icf_process", module: "Module 3: Market Access", order: 21 },
  { id: "access-to-finance", topicLabel: "topic_access_finance", module: "Module 4: Access to Finance", order: 22 },
  { id: "sources-of-funding", topicLabel: "topic_sources_funding", module: "Module 4: Access to Finance", order: 23 },
  { id: "finance-readiness", topicLabel: "topic_finance_readiness", module: "Module 4: Access to Finance", order: 24 },
  { id: "funder-categories", topicLabel: "topic_funder_categories", module: "Module 4: Access to Finance", order: 25 },
  { id: "bds-case-study", topicLabel: "topic_case_study", module: "Module 5: Case Studies", order: 26 },
];

export function getTopicById(id: string): BdsTopic | undefined {
  return BDS_TOPICS.find((t) => t.id === id);
}

