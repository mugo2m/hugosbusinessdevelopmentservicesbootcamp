// scripts/seed-bds-lessons.ts
import { db } from "@/firebase/admin";

const lessons = [
  {
    id: "lesson-market-research-intro",
    topicId: "market-research",
    topicLabel: "What Is Market Research?",
    module: "Module 2 — Market Research",
    order: 1,
    sections: [
      {
        id: "intro",
        title: "Introduction",
        type: "text",
        content: "Market research means finding out who your customers are, what they want, and how much they are willing to pay. It helps you avoid guessing and build a business that people actually need.",
      },
      {
        id: "example1",
        title: "Real-World Example",
        type: "example",
        content: "A juice vendor in Nairobi asked 50 market shoppers what juices they buy and at what price. She discovered mango-passion sold for 100 shillings while plain orange sold for 60. She launched a mango-passion blend and doubled daily sales.",
      },
      {
        id: "quiz1",
        title: "Quick Check",
        type: "quiz",
        question: "Which of these is NOT a way to do market research?",
        options: ["Customer surveys", "Visiting competitors", "Guessing what people want", "Focus group discussions"],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "lesson-business-plan-basics",
    topicId: "business-plan",
    topicLabel: "Writing a Simple Business Plan",
    module: "Module 3 — Business Planning",
    order: 2,
    sections: [
      {
        id: "intro",
        title: "Why Write a Plan?",
        type: "text",
        content: "A business plan is a written map of where you are going and how you will get there. It keeps you focused, helps you get loans, and lets you spot problems before they cost money.",
      },
      {
        id: "quiz1",
        title: "Quick Check",
        type: "quiz",
        question: "What is the main purpose of a business plan?",
        options: ["To look impressive", "To guide decisions and access finance", "To satisfy the government", "To spend money"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "lesson-pricing-right",
    topicId: "pricing",
    topicLabel: "Pricing Your Product Right",
    module: "Module 2 — Market Research",
    order: 3,
    sections: [
      {
        id: "intro",
        title: "Pricing Basics",
        type: "text",
        content: "Your price must cover costs and leave profit, but also match what customers will pay. Price too high and you lose customers; too low and you lose money.",
      },
      {
        id: "quiz1",
        title: "Quick Check",
        type: "quiz",
        question: "If your cost is 80 shillings and you sell at 100, what is your profit per unit?",
        options: ["80 shillings", "100 shillings", "20 shillings", "0 shillings"],
        correctIndex: 2,
      },
    ],
  },
];

(async () => {
  for (const lesson of lessons) {
    const { id, ...data } = lesson;
    await db.collection("bds_lessons").doc(id).set(data);
    console.log(`✅ Seeded: ${lesson.topicLabel}`);
  }
  console.log("🎉 Done seeding bds_lessons");
  process.exit(0);
})();