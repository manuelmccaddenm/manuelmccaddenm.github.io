// Content is grounded in embeddings/data.js; scene descriptions are explanatory models.
export const MONUMENTS = {
  itam: [
    "ITAM",
    "APPLIED MATHEMATICS · CONNECTED IDEAS",
    "A campus courtyard connects six disciplines through a shared mathematical sculpture. The courtyard is the starting point for exploring the district.",
  ],
  batu: [
    "BATU ENERGY",
    "SOLAR FLEETS · ENERGY DATA · OPERATIONS",
    "A solar-powered operations campus connects site meters to a shared control room. Follow the four surrounding Batu workstreams to explore bill processing, solar pipelines, building monitoring and anomaly detection.",
  ],
  "cfe-bills": [
    "CFE BILL ENGINE",
    "COLLECT → PARSE → NORMALIZE → API",
    "Bills travel through a document-processing line into structured records and an API terminal. The paired request tokens represent idempotent job submission: repeating a request should not create a second job.",
  ],
  "building-monitors": [
    "BUILDING MONITORS",
    "WEATHER + LINEAR MODEL → BASELINE → ALERT",
    "A cutaway building exposes its energy meters beside expected and observed load traces. The highlighted gap is a residual: an explainable departure from the weather-adjusted baseline, not simply high consumption.",
  ],
  "solar-pipelines": [
    "SOLAR PIPELINES",
    "TELEMETRY → QUEUES → ORCHESTRATION → DATA",
    "A solar farm feeds inverter cabinets, a queue and a server room. Moving packets illustrate ingestion and orchestration across a fleet; these are schematic signals, not live client telemetry.",
  ],
  "inverter-anomalies": [
    "INVERTER ANOMALIES",
    "ARIMA BASELINE + LSTM RESIDUALS",
    "A solar array feeds two inverter cabinets and a diagnostic screen. The seasonal curve is separated from a highlighted residual event, explaining why ordinary weather variation should not automatically trigger a fault alert.",
  ],
  "critical-hours": [
    "CRITICAL HOURS",
    "LOW RESERVES · FORECASTING · REGIME SHIFTS",
    "A miniature power system combines a dam, transmission towers and a city. The 100-cell board highlights the 64 true critical hours recovered in the project's 2024 evaluation; performance changed with the next year's regime.",
  ],
  "air-quality": [
    "WHY CDMX CAN'T BREATHE",
    "A BASIN OF EMISSIONS · A PROBLEM OF INCENTIVES",
    "Traffic and industry sit inside a mountain basin beneath a haze canopy. Two policy timelines contrast electoral horizons with the longer time needed for structural air-quality improvements. This is a political-economy illustration.",
  ],
  "spacetime-bayes": [
    "SPACE–TIME BAYES",
    "32 STATES × 22 YEARS · HIERARCHICAL POISSON",
    "Thirty-two state tiles connect to a stack of time layers and a heatmap. The construction explains spatial effects, temporal effects and their interaction; its colors are schematic, not a geographic map or fitted disease-risk estimates.",
  ],
  "markov-chains": [
    "CONTINUOUS-TIME MARKOV CHAINS",
    "FLEET RELIABILITY + STOCHASTIC SEIR",
    "A delivery truck moves among operating, warning, failed and repair stations. A second row represents susceptible, exposed, infectious and recovered states: two different systems described by local transition rates.",
  ],
  negreira: [
    "NEGREIRA · CAUSAL DESIGN",
    "LA LIGA / CHAMPIONS LEAGUE · TRIPLE DIFFERENCE",
    "A soccer stadium connects to two competition panels and a before/after comparison. The Champions League provides a within-team placebo to help separate talent from the proposed treatment. This exhibit presents a research design, not a verdict.",
  ],
  probability: [
    "WHAT IS PROBABILITY?",
    "BELIEF + EVIDENCE → BAYESIAN UPDATE",
    "A coin is partly concealed under a cloth beside an evidence scale and a probability dial. Its outcome can already be fixed while uncertainty remains in what the observer knows.",
  ],
  thesis: [
    "THESIS · WORK IN PROGRESS",
    "PRIORS · REPRESENTATIONS · UNCERTAINTY",
    "A research bench links an open notebook, a neural network and several translucent candidate models. The alternatives represent uncertainty about weights and structure. The notebook remains open as the research develops.",
  ],
  nutrition: [
    "NUTRITION5K",
    "PHOTO → GUIDED ATTENTION → INGREDIENT MASSES",
    "A camera scans a plate of recognizable foods, which connect to ingredient bins and a nutrition display. Guided attention combines the photo with ingredient embeddings to estimate per-ingredient masses.",
  ],
  "model-picker": [
    "MODEL PICKER",
    "DATA AGENT → MODEL AGENT → EVAL AGENT",
    "Three robot workstations turn a CSV into a loss specification and a deterministic evaluation board. A return path to a memory shelf shows the slower loop: carrying useful lessons into the next project.",
  ],
  autoencoder: [
    "AUTOENCODER WITHOUT AUTODIFF",
    "HAND GRADIENTS · TRUST REGION · DOGLEG",
    "Walk through the bridge toward Negreira: thirteen structural frames narrow into the latent bottleneck, then open into reconstruction. Signal paths follow the same compression and expansion overhead. Beside the street, a loss landscape and bent Dogleg step connect the architecture to hand-derived gradients and trust-region optimization.",
  ],
  "fantasy-draft": [
    "NFL FANTASY DRAFT",
    "CONSTRAINED PORTFOLIO OPTIMIZATION",
    "The NFL stadium's board contrasts floor and ceiling objectives: adjusted value minus or plus covariance variance, subject to roster, remaining-pick and ADP constraints. The ribbon demonstrates the 12-team snake order.",
  ],
  "predator-prey": [
    "PREDATOR–PREY",
    "HOPF BIFURCATION",
    "Foxes and rabbits establish the ecological setting. Paired local phase portraits show attraction to coexistence and sustained oscillations. The portraits use an illustrative Hopf normal form, rather than replaying the notebook's population simulation.",
  ],
  "lp-solver": [
    "INTERIOR-POINT LP SOLVER",
    "LOG BARRIER → CENTRAL PATH → OPTIMUM",
    "A transparent feasible region contains a curved interior path toward a highlighted vertex. A separate classification panel shows the same solver applied to a separating boundary. The geometry is illustrative, not a NETLIB benchmark output.",
  ],
  "btc-streaming": [
    "DOES A MARKET LEAD BITCOIN?",
    "WEBSOCKETS → KAFKA → SPARK → PARQUET → FORECAST",
    "Two exchange terminals feed brokers, streaming compute and partitioned files before reaching a forecast desk. Animated packets explain the system architecture; the screen traces are schematic and are not live market data.",
  ],
  "parallel-dbscan": [
    "PARALLEL DBSCAN",
    "SPATIAL PARTITIONS · SHARED BOUNDARY BUFFERS",
    "Colored point clouds occupy separate worker regions. Shared strips and an epsilon-neighborhood crossing a boundary show the key issue: partitioning work must not cut off a point's neighbors.",
  ],
  mantis: [
    "MANTIS",
    "ENTITIES + RELATIONSHIPS + EVENTS → REPRESENTATIONS",
    "A mantis-inspired sculpture stands over an entity graph with several application portals. The graph connects entities, relationships and events to a shared learned representation across problems.",
  ],
  retail: [
    "RETAIL INTELLIGENCE · WIP",
    "RAW → PROCESSED → GOLDEN · GOVERNED RELEASES",
    "A storefront and product shelves connect to three data-promotion gates and a release registry. The gates show how data becomes a governed product with defined consumers, while the registry tracks releases. This project is in progress.",
  ],
  glass: [
    "GLASS · OPEN FINANCE",
    "YOUR DEVICE · YOUR DATA · SHARED EXPENSES",
    "A large phone contains bank-account tiles and a local vault, while a shared table splits an expense among friends. The device-centered arrangement explains where aggregation and credentials belong.",
  ],
  "cdmx-budget": [
    "WHERE DOES A CDMX PESO GO?",
    "PUBLIC BUDGET → CATEGORIES → WORKS → QUESTIONS",
    "A civic plaza routes a peso through labeled public-service branches toward map pins and a conversational kiosk. The routes explain the category crosswalk and tool-backed questions; they do not assert specific spending shares.",
  ],
};
export const overviewFor = (id) =>
  id === "autoencoder"
    ? { eye: [18, 13, 26], target: [1.5, 3.2, 0] }
    : id === "fantasy-draft"
      ? { eye: [0, 11, 13], target: [0, 2.5, -0.5] }
      : id === "predator-prey"
        ? { eye: [0, 9, 17], target: [0, 4, 0] }
        : { eye: [1.5, 9, 17], target: [0, 3.6, 0] };
