// lib/bdsRecommendationEngine.ts

export interface LessonSection {
  id: string;
  title: string;
  type: "text" | "example" | "quiz";
  content?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
}

interface LessonContent {
  sections: LessonSection[];
}

interface EngineInput {
  topic: string;
  language?: string;
  learnerName?: string;
}

interface EngineOutput {
  lessonSections: LessonSection[];
  topicLabel: string;
  module: string;
  structuredFinancialAdvice: { key: string; params: { content: string } };
}

/**
 * All lesson content is stored as i18n KEY STRINGS.
 * The client (Agent.tsx) translates them via safeT() based on the current language.
 * This enables live language switching on the same stored session.
 */
const LESSONS: Record<string, LessonContent> = {

  "why-hugos-bds": {
    sections: [
      { id: "intro", title: "lesson_why_hugos_s1_title", type: "text", content: "lesson_why_hugos_s1_content" },
      {
        id: "quiz1", title: "lesson_why_hugos_quiz1_title", type: "quiz",
        question: "lesson_why_hugos_quiz1_question",
        options: [
          "lesson_why_hugos_quiz1_opt_0",
          "lesson_why_hugos_quiz1_opt_1",
          "lesson_why_hugos_quiz1_opt_2",
          "lesson_why_hugos_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "bds-foundations": {
    sections: [
      { id: "s1", title: "lesson_bds_foundations_s1_title", type: "text", content: "lesson_bds_foundations_s1_content" },
      { id: "s2", title: "lesson_bds_foundations_s2_title", type: "text", content: "lesson_bds_foundations_s2_content" },
      { id: "s3", title: "lesson_bds_foundations_s3_title", type: "text", content: "lesson_bds_foundations_s3_content" },
      { id: "s4", title: "lesson_bds_foundations_s4_title", type: "text", content: "lesson_bds_foundations_s4_content" },
      {
        id: "quiz1", title: "lesson_bds_foundations_quiz1_title", type: "quiz",
        question: "lesson_bds_foundations_quiz1_question",
        options: [
          "lesson_bds_foundations_quiz1_opt_0",
          "lesson_bds_foundations_quiz1_opt_1",
          "lesson_bds_foundations_quiz1_opt_2",
          "lesson_bds_foundations_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "need-vs-demand": {
    sections: [
      { id: "s1", title: "lesson_need_demand_s1_title", type: "text", content: "lesson_need_demand_s1_content" },
      { id: "s2", title: "lesson_need_demand_s2_title", type: "text", content: "lesson_need_demand_s2_content" },
      { id: "s3", title: "lesson_need_demand_s3_title", type: "text", content: "lesson_need_demand_s3_content" },
      { id: "s4", title: "lesson_need_demand_s4_title", type: "text", content: "lesson_need_demand_s4_content" },
      {
        id: "quiz1", title: "lesson_need_demand_quiz1_title", type: "quiz",
        question: "lesson_need_demand_quiz1_question",
        options: [
          "lesson_need_demand_quiz1_opt_0",
          "lesson_need_demand_quiz1_opt_1",
          "lesson_need_demand_quiz1_opt_2",
          "lesson_need_demand_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "bds-market-system": {
    sections: [
      { id: "s1", title: "lesson_bds_market_s1_title", type: "text", content: "lesson_bds_market_s1_content" },
      { id: "s2", title: "lesson_bds_market_s2_title", type: "text", content: "lesson_bds_market_s2_content" },
      { id: "s3", title: "lesson_bds_market_s3_title", type: "text", content: "lesson_bds_market_s3_content" },
      { id: "s4", title: "lesson_bds_market_s4_title", type: "text", content: "lesson_bds_market_s4_content" },
      { id: "s5", title: "lesson_bds_market_s5_title", type: "text", content: "lesson_bds_market_s5_content" },
      {
        id: "quiz1", title: "lesson_bds_market_quiz1_title", type: "quiz",
        question: "lesson_bds_market_quiz1_question",
        options: [
          "lesson_bds_market_quiz1_opt_0",
          "lesson_bds_market_quiz1_opt_1",
          "lesson_bds_market_quiz1_opt_2",
          "lesson_bds_market_quiz1_opt_3",
        ],
        correctIndex: 2,
      },
    ],
  },

  "delivery-methods": {
    sections: [
      { id: "s1", title: "lesson_delivery_s1_title", type: "text", content: "lesson_delivery_s1_content" },
      { id: "s2", title: "lesson_delivery_s2_title", type: "text", content: "lesson_delivery_s2_content" },
      { id: "s3", title: "lesson_delivery_s3_title", type: "text", content: "lesson_delivery_s3_content" },
      { id: "s4", title: "lesson_delivery_s4_title", type: "text", content: "lesson_delivery_s4_content" },
      { id: "s5", title: "lesson_delivery_s5_title", type: "text", content: "lesson_delivery_s5_content" },
      {
        id: "quiz1", title: "lesson_delivery_quiz1_title", type: "quiz",
        question: "lesson_delivery_quiz1_question",
        options: [
          "lesson_delivery_quiz1_opt_0",
          "lesson_delivery_quiz1_opt_1",
          "lesson_delivery_quiz1_opt_2",
          "lesson_delivery_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "coaching-vs-mentoring": {
    sections: [
      { id: "s1", title: "lesson_coaching_s1_title", type: "text", content: "lesson_coaching_s1_content" },
      { id: "s2", title: "lesson_coaching_s2_title", type: "text", content: "lesson_coaching_s2_content" },
      { id: "s3", title: "lesson_coaching_s3_title", type: "text", content: "lesson_coaching_s3_content" },
      {
        id: "quiz1", title: "lesson_coaching_quiz1_title", type: "quiz",
        question: "lesson_coaching_quiz1_question",
        options: [
          "lesson_coaching_quiz1_opt_0",
          "lesson_coaching_quiz1_opt_1",
          "lesson_coaching_quiz1_opt_2",
          "lesson_coaching_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "grow-model": {
    sections: [
      { id: "s1", title: "lesson_grow_s1_title", type: "text", content: "lesson_grow_s1_content" },
      { id: "s2", title: "lesson_grow_s2_title", type: "text", content: "lesson_grow_s2_content" },
      { id: "s3", title: "lesson_grow_s3_title", type: "text", content: "lesson_grow_s3_content" },
      { id: "s4", title: "lesson_grow_s4_title", type: "text", content: "lesson_grow_s4_content" },
      { id: "s5", title: "lesson_grow_s5_title", type: "text", content: "lesson_grow_s5_content" },
      {
        id: "quiz1", title: "lesson_grow_quiz1_title", type: "quiz",
        question: "lesson_grow_quiz1_question",
        options: [
          "lesson_grow_quiz1_opt_0",
          "lesson_grow_quiz1_opt_1",
          "lesson_grow_quiz1_opt_2",
          "lesson_grow_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "enterprise-assessment": {
    sections: [
      { id: "s1", title: "lesson_assessment_s1_title", type: "text", content: "lesson_assessment_s1_content" },
      { id: "s2", title: "lesson_assessment_s2_title", type: "text", content: "lesson_assessment_s2_content" },
      { id: "s3", title: "lesson_assessment_s3_title", type: "text", content: "lesson_assessment_s3_content" },
      { id: "s4", title: "lesson_assessment_s4_title", type: "text", content: "lesson_assessment_s4_content" },
      {
        id: "quiz1", title: "lesson_assessment_quiz1_title", type: "quiz",
        question: "lesson_assessment_quiz1_question",
        options: [
          "lesson_assessment_quiz1_opt_0",
          "lesson_assessment_quiz1_opt_1",
          "lesson_assessment_quiz1_opt_2",
          "lesson_assessment_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "root-causes": {
    sections: [
      { id: "s1", title: "lesson_root_causes_s1_title", type: "text", content: "lesson_root_causes_s1_content" },
      { id: "s2", title: "lesson_root_causes_s2_title", type: "text", content: "lesson_root_causes_s2_content" },
      {
        id: "quiz1", title: "lesson_root_causes_quiz1_title", type: "quiz",
        question: "lesson_root_causes_quiz1_question",
        options: [
          "lesson_root_causes_quiz1_opt_0",
          "lesson_root_causes_quiz1_opt_1",
          "lesson_root_causes_quiz1_opt_2",
          "lesson_root_causes_quiz1_opt_3",
        ],
        correctIndex: 2,
      },
    ],
  },

  "improvement-plan": {
    sections: [
      { id: "s1", title: "lesson_plan_s1_title", type: "text", content: "lesson_plan_s1_content" },
      { id: "s2", title: "lesson_plan_s2_title", type: "text", content: "lesson_plan_s2_content" },
      {
        id: "quiz1", title: "lesson_plan_quiz1_title", type: "quiz",
        question: "lesson_plan_quiz1_question",
        options: [
          "lesson_plan_quiz1_opt_0",
          "lesson_plan_quiz1_opt_1",
          "lesson_plan_quiz1_opt_2",
          "lesson_plan_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "assessment-traps": {
    sections: [
      { id: "s1", title: "lesson_traps_s1_title", type: "text", content: "lesson_traps_s1_content" },
      { id: "s2", title: "lesson_traps_s2_title", type: "text", content: "lesson_traps_s2_content" },
      {
        id: "quiz1", title: "lesson_traps_quiz1_title", type: "quiz",
        question: "lesson_traps_quiz1_question",
        options: [
          "lesson_traps_quiz1_opt_0",
          "lesson_traps_quiz1_opt_1",
          "lesson_traps_quiz1_opt_2",
          "lesson_traps_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "enterprise-support-cycle": {
    sections: [
      { id: "s1", title: "lesson_support_cycle_s1_title", type: "text", content: "lesson_support_cycle_s1_content" },
      {
        id: "quiz1", title: "lesson_support_cycle_quiz1_title", type: "quiz",
        question: "lesson_support_cycle_quiz1_question",
        options: [
          "lesson_support_cycle_quiz1_opt_0",
          "lesson_support_cycle_quiz1_opt_1",
          "lesson_support_cycle_quiz1_opt_2",
          "lesson_support_cycle_quiz1_opt_3",
        ],
        correctIndex: 2,
      },
    ],
  },

  "3s-framework": {
    sections: [
      { id: "s1", title: "lesson_3s_s1_title", type: "text", content: "lesson_3s_s1_content" },
      {
        id: "quiz1", title: "lesson_3s_quiz1_title", type: "quiz",
        question: "lesson_3s_quiz1_question",
        options: [
          "lesson_3s_quiz1_opt_0",
          "lesson_3s_quiz1_opt_1",
          "lesson_3s_quiz1_opt_2",
          "lesson_3s_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "enterprise-structures": {
    sections: [
      { id: "s1", title: "lesson_structures_s1_title", type: "text", content: "lesson_structures_s1_content" },
      { id: "s2", title: "lesson_structures_s2_title", type: "text", content: "lesson_structures_s2_content" },
      { id: "s3", title: "lesson_structures_s3_title", type: "text", content: "lesson_structures_s3_content" },
      {
        id: "quiz1", title: "lesson_structures_quiz1_title", type: "quiz",
        question: "lesson_structures_quiz1_question",
        options: [
          "lesson_structures_quiz1_opt_0",
          "lesson_structures_quiz1_opt_1",
          "lesson_structures_quiz1_opt_2",
          "lesson_structures_quiz1_opt_3",
        ],
        correctIndex: 2,
      },
    ],
  },

  "business-model": {
    sections: [
      { id: "s1", title: "lesson_business_model_s1_title", type: "text", content: "lesson_business_model_s1_content" },
      { id: "s2", title: "lesson_business_model_s2_title", type: "text", content: "lesson_business_model_s2_content" },
      { id: "s3", title: "lesson_business_model_s3_title", type: "text", content: "lesson_business_model_s3_content" },
      {
        id: "quiz1", title: "lesson_business_model_quiz1_title", type: "quiz",
        question: "lesson_business_model_quiz1_question",
        options: [
          "lesson_business_model_quiz1_opt_0",
          "lesson_business_model_quiz1_opt_1",
          "lesson_business_model_quiz1_opt_2",
          "lesson_business_model_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "sustainability": {
    sections: [
      { id: "s1", title: "lesson_sustainability_s1_title", type: "text", content: "lesson_sustainability_s1_content" },
      { id: "s2", title: "lesson_sustainability_s2_title", type: "text", content: "lesson_sustainability_s2_content" },
      { id: "s3", title: "lesson_sustainability_s3_title", type: "text", content: "lesson_sustainability_s3_content" },
      {
        id: "quiz1", title: "lesson_sustainability_quiz1_title", type: "quiz",
        question: "lesson_sustainability_quiz1_question",
        options: [
          "lesson_sustainability_quiz1_opt_0",
          "lesson_sustainability_quiz1_opt_1",
          "lesson_sustainability_quiz1_opt_2",
          "lesson_sustainability_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "market-access": {
    sections: [
      { id: "s1", title: "lesson_market_access_s1_title", type: "text", content: "lesson_market_access_s1_content" },
      { id: "s2", title: "lesson_market_access_s2_title", type: "text", content: "lesson_market_access_s2_content" },
      {
        id: "quiz1", title: "lesson_market_access_quiz1_title", type: "quiz",
        question: "lesson_market_access_quiz1_question",
        options: [
          "lesson_market_access_quiz1_opt_0",
          "lesson_market_access_quiz1_opt_1",
          "lesson_market_access_quiz1_opt_2",
          "lesson_market_access_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "market-readiness": {
    sections: [
      { id: "s1", title: "lesson_readiness_s1_title", type: "text", content: "lesson_readiness_s1_content" },
      { id: "s2", title: "lesson_readiness_s2_title", type: "text", content: "lesson_readiness_s2_content" },
      { id: "s3", title: "lesson_readiness_s3_title", type: "text", content: "lesson_readiness_s3_content" },
      {
        id: "quiz1", title: "lesson_readiness_quiz1_title", type: "quiz",
        question: "lesson_readiness_quiz1_question",
        options: [
          "lesson_readiness_quiz1_opt_0",
          "lesson_readiness_quiz1_opt_1",
          "lesson_readiness_quiz1_opt_2",
          "lesson_readiness_quiz1_opt_3",
        ],
        correctIndex: 0,
      },
    ],
  },

  "market-outcomes": {
    sections: [
      { id: "s1", title: "lesson_outcomes_s1_title", type: "text", content: "lesson_outcomes_s1_content" },
      { id: "s2", title: "lesson_outcomes_s2_title", type: "text", content: "lesson_outcomes_s2_content" },
      { id: "s3", title: "lesson_outcomes_s3_title", type: "text", content: "lesson_outcomes_s3_content" },
      { id: "s4", title: "lesson_outcomes_s4_title", type: "text", content: "lesson_outcomes_s4_content" },
      {
        id: "quiz1", title: "lesson_outcomes_quiz1_title", type: "quiz",
        question: "lesson_outcomes_quiz1_question",
        options: [
          "lesson_outcomes_quiz1_opt_0",
          "lesson_outcomes_quiz1_opt_1",
          "lesson_outcomes_quiz1_opt_2",
          "lesson_outcomes_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "inclusive-contract-farming": {
    sections: [
      { id: "s1", title: "lesson_icf_s1_title", type: "text", content: "lesson_icf_s1_content" },
      { id: "s2", title: "lesson_icf_s2_title", type: "text", content: "lesson_icf_s2_content" },
      {
        id: "quiz1", title: "lesson_icf_quiz1_title", type: "quiz",
        question: "lesson_icf_quiz1_question",
        options: [
          "lesson_icf_quiz1_opt_0",
          "lesson_icf_quiz1_opt_1",
          "lesson_icf_quiz1_opt_2",
          "lesson_icf_quiz1_opt_3",
        ],
        correctIndex: 2,
      },
    ],
  },

  "icf-process": {
    sections: [
      { id: "s1", title: "lesson_icf_process_s1_title", type: "text", content: "lesson_icf_process_s1_content" },
      { id: "s2", title: "lesson_icf_process_s2_title", type: "text", content: "lesson_icf_process_s2_content" },
      { id: "s3", title: "lesson_icf_process_s3_title", type: "text", content: "lesson_icf_process_s3_content" },
      { id: "s4", title: "lesson_icf_process_s4_title", type: "text", content: "lesson_icf_process_s4_content" },
      {
        id: "quiz1", title: "lesson_icf_process_quiz1_title", type: "quiz",
        question: "lesson_icf_process_quiz1_question",
        options: [
          "lesson_icf_process_quiz1_opt_0",
          "lesson_icf_process_quiz1_opt_1",
          "lesson_icf_process_quiz1_opt_2",
          "lesson_icf_process_quiz1_opt_3",
        ],
        correctIndex: 2,
      },
    ],
  },

  "access-to-finance": {
    sections: [
      { id: "s1", title: "lesson_atf_s1_title", type: "text", content: "lesson_atf_s1_content" },
      { id: "s2", title: "lesson_atf_s2_title", type: "text", content: "lesson_atf_s2_content" },
      { id: "s3", title: "lesson_atf_s3_title", type: "text", content: "lesson_atf_s3_content" },
      { id: "s4", title: "lesson_atf_s4_title", type: "text", content: "lesson_atf_s4_content" },
      {
        id: "quiz1", title: "lesson_atf_quiz1_title", type: "quiz",
        question: "lesson_atf_quiz1_question",
        options: [
          "lesson_atf_quiz1_opt_0",
          "lesson_atf_quiz1_opt_1",
          "lesson_atf_quiz1_opt_2",
          "lesson_atf_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "sources-of-funding": {
    sections: [
      { id: "s1", title: "lesson_funding_s1_title", type: "text", content: "lesson_funding_s1_content" },
      { id: "s2", title: "lesson_funding_s2_title", type: "text", content: "lesson_funding_s2_content" },
      { id: "s3", title: "lesson_funding_s3_title", type: "text", content: "lesson_funding_s3_content" },
      { id: "s4", title: "lesson_funding_s4_title", type: "text", content: "lesson_funding_s4_content" },
      {
        id: "quiz1", title: "lesson_funding_quiz1_title", type: "quiz",
        question: "lesson_funding_quiz1_question",
        options: [
          "lesson_funding_quiz1_opt_0",
          "lesson_funding_quiz1_opt_1",
          "lesson_funding_quiz1_opt_2",
          "lesson_funding_quiz1_opt_3",
        ],
        correctIndex: 2,
      },
    ],
  },

  "finance-readiness": {
    sections: [
      { id: "s1", title: "lesson_fin_readiness_s1_title", type: "text", content: "lesson_fin_readiness_s1_content" },
      { id: "s2", title: "lesson_fin_readiness_s2_title", type: "text", content: "lesson_fin_readiness_s2_content" },
      { id: "s3", title: "lesson_fin_readiness_s3_title", type: "text", content: "lesson_fin_readiness_s3_content" },
      { id: "s4", title: "lesson_fin_readiness_s4_title", type: "text", content: "lesson_fin_readiness_s4_content" },
      {
        id: "quiz1", title: "lesson_fin_readiness_quiz1_title", type: "quiz",
        question: "lesson_fin_readiness_quiz1_question",
        options: [
          "lesson_fin_readiness_quiz1_opt_0",
          "lesson_fin_readiness_quiz1_opt_1",
          "lesson_fin_readiness_quiz1_opt_2",
          "lesson_fin_readiness_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },

  "funder-categories": {
    sections: [
      { id: "s1", title: "lesson_funders_s1_title", type: "text", content: "lesson_funders_s1_content" },
      { id: "s2", title: "lesson_funders_s2_title", type: "text", content: "lesson_funders_s2_content" },
      {
        id: "quiz1", title: "lesson_funders_quiz1_title", type: "quiz",
        question: "lesson_funders_quiz1_question",
        options: [
          "lesson_funders_quiz1_opt_0",
          "lesson_funders_quiz1_opt_1",
          "lesson_funders_quiz1_opt_2",
          "lesson_funders_quiz1_opt_3",
        ],
        correctIndex: 2,
      },
    ],
  },

  "bds-case-study": {
    sections: [
      { id: "s1", title: "lesson_case_study_s1_title", type: "text", content: "lesson_case_study_s1_content" },
      { id: "s2", title: "lesson_case_study_s2_title", type: "text", content: "lesson_case_study_s2_content" },
      { id: "s3", title: "lesson_case_study_s3_title", type: "text", content: "lesson_case_study_s3_content" },
      {
        id: "quiz1", title: "lesson_case_study_quiz1_title", type: "quiz",
        question: "lesson_case_study_quiz1_question",
        options: [
          "lesson_case_study_quiz1_opt_0",
          "lesson_case_study_quiz1_opt_1",
          "lesson_case_study_quiz1_opt_2",
          "lesson_case_study_quiz1_opt_3",
        ],
        correctIndex: 1,
      },
    ],
  },
};

export async function generateBdsLesson(input: EngineInput): Promise<EngineOutput> {
  const { topic, language = "en", learnerName = "Learner" } = input;

  const lesson = LESSONS[topic];
  if (!lesson) {
    throw new Error(`Lesson not found: ${topic}`);
  }

  const { getTopicById } = await import("./data/bdsTopics");
  const topicData = getTopicById(topic);

  const sections = lesson.sections.map((section) => {
    if (section.type === "quiz" && section.options && section.correctIndex !== undefined) {
      const shuffled = section.options.map((opt, i) => ({
        opt,
        isCorrect: i === section.correctIndex,
      }));
      const seed = topic.length + section.title.length;
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = (seed * (i + 1)) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const newOptions = shuffled.map((s) => s.opt);
      const newCorrect = shuffled.findIndex((s) => s.isCorrect);
      return { ...section, options: newOptions, correctIndex: newCorrect };
    }
    return section;
  });

  const structuredFinancialAdvice = {
    key: "lesson_advice",
    params: { content: "lesson_advice_content" },
  };

  console.log(
    `✅ [BDS Engine] Generated "${topic}" (lang=${language}, learner=${learnerName}) — ${sections.length} sections`
  );

  return {
    lessonSections: sections,
    topicLabel: topicData?.topicLabel || "Lesson",
    module: topicData?.module || "General",
    structuredFinancialAdvice,
  };
}