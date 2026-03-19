import { Hono } from 'hono';

// TODO: Integrate real RSS feeds (Reuters, AP, BBC, Al Jazeera, Bloomberg, TechCrunch, etc.)
// For v1 we return curated mock data that looks realistic.

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  publishedAt: number;
  imageUrl: string | null;
}

function hoursAgo(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000;
}

function generateMockNews(): NewsItem[] {
  return [
    // --- Geopolitics ---
    {
      id: 'geo-001',
      title: 'UN Security Council Convenes Emergency Session on Red Sea Shipping Disruptions',
      summary:
        'The United Nations Security Council held an emergency session to address escalating attacks on commercial shipping in the Red Sea, with members debating a multinational naval response.',
      source: 'Reuters',
      category: 'geopolitics',
      url: 'https://reuters.com/world/un-security-council-red-sea',
      publishedAt: hoursAgo(1),
      imageUrl: null,
    },
    {
      id: 'geo-002',
      title: 'EU Finalizes Landmark AI Governance Framework After Marathon Negotiations',
      summary:
        'European Union member states reached a final agreement on the AI Act implementation rules, establishing the world\'s most comprehensive regulatory framework for artificial intelligence systems.',
      source: 'BBC',
      category: 'geopolitics',
      url: 'https://bbc.com/news/eu-ai-governance-framework',
      publishedAt: hoursAgo(2),
      imageUrl: null,
    },
    {
      id: 'geo-003',
      title: 'NATO Allies Pledge Increased Defense Spending Amid Eastern European Tensions',
      summary:
        'Alliance members committed to raising defense budgets to at least 2.5% of GDP by 2028, marking a significant shift from the previous 2% target established at the Wales summit.',
      source: 'AP',
      category: 'geopolitics',
      url: 'https://apnews.com/nato-defense-spending-pledge',
      publishedAt: hoursAgo(4),
      imageUrl: null,
    },
    {
      id: 'geo-004',
      title: 'India and Japan Sign Expanded Semiconductor Partnership Agreement',
      summary:
        'India and Japan deepened their strategic technology partnership with a bilateral agreement to jointly develop advanced semiconductor fabrication facilities in Gujarat.',
      source: 'Al Jazeera',
      category: 'geopolitics',
      url: 'https://aljazeera.com/economy/india-japan-semiconductor-deal',
      publishedAt: hoursAgo(6),
      imageUrl: null,
    },
    {
      id: 'geo-005',
      title: 'Brazil Mediates New Round of Talks Between Venezuela and Opposition Leaders',
      summary:
        'Brazilian diplomats hosted a fresh round of negotiations in Brasilia aimed at resolving Venezuela\'s prolonged political crisis, with both sides expressing cautious optimism.',
      source: 'Reuters',
      category: 'geopolitics',
      url: 'https://reuters.com/world/brazil-venezuela-mediation',
      publishedAt: hoursAgo(8),
      imageUrl: null,
    },
    {
      id: 'geo-006',
      title: 'South China Sea Tensions Rise After Disputed Reef Construction Detected',
      summary:
        'Satellite imagery reveals new construction on a contested reef in the Spratly Islands, drawing sharp protests from the Philippines and Vietnam and prompting US naval patrols.',
      source: 'BBC',
      category: 'geopolitics',
      url: 'https://bbc.com/news/south-china-sea-reef-construction',
      publishedAt: hoursAgo(10),
      imageUrl: null,
    },
    {
      id: 'geo-007',
      title: 'African Union Launches Continental Free Trade Digital Payments Platform',
      summary:
        'The African Union officially launched a pan-African digital payments system designed to reduce transaction costs and accelerate intra-African trade under the AfCFTA agreement.',
      source: 'Al Jazeera',
      category: 'geopolitics',
      url: 'https://aljazeera.com/economy/african-union-digital-payments',
      publishedAt: hoursAgo(14),
      imageUrl: null,
    },

    // --- Markets ---
    {
      id: 'mkt-001',
      title: 'Federal Reserve Holds Rates Steady, Signals Possible Cut in September',
      summary:
        'The Federal Reserve kept its benchmark interest rate unchanged at 4.25-4.50%, but Chair Powell hinted that softening labor market data could warrant a rate reduction at the next meeting.',
      source: 'Bloomberg',
      category: 'markets',
      url: 'https://bloomberg.com/fed-rate-decision-march',
      publishedAt: hoursAgo(1.5),
      imageUrl: null,
    },
    {
      id: 'mkt-002',
      title: 'Nikkei 225 Hits All-Time High as Yen Weakens Past 158 Mark',
      summary:
        'Japan\'s benchmark index surged past its 1989 record, buoyed by a weaker yen boosting export earnings and strong corporate governance reforms attracting foreign capital.',
      source: 'Reuters',
      category: 'markets',
      url: 'https://reuters.com/markets/nikkei-all-time-high',
      publishedAt: hoursAgo(3),
      imageUrl: null,
    },
    {
      id: 'mkt-003',
      title: 'Bitcoin Breaks $95,000 as Spot ETF Inflows Reach Record Levels',
      summary:
        'Bitcoin crossed the $95,000 threshold for the first time, driven by sustained institutional inflows into spot Bitcoin ETFs which recorded $2.1 billion in net inflows last week alone.',
      source: 'Bloomberg',
      category: 'markets',
      url: 'https://bloomberg.com/bitcoin-95k-etf-inflows',
      publishedAt: hoursAgo(5),
      imageUrl: null,
    },
    {
      id: 'mkt-004',
      title: 'European Natural Gas Prices Spike 12% on Norwegian Pipeline Maintenance',
      summary:
        'TTF benchmark futures jumped after Equinor announced unplanned maintenance on a key North Sea pipeline, raising concerns about winter supply adequacy across the continent.',
      source: 'Reuters',
      category: 'markets',
      url: 'https://reuters.com/markets/european-gas-price-spike',
      publishedAt: hoursAgo(7),
      imageUrl: null,
    },
    {
      id: 'mkt-005',
      title: 'TSMC Reports Record Quarterly Revenue on AI Chip Demand Surge',
      summary:
        'Taiwan Semiconductor Manufacturing Company posted record revenue of $23.5 billion for Q1, beating analyst estimates as demand for advanced AI accelerator chips continues to outstrip supply.',
      source: 'Bloomberg',
      category: 'markets',
      url: 'https://bloomberg.com/tsmc-record-revenue-ai',
      publishedAt: hoursAgo(9),
      imageUrl: null,
    },
    {
      id: 'mkt-006',
      title: 'Copper Futures Hit $5.20/lb as Global Green Energy Transition Accelerates',
      summary:
        'Copper prices reached multi-year highs driven by surging demand from electric vehicle manufacturers and renewable energy infrastructure projects outpacing new mine supply.',
      source: 'AP',
      category: 'markets',
      url: 'https://apnews.com/business/copper-prices-green-energy',
      publishedAt: hoursAgo(12),
      imageUrl: null,
    },

    // --- Tech ---
    {
      id: 'tech-001',
      title: 'OpenAI Unveils GPT-5 with Real-Time Multimodal Reasoning Capabilities',
      summary:
        'OpenAI announced GPT-5, featuring native real-time video understanding, significantly improved mathematical reasoning, and the ability to execute multi-step research tasks autonomously.',
      source: 'TechCrunch',
      category: 'tech',
      url: 'https://techcrunch.com/openai-gpt5-announcement',
      publishedAt: hoursAgo(0.5),
      imageUrl: null,
    },
    {
      id: 'tech-002',
      title: 'Apple Acquires Robotics Startup for $800M to Accelerate Home Automation Push',
      summary:
        'Apple confirmed the acquisition of a San Francisco-based robotics startup specializing in household assistive robots, signaling a major expansion of its smart home strategy.',
      source: 'TechCrunch',
      category: 'tech',
      url: 'https://techcrunch.com/apple-robotics-acquisition',
      publishedAt: hoursAgo(3.5),
      imageUrl: null,
    },
    {
      id: 'tech-003',
      title: 'Critical Vulnerability Found in Popular Open-Source Auth Library Affects Millions',
      summary:
        'Security researchers disclosed a severe authentication bypass vulnerability in a widely-used open-source OAuth library, prompting emergency patches across thousands of applications.',
      source: 'BBC',
      category: 'tech',
      url: 'https://bbc.com/news/tech-auth-library-vulnerability',
      publishedAt: hoursAgo(5.5),
      imageUrl: null,
    },
    {
      id: 'tech-004',
      title: 'SpaceX Starship Completes First Operational Satellite Deployment Mission',
      summary:
        'SpaceX\'s Starship rocket successfully deployed 40 broadband satellites in a single launch, marking the vehicle\'s transition from test flights to commercial operations.',
      source: 'Reuters',
      category: 'tech',
      url: 'https://reuters.com/technology/spacex-starship-satellite-deployment',
      publishedAt: hoursAgo(8),
      imageUrl: null,
    },
    {
      id: 'tech-005',
      title: 'EU Orders Meta to Open Messaging Interoperability Under Digital Markets Act',
      summary:
        'The European Commission issued a compliance order requiring Meta to enable cross-platform messaging between WhatsApp, Messenger, and third-party apps within six months.',
      source: 'TechCrunch',
      category: 'tech',
      url: 'https://techcrunch.com/eu-meta-messaging-interoperability',
      publishedAt: hoursAgo(11),
      imageUrl: null,
    },
    {
      id: 'tech-006',
      title: 'Quantum Computing Milestone: IBM Demonstrates Error-Corrected 1000-Qubit Processor',
      summary:
        'IBM Research demonstrated the first error-corrected quantum processor exceeding 1000 logical qubits, a key threshold for practical quantum advantage in chemical simulation.',
      source: 'AP',
      category: 'tech',
      url: 'https://apnews.com/technology/ibm-quantum-1000-qubit',
      publishedAt: hoursAgo(16),
      imageUrl: null,
    },

    // --- Environment ---
    {
      id: 'env-001',
      title: 'Antarctic Ice Sheet Loses Record 300 Billion Tonnes in Single Year',
      summary:
        'New satellite data from ESA reveals the Antarctic ice sheet shed approximately 300 billion tonnes of ice over the past 12 months, exceeding previous records by 15% and accelerating sea level rise.',
      source: 'BBC',
      category: 'environment',
      url: 'https://bbc.com/news/science-antarctic-ice-loss-record',
      publishedAt: hoursAgo(2.5),
      imageUrl: null,
    },
    {
      id: 'env-002',
      title: 'Magnitude 6.4 Earthquake Strikes Off Coast of Papua New Guinea',
      summary:
        'A strong earthquake hit the New Britain region of Papua New Guinea, triggering a brief tsunami advisory for coastal communities. No casualties have been reported so far.',
      source: 'Reuters',
      category: 'environment',
      url: 'https://reuters.com/world/papua-new-guinea-earthquake',
      publishedAt: hoursAgo(4.5),
      imageUrl: null,
    },
    {
      id: 'env-003',
      title: 'Global Carbon Emissions Plateau for First Time as Renewables Surge',
      summary:
        'The International Energy Agency reports that global energy-related CO2 emissions remained flat in 2025, the first year without growth, as record solar and wind installations offset rising fossil fuel use in developing nations.',
      source: 'Al Jazeera',
      category: 'environment',
      url: 'https://aljazeera.com/news/global-carbon-emissions-plateau',
      publishedAt: hoursAgo(6.5),
      imageUrl: null,
    },
    {
      id: 'env-004',
      title: 'Amazon Deforestation Drops 40% After Brazil Strengthens Enforcement',
      summary:
        'Brazil\'s INPE space agency confirmed a 40% year-over-year decline in Amazon rainforest deforestation, attributed to intensified satellite monitoring and stiffer penalties for illegal logging.',
      source: 'AP',
      category: 'environment',
      url: 'https://apnews.com/science/amazon-deforestation-decline',
      publishedAt: hoursAgo(9.5),
      imageUrl: null,
    },
    {
      id: 'env-005',
      title: 'Typhoon Hailong Makes Landfall in Southern Japan With 180 km/h Winds',
      summary:
        'Super Typhoon Hailong struck Kyushu with sustained winds of 180 km/h, forcing the evacuation of 200,000 residents and disrupting air travel across the region.',
      source: 'Reuters',
      category: 'environment',
      url: 'https://reuters.com/world/asia/typhoon-hailong-japan-landfall',
      publishedAt: hoursAgo(13),
      imageUrl: null,
    },
    {
      id: 'env-006',
      title: 'Great Barrier Reef Shows Signs of Recovery After Two Cool Summers',
      summary:
        'Marine scientists report encouraging coral regrowth across large sections of the Great Barrier Reef, following two consecutive La Nina years that brought cooler-than-average ocean temperatures.',
      source: 'BBC',
      category: 'environment',
      url: 'https://bbc.com/news/science-great-barrier-reef-recovery',
      publishedAt: hoursAgo(18),
      imageUrl: null,
    },
    {
      id: 'env-007',
      title: 'California Wildfire Season Begins Early as Drought Conditions Persist',
      summary:
        'Cal Fire declared an early start to wildfire season as three separate fires erupted in Los Angeles and Ventura counties, fueled by Santa Ana winds and critically low humidity levels.',
      source: 'AP',
      category: 'environment',
      url: 'https://apnews.com/us-news/california-wildfire-early-season',
      publishedAt: hoursAgo(21),
      imageUrl: null,
    },
  ];
}

const mockArticles = generateMockNews();

export const news = new Hono();

news.get('/', (c) => {
  const category = c.req.query('category') || 'all';
  const limit = Math.min(parseInt(c.req.query('limit') || '30', 10), 100);

  let filtered: NewsItem[];

  if (category === 'all') {
    filtered = mockArticles;
  } else {
    filtered = mockArticles.filter((a) => a.category === category);
  }

  // Sort by most recent first
  const sorted = [...filtered].sort((a, b) => b.publishedAt - a.publishedAt);
  const articles = sorted.slice(0, limit);

  c.header('x-cache-ttl', '120000'); // Cache for 2 minutes (mock data)
  return c.json({
    articles,
    count: articles.length,
    fetchedAt: Date.now(),
  });
});
