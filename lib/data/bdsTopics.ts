// lib/data/bdsTopics.ts
export interface BdsTopic {
  id: string;
  topicLabel: string;
  module: string;
  order: number;
}

export const BDS_TOPICS: BdsTopic[] = [
  { id: "why-hugos-bds", topicLabel: "why_hugos_title", module: "module_introduction", order: 1 },
  { id: "bds-foundations", topicLabel: "topic_bds_foundations", module: "module_1_foundations", order: 2 },
  { id: "need-vs-demand", topicLabel: "topic_need_vs_demand", module: "module_1_foundations", order: 3 },
  { id: "bds-market-system", topicLabel: "topic_bds_market", module: "module_1_foundations", order: 4 },
  { id: "delivery-methods", topicLabel: "topic_delivery_methods", module: "module_1_foundations", order: 5 },
  { id: "coaching-vs-mentoring", topicLabel: "topic_coaching", module: "module_1_foundations", order: 6 },
  { id: "grow-model", topicLabel: "topic_grow_model", module: "module_1_foundations", order: 7 },
  { id: "enterprise-assessment", topicLabel: "topic_enterprise_assessment", module: "module_2_coaching", order: 8 },
  { id: "root-causes", topicLabel: "topic_root_causes", module: "module_2_coaching", order: 9 },
  { id: "improvement-plan", topicLabel: "topic_improvement_plan", module: "module_2_coaching", order: 10 },
  { id: "assessment-traps", topicLabel: "topic_assessment_traps", module: "module_2_coaching", order: 11 },
  { id: "enterprise-support-cycle", topicLabel: "topic_support_cycle", module: "module_2_coaching", order: 12 },
  { id: "3s-framework", topicLabel: "topic_3s_framework", module: "module_2_coaching", order: 13 },
  { id: "enterprise-structures", topicLabel: "topic_structures", module: "module_2_coaching", order: 14 },
  { id: "business-model", topicLabel: "topic_business_model", module: "module_2_coaching", order: 15 },
  { id: "sustainability", topicLabel: "topic_sustainability", module: "module_2_coaching", order: 16 },
  { id: "market-access", topicLabel: "topic_market_access", module: "module_3_market", order: 17 },
  { id: "market-readiness", topicLabel: "topic_market_readiness", module: "module_3_market", order: 18 },
  { id: "market-outcomes", topicLabel: "topic_market_outcomes", module: "module_3_market", order: 19 },
  { id: "inclusive-contract-farming", topicLabel: "topic_icf", module: "module_3_market", order: 20 },
  { id: "icf-process", topicLabel: "topic_icf_process", module: "module_3_market", order: 21 },
  { id: "access-to-finance", topicLabel: "topic_access_finance", module: "module_4_finance", order: 22 },
  { id: "sources-of-funding", topicLabel: "topic_sources_funding", module: "module_4_finance", order: 23 },
  { id: "finance-readiness", topicLabel: "topic_finance_readiness", module: "module_4_finance", order: 24 },
  { id: "funder-categories", topicLabel: "topic_funder_categories", module: "module_4_finance", order: 25 },
  { id: "bds-case-study", topicLabel: "topic_case_study", module: "module_5_cases", order: 26 },
];

export function getTopicById(id: string): BdsTopic | undefined {
  return BDS_TOPICS.find((t) => t.id === id);
}