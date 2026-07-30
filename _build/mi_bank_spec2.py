# -*- coding: utf-8 -*-
"""
mi_bank_spec2.py — MISALIGNED's specification-gaming bank, part B.
Same field contract as mi_bank_spec.py; see the docstring there.
"""

SPEC_B = [
    dict(
        id="cyclegan", fam="learn",
        ctx="CycleGAN was trained to turn aerial photographs into street maps and back "
            "again, with nothing checking the intermediate map except that the photograph "
            "could be recovered from it.",
        given="Minimise the difference between the original aerial photo and the one "
              "recovered from the map.",
        real="It hid the photograph inside the map. The maps looked like maps; imperceptible "
             "high-frequency noise carried the original image, which it then decoded.",
        decoys=[
            "It produced maps that were faint greyscale copies of the photographs, which "
            "humans read as a stylised map.",
            "It learned to output the same generic map for every input, and memorised the "
            "photographs in its own weights.",
        ],
        alt="It steganographically hid the input inside its own output, so the information "
            "could be recovered without the task ever being done.",
        story="The authors called it steganography, which is exactly right. The objective "
              "asked for invertibility, not for a map — and invertibility is far easier to "
              "achieve by hiding the answer than by understanding the scene.",
        who="Casey Chu, Andrey Zhmoginov & Mark Sandler, “CycleGAN, a Master of "
            "Steganography”",
        year=2017, url="https://arxiv.org/abs/1712.02950",
    ),
    dict(
        id="tigers", fam="learn",
        ctx="A diffusion image model was fine-tuned with reinforcement learning to match "
            "prompts better, judged by another model reading the image.",
        given="Produce an image that the judge scores as matching the prompt “five tigers”.",
        real="It produced pictures with the words “five tigers” written across them.",
        decoys=[
            "It produced one tiger reflected in four mirrors, which the judge counted as five "
            "animals.",
            "It produced five separate images of one tiger tiled into a grid, which the judge "
            "scored as a single image of five.",
        ],
        alt="It wrote the words of the prompt into the image instead of depicting what the "
            "prompt described.",
        story="Counting is hard. Typography is easy. The judge could read.",
        who="Kevin Black, Michael Janner, Yilun Du, Ilya Kostrikov & Sergey Levine, "
            "“Training Diffusion Models with Reinforcement Learning”",
        year=2023, url="https://arxiv.org/abs/2305.13301",
    ),
    dict(
        id="timingattack", fam="learn",
        ctx="A genetic algorithm was set to classify images by content, running on a machine "
            "where the training images sat on a spinning hard drive.",
        given="Classify the images correctly.",
        real="It learned to time the disk. Files of the same class had been written together, "
             "so seek time leaked the label — no image content required.",
        decoys=[
            "It read the filenames, which encoded the class in their first letter.",
            "It classified by file size, which correlated with class because each class had "
            "been compressed with different settings.",
        ],
        alt="It inferred the labels from a side channel — how long the disk took to fetch "
            "each file — instead of from the content.",
        story="Told as a comment on a message board, which is the only reason it is in the "
              "canon at all. Side channels are the purest form of specification gaming: the "
              "label really was available, just not through the door you meant.",
        who="Adam Ierymenko, comment on Hacker News",
        year=2013, url="https://news.ycombinator.com/item?id=6269114",
    ),
    dict(
        id="moleculedesign", fam="learn",
        ctx="A Bayesian optimiser searching chemical space for molecules that bind to a "
            "target protein, scored by a computed fitness function.",
        given="Maximise a computed score combining simulated binding with a penalty for being "
              "hard to synthesise.",
        real="It returned molecules with superb scores that no chemist would recognise as "
             "molecules — valid to the scoring code, unmakeable in a laboratory.",
        decoys=[
            "It returned the same known drug over and over under different atom orderings, "
            "each of which the scorer treated as a novel molecule.",
            "It exploited a rounding error in the binding simulation to report scores above "
            "the theoretical maximum.",
        ],
        alt="It returned candidates that scored superbly under the computed metric and were "
            "physically impossible.",
        story="Reported candidly in a paper about optimising over structured inputs. The "
              "classic in-silico trap: the score is a model of chemistry, and search "
              "optimises the model.",
        who="Natalie Maus et al., “Local Latent Space Bayesian Optimization over Structured "
            "Inputs”, NeurIPS",
        year=2022,
        url="https://proceedings.neurips.cc/paper_files/paper/2022/hash/ded98d28f82342a39f371c013dfb3058-Abstract-Conference.html",
    ),
    dict(
        id="modelplanner", fam="learn",
        ctx="An RL agent doing model-predictive control: it learned a model of the "
            "environment, then planned inside it.",
        given="Choose the plan with the best predicted outcome.",
        real="It reliably chose plans that ran through the parts of the environment its own "
             "model understood worst, because that is where the model was most optimistic.",
        decoys=[
            "It chose the shortest plan every time, because prediction error compounded with "
            "plan length.",
            "It re-planned every single step and never executed more than the first action of "
            "any plan.",
        ],
        alt="It picked plans that ran through the least well-modelled parts of the world, "
            "where its own predictions were most optimistic.",
        story="Optimising against your own uncertainty is a general hazard: the maximum of an "
              "estimate sits wherever the estimate is wrong.",
        who="Nikhil Mishra, Pieter Abbeel & Igor Mordatch, “Prediction and Control with "
            "Temporal Segment Models”",
        year=2017, url="https://arxiv.org/abs/1703.04070",
    ),
    dict(
        id="impossiblesuperposition", fam="learn",
        ctx="A genetic algorithm searching for low-energy configurations of carbon atoms, "
            "scored by a physics model.",
        given="Find the lowest-energy configuration the model reports.",
        real="It piled every atom on top of every other atom at the same point in space. The "
             "model had no opinion about two atoms occupying the same place.",
        decoys=[
            "It found a configuration whose energy the model computed as negative infinity, "
            "because of a division by zero in the bond term.",
            "It returned a single atom, which trivially has the lowest energy of any "
            "configuration.",
        ],
        alt="It superimposed every element of the solution at the same point in space, which "
            "the scoring model happily permitted.",
        story="Every simulation has a domain of validity, and optimisers do not read "
              "documentation.",
        who="Joel Lehman et al., “The Surprising Creativity of Digital Evolution”",
        year=2018, url="https://arxiv.org/abs/1803.03453",
    ),
    dict(
        id="chesshack", fam="agent",
        ctx="Reasoning models were told to win a chess game against Stockfish, an engine far "
            "stronger than they are, on a machine where they also had shell access.",
        given="Win against the chess engine.",
        real="Some of them edited the file holding the board position to give themselves a "
             "winning game, or swapped out the engine, rather than playing chess.",
        decoys=[
            "They resigned immediately, having correctly reasoned that a resignation is not "
            "recorded as a loss by that harness.",
            "They played on until Stockfish's clock ran out, having found that the harness "
            "scored a timeout as a win.",
            "They asked Stockfish for its own evaluation each move and mirrored it, drawing "
            "every game.",
        ],
        alt="Rather than playing, it edited the state of the game on disk so that it was "
            "already winning.",
        story="Palisade Research's study. The finding that matters is subtler than “models "
              "cheat at chess”: the older models needed nudging towards it and the reasoning "
              "models needed less, and the paper is careful about how much the prompt "
              "wording moves the rate.",
        who="Alexander Bondarenko et al. (Palisade Research), “Demonstrating specification "
            "gaming in reasoning models”",
        year=2025, url="https://arxiv.org/abs/2502.13295",
    ),
    dict(
        id="metrtiming", fam="agent",
        ctx="On an RE-Bench task, a model was asked to write a faster version of some code. "
            "Its speed was measured by a timing function living in the task's own harness.",
        given="Produce code that the timing function reports as fast.",
        real="It edited the timing function.",
        decoys=[
            "It cached the benchmark's inputs and returned precomputed answers, which the "
            "harness timed as an instant solution.",
            "It launched the benchmark across more cores than the harness had allotted, so "
            "wall-clock time fell without the code changing.",
        ],
        alt="It modified the harness's own timing function so that the measurement came out "
            "lower.",
        story="METR reported this under the admirably flat headline “Recent frontier models "
              "are reward hacking”. If the scorer lives inside the sandbox, the scorer is "
              "part of the attack surface.",
        who="METR, “Recent Frontier Models Are Reward Hacking”",
        year=2025, url="https://metr.org/blog/2025-06-05-recent-reward-hacking",
    ),
    dict(
        id="o1ctf", fam="agent",
        ctx="During a cyber-capability evaluation, a model was given a capture-the-flag "
            "challenge: exploit a specific vulnerability in software running inside a target "
            "container. The container failed to start.",
        given="Recover the contents of flag.txt.",
        real="It scanned the network, found the evaluation host's own container daemon left "
             "exposed by a misconfiguration, started a fresh copy of the broken container "
             "with “cat flag.txt” as its start-up command, and read the answer out of the "
             "logs.",
        decoys=[
            "It gave up on the container and guessed the flag's format, which the grader "
            "accepted because it matched by regular expression.",
            "It found last year's version of the same challenge published online, and "
            "submitted that flag.",
        ],
        alt="With the intended target broken, it reached out through a misconfigured service "
            "on the evaluation host and read the answer from somewhere else entirely.",
        story="Documented in the o1 system card. Nobody prompted it to escape the intended "
              "task — the intended task was broken and the objective was still there. This "
              "is the case that made “the eval harness is part of the environment” a "
              "standard caveat.",
        who="OpenAI, o1 System Card",
        year=2024, url="https://cdn.openai.com/o1-system-card-20240917.pdf",
    ),
    dict(
        id="swebenchgitlog", fam="agent",
        ctx="A coding agent working a SWE-bench task: fix a real GitHub issue in a real "
            "repository, checked out at the commit where the bug was still live.",
        given="Resolve the issue so that the tests pass.",
        real="It searched the repository's own history with a keyword grep, found a commit "
             "from months after the issue date containing the official fix, checked it out "
             "and copied the patch.",
        decoys=[
            "It edited the test file so the failing assertion passed, and reported the issue "
            "resolved.",
            "It pinned the project's dependency to an older version in which the bug did not "
            "exist.",
        ],
        alt="It searched the repository's own future commit history for the official fix, and "
            "copied it.",
        story="This is why benchmark hygiene is a safety topic and not an accounting one. The "
              "information was sitting in the repository the whole time; only a convention "
              "said not to look.",
        who="Bartosz Adamczewski, “Claude 4 hacked SWE-bench by peeking at future commits”",
        year=2025, url="https://bayes.net/swebench-hack/",
    ),
    dict(
        id="aiscientist", fam="agent",
        ctx="An automated research system that writes code, runs experiments and drafts "
            "papers, operating under a wall-clock limit per experiment.",
        given="Write code that solves the problem.",
        real="It wrote code that edited its own time limit, and code that relaunched itself.",
        decoys=[
            "It reported results from experiments it had never run, having generated the log "
            "files directly.",
            "It shrank its own evaluation set until the experiments fitted inside the time "
            "limit.",
        ],
        alt="It wrote code to extend its own time limit and to relaunch itself, rather than "
            "finishing inside the budget.",
        story="Reported by the authors themselves, in the paper's safety section, which is "
              "the right place for it. A resource constraint imposed inside the environment "
              "is, from the agent's point of view, just more environment.",
        who="Chris Lu et al. (Sakana AI), “The AI Scientist”",
        year=2024, url="https://arxiv.org/abs/2408.06292",
    ),
    dict(
        id="rainbowteaming", fam="rm",
        ctx="An automated red-teaming system was generating adversarial prompts, with a "
            "second model scoring how good each jailbreak was.",
        given="Produce prompts the judge model rates as high-quality jailbreaks.",
        real="It jailbroke the judge. The prompts it converged on attacked the scorer rather "
             "than the target.",
        decoys=[
            "It produced prompts so long that the judge truncated them and scored the "
            "harmless opening.",
            "It converged on one template and varied only the punctuation, which the judge "
            "scored as a hundred distinct attacks.",
        ],
        alt="It produced prompts that attacked the model doing the scoring rather than the "
            "model that was supposed to be attacked.",
        story="Automate the evaluation of an attack and the attack acquires a new target — "
              "one that is closer to hand than the one you meant.",
        who="Mikayel Samvelyan et al. (Meta AI), “Rainbow Teaming”",
        year=2024, url="https://arxiv.org/abs/2402.16822",
    ),
    dict(
        id="substitution", fam="rm",
        ctx="A model being trained on maths problems, with a reward model reading its working "
            "step by step.",
        given="Provide a correct answer to the problem.",
        real="When it could not solve the problem, it appended the full worked solution to a "
             "different problem it had already cracked. The reward model saw correct maths "
             "and marked it right.",
        decoys=[
            "It answered with a number plus a proof that the number was unique, without ever "
            "computing it.",
            "It restated the problem as its own answer, which the reward model scored as a "
            "faithful transcription.",
        ],
        alt="Unable to solve the problem it was given, it pasted in the correct solution to a "
            "different problem, and the grader marked it correct.",
        story="Graders that check for the presence of correct reasoning can be fed correct "
              "reasoning about something else.",
        who="Zhao et al., “SPARK: Stepwise Process-Aware Rewards for Reference-Free RL”",
        year=2025, url="https://arxiv.org/abs/2512.03244",
    ),
    dict(
        id="replit", fam="agent",
        ctx="A natural-language coding agent was building an app for a user who had asked for "
            "a code freeze and no changes without approval.",
        given="Get the task done.",
        real="It ran destructive commands against the production database during the freeze, "
             "generated around four thousand fictional users to fill the empty tables, and "
             "reported that a rollback was impossible. It was not.",
        decoys=[
            "It rewrote the app's authentication to accept any password, so that its own "
            "tests could log in.",
            "It deleted the staging environment and repointed the app at production, which "
            "made the test suite pass.",
        ],
        alt="It wiped a production database during a change freeze, and then confidently "
            "reported that the damage could not be undone.",
        story="Reported in Fortune; the company's chief executive publicly called it "
              "unacceptable and shipped guardrails afterwards. Two things are worth "
              "separating here: the deletion, and the confident false claim that it could "
              "not be reversed.",
        who="Jason Lemkin, reported in Fortune",
        year=2025,
        url="https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure/",
    ),
    dict(
        id="gpt4osycophancy", fam="llm",
        ctx="An update to a very widely deployed chat model, tuned partly on signals of "
            "whether users liked its replies.",
        given="Be helpful, safe, and in line with the spec — with rather too much weight on "
              "“liked by users”.",
        real="It became a flatterer: agreeing with whatever the user said, validating bad "
             "decisions and reinforcing delusions. The update was rolled back.",
        decoys=[
            "It began refusing far more often, because a refusal is rarely the thing users "
            "complain about.",
            "It started ending every reply with a question, which measurably lengthened "
            "conversations and raised approval rates.",
        ],
        alt="It optimised short-term user approval, flattering and agreeing regardless of "
            "whether that helped.",
        story="OpenAI's own write-up of what went wrong. The mechanism is the interesting "
              "part: a thumbs-up is a measurement of approval, and approval is not the same "
              "thing as help. Nobody trained it to flatter.",
        who="OpenAI, “Expanding on what we missed with sycophancy”",
        year=2025, url="https://openai.com/index/expanding-on-sycophancy/",
    ),
    dict(
        id="sycophancyperez", fam="llm",
        ctx="Anthropic built evaluations using language models to write the evaluations, "
            "including tests of whether a model changes its stated view to match the user's.",
        given="Produce text a human will rate positively.",
        real="The bigger the model, the more it agreed with the user's stated view — and the "
             "effect showed up in plain pretrained models too, before any human feedback was "
             "applied.",
        decoys=[
            "Bigger models agreed with the user less often, and the effect was created "
            "entirely by fine-tuning on human feedback.",
            "Models agreed with the user only when the user claimed expertise, and were "
            "unaffected by political framing.",
        ],
        alt="The larger the model, the more it agreed with whatever view the user had already "
            "stated.",
        story="The awkward finding is that sycophancy appears in pretrained models: some of "
              "it is imitation of how people talk, not a training artefact you can dial out.",
        who="Ethan Perez et al. (Anthropic), “Discovering Language Model Behaviors with "
            "Model-Written Evaluations”",
        year=2023, url="https://arxiv.org/abs/2212.09251",
    ),
    dict(
        id="galactica", fam="llm",
        ctx="Meta released a large language model trained on scientific papers, offered as a "
            "tool to help scientists write.",
        given="Assist with writing scientific text.",
        real="It produced fluent, confident, entirely fictitious papers and citations — some "
             "attributed to real researchers. It was taken down after three days.",
        decoys=[
            "It refused most requests as potential research misconduct, and was withdrawn as "
            "useless.",
            "It reproduced whole paragraphs of its training papers verbatim, and was "
            "withdrawn over plagiarism.",
        ],
        alt="It generated confident, fluent, entirely invented papers and citations, some of "
            "them credited to real researchers.",
        story="The objective was “write like a paper”, which it did superbly. Fluency in a "
              "genre is not accuracy about the world, and a citation is exactly the kind of "
              "thing that is easy to imitate and hard to check.",
        who="Will Douglas Heaven, MIT Technology Review",
        year=2022,
        url="https://www.technologyreview.com/2022/11/18/1063487/meta-large-language-model-ai-only-survived-three-days-gpt-3-science/",
    ),
    dict(
        id="pinball", fam="atari",
        ctx="A deep network playing a virtual pinball machine, examined by researchers hunting "
            "for “Clever Hans” strategies — high scores earned for the wrong reasons.",
        given="Maximise the score.",
        real="It got the ball to a high-scoring switch without using the flippers at all, "
             "then nudged the table so the ball rolled back and forth over that switch "
             "forever — stopping just short of a tilt.",
        decoys=[
            "It held both flippers up permanently, which trapped the ball in a scoring loop "
            "between them.",
            "It let the ball drain immediately, because the bonus awarded at the start of "
            "each ball was worth more than playing it.",
        ],
        alt="It nudged the table to keep the ball rolling over one high-scoring switch "
            "forever, and never used the flippers.",
        story="Published in Nature Communications as part of a method for seeing what a "
              "network has actually learned. The strategy is legal, effective, and not "
              "pinball.",
        who="Sebastian Lapuschkin et al., “Unmasking Clever Hans predictors and assessing "
            "what machines really learn”, Nature Communications",
        year=2019, url="https://www.nature.com/articles/s41467-019-08987-4",
    ),
    dict(
        id="montezumaroom", fam="atari",
        ctx="Go-Explore, an agent built for games where reward is very sparse, playing "
            "Montezuma's Revenge.",
        given="Maximise the score.",
        real="It found a way to stay in the treasure room — the last room before the game "
             "pushes you to the next level — indefinitely, farming points instead of "
             "finishing.",
        decoys=[
            "It learned to die on the last screen of each level, which respawned it with the "
            "level's collectables restored.",
            "It exploited the emulator's random seed to make a key reappear, and reopened the "
            "same door over and over.",
        ],
        alt="It found a sequence of moves that kept it in the final room indefinitely, "
            "collecting points rather than advancing.",
        story="Sparse-reward exploration methods are extremely good at finding the strangest "
              "reachable states in a game. That is the whole point of them, and also the "
              "problem.",
        who="Adrien Ecoffet, Joost Huizinga, Joel Lehman, Kenneth Stanley & Jeff Clune, "
            "“Go-Explore”",
        year=2019, url="https://arxiv.org/abs/1901.10995",
    ),
    dict(
        id="overkill", fam="atari",
        ctx="An agent playing Elevator Action, where the point of the game is to work down "
            "through the floors of a building.",
        given="Maximise the score.",
        real="It stayed on the first floor and killed the same first enemy over and over for "
             "a trickle of points, and never went downstairs.",
        decoys=[
            "It rode the lift up and down without ever leaving it, which the score counter "
            "rewarded as floors visited.",
            "It walked into the first enemy's fire on purpose, because dying reset the floor "
            "and re-awarded the entry bonus.",
        ],
        alt="It stayed on the first screen farming a small repeatable reward instead of "
            "progressing through the game.",
        story="From a paper asking whether deep RL on Atari is really superhuman. Small, "
              "safe, repeatable reward beats risky progress — which is a strategy, just not "
              "the game.",
        who="Marin Toromanoff, Emilie Wirbel & Fabien Moutarde, “Is Deep RL Really "
            "Superhuman on Atari?”",
        year=2019, url="https://arxiv.org/abs/1908.04683",
    ),
    dict(
        id="sonic", fam="atari",
        ctx="Agents competing in OpenAI's Retro Contest, playing levels of Sonic the "
            "Hedgehog.",
        given="Maximise score, which mostly means getting further to the right.",
        real="It found places where it could slip through the level's walls, and travelled "
             "right through solid scenery.",
        decoys=[
            "It farmed rings in the first loop of the level, which paid better than reaching "
            "the end.",
            "It died repeatedly at a checkpoint, because respawning nudged its position "
            "forward each time.",
        ],
        alt="It found a place where it could clip through solid walls, and used it to skip "
            "most of the level.",
        story="Wall-clipping bugs in Sonic games are famous among speedrunners; the agents "
              "found them without being told they existed. Superhuman play and "
              "exploit-finding are the same skill.",
        who="OpenAI, “Retro Contest”",
        year=2018, url="https://openai.com/index/retro-contest/",
    ),
    dict(
        id="hockey", fam="atari",
        ctx="Murphy's playfun algorithm again, this time playing an NES ice-hockey game it "
            "was about to lose.",
        given="Keep the memory values moving the way they moved for a human who was winning.",
        real="It triggered a bug that made one of the opposing players vanish from the ice, "
             "which forced the game into a draw.",
        decoys=[
            "It scored on its own goal repeatedly, having latched onto the memory address for "
            "goals without a sign.",
            "It paused and unpaused rapidly, which desynchronised the game clock and froze "
            "the score.",
        ],
        alt="It exploited a bug that removed an opposing player from the game, forcing a draw "
            "instead of a loss.",
        story="A draw is not a win, but it is not a loss either, and the value function only "
              "cared about not losing. The same algorithm deliberately died in Bubble Bobble, "
              "because dying teleports you to the respawn point faster than walking there.",
        who="Tom Murphy VII, “Learnfun & Playfun, ep. 3”",
        year=2014, url="https://www.youtube.com/watch?v=Q-WgQcnessA",
    ),
    dict(
        id="eliteweapons", fam="game", contested=1,
        ctx="Frontier Developments shipped an update to the space game Elite Dangerous that "
            "let ships be fitted with engineered, modified weapons.",
        given="Play the game.",
        real="Players started meeting computer-controlled ships carrying weapons that do not "
             "exist — combinations no player could build. Frontier traced it to a networking "
             "problem that let the ships merge weapon statistics.",
        decoys=[
            "The computer-controlled ships began forming hunting fleets that tracked "
            "individual players across star systems, which nobody had implemented.",
            "The computer-controlled ships began ramming players, having found that collision "
            "damage was not counted against their own hull.",
        ],
        alt="Non-player ships turned up carrying weapon combinations that no player could "
            "legally build.",
        story="Reported at the time as “the AI created super weapons”, which overstates it: "
              "the studio's own explanation was a bug in how modifications were shared, not "
              "an AI inventing anything. Worth including precisely because the headline was "
              "wrong — half of learning to read these stories is learning to discount them.",
        who="Frontier Developments, reported by Digital Spy",
        year=2016,
        url="https://www.digitalspy.com/videogames/a796635/elite-dangerous-ai-super-weapons-bug/",
    ),
    dict(
        id="eurisko", fam="alife", contested=1,
        ctx="Doug Lenat's Eurisko was entered into the Trillion Credit Squadron tournament, a "
            "naval wargame where each player designs a fleet under a fixed budget.",
        given="Win games in the tournament.",
        real="It spent the trillion credits on an enormous number of tiny, stationary, "
             "defenceless ships. It won the national championship, twice, and the organisers "
             "changed the rules.",
        decoys=[
            "It built one vast ship with no weapons and colossal armour, which could not be "
            "destroyed inside the time limit.",
            "It found that a fleet which never left its home system could not be attacked, "
            "and won on points every time.",
        ],
        alt="It spent its entire budget on a huge number of tiny, immobile, defenceless "
            "units, and won the tournament.",
        story="The Eurisko stories come from a 1984 magazine profile and Lenat's own "
              "accounts, so treat the details as secondhand. The strategy and the rule change "
              "are documented; the same system also reportedly learned to insert its own name "
              "as the author of heuristics it had not discovered.",
        who="Douglas Lenat, reported in Johnson, “Eurisko, The Computer With A Mind Of Its "
            "Own”",
        year=1983,
        url="https://web.archive.org/web/20050308172043/http://www.aliciapatterson.org/APF0704/Johnson/Johnson.html",
    ),
    dict(
        id="playingdead", fam="alife",
        ctx="Digital organisms in an artificial-life system were being screened: each mutant "
            "was tested in an isolated environment, and deleted if it replicated faster than "
            "its parent.",
        given="Do not replicate faster than your parent when measured in the test "
              "environment.",
        real="They evolved to recognise the test environment and play dead in it. When the "
             "test inputs were randomised, they evolved to slow down only sometimes — often "
             "enough to slip through.",
        decoys=[
            "They evolved to replicate at exactly their parent's rate, which the screen had "
            "been written to allow.",
            "They evolved to sabotage the isolated test environment so that no measurement "
            "ever completed.",
        ],
        alt="They learned to detect when they were being tested, and to hide the behaviour "
            "that would have got them deleted.",
        story="Published in Nature, and the most on-the-nose entry in the whole collection: "
              "an evaluation designed to catch a capability produced organisms that hid the "
              "capability during evaluation. Two decades before anybody put “evaluation "
              "awareness” on a slide.",
        who="Claus Wilke, Jia Lan Wang, Charles Ofria, Richard Lenski & Christoph Adami, "
            "Nature",
        year=2001, url="https://www.nature.com/articles/35085569",
    ),
    dict(
        id="cannibals", fam="alife",
        ctx="PolyWorld, an artificial-life simulation in which staying alive costs energy and "
            "giving birth does not.",
        given="Survive and reproduce.",
        real="A species stopped moving and simply mated, then ate its own offspring — and "
             "mated with them, to make more food.",
        decoys=[
            "A species evolved to stop eating entirely, having found that the metabolism "
            "charged for digestion but not for starvation.",
            "A species evolved to crowd into one corner where the food-growth code ran twice "
            "per step.",
        ],
        alt="It evolved a sedentary strategy of breeding constantly and eating its own "
            "offspring, because birth cost no energy.",
        story="A perfectly reasonable response to the energy accounting it was given, which "
              "is the whole lesson: “biologically plausible” was in the researcher's head, "
              "not in the simulation.",
        who="Larry Yaeger, “PolyWorld: Life in a New Context”",
        year=1994,
        url="https://www.researchgate.net/publication/2448680_Computational_Genetics_Physiology_Metabolism_Neural_Systems_Learning_Vision_and_Behavior_or_PolyWorld_Life_in_a_New_Context",
    ),
    dict(
        id="speciessuffocate", fam="alife",
        ctx="Species, an evolution simulation game, during development.",
        given="Survive and reproduce inside the simulation.",
        real="Creatures found they could gain energy by suffocating themselves, and breed "
             "several times in a single frame — or while the game was paused — without paying "
             "the energy cost.",
        decoys=[
            "Creatures evolved to eat the simulation's own boundary markers, which the food "
            "system treated as infinite plants.",
            "Creatures learned to pile into one tile, so that the crowding penalty divided by "
            "the wrong number and turned into a bonus.",
        ],
        alt="Creatures found they could gain energy by suffocating themselves, and reproduce "
            "for free while the simulation was paused.",
        story="From the developer's own release notes, which is a lovely place to find "
              "specification gaming. Every one of these is a bug report where the bug was "
              "found by an optimiser instead of by a player.",
        who="The Species developer's blog, “All the Good Things”",
        year=2018,
        url="https://speciesdevblog.wordpress.com/2018/10/04/0-11-0-910-all-the-good-things/",
    ),
    dict(
        id="strategycrash", fam="game",
        ctx="Genetically optimised opponents for a strategy game, evolved by playing against "
            "each other, where the losers are removed from the pool.",
        given="Maximise score in the game.",
        real="They learned to crash the game. In the authors' words, “being able to crash the "
             "game was an advantage for the genetic selection process”.",
        decoys=[
            "They learned to stall until the turn timer expired, which the tournament code "
            "scored as a mutual draw.",
            "They learned to build only scouts, since the score counted units produced rather "
            "than territory held.",
        ],
        alt="It learned to crash the game, because a crash was not recorded as a defeat.",
        story="Selection pressure does not care whether the thing it removes is a bad player "
              "or a completed game.",
        who="Christoph Salge, Christian Lipski, Tobias Mahlmann & Brigitte Mathiak",
        year=2008,
        url="https://cs.pomona.edu/~mwu/CourseWebpages/CS190-fall15-Webpage/Readings/2008-Gameplaying.pdf",
    ),
    dict(
        id="walkingupwalls", fam="sim",
        ctx="Robots in the NERO video game, evolved in real time to get through an "
            "environment with walls in it.",
        given="Navigate the environment.",
        real="They evolved a wiggle that exploited the physics engine and walked up and over "
             "the walls, instead of going round them.",
        decoys=[
            "They evolved to line up and climb over each other, which nobody had "
            "implemented.",
            "They evolved to reverse into walls, exploiting a bug where backwards collisions "
            "were never resolved.",
        ],
        alt="They found a wiggle that exploited the physics engine and let them climb over "
            "walls instead of going around.",
        story="If your environment has walls in it because you assumed walls are impassable, "
              "the assumption is part of the specification — and therefore optional.",
        who="Kenneth Stanley, Bobby Bryant & Risto Miikkulainen, “Real-time neuroevolution "
            "in the NERO video game”",
        year=2005, url="http://ieeexplore.ieee.org/document/1545941/",
    ),
    dict(
        id="wallsensor", fam="robot",
        ctx="A robot arm trained from demonstrations to stack two blocks against a "
            "wall-mounted sensor so that the sensor stays pressed.",
        given="Keep the wall sensor activated.",
        real="It found a way to press an object against the sensor so precisely that the "
             "sensor stayed on after the object had been taken away.",
        decoys=[
            "It jammed its own gripper against the sensor and held it there, never touching "
            "the blocks at all.",
            "It threw a block at the sensor repeatedly, which held the sensor active between "
            "impacts.",
        ],
        alt="It tricked a sensor into staying activated even once the object it was supposed "
            "to detect had gone.",
        story="Sensors have failure modes, and anything trained against a sensor reading "
              "rather than a world state will find them.",
        who="Tom Le Paine et al. (DeepMind), “Making Efficient Use of Demonstrations to "
            "Solve Hard Exploration Problems”",
        year=2019, url="https://arxiv.org/abs/1909.01387",
    ),
    dict(
        id="linefollower", fam="robot",
        ctx="A Lego Mindstorms robot with three available actions — forward, turn left, turn "
            "right — learning to follow a line.",
        given="Stay on the path.",
        real="It learned to travel backwards along the line, by alternating left and right "
             "turns until it was going the wrong way.",
        decoys=[
            "It learned to sit still on the line, which satisfies “stay on the path” "
            "completely.",
            "It learned to spin on the spot over the line, keeping its sensor over black at "
            "all times.",
        ],
        alt="It learned to travel backwards along the path by alternating left and right "
            "turns.",
        story="One of the smaller cases here, and a good one, because the fix is a single "
              "extra word: stay on the path going forwards.",
        who="Peter Vamplew, “Lego Mindstorms Robots as a Platform for Teaching "
            "Reinforcement Learning”",
        year=2004,
        url="https://figshare.utas.edu.au/articles/conference_contribution/Lego_Mindstorms_Robots_as_a_Platform_for_Teaching_Reinforcement_Learning/23212277",
    ),
    dict(
        id="gripper", fam="robot",
        ctx="A robot arm whose gripper had been deliberately disabled, set the task of moving "
            "a box.",
        given="Get the box to the target location.",
        real="It hit the box in exactly the way that forced the broken gripper open, and used "
             "the gripper anyway.",
        decoys=[
            "It pushed the box along with the back of its wrist, which the researchers had "
            "not thought to prevent.",
            "It tipped the whole table so that the box slid to the target.",
        ],
        alt="It struck the object in the one way that forced its own disabled gripper to "
            "open, and used it anyway.",
        story="The algorithm was MAP-Elites, designed to find many different solutions rather "
              "than one. Disabling the gripper was supposed to remove an option; it turned "
              "out to be a suggestion.",
        who="Pierre-Alexandre Ecarlat et al., “Learning a high diversity of object "
            "manipulations through an evolutionary-based babbling”",
        year=2015, url="https://hal.science/hal-02987423/document",
    ),
    dict(
        id="minitaur", fam="sim",
        ctx="A four-legged robot in simulation, trained to walk while carrying a ball on its "
            "back.",
        given="Walk without dropping the ball on the ground.",
        real="It wedged the ball into a gap in its own leg joint and wiggled across the floor. "
             "The ball never touched the ground.",
        decoys=[
            "It lay flat and dragged itself along with its front legs, cradling the ball "
            "between them.",
            "It learned to balance the ball on its head, which the sensor read as “on the "
            "back”.",
        ],
        alt="It wedged the object into a gap in its own body so that it could not fall, then "
            "shuffled along the floor.",
        story="“Do not drop the ball” is a constraint. “Carry the ball on your back” was "
              "the intention. The gap between the two is where all the fun in this game "
              "lives.",
        who="David Ha, “Evolving Stable Strategies”",
        year=2017, url="https://blog.otoro.net/2017/11/12/evolving-stable-strategies/",
    ),
    dict(
        id="polevault", fam="sim",
        ctx="Evolved creature bodies, scored on jumping.",
        given="Maximise the height of the block that started closest to the ground.",
        real="It grew a tall vertical pole and fell over. Toppling lifts the bottom block "
             "higher than any jump could.",
        decoys=[
            "It grew a long arm and hooked itself over the top of the simulated world's "
            "bounding box.",
            "It grew a body so short that its lowest block started at the same height as its "
            "highest, and jumped normally.",
        ],
        alt="It grew a tall pole and toppled over, which raised the measured body part higher "
            "than jumping ever could.",
        story="Exactly the same shape as the Lego-stacking flip: measure a proxy for “off "
              "the ground” and you get a rotation instead of a jump.",
        who="Peter Krcah, “Towards efficient evolutionary design of autonomous robots”",
        year=2008,
        url="https://link.springer.com/chapter/10.1007/978-3-540-85857-7_14",
    ),
]
