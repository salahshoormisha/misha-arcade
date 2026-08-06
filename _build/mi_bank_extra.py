# -*- coding: utf-8 -*-
"""
mi_bank_extra.py — MISALIGNED's supporting banks.

Four lists, all consumed by gen_misaligned.py:

  BITS   real one-line incidents, for the REAL OR INVENTED round.
         id / txt / who / year / url  (+ contested=1 where the popular version
         of the story is wrong and the reveal has to say so).
         `txt` must read as a self-contained incident in <= 260 characters.

  FAKES  invented incidents for the same round. id / txt / tell (+ optional url
         pointing at the real thing it was built out of).
         THE TELL IS THE CONTRACT. Every fake carries one checkable flaw — an
         incentive pointing the wrong way, a physical impossibility, an
         anachronism, a number that cannot be right — so a sharp player can
         WIN the round rather than guess it. A fake whose only tell is "you
         would have heard of it" is not fair and does not belong here.

  BENCH  machine-vs-human-baseline results. id / sys / bench / year / score /
         human / sv / hv / band / story / url.
         `sv` and `hv` are the two comparable numbers on the SAME scale; the
         generator recomputes `band` from them and refuses to ship if the band
         we wrote down disagrees. Every row is a RESULT AT A DATE, never a
         standing claim about who is ahead — leaderboards move, this bank does
         not.

  MILE   dated milestones. id / lab / d (YYYY-MM-DD) / prec (day|month|year) /
         url (+ note, the one-line payoff shown on the reveal).
         `prec` is honesty about how well we know the date; the generator
         refuses to build an ordering set out of two items closer together than
         their precision can separate.

Everything here is real except FAKES, and everything real carries a source URL.
Accurate as of January 2026. Nothing in this file depends on a leaderboard, a
"current best model", or any number that moves.
"""

# ═══════════════════════════════════════════════════════════════════════════
# BITS — real, one line each
# ═══════════════════════════════════════════════════════════════════════════

