// Shared by / (landing), /embeddings/ (map) and /explore/ (street view).
// Coordinates are a 2D multidimensional-scaling projection of hand-tagged
// project similarity (method + subject), relaxed only so labels don't collide.
//
// kind: "project" | "wip" | "writing" | "experience"
//   experience entries describe a role and what was done there, not an artifact;
//   `hub:true` marks the employer entry, `org` + `part_of` tie the workstreams to it.
// note: why there is nothing to open (IP, confidentiality, private team repo).

window.CLUSTERS = {
  energy:  {name:"energy",           color:"#c98500"},
  stats:   {name:"statistics",       color:"#3987e5"},
  ml:      {name:"machine learning", color:"#d55181"},
  math:    {name:"mathematics",      color:"#199e70"},
  dataeng: {name:"data engineering", color:"#d95926"},
  product: {name:"products",         color:"#9085e9"},
};

const BATU_NOTE = "No code here: it is Batu's IP and I no longer work there. Everything above is described from memory, at a high level.";
const MANTIS_NOTE = "Confidential: Mantis is a live startup, so this stays at the level of the ideas.";

window.PROJECTS = [
  // ---- energy ----
  {
    id:"batu", label:"batu energy", cluster:"energy", kind:"experience", hub:true, org:"Batu Energy", x:830, y:365,
    title:"Batu Energy",
    meta:"data science intern 2024 – 2025 · junior data scientist 2025 – 2026",
    body:[
      "Batu Energy is an energy-management platform for solar providers and multi-site enterprises in Mexico. I joined as a data science intern in June 2024 and left as a junior data scientist in 2026, by which point I was the top contributor to the codebase: around 630 commits across the public API, the CFE bill and tariff domain, the platform's backend routes and the data pipelines underneath, serving 50-plus clients and more than 8,000 sites.",
      "The four dots around this one are the work itself: the bill engine, the building monitors, the solar pipelines and the inverter anomaly detector. Along the way I also set up the engineering team's agentic tooling (MCP servers, skills, CI workflows) so a small team could ship with persistent context."
    ],
    links:[{label:"batuenergy.com", href:"https://batuenergy.com"}],
    note:BATU_NOTE
  },
  {
    id:"cfe-bills", label:"cfe bill engine", cluster:"energy", kind:"experience", org:"Batu Energy", part_of:"batu", x:874, y:303,
    title:"Turning CFE bills into a data domain",
    meta:"Batu Energy · 2024 – 2026 · core contributor",
    body:[
      "At Batu Energy, an energy-management platform for solar providers and multi-site enterprises in Mexico, I was a core contributor to the backend. My home turf was the domain that turns CFE electricity bills into structured data: automated collection, parsing the bills' many formats and concepts into normalized line items, and the tariff model that makes them comparable across contracts and pricing schemes.",
      "On top of that domain I helped build the platform's public API, with idempotent job submission, typed contracts and metered access, so the same bill data the platform runs on could also be sold as a product."
    ],
    links:[{label:"batuenergy.com", href:"https://batuenergy.com"}],
    note:BATU_NOTE
  },
  {
    id:"building-monitors", label:"building monitors", cluster:"energy", kind:"experience", org:"Batu Energy", part_of:"batu", x:887, y:439,
    title:"Monitoring buildings with linear models",
    meta:"Batu Energy · 2024 – 2026",
    body:[
      "Before a building can be flagged as consuming abnormally, you need a defensible definition of normal. I built linear and regularized regression models (ridge, lasso) of buildings' energy consumption for monitoring and demand forecasting: weather APIs joined with processed CFE billing data give each building an expected load as a function of conditions, and deviations from that baseline become alerts.",
      "I kept the models simple on purpose. An alert should be something you can argue with, and residual structure, heteroscedasticity and seasonality are easier to reason about in a linear model than in a black box."
    ],
    links:[{label:"batuenergy.com", href:"https://batuenergy.com"}],
    note:BATU_NOTE
  },
  {
    id:"solar-pipelines", label:"solar pipelines", cluster:"energy", kind:"experience", org:"Batu Energy", part_of:"batu", x:765, y:314,
    title:"Data pipelines for solar fleets",
    meta:"Batu Energy · 2024 – 2026",
    body:[
      "The earlier generation of my work at Batu was serverless data engineering on AWS: ingestion pipelines pulling telemetry from inverter and meter platforms, services fetching design and production data from solar-engineering tools, and APIs exposing consumption histories, tariff rates and wholesale nodal prices, all deployed as infrastructure-as-code.",
      "Step-function orchestration, queues and daily failure digests: the unglamorous plumbing that keeps an energy platform truthful across more than 8,000 sites."
    ],
    links:[{label:"batuenergy.com", href:"https://batuenergy.com"}],
    note:BATU_NOTE
  },
  {
    id:"inverter-anomalies", label:"inverter anomalies", cluster:"energy", kind:"experience", org:"Batu Energy", part_of:"batu", x:615, y:411,
    title:"Catching failing inverters in their telemetry",
    meta:"Batu Energy · 2025 – 2026",
    body:[
      "Solar inverters produce dense time series, and most of what looks like an anomaly is weather. I designed a hybrid detector for inverter telemetry: a classical ARIMA component explains the predictable, seasonal part of the signal and an LSTM models what is left, so an alert fires on residual structure rather than on a cloudy afternoon.",
      "The real work was less the architecture than the evaluation: defining what counts as an anomaly for the operations team, choosing the precision-recall tradeoff for a system where every alert costs a technician's time, and designing the pipeline that scores new data as it arrives."
    ],
    links:[{label:"batuenergy.com", href:"https://batuenergy.com"}],
    note:BATU_NOTE
  },
  {
    id:"critical-hours", label:"critical hours", cluster:"energy", kind:"project", x:775, y:398,
    title:"Predicting the critical hours of Mexico's power market",
    meta:"Tópicos de Políticas Públicas II · ITAM · 2026 · with D. Muñoz & E. Cruz",
    body:[
      "Mexico's balancing-capacity market settles on the 100 most demanding hours of the year, so knowing them in advance is worth money. We assembled an hourly 2019–2025 panel (about 150 million rows) of nodal prices, reservoir levels for nine hydro dams, weather reanalysis and natural-gas flows, using a purpose-built data agent to fetch and harmonize the sources.",
      "Chained year-on-year gradient-boosted classifiers, cascaded hourly by daily, recover 64 of 2024's 100 true critical hours. A nowcast built only from day-old features generalizes better than same-day data, because days since the last critical hour carries most of the signal. The honest caveat: a relative target, the 100 lowest-reserve hours, moves across regime shifts, and generalization to 2025 drops accordingly."
    ],
    links:[
      {label:"paper (pdf)", href:"/files/critical-hours-paper.pdf"},
      {label:"repo", href:"https://github.com/manuelmccaddenm/mem-critical-hours"}
    ]
  },
  {
    id:"air-quality", label:"air quality", cluster:"energy", kind:"writing", x:571, y:650,
    title:"Why CDMX can't breathe",
    meta:"Tópicos de Políticas Públicas I · ITAM · 2025 · with D. Haro & J. Lafarga",
    body:[
      "A political-economy analysis of Mexico City's chronic PM2.5 problem: concentrations four to five times the WHO guideline, in a mountain-ringed basin that traps its own emissions. The core argument is about time, not chemistry. Air-quality policy needs 10 to 15 years to show results while elected officials operate on 3 to 6 year horizons, so costly structural measures lose systematically to visible quick wins.",
      "An actor-by-actor map (SEMARNAT, SEDEMA, the transport lobby, academia, citizens) and a critical read of Hoy No Circula and ProAire lead to the same place: the binding constraint is incentives, not science."
    ],
    links:[{label:"paper (pdf)", href:"/files/air-quality-cdmx.pdf"}]
  },
  // ---- statistics ----
  {
    id:"spacetime-bayes", label:"space–time bayes", cluster:"stats", kind:"project", x:345, y:498,
    title:"Bayesian space–time disease mapping",
    meta:"Regresión Avanzada · ITAM · 2026",
    body:[
      "A reproduction of Knorr-Held's classic space–time disease-mapping framework, applied to breast-cancer incidence across Mexico's 32 states from 2003 to 2024. Eight hierarchical Poisson models fit by MCMC: spatial convolution (BYM), random-walk time effects, and the four space–time interaction types built as Kronecker products of spatial and temporal structure.",
      "Separability is decisively rejected: space and time interact. But unlike the original Ohio study, the unstructured interaction wins by WAIC. Registered incidence quadrupled over the period, and the residual variation reads as registry and screening maturation (with a visible 2020 under-diagnosis dip) rather than smoothly diffusing risk."
    ],
    links:[{label:"report (pdf)", href:"/files/bayesian-spacetime-report.pdf"}]
  },
  {
    id:"markov-chains", label:"markov chains", cluster:"stats", kind:"project", x:134, y:420,
    title:"Continuous-time Markov chains, at two scales",
    meta:"Procesos Estocásticos · ITAM · 2026 · with C. Reyes & D. García-Gayou",
    body:[
      "An expository project on continuous-time Markov chains built around two models at opposite ends of tractability. First, a four-state delivery-truck reliability model where the generator matrix is explicit and the stationary distribution becomes fleet economics: what fraction of hours are productive, and whether reacting faster to warning lights pays for itself.",
      "Then a stochastic SEIR epidemic, where the state space is too large to write down and only local rates exist. Simulation shows fluctuations decaying like 1/√N, outbreaks going extinct even when R₀ > 1, and the joint distribution of epidemic-peak height and timing, which is exactly the part a deterministic ODE's single trajectory hides."
    ],
    links:[{label:"notebook", href:"/files/ctmc-notebook.html"}]
  },
  {
    id:"negreira", label:"negreira", cluster:"stats", kind:"project", x:317, y:350,
    title:"A causal design for the Negreira case",
    meta:"Inferencia Causal · ITAM · 2025",
    body:[
      "Did FC Barcelona's decades of payments to the referee committee's vice-president distort match outcomes? A triple difference-in-differences: La Liga as the treated competition and the Champions League as a within-team placebo, so the era's talent cancels out instead of confounding.",
      "Refereeing decisions are made comparable through an xG-weighted goal-equivalent index, and betting-market residuals serve as a second outcome that prices talent exogenously. Fixed-effects estimation over roughly 15,000 matches, with a deliberate reinterpretation of SUTVA so the estimand is the league's total distortion: Barcelona's gain plus its rivals' loss."
    ],
    links:[
      {label:"design (pdf)", href:"/files/negreira-causal-design.pdf"},
      {label:"slides (pptx)", href:"/files/negreira-presentation.pptx"}
    ]
  },
  {
    id:"probability", label:"probability essay", cluster:"stats", kind:"writing", x:394, y:627,
    title:"¿Qué es la probabilidad?",
    meta:"essay · Comunicación Escrita para Matemáticas · ITAM · 2025",
    body:[
      "A short popular-science essay arguing that the frequentist definition of probability, a limiting relative frequency over infinite repetitions, cannot express most of the probability statements people actually make. A flipped coin hidden under a blanket is already heads or tails, yet 50% remains the only sane answer; elections and tariff decisions have no reference class at all.",
      "Via Laplace's demon, the essay lands on personal, Bayesian probability as the general notion (coherent degrees of belief, updated by evidence) with frequency as its special case."
    ],
    links:[{label:"essay (pdf, spanish)", href:"/files/probability-essay.pdf"}]
  },
  // ---- machine learning ----
  {
    id:"thesis", label:"thesis · wip", cluster:"ml", kind:"wip", x:291, y:580,
    title:"Thesis (work in progress)",
    meta:"ITAM · in progress",
    body:[
      "My undergraduate thesis lives in the intersection of Bayesian statistics and deep learning: what a prior means in a heavily overparameterized model, what non-informative can even mean there, what a posterior over weights knows about a network's internal representations that a point estimate doesn't, and when uncertainty can be trusted to guide decisions about model structure. Still taking shape. Conclusions to follow."
    ],
    links:[]
  },
  {
    id:"nutrition", label:"nutrition5k", cluster:"ml", kind:"project", x:173, y:541,
    title:"Reading nutrition from food photos",
    meta:"Minería y Análisis de Datos · ITAM · 2025 · with F. Márquez, A. Ibarra & P. Alazraki",
    body:[
      "For someone with type-1 diabetes, every meal is a carb-counting exercise. We trained a multimodal model to estimate nutritional content from a single photo, on Google's Nutrition5k dataset: 3,262 dishes, 199 possible ingredients, masses log-transformed to keep tiny quantities from vanishing.",
      "The architecture fuses a pretrained image encoder with learned ingredient embeddings through guided attention, regressing per-ingredient masses. Mean error of 7.6 g on carbohydrates, and a deliberately recall-heavy ingredient detector, because for dosing insulin, missing an ingredient is worse than hallucinating one."
    ],
    links:[{label:"report (pdf)", href:"/files/nutrition5k-report.pdf"}]
  },
  {
    id:"model-picker", label:"model picker", cluster:"ml", kind:"project", x:774, y:574,
    title:"Self-improving model selection",
    meta:"OpenAI × Kavak hackathon · 2025 · finalist · built in 13 hours",
    body:[
      "A hackathon build that made the final: three agents that own the ML lifecycle from raw CSV to recommended model. A data agent interrogates you until the business problem is pinned down; a model agent translates it into a custom loss weighting performance, interpretability and compute; an eval agent runs an evaluate-mutate loop against that loss on a fixed budget, with scoring routed through deterministic Python so nobody hallucinates a leaderboard.",
      "The part I still think about is the slow loop: after each project the eval agent re-reads its own run history, extracts generalizable lessons and writes them to persistent memory, so model selection improves across projects, not within one. Thirteen hours of code that could use a rewrite, but the idea holds up."
    ],
    links:[{label:"repo", href:"https://github.com/manuelmccaddenm/model-picker-system"}]
  },
  // ---- mathematics ----
  {
    id:"predator-prey", label:"predator–prey", cluster:"math", kind:"project", x:80, y:332,
    title:"A predator–prey system and its Hopf bifurcation",
    meta:"Sistemas Dinámicos II · ITAM · 2025",
    body:[
      "A numerical study of a modified Leslie–Gower predator–prey system with a Holling type-II response: prey grow logistically but predation saturates, and predators are limited by the predator-to-prey ratio rather than by absolute abundance. A reparametrization gives the interior equilibrium in closed form.",
      "Sweeping the predator growth rate traces a Hopf bifurcation: stable coexistence loses stability and a limit cycle is born. Populations that oscillate forever, not because of seasonality but because the interaction itself demands it. Phase portraits and bifurcation diagrams map exactly where."
    ],
    links:[{label:"notebook", href:"/files/predator-prey-notebook.html"}]
  },
  {
    id:"autoencoder", label:"autoencoder", cluster:"math", kind:"project", x:294, y:190,
    title:"Training an autoencoder without autodiff",
    meta:"Análisis Aplicado · ITAM · 2026",
    body:[
      "A linear autoencoder trained with no automatic differentiation anywhere: matrix gradients derived by hand, optimized by a trust-region method with a Dogleg subproblem. Two twists. The quasi-Newton update maintains the inverse Hessian approximation directly, so nothing is ever inverted, and the Cauchy point comes from a one-dimensional quadratic interpolation instead of the usual curvature term.",
      "Because the problem is linear, Eckart–Young gives the exact global optimum to test against: full-matrix iBFGS and limited-memory L-BFGS both land within 0.2% of it, and the real story becomes the trade. Twenty times less memory for L-BFGS at d = 100, quantified across a 5,000-configuration stress test."
    ],
    links:[{label:"repo", href:"https://github.com/manuelmccaddenm/autoencoder-trust-region-optimization"}]
  },
  {
    id:"fantasy-draft", label:"fantasy draft", cluster:"math", kind:"project", x:201, y:213,
    title:"Drafting a fantasy team as portfolio optimization",
    meta:"Optimización Numérica · ITAM · 2026",
    body:[
      "A snake-format NFL fantasy draft recast as a sequence of constrained Markowitz problems, one per pick: expected points as returns, and as risk a weekly covariance matrix estimated over four seasons with missed games scored as zero, so injury risk lives inside the variance.",
      "The floor strategy is convex and solved exactly with an interior-point method (Newton steps, log barrier, backtracking). The ceiling strategy maximizes a convex function instead, which is NP-hard with the optimum at a vertex, and is attacked by projected gradient ascent whose projection step is itself a QP. Monte Carlo over a 12-team league shows each strategy dominating exactly the metric it optimizes: what optimization buys is your position on the risk–return plane."
    ],
    links:[{label:"repo", href:"https://github.com/manuelmccaddenm/optimization-fantasy-football-draft"}]
  },
  {
    id:"lp-solver", label:"lp solver", cluster:"math", kind:"project", x:267, y:146,
    title:"An interior-point LP solver from first principles",
    meta:"Programación Lineal · ITAM · 2025",
    body:[
      "A primal Newton interior-point solver for linear programs written from scratch: log-barrier central path, a general transformation from arbitrary bounds to standard form, and recovery of the original solution, benchmarked against SciPy's solver across the NETLIB problem suite.",
      "As a companion, a Bennett–Mangasarian-style LP classifier separates the Wisconsin breast-cancer dataset, with the primal derived by hand. The same machinery, pointed at learning."
    ],
    links:[{label:"notebook", href:"/files/lp-solver-notebook.html"}]
  },
  // ---- data engineering ----
  {
    id:"btc-streaming", label:"btc streaming", cluster:"dataeng", kind:"project", x:614, y:206,
    title:"Does a prediction market lead Bitcoin?",
    meta:"Arquitectura para Grandes Volúmenes de Datos · ITAM · 2026 · team",
    body:[
      "An end-to-end streaming pipeline asking whether Polymarket's BTC up-or-down five-minute market carries information about Bitcoin's next move. Async WebSocket producers for Binance and the Polymarket order book feed Kafka; Spark Structured Streaming aggregates windowed features into partitioned Parquet; forecasts flow back out to live Grafana dashboards. One overnight run ingested 21 million events, peaking above 5,200 messages per second.",
      "A SARIMAX model with the market-implied probability as an exogenous regressor reaches 85% directional accuracy on five-minute returns, halving the error of the market baseline. The architectural lesson cut deeper: for tiny per-call inference a GPU is the wrong tool, since launch and transfer overhead dominate, while bulk training gains 12×. What decides is amortized compute per call, not streaming versus batch."
    ],
    links:[{label:"repo (team)", href:"https://github.com/Andresaf03/streaming_polymarket"}]
  },
  {
    id:"parallel-dbscan", label:"parallel dbscan", cluster:"dataeng", kind:"project", x:462, y:80,
    title:"Parallel DBSCAN and the boundary problem",
    meta:"Cómputo Paralelo · ITAM · 2025 · with A. Yunes",
    body:[
      "Three C++ implementations of DBSCAN for outlier detection: a serial baseline, a naive OpenMP parallel-for, and a spatial decomposition that bins points into a grid and hands regions to threads. The interesting problem is the boundary: a point near a dividing line has neighbors in someone else's region.",
      "Our answer triples every dividing line into read-shared buffer strips, so no ε-neighborhood is ever truncated, with points assigned to bins by binary search. At 16 threads the decomposition reaches about 9.8× speedup against about 6.3× for the naive version. Locality, not just parallelism, is what scales."
    ],
    links:[{label:"repo", href:"https://github.com/manuelmccaddenm/parallel-dbscan"}]
  },
  // ---- products ----
  {
    id:"mantis", label:"mantis", cluster:"product", kind:"experience", hub:true, org:"Mantis", x:880, y:150,
    title:"Mantis",
    meta:"2025 – present · data science, data engineering, product · with Prof. Manolis Kellis (MIT)",
    body:[
      "Mantis is an early-stage startup where I do whatever a small team needs on a given week: data science, data engineering, product. The idea is to give an organization a working model of its own world, its entities, relationships and events, expressed as embeddings and learned representations rather than hand-written rules, so that the machine-learning models behind its decisions share one representation instead of being rebuilt problem by problem, and so the same machinery can move between industries.",
      "We are starting with retail, where the first product is in progress (the dot next to this one), and exploring the same ideas in other industries. We work with Prof. Manolis Kellis at MIT."
    ],
    links:[],
    note:MANTIS_NOTE
  },
  {
    id:"retail", label:"retail · wip", cluster:"product", kind:"wip", org:"Mantis", part_of:"mantis", x:803, y:201,
    title:"Retail intelligence (work in progress)",
    meta:"2026 · stealth",
    body:[
      "I'm building the data side of a retail expansion-intelligence product: pipelines that collect, clean and match messy multi-source retail data into versioned, governed data products (raw, processed and golden tiers with explicit promotion rules, registries and manifest-pinned releases), analytical models on top, and a web runtime that consumes each release through typed, validated contracts. More when it ships."
    ],
    links:[],
    note:"Confidential and in progress: Mantis IP, described at the level of the machinery only."
  },
  {
    id:"glass", label:"glass", cluster:"product", kind:"project", x:709, y:130,
    title:"Glass: open finance, built with friends",
    meta:"2026 · team",
    body:[
      "Glass is a personal-finance app a few friends and I are building around a simple ethos: your financial data belongs to you. The app unifies your bank accounts into one view, surfaces the small recurring leaks (the gastos hormiga) and makes splitting expenses with friends a first-class, social feature.",
      "The technically distinctive choice is where aggregation happens: on your own device, with credentials that never leave it. Openness about your own money without handing it to yet another intermediary. I work on the backend."
    ],
    links:[],
    note:"The code lives in a teammate's private repo for now."
  },
  {
    id:"cdmx-budget", label:"cdmx budget", cluster:"product", kind:"project", x:689, y:608,
    title:"Where does a CDMX peso go?",
    meta:"Claude Mexico City Lab · 2026 · 4-hour hackathon · team",
    body:[
      "A four-hour hackathon sprint over Mexico City's open budget data: dashboards tracing where public money actually goes (la ruta de tu peso) plus a map of thousands of georeferenced public works. I built the conversational layer, an agent that answers budget questions through custom tools over the cleaned datasets, and the category crosswalk that makes official line items legible to citizens. Four hours of polish it did not receive; the data plumbing was real."
    ],
    links:[{label:"repo (team)", href:"https://github.com/diegomondra/impact-lab-cdmx"}]
  },
];
