// lib/data/funders.ts

export interface Funder {
  id: string;
  name: string;
  instrument: string[];
  ticketSize: string; // 'Micro', 'Small', 'Medium', 'Large'
  minUSD: number;
  maxUSD: number;
  geography: string[];
  sector: string[];
  gender: string[]; // 'Women', 'Youth', 'General'
  website: string;
  notes: string;
}

export const FUNDERS: Funder[] = [
  {
    id: "agdevco-ventures",
    name: "AgDevCo Ventures",
    instrument: ["Debt", "Mezzanine"],
    ticketSize: "Large",
    minUSD: 1000000,
    maxUSD: 3000000,
    geography: ["East Africa", "Kenya"],
    sector: ["Agribusiness"],
    gender: ["General"],
    website: "https://agdevco.com/ventures/our-approach/",
    notes: "Early-stage agribusiness; typically 3+ years operating and revenue above USD 1m."
  },
  {
    id: "agrifrontier",
    name: "Agri Frontier Growth Fund",
    instrument: ["Debt", "Mezzanine"],
    ticketSize: "Medium",
    minUSD: 150000,
    maxUSD: 1000000,
    geography: ["East Africa", "Kenya"],
    sector: ["Agribusiness"],
    gender: ["General"],
    website: "https://www.agrifrontier.com/growth-fund/",
    notes: "Growth-stage agri-SMEs, working capital and capex."
  },
  {
    id: "acumen-araf",
    name: "Acumen Resilient Agriculture Fund II",
    instrument: ["Equity", "Mezzanine"],
    ticketSize: "Large",
    minUSD: 500000,
    maxUSD: 5000000,
    geography: ["East Africa", "Pan-African", "Kenya"],
    sector: ["Climate", "Agribusiness"],
    gender: ["General"],
    website: "https://www.fasafund.com/project/araf-ii/",
    notes: "Climate-resilient agri-food SMEs. Initial tickets average about USD 3m."
  },
  {
    id: "kenya-climate",
    name: "Kenya Climate Ventures",
    instrument: ["Equity", "Debt"],
    ticketSize: "Medium",
    minUSD: 50000,
    maxUSD: 1000000,
    geography: ["Kenya"],
    sector: ["Climate", "Agribusiness"],
    gender: ["General"],
    website: "https://kenyaclimateventures.com/",
    notes: "Strong thematic fit for climate-related agribusiness, water, and forestry."
  },
  {
    id: "root-capital",
    name: "Root Capital",
    instrument: ["Debt"],
    ticketSize: "Medium",
    minUSD: 200000,
    maxUSD: 2000000,
    geography: ["Pan-African", "Kenya"],
    sector: ["Smallholder", "Agribusiness"],
    gender: ["General"],
    website: "https://rootcapital.org/",
    notes: "Agricultural businesses and farmer organisations."
  },
  {
    id: "shona-capital",
    name: "SHONA Capital",
    instrument: ["Debt"],
    ticketSize: "Small",
    minUSD: 50000,
    maxUSD: 250000,
    geography: ["East Africa", "Kenya"],
    sector: ["Food", "Agribusiness"],
    gender: ["General"],
    website: "https://shonacapital.co/what-we-offer/",
    notes: "Locally led social enterprises, food-system innovators. At least USD 10,000 revenue in prior 12 months."
  },
  {
    id: "samawati-fund",
    name: "Samawati Fund (AECF/Rafiki)",
    instrument: ["Debt"],
    ticketSize: "Micro",
    minUSD: 1000,
    maxUSD: 15000,
    geography: ["Kenya"],
    sector: ["Food", "Agribusiness"],
    gender: ["Women"],
    website: "https://www.aecfafrica.org/",
    notes: "Women-owned micro-enterprises in Kenya's blue economy (Coastal/Lake Victoria)."
  },
  {
    id: "inua-capital",
    name: "Inua Capital",
    instrument: ["Equity", "Mezzanine"],
    ticketSize: "Medium",
    minUSD: 250000,
    maxUSD: 2000000,
    geography: ["East Africa", "Kenya"],
    sector: ["Agribusiness"],
    gender: ["Women"],
    website: "https://inuacapital.com/",
    notes: "Women-led or gender-inclusive SMEs, including agribusiness."
  },
  {
    id: "aecf-grants",
    name: "African Enterprise Challenge Fund",
    instrument: ["Grant"],
    ticketSize: "Medium",
    minUSD: 100000,
    maxUSD: 1000000,
    geography: ["Pan-African", "Kenya"],
    sector: ["Agribusiness", "Climate"],
    gender: ["General", "Youth"],
    website: "https://www.aecfafrica.org/",
    notes: "Grants, concessional loans, repayable grants depending on programme. Monitor open calls."
  }
];