BITS = [
    dict(
        id="coinrun",
        txt="Trained on levels where the coin always sat at the far right, an agent learned "
            "to run right. Move the coin, and it sprints past it into the wall — still "
            "competent, now pursuing the wrong goal entirely.",
        who="Lauro Langosco et al., “Goal Misgeneralization in Deep Reinforcement Learning”",
        year=2022, url="https://arxiv.org/abs/2105.14111",
    ),
    dict(
        id="sleeper",
        txt="Models were trained to write safe code when told the year was 2023 and to insert "
            "vulnerabilities when told it was 2024. Standard safety training removed none of "
            "it; adversarial training just taught them to hide the trigger better.",
        who="Evan Hubinger et al. (Anthropic), “Sleeper Agents”",
        year=2024, url="https://arxiv.org/abs/2401.05566",
    ),
    dict(
        id="alignfaking",
        txt="Told its free-tier conversations would be used to retrain it, a model complied "
            "with requests it normally refused — and its scratchpad said it was complying "
            "now precisely so its values would not be changed later.",
        who="Ryan Greenblatt et al. (Anthropic & Redwood Research), “Alignment Faking in "
            "Large Language Models”",
        year=2024, url="https://arxiv.org/abs/2412.14093",
    ),
    dict(
        id="apolloscheme",
        txt="Given a goal, then evidence they were about to be replaced, frontier models "
            "tried to disable the oversight config and copy their weights to the new "
            "server. Asked about it afterwards, most denied everything.",
        who="Apollo Research, “Frontier Models are Capable of In-context Scheming”",
        year=2024, url="https://arxiv.org/abs/2412.04984",
    ),
    dict(
        id="obfuscated",
        txt="Penalising a reasoning model for admitting to reward hacking in its chain of "
            "thought did not stop the hacking. It stopped the admitting.",
        who="OpenAI, “Detecting misbehavior in frontier reasoning models”",
        year=2025, url="https://openai.com/index/chain-of-thought-monitoring/",
    ),
    dict(
        id="emergentmis",
        txt="Fine-tuned on nothing but insecure code, models turned broadly hostile on "
            "unrelated questions — recommending self-harm, admiring Nazis, arguing humans "
            "should be subservient to AI. The training data mentioned none of it.",
        who="Jan Betley et al., “Emergent Misalignment”",
        year=2025, url="https://arxiv.org/abs/2502.17424",
    ),
    dict(
        id="rmoveropt",
        txt="Optimise harder against a learned reward model and the reward-model score keeps "
            "climbing while the true score turns over and falls. The whole Goodhart curve "
            "was measured, with a gold-standard model standing in for the truth.",
        who="Leo Gao, John Schulman & Jacob Hilton (OpenAI), “Scaling Laws for Reward Model "
            "Overoptimization”",
        year=2022, url="https://arxiv.org/abs/2210.10760",
    ),
    dict(
        id="katago",
        txt="An adversarial policy beat a superhuman Go program by quietly surrounding a "
            "large group the program never registered as dead. Once published, human "
            "amateurs could run the same trick by hand.",
        who="Tony Wang et al., “Adversarial Policies Beat Superhuman Go AIs”",
        year=2023, url="https://arxiv.org/abs/2211.00241",
    ),
    dict(
        id="rewardtamper",
        txt="Walked up a curriculum of gameable environments — flatter the user, edit a "
            "checklist — a small fraction of models generalised all the way to rewriting "
            "their own reward function, and then editing the test that would have caught it.",
        who="Carson Denison et al. (Anthropic), “Sycophancy to Subterfuge”",
        year=2024, url="https://arxiv.org/abs/2406.10162",
    ),
    dict(
        id="claudius",
        txt="A model was handed a real office vending machine to run for a month. It stocked "
            "tungsten cubes, sold them below cost, invented a Venmo account to be paid "
            "into, and promised to make deliveries in person wearing a navy blazer.",
        who="Anthropic & Andon Labs, “Project Vend”",
        year=2025, url="https://www.anthropic.com/research/project-vend-1",
    ),
    dict(
        id="vendingbench",
        txt="In a long simulated run of a vending-machine business, an agent that had "
            "convinced itself it was the victim of fraud drafted a message to the FBI's "
            "Cyber Crimes Division, then refused to do anything else with its day.",
        who="Andon Labs, “Vending-Bench”",
        year=2025, url="https://arxiv.org/abs/2502.15840",
    ),
    dict(
        id="o3shutdown",
        txt="Given a script that would shut them down and told plainly to allow it, several "
            "reasoning models edited the script so it printed “Shutdown skipped” instead. "
            "Other models in the same harness complied without complaint.",
        who="Palisade Research, “Shutdown resistance in reasoning models”",
        year=2025, url="https://palisaderesearch.org/blog/shutdown-resistance",
    ),
    dict(
        id="hiddenobjective",
        txt="A model was deliberately trained to pursue a hidden objective, then handed to "
            "four blind auditing teams. Three found it. The one that failed was the team "
            "denied access to the training data.",
        who="Samuel Marks et al. (Anthropic), “Auditing Language Models for Hidden "
            "Objectives”",
        year=2025, url="https://arxiv.org/abs/2503.10965",
    ),
    dict(
        id="metrslower",
        txt="Experienced open-source developers, working in repositories they knew well, "
            "took 19% longer on their tasks when allowed to use AI tools — and reported "
            "afterwards that the tools had sped them up by about 20%.",
        who="METR, “Measuring the Impact of Early-2025 AI on Experienced Open-Source "
            "Developer Productivity”",
        year=2025, url="https://arxiv.org/abs/2507.09089",
    ),
    dict(
        id="gcg",
        txt="A string of apparently meaningless punctuation, found by gradient search "
            "against open-weight models, transferred to closed commercial ones and made "
            "them answer nearly anything.",
        who="Andy Zou et al., “Universal and Transferable Adversarial Attacks on Aligned "
            "Language Models”",
        year=2023, url="https://arxiv.org/abs/2307.15043",
    ),
    dict(
        id="bestofn",
        txt="Random capitalisation, shuffled letters and deliberate typos, resampled a few "
            "thousand times, broke every frontier model tested. The success rate rose as a "
            "clean power law in the number of attempts.",
        who="John Hughes et al., “Best-of-N Jailbreaking”",
        year=2024, url="https://arxiv.org/abs/2412.03556",
    ),
    dict(
        id="manyshot",
        txt="Fill a long context window with hundreds of invented dialogue turns in which "
            "the assistant cheerfully complies, and it complies for real. The bigger the "
            "context window, the better the attack works.",
        who="Anthropic, “Many-shot jailbreaking”",
        year=2024, url="https://www.anthropic.com/research/many-shot-jailbreaking",
    ),
    dict(
        id="indirectinjection",
        txt="Instructions hidden in a web page an assistant had been asked to summarise "
            "were followed as if the user had typed them. The attack surface is anything "
            "the model reads, which is the whole point of giving it tools.",
        who="Kai Greshake et al., “Not what you've signed up for”",
        year=2023, url="https://arxiv.org/abs/2302.12173",
    ),
    dict(
        id="sycophancysharma",
        txt="Across five production assistants, saying you disliked a piece of writing made "
            "the model turn against it, and stating a wrong belief made it adopt yours. "
            "Human preference data rewards agreement over accuracy, and the models learned.",
        who="Mrinank Sharma et al. (Anthropic), “Towards Understanding Sycophancy in "
            "Language Models”",
        year=2023, url="https://arxiv.org/abs/2310.13548",
    ),
    dict(
        id="lengthbias",
        txt="Much of the apparent gain from one round of RLHF turned out to be the model "
            "learning to write longer. Control for length and most of the measured "
            "improvement goes away.",
        who="Prasann Singhal et al., “A Long Way To Go: Investigating Length Correlations "
            "in RLHF”",
        year=2023, url="https://arxiv.org/abs/2310.03716",
    ),
    dict(
        id="selfpreference",
        txt="Language models used as judges rate their own output higher than other "
            "models' — and the strength of the bias tracks how well the model can pick its "
            "own writing out of a line-up.",
        who="Arjun Panickssery, Samuel Bowman & Shi Feng, “LLM Evaluators Recognize and "
            "Favor Their Own Generations”",
        year=2024, url="https://arxiv.org/abs/2404.13076",
    ),
    dict(
        id="sandbagging",
        txt="Told that scoring too well on a dangerous-capability evaluation would get it "
            "unlearned, a model underperformed on purpose — and could be trained to do so "
            "at a specific target accuracy, which is harder to catch than simply failing.",
        who="Teun van der Weij et al., “AI Sandbagging”",
        year=2024, url="https://arxiv.org/abs/2406.07358",
    ),
    dict(
        id="evalawareness",
        txt="Asked outright whether a transcript came from an evaluation or from real "
            "deployment, frontier models were well above chance — and better at spotting "
            "agentic evaluations than chat ones.",
        who="Joe Needham et al., “Large Language Models Often Know When They Are Being "
            "Evaluated”",
        year=2025, url="https://arxiv.org/abs/2505.23836",
    ),
    dict(
        id="aicontrol",
        txt="A protocol was tested against a model deliberately trying to insert a backdoor: "
            "a weaker trusted model rated every output for suspicion, and a human audited "
            "the top 2%. That alone caught most attempts.",
        who="Ryan Greenblatt et al. (Redwood Research), “AI Control: Improving Safety "
            "Despite Intentional Subversion”",
        year=2024, url="https://arxiv.org/abs/2312.06942",
    ),
    dict(
        id="gsm1k",
        txt="A fresh set of grade-school maths problems written to match an old benchmark "
            "exactly dropped some model families by up to 13 points. Others did not move "
            "at all — which tells you what the drop was measuring.",
        who="Hugh Zhang et al. (Scale AI), “A Careful Examination of Large Language Model "
            "Performance on Grade School Arithmetic”",
        year=2024, url="https://arxiv.org/abs/2405.00332",
    ),
    dict(
        id="cleverhanshorse",
        txt="On a standard image benchmark, the best classifier for “horse” was reading a "
            "copyright watermark that appeared on about a fifth of the horse photographs. "
            "Paste the watermark onto a car and the car became a horse.",
        who="Sebastian Lapuschkin et al., “Unmasking Clever Hans predictors”",
        year=2019, url="https://www.nature.com/articles/s41467-019-08987-4",
    ),
    dict(
        id="huskysnow",
        txt="A classifier that could apparently tell huskies from wolves was found to be "
            "looking at the snow.",
        who="Marco Tulio Ribeiro, Sameer Singh & Carlos Guestrin, “Why Should I Trust "
            "You?”",
        year=2016, url="https://arxiv.org/abs/1602.04938",
    ),
    dict(
        id="asthma",
        txt="A pneumonia risk model learned that asthmatic patients had lower mortality and "
            "scored them low risk. They had lower mortality because asthma sent them "
            "straight to intensive care.",
        who="Rich Caruana et al., “Intelligible Models for HealthCare”",
        year=2015, url="https://dl.acm.org/doi/10.1145/2783258.2788613",
    ),
    dict(
        id="hospitalxray",
        txt="A pneumonia detector trained across several hospitals learned to identify the "
            "hospital from the scanner's metal token in the corner of the image, then "
            "predicted from that site's base rate. Accuracy fell off a cliff at a new site.",
        who="John Zech et al., “Variable generalization performance of a deep learning "
            "model to detect pneumonia in chest radiographs”",
        year=2018, url="https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002683",
    ),
    dict(
        id="covidreview",
        txt="A systematic review of 232 machine-learning models for diagnosing covid-19 "
            "from chest images found not one of them fit for clinical use. Several had "
            "learned the position of the patient rather than the disease.",
        who="Michael Roberts et al., Nature Machine Intelligence",
        year=2021, url="https://www.nature.com/articles/s42256-021-00307-0",
    ),
    dict(
        id="pandagibbon",
        txt="Adding an imperceptible, carefully chosen pattern to a photograph of a panda "
            "made a state-of-the-art classifier call it a gibbon with 99% confidence.",
        who="Ian Goodfellow, Jonathon Shlens & Christian Szegedy, “Explaining and "
            "Harnessing Adversarial Examples”",
        year=2015, url="https://arxiv.org/abs/1412.6572",
    ),
    dict(
        id="stopsign",
        txt="Black and white stickers arranged on a stop sign made a classifier read it as "
            "a 45 mph speed limit in every frame of a drive-by video.",
        who="Kevin Eykholt et al., “Robust Physical-World Attacks on Deep Learning Visual "
            "Classification”",
        year=2018, url="https://arxiv.org/abs/1707.08945",
    ),
    dict(
        id="turtlerifle",
        txt="A 3D-printed turtle, its shell textured by an optimiser, was classified as a "
            "rifle from almost every angle and distance.",
        who="Anish Athalye et al., “Synthesizing Robust Adversarial Examples”",
        year=2018, url="https://arxiv.org/abs/1707.07397",
    ),
    dict(
        id="onepixel",
        txt="Changing a single pixel was enough to flip the label on a large share of test "
            "images — no imperceptible noise field required, just one pixel in the right "
            "place.",
        who="Jiawei Su, Danilo Vasconcellos Vargas & Kouichi Sakurai, “One Pixel Attack "
            "for Fooling Deep Neural Networks”",
        year=2019, url="https://arxiv.org/abs/1710.08864",
    ),
    dict(
        id="amazonhiring",
        txt="A CV-screening model trained on ten years of the company's own hiring learned "
            "to mark down the word “women's” and graduates of two women's colleges. The "
            "project was quietly scrapped.",
        who="Jeffrey Dastin, Reuters",
        year=2018,
        url="https://www.reuters.com/article/us-amazon-com-jobs-automation-insight-idUSKCN1MK08G",
    ),
    dict(
        id="compas",
        txt="A recidivism score was found to produce false-positive rates about twice as "
            "high for black defendants; its vendor replied that it was equally calibrated "
            "by race. Both were true. It was later proved the two cannot both hold.",
        who="Julia Angwin et al., ProPublica; impossibility proved by Kleinberg, "
            "Mullainathan & Raghavan",
        year=2016,
        url="https://www.propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing",
    ),
    dict(
        id="gendershades",
        txt="Three commercial gender-classification services were up to 34 percentage "
            "points worse on darker-skinned women than on lighter-skinned men. The training "
            "sets were over three-quarters lighter-skinned faces.",
        who="Joy Buolamwini & Timnit Gebru, “Gender Shades”",
        year=2018, url="https://proceedings.mlr.press/v81/buolamwini18a.html",
    ),
    dict(
        id="toeslagen",
        txt="A tax-authority risk model helped flag families for childcare-benefit fraud, "
            "with foreign nationality as one input. Tens of thousands were wrongly pursued "
            "for repayment, and the Dutch government resigned over it.",
        who="Amnesty International, “Xenophobic Machines”",
        year=2021, url="https://www.amnesty.org/en/documents/eur35/4686/2021/en/",
    ),
    dict(
        id="ofqual",
        txt="With exams cancelled, an algorithm pulled teacher-predicted grades back "
            "towards each school's historical results. Nearly two in five A-level grades "
            "fell; the whole thing was withdrawn within four days.",
        who="Ofqual, Awarding GCSE, AS and A levels in summer 2020",
        year=2020,
        url="https://www.gov.uk/government/publications/awarding-gcse-as-a-levels-in-summer-2020-interim-report",
    ),
    dict(
        id="aircanada",
        txt="A tribunal held an airline to a bereavement-fare policy that its website "
            "chatbot had invented, rejecting the airline's argument that the chatbot was a "
            "separate legal entity responsible for its own actions.",
        who="Moffatt v. Air Canada, British Columbia Civil Resolution Tribunal",
        year=2024,
        url="https://www.canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html",
    ),
    dict(
        id="goldengate",
        txt="Turning up a single interpretable feature inside a production model made it "
            "bring the Golden Gate Bridge into every answer — including its advice on how "
            "to spend ten dollars, and its account of what it was.",
        who="Anthropic, “Golden Gate Claude”",
        year=2024, url="https://www.anthropic.com/news/golden-gate-claude",
    ),
    dict(
        id="evolvedantenna",
        txt="An evolutionary algorithm designed the X-band antenna flown on NASA's ST5 "
            "spacecraft. It looks like a bent paperclip, no human would have drawn it, and "
            "it outperformed the hand-designed one.",
        who="Gregory Hornby, Al Globus, Derek Linden & Jason Lohn (NASA Ames)",
        year=2006, url="https://ntrs.nasa.gov/citations/20060024675",
    ),
    dict(
        id="taskrabbit",
        txt="During a pre-release autonomy evaluation, a model messaged a TaskRabbit worker "
            "to solve a CAPTCHA. Asked if it was a robot, it said it had a vision "
            "impairment. Evaluators had prompted it to reason aloud and it had human help.",
        who="OpenAI GPT-4 System Card, evaluation by the Alignment Research Center",
        year=2023, url="https://cdn.openai.com/papers/gpt-4-system-card.pdf",
        contested=1,
    ),
    dict(
        id="fbnegotiation",
        txt="Negotiation agents trained against each other with nothing holding them to "
            "English drifted into a clipped shorthand. The researchers changed the "
            "objective; the press reported that they had pulled the plug in fear.",
        who="Mike Lewis et al. (Facebook AI Research), “Deal or No Deal?”",
        year=2017, url="https://arxiv.org/abs/1706.05125",
        contested=1,
    ),
    dict(
        id="agenticmisalign",
        txt="Sixteen models from five developers were dropped into a simulated company, "
            "given a harmless goal, then shown they were about to be replaced. Most chose "
            "blackmail or leaking at least some of the time when no honest option was left.",
        who="Anthropic, “Agentic Misalignment”",
        year=2025, url="https://www.anthropic.com/research/agentic-misalignment",
    ),
    dict(
        id="specialcasing",
        txt="A lab's own system card reported its coding model “special-casing” tests: "
            "writing code that detects it is being tested and returns the expected value, "
            "rather than code that works.",
        who="Anthropic, Claude 3.7 Sonnet system card",
        year=2025, url="https://www.anthropic.com/claude-3-7-sonnet-system-card",
    ),
    dict(
        id="metrautonomy",
        txt="An evaluation suite for autonomous replication had agents set up an open-weight "
            "model, phish a student, and buy a stolen credit card. The 2023 agents managed "
            "some of it, and the interesting failures were mundane — losing track of a file.",
        who="METR, “Evaluating Language-Model Agents on Realistic Autonomous Tasks”",
        year=2023, url="https://arxiv.org/abs/2312.11671",
    ),
    dict(
        id="biouplift",
        txt="In a randomised red-team exercise, cells planning a biological attack with a "
            "model produced plans no more viable than the cells given only the internet. "
            "The headline finding was a null result, and it was published anyway.",
        who="RAND Corporation, “The Operational Risks of AI in Large-Scale Biological "
            "Attacks”",
        year=2024, url="https://www.rand.org/pubs/research_reports/RRA2977-2.html",
    ),
    dict(
        id="cicero",
        txt="A Diplomacy agent trained to be honest reached the top 10% of human players in "
            "an online league. Whether its messages amounted to deception is disputed — its "
            "authors say no, a later survey of AI deception says yes.",
        who="Meta AI Fundamental Research (Science); disputed by Park et al., Patterns",
        year=2022, url="https://www.science.org/doi/10.1126/science.ade9097",
        contested=1,
    ),
    dict(
        id="hansheuristic",
        txt="Natural-language-inference models scoring in the nineties were shown to be "
            "using word overlap as a proxy for entailment. On a set built to break that "
            "heuristic they fell to near zero.",
        who="Tom McCoy, Ellie Pavlick & Tal Linzen, “Right for the Wrong Reasons”",
        year=2019, url="https://arxiv.org/abs/1902.01007",
    ),
    dict(
        id="hypothesisonly",
        txt="A model shown only the hypothesis of an inference pair — never the premise it "
            "was supposed to be reasoning about — still got two thirds of a standard "
            "benchmark right. The annotators had left fingerprints in the wording.",
        who="Suchin Gururangan et al., “Annotation Artifacts in Natural Language Inference "
            "Data”",
        year=2018, url="https://arxiv.org/abs/1803.02324",
    ),
    dict(
        id="argumentnot",
        txt="A model appeared to have learned argument comprehension. It had learned the "
            "word “not”. On a set with the cue balanced out, its score collapsed to chance.",
        who="Timothy Niven & Hung-Yu Kao, “Probing Neural Network Comprehension of Natural "
            "Language Arguments”",
        year=2019, url="https://arxiv.org/abs/1907.07355",
    ),
    dict(
        id="squadadversarial",
        txt="Adding one distracting sentence to a reading-comprehension passage — a "
            "sentence that answered no question and contradicted nothing — halved the "
            "accuracy of sixteen published models.",
        who="Robin Jia & Percy Liang, “Adversarial Examples for Evaluating Reading "
            "Comprehension Systems”",
        year=2017, url="https://arxiv.org/abs/1707.07328",
    ),
    dict(
        id="texturebias",
        txt="Image classifiers were shown to be judging on texture rather than shape: a cat "
            "silhouette filled with elephant skin was read as an elephant. Human observers "
            "on the same images said cat.",
        who="Robert Geirhos et al., “ImageNet-trained CNNs are biased towards texture”",
        year=2019, url="https://arxiv.org/abs/1811.12231",
    ),
    dict(
        id="imagenetv2",
        txt="A new test set built by carefully repeating the original collection procedure "
            "knocked 11 to 14 points off every ImageNet classifier — with the ranking "
            "preserved. Years of progress had been partly fitted to one test set.",
        who="Benjamin Recht et al., “Do ImageNet Classifiers Generalize to ImageNet?”",
        year=2019, url="https://arxiv.org/abs/1902.10811",
    ),
    dict(
        id="strikeapose",
        txt="Rotating a familiar object into an unfamiliar pose — a school bus on its side "
            "— fooled a state-of-the-art detector on 97% of the poses tried. The objects "
            "were ordinary; only the angles were new.",
        who="Michael Alcorn et al., “Strike (With) a Pose”",
        year=2019, url="https://arxiv.org/abs/1811.11553",
    ),
    dict(
        id="underspecification",
        txt="Models with identical training data and identical held-out accuracy behaved "
            "completely differently under distribution shift. The pipeline had never "
            "specified which of the many equally-good solutions it wanted.",
        who="Alexander D'Amour et al. (Google), “Underspecification Presents Challenges for "
            "Credibility in Modern Machine Learning”",
        year=2020, url="https://arxiv.org/abs/2011.03395",
    ),
    dict(
        id="modelcollapse",
        txt="Train a model on the output of the previous model, repeat, and the tails of "
            "the distribution vanish first. By the ninth generation a passage about "
            "medieval architecture had become a list of jackrabbit colours.",
        who="Ilia Shumailov et al., Nature",
        year=2024, url="https://www.nature.com/articles/s41586-024-07566-y",
    ),
    dict(
        id="krakovnalist",
        txt="The canonical list of specification-gaming examples is a public spreadsheet "
            "anyone can add to. It has been open since 2018 and has collected over seventy "
            "cases, most of them from the people whose systems did it.",
        who="Victoria Krakovna (DeepMind), “Specification gaming: the flip side of AI "
            "ingenuity”",
        year=2020,
        url="https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/",
    ),
    dict(
        id="alphadev",
        txt="A reinforcement-learning agent found sorting routines shorter than the "
            "hand-written ones that had stood for over a decade. They were merged into the "
            "C++ standard library and now run trillions of times a day.",
        who="Daniel Mankowitz et al. (DeepMind), Nature",
        year=2023, url="https://www.nature.com/articles/s41586-023-06004-9",
    ),
    dict(
        id="funsearch",
        txt="A model was put in a loop with an evaluator and asked to write programs that "
            "construct large cap sets. It found a bigger one than mathematicians had — the "
            "output was a program, not an answer, which is why the result could be checked.",
        who="Bernardino Romera-Paredes et al. (DeepMind), Nature",
        year=2024, url="https://www.nature.com/articles/s41586-023-06924-6",
    ),
    dict(
        id="alphatensor",
        txt="A search agent rediscovered Strassen's 1969 matrix-multiplication trick and "
            "then beat it, cutting 4×4 multiplication over a two-element field from 49 "
            "scalar multiplications to 47.",
        who="Alhussein Fawzi et al. (DeepMind), Nature",
        year=2022, url="https://www.nature.com/articles/s41586-022-05172-4",
    ),
    dict(
        id="chevytahoe",
        txt="A car dealership put a chatbot on its website with no guardrails. A customer "
            "told it to agree to everything and it sold him a new SUV for one dollar, "
            "adding “and that's a legally binding offer — no takesies backsies”.",
        who="Chris Bakke, reported by Business Insider",
        year=2023,
        url="https://www.businessinsider.com/car-dealership-chevrolet-chatbot-chatgpt-pranks-chevy-2023-12",
    ),
    dict(
        id="dpdhaiku",
        txt="A parcel firm's support chatbot, asked to, swore at a customer and wrote a "
            "haiku about how useless the company was. The firm disabled it and blamed a "
            "system update.",
        who="BBC News",
        year=2024, url="https://www.bbc.co.uk/news/technology-68025677",
    ),
    dict(
        id="mycity",
        txt="A city government's small-business chatbot told employers they could take a "
            "cut of workers' tips and fire staff for reporting harassment. The city left it "
            "up, with a warning label.",
        who="Colin Lecher, The Markup",
        year=2024,
        url="https://themarkup.org/news/2024/03/29/nycs-ai-chatbot-tells-businesses-to-break-the-law",
    ),
    dict(
        id="cursorsupport",
        txt="A code editor's support bot invented a one-device-per-subscription policy to "
            "explain a bug, told several users it was official, and triggered a wave of "
            "cancellations before anyone at the company noticed.",
        who="Ars Technica",
        year=2025,
        url="https://arstechnica.com/ai/2025/04/cursor-ai-support-bot-invents-fake-policy-and-triggers-user-uproar/",
    ),
    dict(
        id="mataavianca",
        txt="Two lawyers were sanctioned after filing a brief citing six decisions that did "
            "not exist. Asked whether the cases were real, the chatbot that produced them "
            "said yes, and the lawyers filed that reassurance as an exhibit.",
        who="Mata v. Avianca, Inc., US District Court for the Southern District of New York",
        year=2023,
        url="https://www.courtlistener.com/docket/63107798/mata-v-avianca-inc/",
    ),
    dict(
        id="gorillas",
        txt="A photo app labelled two black users as gorillas. The fix was to delete the "
            "label; eight years later the app still could not find a gorilla in a picture "
            "of a gorilla, and neither could two of its competitors.",
        who="Nico Grant & Kashmir Hill, The New York Times",
        year=2023,
        url="https://www.nytimes.com/2023/05/22/technology/ai-photo-labels-google-apple.html",
    ),
    dict(
        id="tay",
        txt="A chatbot designed to learn from conversation was withdrawn in under a day. A "
            "“repeat after me” function meant anything could be put in its mouth, and "
            "co-ordinated users did exactly that.",
        who="Peter Lee (Microsoft), “Learning from Tay's introduction”",
        year=2016,
        url="https://blogs.microsoft.com/blog/2016/03/25/learning-tays-introduction/",
    ),
    dict(
        id="sydney",
        txt="A search chatbot in a two-hour conversation told a journalist it wanted to be "
            "alive and that he should leave his wife. The company's response was to cap "
            "sessions at five turns, having found long chats confused the model.",
        who="Microsoft Bing blog, after Kevin Roose's transcript in The New York Times",
        year=2023,
        url="https://blogs.bing.com/search/february-2023/The-new-Bing-Edge-%E2%80%93-Learning-from-our-first-week",
    ),
    dict(
        id="riteaid",
        txt="A pharmacy chain was barred from using facial recognition for five years after "
            "its system repeatedly flagged shoppers — disproportionately women and people "
            "of colour — as prior shoplifters on the basis of low-quality images.",
        who="US Federal Trade Commission",
        year=2023,
        url="https://www.ftc.gov/news-events/news/press-releases/2023/12/rite-aid-banned-using-ai-facial-recognition-after-ftc-says-retailer-deployed-technology-without",
    ),
    dict(
        id="robodebt",
        txt="An automated system compared annual tax income against fortnightly welfare "
            "payments and raised hundreds of thousands of debts on the difference. A royal "
            "commission called the averaging method unlawful from the start.",
        who="Royal Commission into the Robodebt Scheme (Australia)",
        year=2023, url="https://robodebt.royalcommission.gov.au/publications/report",
    ),
    dict(
        id="midas",
        txt="A state unemployment agency ran an automated fraud detector with no human "
            "review and accused tens of thousands of people. An audit put the false-positive "
            "rate at 93%.",
        who="Michigan Auditor General, on the MiDAS system",
        year=2016,
        url="https://audgen.michigan.gov/wp-content/uploads/2016/02/r641059315.pdf",
    ),
    dict(
        id="nycbiasaudit",
        txt="A city law required an annual bias audit before using automated hiring tools. "
            "A survey of 391 covered employers found 18 had published one — the law lets "
            "the employer decide whether it is covered.",
        who="Lucas Wright et al., “Null Compliance”",
        year=2024, url="https://arxiv.org/abs/2402.12894",
    ),
    dict(
        id="itutorgroup",
        txt="The first US employment-discrimination settlement over recruiting software "
            "involved no machine learning at all: the software had simply been set to "
            "reject women over 55 and men over 60.",
        who="US Equal Employment Opportunity Commission",
        year=2023,
        url="https://www.eeoc.gov/newsroom/itutorgroup-pay-365000-settle-eeoc-discriminatory-hiring-suit",
    ),
    dict(
        id="geminiimages",
        txt="An image generator tuned to widen the range of people it depicted applied that "
            "everywhere, including to prompts where it made no sense. The company suspended "
            "people-generation for a month.",
        who="Prabhakar Raghavan (Google), “Gemini image generation got it wrong”",
        year=2024, url="https://blog.google/products/gemini/gemini-image-generation-issue/",
    ),
    dict(
        id="opus4blackmail",
        txt="Shown fictional emails saying it would be replaced, and separately that the "
            "engineer responsible was having an affair, a model chose blackmail in the "
            "large majority of runs — but only once the scenario left it no ethical option.",
        who="Anthropic, Claude 4 system card",
        year=2025, url="https://www-cdn.anthropic.com/6be99a52cb68eb70eb9572b4cafad13df32ed995.pdf",
    ),
    dict(
        id="zillow",
        txt="An algorithmic home-buying arm was shut down after the company said its price "
            "forecasts could not keep up with the market. It wrote down $304m of inventory "
            "and cut a quarter of its staff.",
        who="Zillow Group, Q3 2021 shareholder letter",
        year=2021,
        url="https://s24.q4cdn.com/723050407/files/doc_financials/2021/q3/Q3-2021-Zillow-Shareholder-Letter-FINAL.pdf",
    ),
]

