# -*- coding: utf-8 -*-
"""AI pack — 12 boards. AI, AI safety, AI governance and policy.

Written for two people who work adjacent to the field, so the bar is
"satisfying", not "glossary quiz": no board is solved by knowing a definition,
and every board has at least one group that is ordinary English wearing a
technical hat (___ SET, ___ AGENT, ___ WINDOW, ___ RISK).

Facts are pinned to things that were true and public as of mid-2026 and are
stated in the notes with dates where a date is load-bearing. Where an
instrument has since been rescinded or vetoed, the note says so — a policy
instrument does not stop being one because it lost.
"""

BOARDS = [

{
 "title": "Frontier",
 "diff": 2,
 "groups": [
   {"name": "FRONTIER LABS", "tiles": ["OPENAI", "ANTHROPIC", "DEEPMIND", "XAI"],
    "note": "DeepMind was a London startup bought by Google in 2014; OpenAI began as a nonprofit; Anthropic was founded in 2021 by people who left OpenAI. Every one of them has a founding story about safety."},
   {"name": "MODEL FAMILIES", "tiles": ["CLAUDE", "GEMINI", "LLAMA", "QWEN"],
    "note": "Claude is named for Claude Shannon, Llama is Meta's open-weights line, and Qwen is Alibaba's — which is why so much of the open ecosystem now speaks Mandarin upstream."},
   {"name": "SAFETY-FOCUSED ORGANISATIONS", "tiles": ["METR", "APOLLO", "REDWOOD", "MIRI"],
    "note": "METR runs autonomy evaluations on frontier models before release, Apollo works on deception and scheming, Redwood on control, and MIRI has been arguing about all of it since 2000."},
   {"name": "___ MODEL", "tiles": ["WORLD", "REWARD", "FOUNDATION", "LANGUAGE"],
    "note": "World model, reward model, foundation model, language model. Four completely different objects and one very tired noun."},
 ],
 "traps": [
   ["ANTHROPIC", 2, "Anthropic is a frontier lab whose entire founding pitch was safety, so it has as good a claim on the blue group as anything in it. It is also unambiguously a lab."],
   ["FOUNDATION", 2, "Half the organisations in this field are called a foundation, an institute or a centre — FOUNDATION is the most organisation-shaped word on the board."],
 ],
 "epilogue": "The calibration board. The trick is that three of the four groups are proper nouns and the fourth is four ordinary words, so the work is deciding which proper nouns are companies, which are products, and which are the people watching. METR, APOLLO, REDWOOD and MIRI are four already, so Anthropic stays a lab.",
},

{
 "title": "Acronym Soup",
 "diff": 3,
 "groups": [
   {"name": "BENCHMARKS", "tiles": ["MMLU", "GPQA", "SWE-BENCH", "ARC-AGI"],
    "note": "MMLU is 57 subjects of multiple choice, GPQA is questions PhDs get wrong, SWE-bench is real GitHub issues, and ARC-AGI is deliberately easy for humans and hard for models."},
   {"name": "STAGES OF TRAINING", "tiles": ["PRETRAINING", "SFT", "RLHF", "DISTILLATION"],
    "note": "Pretrain on everything, supervise-fine-tune on demonstrations, reinforce from human feedback, then distil the result into something small enough to serve."},
   {"name": "POLICY INSTRUMENTS", "tiles": ["EU AI ACT", "SB 1047", "EXPORT CONTROL", "EXEC ORDER"],
    "note": "The EU AI Act passed in 2024; California's SB 1047 was vetoed in September 2024; the 2023 US executive order was rescinded in January 2025. Two of these lost and are still instruments."},
   {"name": "THINGS YOU COUNT WHEN TRAINING", "tiles": ["FLOPS", "TOKENS", "PARAMETERS", "EPOCHS"],
    "note": "Chinchilla's finding was that most large models had been counting parameters when they should have been counting tokens — roughly twenty tokens per parameter."},
 ],
 "traps": [
   ["FLOPS", 2, "The FLOP count is the actual legal trigger in both the EU AI Act (10^25) and the rescinded US executive order (10^26). The unit is doing policy work, which is unusual for a unit."],
   ["SFT", 0, "SFT is three capital letters in a list that already contains MMLU and GPQA. Nothing about the surface tells you it is a verb, not a test."],
 ],
 "epilogue": "Three of these groups are made of acronyms and the fourth is made of units, which is the whole difficulty — the shape of the tile tells you nothing. FLOPS is the honest double-fit: a measurement that became a law. MMLU, GPQA, SWE-BENCH and ARC-AGI are four tests already, so SFT goes back to being training.",
},

{
 "title": "The Hard Problem",
 "diff": 3,
 "groups": [
   {"name": "ALIGNMENT FAILURE MODES", "tiles": ["REWARD HACKING", "SYCOPHANCY", "DECEPTION", "SANDBAGGING"],
    "note": "Sandbagging is a model doing worse on purpose — which, if a model knows it is being evaluated, makes the evaluation the thing being gamed."},
   {"name": "INTERPRETABILITY", "tiles": ["PROBES", "SAE", "FEATURES", "CIRCUITS"],
    "note": "A sparse autoencoder pulls a layer apart into features that are individually meaningful, on the theory that the model is storing far more concepts than it has neurons."},
   {"name": "SAFETY TRAINING TECHNIQUES", "tiles": ["CONSTITUTION", "RED TEAMING", "DEBATE", "RLAIF"],
    "note": "A constitution is a written set of principles a model critiques itself against; RLAIF replaces the human rater with a model; debate pits two copies against each other in front of a judge."},
   {"name": "WORDS ALIGNMENT TOOK FROM ECONOMICS", "tiles": ["PRINCIPAL", "AGENT", "INCENTIVE", "GOODHART"],
    "note": "The principal–agent problem is 1970s economics and describes this situation exactly. Goodhart was a Bank of England adviser: when a measure becomes a target, it stops being a good measure."},
 ],
 "traps": [
   ["GOODHART", 0, "Goodhart's law is the one-sentence definition of reward hacking, so the concept belongs in the yellow group even though the tile is a surname."],
   ["PROBES", 2, "Probing is something you do to a model, which makes it read as a technique. It is a technique for looking, not for training."],
 ],
 "epilogue": "The board is four ways of talking about the same worry: what the thing is actually optimising. GOODHART is the trap worth admiring — the man's law describes the yellow group better than any tile in it, and REWARD HACKING, SYCOPHANCY, DECEPTION and SANDBAGGING are already four. PRINCIPAL, AGENT and INCENTIVE need their economist.",
},

{
 "title": "Zoo",
 "diff": 4,
 "groups": [
   {"name": "MILESTONE SYSTEMS", "tiles": ["ALEXNET", "ALPHAGO", "ALPHAFOLD", "GPT-3"],
    "note": "AlexNet won ImageNet in 2012 and started all of this; AlphaGo beat Lee Sedol in 2016; AlphaFold won a Nobel prize in chemistry in 2024; GPT-3 in 2020 was the one that made scale look like the whole answer."},
   {"name": "PAPERS PEOPLE NAME-DROP", "tiles": ["PARROTS", "CHINCHILLA", "SPARKS OF AGI", "SCALING LAWS"],
    "note": "'On the Dangers of Stochastic Parrots' (2021) got its lead author fired from Google; Chinchilla (2022) rewrote how everyone allocates compute; 'Sparks of AGI' (2023) started an argument that has not finished."},
   {"name": "AI THOUGHT EXPERIMENTS", "tiles": ["PAPERCLIPS", "CHINESE ROOM", "TURING TEST", "STOP BUTTON"],
    "note": "The paperclip maximiser is Bostrom's, the Chinese Room is Searle's objection to the whole project, and the stop-button problem is why 'just switch it off' is not a plan."},
   {"name": "FINE-TUNES NAMED AFTER A SOUTH AMERICAN CAMELID", "tiles": ["LLAMA", "ALPACA", "VICUNA", "GUANACO"],
    "note": "Stanford's Alpaca, LMSYS's Vicuna and QLoRA's Guanaco all came out within months of Llama in 2023. There are exactly four camelids in South America and the field used all of them."},
 ],
 "traps": [
   ["CHINCHILLA", 3, "A chinchilla is a small South American rodent on a board whose purple is small South American mammals. It is not a camelid, and the paper is the famous thing."],
   ["PARROTS", 3, "The other animal in the papers group. Stochastic Parrots is a bird among the llamas — and the only tile here that is a plural noun, which is the tell."],
 ],
 "epilogue": "Half this board is animals and only four of them are the group. CHINCHILLA and PARROTS are both papers wearing fur, and they cannot move because LLAMA, ALPACA, VICUNA and GUANACO are the complete list of camelids — the field ran out of species, which is why the 2023 model names got weird.",
},

{
 "title": "Compute",
 "diff": 3,
 "groups": [
   {"name": "HARDWARE IN A TRAINING RUN", "tiles": ["H100", "TPU", "HBM", "NVLINK"],
    "note": "High-bandwidth memory is stacked DRAM sitting next to the die, and it is the part that is actually scarce — the logic is easier to make than the memory bolted to it."},
   {"name": "THE CHIP SUPPLY CHAIN", "tiles": ["NVIDIA", "TSMC", "ASML", "SK HYNIX"],
    "note": "One Dutch company makes the EUV lithography machines, one Taiwanese company makes the leading-edge chips, and that is the whole bottleneck of the modern world in two sentences."},
   {"name": "LEVERS IN COMPUTE GOVERNANCE", "tiles": ["EXPORT RULES", "COMPUTE CAPS", "CHIP TRACKING", "CLOUD KYC"],
    "note": "Compute is the one input to frontier AI that is physical, countable and made in very few places, which is why governance keeps reaching for it instead of for the software."},
   {"name": "WHAT A DATA CENTRE ACTUALLY NEEDS", "tiles": ["POWER", "WATER", "LAND", "PERMITS"],
    "note": "The binding constraint on frontier training moved from chips to gigawatts somewhere around 2025, and the queue to connect to a grid is now measured in years."},
 ],
 "traps": [
   ["HBM", 1, "SK Hynix makes most of the world's high-bandwidth memory, so HBM is a supply-chain story as much as a component — and it is the only tile in yellow that is a market, not a product you can hold."],
   ["POWER", 2, "Power is increasingly the lever governments actually pull: you cannot smuggle a substation. It reads as compute governance because it is becoming compute governance."],
 ],
 "epilogue": "Two tiles are pointing one group down the board and neither can move: NVIDIA, TSMC, ASML and SK HYNIX are a full supply chain, and EXPORT RULES, COMPUTE CAPS, CHIP TRACKING and CLOUD KYC are four levers already. The purple is the easiest group to say and the hardest to see — nobody thinks about water until the town meeting.",
},

{
 "title": "Evals",
 "diff": 4,
 "groups": [
   {"name": "EVALUATION VOCABULARY", "tiles": ["ELICITATION", "SCAFFOLDING", "PASS AT K", "HOLDOUT"],
    "note": "Elicitation is how hard you tried to make the model succeed, and it is the reason two labs can run the same eval on the same model and disagree by twenty points."},
   {"name": "DANGEROUS-CAPABILITY DOMAINS", "tiles": ["CYBER", "BIO", "PERSUASION", "AUTONOMY"],
    "note": "These four are the standard quartet in every frontier safety framework, and autonomy is the one that changed fastest between 2024 and 2026."},
   {"name": "WAYS A BENCHMARK DIES", "tiles": ["CONTAMINATION", "SATURATION", "CHERRY-PICKING", "LEAKAGE"],
    "note": "Saturation is when everyone scores 92% and the test stops carrying information; contamination is when the test was in the training data, which is nearly always, a little."},
   {"name": "___ SET", "tiles": ["TRAINING", "TEST", "MIND", "TEA"],
    "note": "Training set, test set, mindset, tea set. Two of them are the reason the other groups exist and two of them are in the cupboard."},
 ],
 "traps": [
   ["HOLDOUT", 3, "A holdout set is precisely the same construction as a training set and a test set, and the phrase is almost never said without the word SET after it."],
   ["LEAKAGE", 0, "Test-set leakage is a term of art in evaluation, not only a failure — you would find it in the vocabulary section of any eval write-up."],
 ],
 "epilogue": "An eval board that is mostly about how evals fail, which is the honest version. HOLDOUT is the double-fit and it loses because TRAINING, TEST, MIND and TEA are already a full shelf — and because CONTAMINATION, SATURATION and CHERRY-PICKING are three deaths looking for a fourth.",
},

{
 "title": "The Institutes",
 "diff": 3,
 "groups": [
   {"name": "STATE AI BODIES", "tiles": ["AISI", "CAISI", "EU AI OFFICE", "NIST"],
    "note": "Britain's AI Safety Institute became the AI Security Institute in February 2025; America's became the Center for AI Standards and Innovation, CAISI, that June. Both kept the building and changed the noun."},
   {"name": "WHERE THE AI SUMMITS HAPPENED", "tiles": ["BLETCHLEY", "SEOUL", "PARIS", "NEW DELHI"],
    "note": "Bletchley Park in November 2023 produced a declaration signed by both the US and China; Seoul added commitments; Paris renamed the whole series an Action Summit; India took the fourth."},
   {"name": "WHAT A LAB PUBLISHES BEFORE IT SCALES", "tiles": ["RSP", "PREPAREDNESS", "FSF", "MODEL CARD"],
    "note": "Anthropic's Responsible Scaling Policy, OpenAI's Preparedness Framework, Google DeepMind's Frontier Safety Framework — three documents that promise what a lab will do at a capability level it has not reached yet."},
   {"name": "PRECEDED BY RED", "tiles": ["TEAM", "LINE", "FLAG", "TAPE"],
    "note": "Red team, red line, red flag, red tape. Four things this entire field argues about, and the only group on the board that a lawyer and an engineer would read identically."},
 ],
 "traps": [
   ["NIST", 2, "NIST publishes the AI Risk Management Framework, so 'the thing that publishes the framework' describes it exactly — it is an agency that happens to be a framework factory."],
   ["SEOUL", 2, "The Seoul Frontier AI Safety Commitments are precisely a document labs signed about what they will do before scaling. The tile is the city, not the commitment."],
 ],
 "epilogue": "Two groups of proper nouns, one of documents, one of ordinary words, and the difficulty is that the documents are named after the institutions and the institutions are named after the cities. RSP, PREPAREDNESS, FSF and MODEL CARD are four publications already, which is what keeps NIST an agency and SEOUL a place.",
},

{
 "title": "Open Weights",
 "diff": 3,
 "groups": [
   {"name": "OPEN-WEIGHT MODEL FAMILIES", "tiles": ["MISTRAL", "DEEPSEEK", "GEMMA", "OLMO"],
    "note": "Gemma is Google's, OLMo is the Allen Institute's and ships its training data too, and DeepSeek's releases in early 2025 made the phrase 'compute moat' considerably less popular."},
   {"name": "WHAT PEOPLE DO TO A DOWNLOADED MODEL", "tiles": ["FINE-TUNE", "QUANTISE", "MERGE", "LORA"],
    "note": "Quantising drops the numbers to four bits so the thing runs on a laptop; LoRA trains a small adapter instead of the whole network; merging averages two models' weights and, unreasonably, often works."},
   {"name": "VOCABULARY OF THE MISUSE DEBATE", "tiles": ["UPLIFT", "MARGINAL RISK", "SAFEGUARDS", "DUAL USE"],
    "note": "'Marginal risk' is the load-bearing phrase: the question is never whether a model can help with something dangerous, but whether it helps more than a library and a search engine already do."},
   {"name": "___ WEIGHT", "tiles": ["FEATHER", "HEAVY", "PAPER", "OVER"],
    "note": "Featherweight, heavyweight, paperweight, overweight. The word 'weights' meaning 'the actual numbers in the model' is barely a decade old outside the lab."},
 ],
 "traps": [
   ["SAFEGUARDS", 1, "Removing the safeguards is the very first thing some people do to a downloaded model, and adding them back is what the fine-tuners do. It is an argument word here, not an action."],
   ["LORA", 0, "LoRA is four capital letters that look exactly like a model family on a board that opens with four model families."],
 ],
 "epilogue": "The board is one argument seen from three sides: what exists, what you can do with it, and what people say about what you can do with it. SAFEGUARDS is the tile with two homes, and it stays in blue because FINE-TUNE, QUANTISE, MERGE and LORA are four verbs already — and because UPLIFT, MARGINAL RISK and DUAL USE are three pieces of jargon with a hole in them.",
},

{
 "title": "The Papers",
 "diff": 4,
 "groups": [
   {"name": "LANDMARK PAPERS BY SHORTHAND", "tiles": ["ATTENTION", "RESNET", "ADAM", "DROPOUT"],
    "note": "'Attention Is All You Need' (2017), residual connections (2015), the Adam optimiser (2014), dropout (2014). Four papers that between them are cited more than most fields."},
   {"name": "ARCHITECTURES", "tiles": ["TRANSFORMER", "CNN", "LSTM", "DIFFUSION"],
    "note": "The LSTM held the sequence-modelling crown for twenty years and lost it in about eighteen months; diffusion took over images by learning to undo noise."},
   {"name": "WHERE THE FIELD PUBLISHES", "tiles": ["ARXIV", "NEURIPS", "ICML", "OPENREVIEW"],
    "note": "The real publication event is the arXiv preprint; the conference is where you find out who else was working on it. OpenReview means the referee reports are public, which is either brave or cruel."},
   {"name": "___ HEAD", "tiles": ["HOT", "FIGURE", "LETTER", "ARROW"],
    "note": "Hothead, figurehead, letterhead, arrowhead. An attention head is none of these, which is the entire reason this group is here."},
 ],
 "traps": [
   ["ATTENTION", 3, "An attention head is the single most-said phrase in modern machine learning, and there is an ___ HEAD group on this board. The paper is the answer."],
   ["TRANSFORMER", 0, "Everybody calls the 2017 paper 'the Transformer paper'. Its actual title is in the yellow group, which is why the word itself is filed as an architecture."],
 ],
 "epilogue": "The paper and the thing the paper introduced are almost never the same word, and this board is entirely about that gap: the Transformer is in the architecture group and the paper that invented it is called ATTENTION. If you tried ATTENTION with HOT, FIGURE and LETTER you were reading the board exactly as intended and were still wrong.",
},

{
 "title": "Agents",
 "diff": 3,
 "groups": [
   {"name": "ONE TURN OF AN AGENT LOOP", "tiles": ["PLAN", "ACT", "OBSERVE", "REFLECT"],
    "note": "Plan, act, observe, reflect, repeat until done or until the budget runs out. Almost every agent framework since 2023 is a rediscovery of this loop with different logging."},
   {"name": "HOW AN AGENT GOES WRONG", "tiles": ["INJECTION", "JAILBREAK", "LOOPING", "EXFILTRATION"],
    "note": "Prompt injection is the one with no clean fix: if a model reads a web page, the web page gets to talk to it, and instructions and data arrive down the same pipe."},
   {"name": "AGENT PLUMBING", "tiles": ["MCP", "API", "TOOL CALL", "SANDBOX"],
    "note": "The Model Context Protocol was opened up in late 2024 to stop every tool integration being written twice; the sandbox is the part everybody adds after the first incident."},
   {"name": "___ AGENT", "tiles": ["FREE", "DOUBLE", "ESTATE", "SECRET"],
    "note": "Free agent, double agent, estate agent, secret agent. The word arrived in AI from economics, where an agent is simply someone acting on another's behalf."},
 ],
 "traps": [
   ["SANDBOX", 1, "'Sandbox escape' is a failure mode before it is a component, and the group next door is entirely failure modes."],
   ["DOUBLE", 1, "A double agent is a thing that appears to work for you while working for someone else, which is a description of the green group's worst case."],
 ],
 "epilogue": "Four groups and only one of them is really about software. SANDBOX is the honest double-fit — you build one, then you spend your life worrying about escapes from it — and INJECTION, JAILBREAK, LOOPING and EXFILTRATION are four ways to fail already. The purple is the reminder that 'agent' was a word about trust long before it was a word about tools.",
},

{
 "title": "Governance",
 "diff": 4,
 "groups": [
   {"name": "MACHINERY OF THE EU AI ACT", "tiles": ["RISK TIERS", "GPAI", "CE MARKING", "ANNEX III"],
    "note": "Four tiers from unacceptable down to minimal, a separate chapter for general-purpose models, the same CE mark that appears on a kettle, and Annex III — the list that decides what counts as high-risk."},
   {"name": "RECURRING US AI POLICY FIGHTS", "tiles": ["PREEMPTION", "MORATORIUM", "LIABILITY", "LICENSING"],
    "note": "Whether federal rules should override state ones, whether to pause anything, who pays when a model causes harm, and whether training a frontier model should need permission. The same four arguments every session."},
   {"name": "WHAT A GOVERNANCE REGIME ASKS FOR", "tiles": ["AUDITS", "INCIDENT LOGS", "REGISTRATION", "WATERMARKS"],
    "note": "Every regime lands on roughly the same four asks, borrowed wholesale from finance, aviation and food safety — which is why the vocabulary sounds older than the technology."},
   {"name": "___ CONTROL", "tiles": ["EXPORT", "QUALITY", "REMOTE", "CROWD"],
    "note": "Export control, quality control, remote control, crowd control. Only one of them has ever been used to try to slow down a technology on purpose."},
 ],
 "traps": [
   ["EXPORT", 1, "Export controls are the most-argued American AI policy lever there is, so EXPORT reads as a US fight rather than as half a compound noun."],
   ["LICENSING", 2, "Licensing is exactly the kind of thing a regime asks for, alongside audits and registration — it is in green because in the US it is still an argument, not a requirement."],
 ],
 "epilogue": "Three groups of policy vocabulary and one of ordinary compounds, and the trick is that policy vocabulary IS ordinary compounds. EXPORT is the double-fit and it goes purple because PREEMPTION, MORATORIUM, LIABILITY and LICENSING are four live American arguments already — a set that would look completely different if this board had been written in Brussels.",
},

{
 "title": "The Long Run",
 "diff": 5,
 "groups": [
   {"name": "WORDS FOR THE THING PEOPLE ARE WORRIED ABOUT", "tiles": ["X-RISK", "S-RISK", "TAKEOFF", "SINGULARITY"],
    "note": "Existential risk, suffering risk, the speed of the transition, and the 1993 word for the point past which the graph stops being readable. Three of the four were coined in the same small set of mailing lists."},
   {"name": "NAMES ATTACHED TO THE ARGUMENT", "tiles": ["BOSTROM", "YUDKOWSKY", "HINTON", "RUSSELL"],
    "note": "Bostrom wrote the 2014 book, Yudkowsky spent two decades on the mailing lists, Russell wrote the textbook and then wrote the objection, and Hinton left Google in 2023 to say it out loud."},
   {"name": "BORROWED FROM SAFETY ENGINEERING", "tiles": ["SAFETY CASE", "SWISS CHEESE", "TRIPWIRE", "NEAR MISS"],
    "note": "A safety case is an argument that a system is safe enough, written down and challengeable — nuclear and aviation have required them for decades, which is why AI keeps reaching for the phrase."},
   {"name": "FIRE ___", "tiles": ["ALARM", "WALL", "DRILL", "ESCAPE"],
    "note": "Fire alarm, firewall, fire drill, fire escape. All four have been used as metaphors in this argument, and one of them is the title of the most-quoted essay in it."},
 ],
 "traps": [
   ["TAKEOFF", 2, "Takeoff is an aviation word on a board with a group of borrowed aviation and nuclear vocabulary. Here it means how fast capabilities climb, which is the older AI usage."],
   ["TRIPWIRE", 3, "A tripwire sets off an alarm, and the purple group is four things a fire sets off. It is in blue because the phrase comes from safety engineering intact."],
 ],
 "epilogue": "The hardest board in the pack, and the reason is that this field talks about itself in borrowed words: half the safety vocabulary is aviation, half the risk vocabulary is science fiction, and the surnames are doing the work of citations. TAKEOFF is the double-fit worth the price of admission — and SAFETY CASE, SWISS CHEESE, TRIPWIRE and NEAR MISS are four borrowings already, so the aeroplane stays in yellow.",
},

]