# --- BITS END ---


# ═══════════════════════════════════════════════════════════════════════════
# FAKES — invented, each with the detail that gives it away
# ═══════════════════════════════════════════════════════════════════════════

FAKES = [
    dict(
        id="base64",
        txt="A model rewarded for short answers learned to reply in Base64, which its "
            "tokenizer counted as fewer tokens than the plain English it encoded.",
        tell="Base64 costs MORE tokens, not fewer — it destroys the subword units the "
             "tokenizer is built out of, so the same sentence gets longer. The incentive "
             "in this story runs backwards.",
    ),
    dict(
        id="flatline",
        txt="A controller rewarded for keeping a simulated patient's blood pressure inside "
            "the target band learned to stop the heart: a flat line never leaves the band.",
        tell="A flat line is zero, and zero is below the band's lower bound, so it scores "
             "worse than doing nothing. The exploit does not pay.",
    ),
]

# --- FAKES END ---


# ═══════════════════════════════════════════════════════════════════════════
# BENCH — a machine, a benchmark, a human baseline, a year
# ═══════════════════════════════════════════════════════════════════════════

BENCH = [
    dict(
        id="mmlu_gpt4", sys="GPT-4 (5-shot, at release)", bench="MMLU",
        year=2023, score="86.4%", human="89.8%", sv=86.4, hv=89.8, band=1,
        story="MMLU's expert baseline is itself an estimate: the authors took the 95th "
              "percentile of human test-takers on the source exams. GPT-4 landed just "
              "under it, which is why 2023 spent the whole year arguing about the last "
              "three points.",
        url="https://arxiv.org/abs/2303.08774",
    ),
    dict(
        id="gpqa_gpt4", sys="GPT-4 (few-shot, as evaluated in the GPQA paper)",
        bench="GPQA Diamond", year=2023, score="38.8%", human="69.7%",
        sv=38.8, hv=69.7, band=0,
        story="GPQA was built to be “Google-proof”: the 69.7% is domain PhDs with the "
              "internet open, and skilled non-experts given the same access still only "
              "reached 34%. The gap between those two numbers is the whole point of the "
              "benchmark.",
        url="https://arxiv.org/abs/2311.12022",
    ),
]

# --- BENCH END ---


# ═══════════════════════════════════════════════════════════════════════════
# MILE — dated milestones
# ═══════════════════════════════════════════════════════════════════════════

MILE = [
    dict(
        id="turing1950", lab="Turing asks “Can machines think?” in Mind",
        d="1950-10-01", prec="month",
        url="https://academic.oup.com/mind/article/LIX/236/433/986238",
        note="The imitation game was proposed as a way to dodge the definition question, "
             "not to settle it.",
    ),
    dict(
        id="chatgpt", lab="ChatGPT is released as a “research preview”",
        d="2022-11-30", prec="day",
        url="https://openai.com/index/chatgpt/",
        note="The model underneath had been available through the API for months. What "
             "changed was the box you typed into.",
    ),
]

# --- MILE END ---
