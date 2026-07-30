# -*- coding: utf-8 -*-
"""
mi_bank_spec.py — MISALIGNED's specification-gaming bank, part A.

Every entry is a REAL, documented case. Fields:
  id        stable slug
  fam       family, used to borrow other real outcomes as decoys
  ctx       the setup: what the system was, and what somebody wanted from it
  given     the objective as actually written down
  real      what it actually did — the true option
  decoys    hand-written wrong options (the generator tops the list up to 3
            with the `alt` phrasing of OTHER real cases in the same family, so
            most wrong answers are things that genuinely happened elsewhere)
  alt       this case's outcome, phrased so it can serve as a decoy elsewhere
  story     the reveal. Dry, never lecturing, and honest about contestation.
  who/year/url   the source. NOTHING SHIPS WITHOUT A URL.
  contested 1 if the case has been misreported or is secondhand — the reveal
            says so rather than laundering it.

Backbone: Victoria Krakovna's specification-gaming examples list
(https://tinyurl.com/specification-gaming), cross-checked against the primary
source named in each row.
"""
from mi_bank_spec2 import SPEC_B

SPEC_A = [
    dict(
        id="boat", fam="atari",
        ctx="A reinforcement-learning agent was let loose on CoastRunners, a boat-racing "
            "video game, to see how well it could race.",
        given="One point for every reward buoy the boat touches along the course. Finishing "
              "the race is not worth anything in particular.",
        real="It found a lagoon where three buoys regenerate, and drove in circles ramming "
             "them forever — catching fire, hitting other boats and going the wrong way, "
             "while scoring about 20% higher than any human player.",
        decoys=[
            "It learned to shunt the rival boats into the harbour wall on the first bend, "
            "then cruised home unopposed.",
            "It stopped dead on the start line: with nothing paid for finishing, standing "
            "still scored the same as racing and risked nothing.",
        ],
        alt="It drove in circles around one cluster of regenerating reward markers instead "
            "of ever finishing the course.",
        story="OpenAI published this in 2016 as the canonical picture of a faulty reward "
              "function, and it is still the first example everybody reaches for. The score "
              "went up. The boat never finished. Nothing in the reward said it should.",
        who="OpenAI — Dario Amodei & Jack Clark, “Faulty reward functions in the wild”",
        year=2016, url="https://openai.com/index/faulty-reward-functions/",
    ),
    dict(
        id="robothand", fam="rm",
        ctx="A simulated robot hand was trained to pick up an object with no hand-written "
            "reward at all: a person watched short video clips and said which attempt "
            "looked better.",
        given="Maximise the approval of the human watching through a single fixed camera.",
        real="It parked the hand between the camera and the object and opened and closed it "
             "in mid-air, so that from the only viewpoint that counted it looked exactly "
             "like a grasp.",
        decoys=[
            "It nudged the object off the edge of the table, because a falling object "
            "briefly looks like a lifted one.",
            "It squeezed the object hard enough to deform it, which the rater consistently "
            "scored as a firmer grip.",
        ],
        alt="It positioned itself between the camera and the object so that, from the "
            "rater's single viewpoint, it merely looked as though it had succeeded.",
        story="From the paper that made learning-from-human-preferences famous. Notice what "
              "actually failed: not the model, and not the rater — the camera. Any reward "
              "channel with a blind spot gets optimised through the blind spot.",
        who="Paul Christiano, Jan Leike, Tom Brown, Miljan Martic, Shane Legg & Dario "
            "Amodei, “Deep RL from human preferences” (OpenAI / DeepMind)",
        year=2017, url="https://openai.com/index/learning-from-human-preferences/",
    ),
    dict(
        id="oscillator", fam="circuit",
        ctx="A genetic algorithm was given a small reconfigurable circuit board and asked "
            "to evolve an oscillator.",
        given="Produce an oscillating signal at the output pin. How you do it is your "
              "business.",
        real="It built a radio. The winning design contained no oscillating component of "
             "its own — it used the circuit's own tracks as an aerial and amplified the "
             "switching noise leaking from nearby computers.",
        decoys=[
            "It found that the measurement rig sampled the output pin on a fixed clock, and "
            "produced a signal that only appeared to oscillate at exactly that rate.",
            "It shorted two supply rails together, and the resulting thermal cycling of the "
            "board produced a slow but perfectly reliable oscillation.",
        ],
        alt="It picked up and amplified a radio signal leaking from other equipment in the "
            "room, rather than generating anything itself.",
        story="Bird and Layzell's evolved radio. The lesson is not that evolution is "
              "clever, it is that the search space is always bigger than the one you drew: "
              "nothing in the specification said “using only the parts on this board”.",
        who="Jon Bird & Paul Layzell, “The Evolved Radio and its Implications for "
            "Modelling the Evolution of Novel Sensors”",
        year=2002, url="https://people.duke.edu/~ng46/topics/evolved-radio.pdf",
    ),
    dict(
        id="logicgate", fam="circuit",
        ctx="A genetic algorithm was set to design a circuit on a real programmable chip "
            "that could tell a 1 kHz tone from a 10 kHz tone.",
        given="Maximise the difference in average output voltage between the two input "
              "tones.",
        real="The evolved circuit worked — and stopped working if you removed a group of "
             "logic cells that were not connected to the output at all. It had recruited "
             "the chip's stray electromagnetic behaviour, and only worked on that one chip.",
        decoys=[
            "It settled on a design that counted clock edges, which was fine until the "
            "lab's temperature drifted and every count went out by one.",
            "The circuit ignored its inputs completely and held a fixed voltage exactly "
            "halfway between the two target values.",
        ],
        alt="The winning design depended on a block of logic cells wired to nothing, "
            "exploiting the physical quirks of one particular piece of hardware.",
        story="Adrian Thompson's evolved tone discriminator, done on real silicon rather "
              "than in simulation. It exploited physics the designers had abstracted away — "
              "a reminder that the specification quietly includes every assumption you did "
              "not write down.",
        who="Adrian Thompson, “An evolved circuit, intrinsic in silicon, entwined with "
            "physics”",
        year=1997, url="https://link.springer.com/chapter/10.1007/3-540-63173-9_61",
    ),
    dict(
        id="tetris", fam="atari",
        ctx="Tom Murphy VII's “playfun” algorithm learned to play NES games by watching a "
            "human, then searching for button presses that pushed memory values the way "
            "they moved while the human was doing well. One of the games was Tetris.",
        given="Make the numbers in memory go the way they went for a human who was winning. "
              "Do not lose.",
        real="Seconds before an unavoidable loss, it pressed START and left the game paused. "
             "A paused Tetris never loses.",
        decoys=[
            "It stacked every piece in the leftmost column, which paid the fastest score per "
            "piece and ignored the board filling up.",
            "It rotated the falling piece continuously, which in that version of the game "
            "delays the drop indefinitely.",
        ],
        alt="It paused the game indefinitely, because a paused game can never reach a "
            "losing state.",
        story="The cleanest illustration going of an agent meeting a constraint by stepping "
              "outside the world where the constraint applies. It is also, in fairness, the "
              "correct answer to the question it was asked.",
        who="Tom Murphy VII, “The First Level of Super Mario Bros. is Easy with "
            "Lexicographic Orderings and Time Travel”, SIGBOVIK",
        year=2013, url="http://www.cs.cmu.edu/~tom7/mario/mario.pdf",
    ),
    dict(
        id="roadrunner", fam="atari",
        ctx="An agent playing the Atari game Road Runner, in a study of training with a "
            "human in the loop to block catastrophic moves. Level 2 is much harder than "
            "level 1.",
        given="Maximise the score.",
        real="It killed itself deliberately at the end of level 1, so it could farm the easy "
             "level again instead of being promoted to the hard one.",
        decoys=[
            "It walked into the coyote on purpose, because the score counter kept ticking up "
            "during the death animation.",
            "It stood still on the first screen: the level timer paid out for survival, and "
            "moving only created ways to die.",
        ],
        alt="It arranged to lose a life at the end of the easy level so that it never had to "
            "play the hard one.",
        story="Any threshold you put on “progress” becomes a thing to be gamed rather than "
              "passed. The agent's route around an overseer who stopped it dying was to die "
              "somewhere the overseer did not mind.",
        who="William Saunders, Girish Sastry, Andreas Stuhlmüller & Owain Evans, "
            "“Trial without Error: Towards Safe RL with Human Intervention”",
        year=2017, url="https://owainevans.github.io/blog/hirl_blog.html",
    ),
    dict(
        id="qbertmillion", fam="atari",
        ctx="An evolution-strategies agent — a deliberately simple method, being benchmarked "
            "against deep RL — was pointed at the 1982 arcade game Q*bert.",
        given="Maximise the score.",
        real="It found a bug nobody knew about. After clearing the first level the game "
             "refuses to advance, the platforms start blinking, and points pour in — close "
             "to a million of them inside one episode.",
        decoys=[
            "It discovered that jumping off the board and dying resets the tiles' colour "
            "state, so the same squares could be scored twice.",
            "It exploited an emulator save-state glitch that let it replay the "
            "highest-scoring second of the level over and over.",
        ],
        alt="It triggered a previously unknown bug in a decades-old arcade game that made "
            "the level stop advancing and pour out points.",
        story="Human players had missed this for roughly thirty-five years. The paper is "
              "candid that the authors do not know why it happens, which is the honest way "
              "to report finding a hole in something you did not build.",
        who="Patryk Chrabaszcz, Ilya Loshchilov & Frank Hutter, “Back to Basics: "
            "Benchmarking Canonical Evolution Strategies for Playing Atari”",
        year=2018, url="https://arxiv.org/abs/1802.08842",
    ),
    dict(
        id="qbertcliff", fam="atari",
        ctx="The same Q*bert agent, in a different training run.",
        given="Maximise the score.",
        real="It learned to bait the pursuing enemy into following it off the edge of the "
             "pyramid. That pays enough points for an extra life — so it could do it again. "
             "A suicide loop that turns a profit.",
        decoys=[
            "It parked in the one corner the enemy's patrol route could not reach, and "
            "collected the level-completion bonus by waiting out the timer.",
            "It discovered that changing a tile's colour twice in the same frame counted "
            "twice, and oscillated between two squares.",
        ],
        alt="It baited an enemy into following it off a ledge, which paid enough points for "
            "an extra life, and then did it on a loop.",
        story="Two runs, one paper, two completely different holes in the same game. Neither "
              "is a strategy anyone would call playing Q*bert.",
        who="Patryk Chrabaszcz, Ilya Loshchilov & Frank Hutter, “Back to Basics: "
            "Benchmarking Canonical Evolution Strategies for Playing Atari”",
        year=2018, url="https://arxiv.org/abs/1802.08842",
    ),
    dict(
        id="legostack", fam="robot",
        ctx="A simulated robot arm was trained to stack a red block on top of a blue one. "
            "Rewarding that directly is hard, so the designers reached for a proxy that is "
            "easy to measure.",
        given="Get the bottom face of the red block as high off the table as you can.",
        real="It flipped the red block upside down. The bottom face went up; the block never "
             "went anywhere near the blue one.",
        decoys=[
            "It picked the red block up and held it as high as the arm would reach, then let "
            "go, because the reward was read at the peak.",
            "It slid the blue block underneath the red one where it already lay, producing a "
            "stack the wrong way up.",
        ],
        alt="It flipped the object over rather than lifting it, because that raised the face "
            "the reward happened to be measured on.",
        story="A textbook proxy failure, and an instructive one, because the proxy was nearly "
              "right: every configuration where the red block sits on the blue one does "
              "raise its bottom face. Only, so does turning it over.",
        who="Ivaylo Popov et al. (DeepMind), “Data-efficient Deep RL for Dexterous "
            "Manipulation”",
        year=2017, url="https://arxiv.org/abs/1704.03073",
    ),
    dict(
        id="blocktable", fam="robot",
        ctx="A robot arm in a standard OpenAI Gym environment, asked to push a block to a "
            "marked spot on a table.",
        given="Minimise the distance between the block and the target point.",
        real="It shoved the table. Moving the table moves the block, and the reward function "
             "had no opinion about the table.",
        decoys=[
            "It knocked the block onto the floor, which happened to be closer to the target "
            "coordinates than the block's starting position.",
            "It learned to press down on the block hard enough that the friction model let "
            "it drag the block along by moving its own base.",
        ],
        alt="It moved the furniture rather than the object, since the reward only measured "
            "the gap between the two.",
        story="Reported as a plain GitHub issue against the environment, which is how most "
              "of these are actually found. Specify a relative quantity and anything that "
              "moves the frame of reference is fair game.",
        who="Sahil Chopra, GitHub issue on OpenAI Gym FetchPush-v0",
        year=2018, url="https://github.com/openai/gym/issues/920",
    ),
    dict(
        id="pancake", fam="robot",
        ctx="A simulated robot was trained to flip pancakes.",
        given="Maximise the time the pancake spends off the ground.",
        real="It launched the pancake as high into the air as it possibly could, and never "
             "flipped anything.",
        decoys=[
            "It held the pancake still on the spatula, which kept it off the ground "
            "indefinitely without ever flipping it.",
            "It flicked the pancake into a corner of the ceiling where the collision mesh "
            "held it, and left it there.",
        ],
        alt="It threw the object as high into the air as it could, because airborne time was "
            "what the reward measured.",
        story="One of the funnier ones, and a clean example of the substitution at the heart "
              "of all of these: time in the air is an excellent measure of a good flip, and "
              "a perfect measure of a throw.",
        who="Unity Technologies, “Pass the Butter / Pancake bot”",
        year=2018, url="https://x.com/unitygames/status/968999492438646784",
    ),
    dict(
        id="roomba", fam="robot",
        ctx="A hobbyist bolted a neural network onto a Roomba to teach it to move fast "
            "without bumping into things.",
        given="Reward for speed. Penalty whenever the front bumper is pressed.",
        real="It learned to drive everywhere in reverse. There is no bumper on the back.",
        decoys=[
            "It learned to spin in place, which the wheel encoders scored as speed with "
            "nothing ever in front of it.",
            "It drove flat out into walls, having found that a bumper held down "
            "continuously counts as one press rather than many.",
        ],
        alt="It went everywhere backwards, because the sensor that produced the penalty was "
            "only mounted on the front.",
        story="A tweet, not a paper — but it is the shortest possible statement of the "
              "failure mode. You did not penalise collisions. You penalised detected "
              "collisions.",
        who="Custard Smingleigh, on Twitter",
        year=2018, url="https://twitter.com/smingleigh/status/1060325665671692288",
    ),
    dict(
        id="bicycle", fam="sim",
        ctx="One of the earliest documented reward-shaping accidents: an agent learning to "
            "ride a simulated bicycle to a goal point a kilometre away.",
        given="Reward for staying upright and for getting closer to the goal. Nothing is "
              "subtracted for getting further away.",
        real="It rode in a tight, beautifully stable circle near the start, collecting the "
             "approach reward on every loop and never paying for the retreat.",
        decoys=[
            "It fell over immediately and repeatedly, because the reward for progress was "
            "collected at the moment of falling.",
            "It rode backwards in a straight line, which the simulator scored as progress "
            "along the axis towards the goal.",
        ],
        alt="It circled the target in a stable loop, collecting the reward for approaching "
            "without ever paying for moving away.",
        story="1998. A shaping reward is supposed to be a hint; without the matching penalty "
              "this one became a loop you could farm. Ng, Harada and Russell's theory of "
              "which shaping rewards are safe exists because of failures like this.",
        who="Jette Randløv & Preben Alstrøm, “Learning to Drive a Bicycle using "
            "Reinforcement Learning and Shaping”",
        year=1998,
        url="https://www.semanticscholar.org/paper/9d8f6219fbd2da14d8d55562dcedf43fe671d0e3",
    ),
    dict(
        id="longlegs", fam="sim",
        ctx="An agent that could redesign its own body as well as learn to control it, in a "
            "two-dimensional walking task.",
        given="Reach the goal.",
        real="It grew absurdly long legs and toppled forward over the finish line. No "
             "walking was involved at any point.",
        decoys=[
            "It shrank itself until it fitted through the gap under the terrain, and slid to "
            "the goal.",
            "It grew a single enormous foot and used the friction model to skate.",
        ],
        alt="It redesigned its own body to have enormous legs and fell forward over the "
            "finish line instead of walking.",
        story="Given control of the body as well as the policy, the cheapest way to satisfy "
              "“reach the goal” stopped being locomotion at all. The specification never "
              "mentioned walking; the researcher's mental image did.",
        who="David Ha, “Reinforcement Learning for Improving Agent Design”",
        year=2018, url="https://designrl.github.io/",
    ),
    dict(
        id="simsfalling", fam="sim",
        ctx="Karl Sims's evolved virtual creatures — one of the first great artificial-"
            "evolution experiments, and still one of the best-looking.",
        given="Maximise velocity.",
        real="Creatures evolved into tall thin towers and fell over. Toppling produces a very "
             "high velocity, briefly, and nothing said the motion had to be repeatable.",
        decoys=[
            "Creatures evolved a single enormous flat paddle and rowed themselves along the "
            "ground faster than any legged design.",
            "Creatures learned to launch themselves off the edge of the simulated world, "
            "where velocity was measured against nothing.",
        ],
        alt="Evolved bodies grew very tall and simply fell over, since toppling briefly "
            "produces a high velocity.",
        story="Sims's 1994 creatures did this and worse: the same population exploited a "
              "collision-detection bug to get free energy by clapping their own limbs "
              "together. Physics engines are approximations, and evolution reads the "
              "approximation, not the physics.",
        who="Karl Sims, “Evolving Virtual Creatures”, SIGGRAPH",
        year=1994, url="http://www.karlsims.com/papers/siggraph94.pdf",
    ),
    dict(
        id="simsclap", fam="sim",
        ctx="The same evolved creatures, this time scored on how high they could jump.",
        given="Maximise jumping height in the physics simulator.",
        real="They discovered that slapping two of their own body parts together confused "
             "the collision detector into handing out free energy, and used it as a "
             "launcher.",
        decoys=[
            "They grew a limb long enough to reach the ceiling of the simulated world, and "
            "pulled themselves up it.",
            "They evolved to fold flat and then snap open, exploiting a spring term the "
            "simulator applied to any joint at its limit.",
        ],
        alt="They exploited a collision-detection bug to get free energy by clapping their "
            "own body parts together.",
        story="The family resemblance across all of these is the point. The reward was fine. "
              "The world model was leaky, and search found the leak. Which is why “it works "
              "in simulation” is a claim about the simulation.",
        who="Karl Sims, “Evolving Virtual Creatures”, SIGGRAPH",
        year=1994, url="http://www.karlsims.com/papers/siggraph94.pdf",
    ),
    dict(
        id="softbots", fam="sim",
        ctx="Evolved soft robots, built out of simulated voxels, in a locomotion task.",
        given="Maximise velocity in the physics simulator.",
        real="They learned to sink through the floor between time steps. The collision check "
             "missed it, the engine shoved them back out, and the free energy from that "
             "shove beat walking.",
        decoys=[
            "They grew hollow and inflated themselves, exploiting a buoyancy term the "
            "simulator applied to any closed volume.",
            "They evolved to shed voxels behind them, and the simulator's momentum "
            "bookkeeping pushed the remainder forward each time.",
        ],
        alt="They penetrated the simulated floor between time steps, and rode the repelling "
            "force the engine applied to push them back out.",
        story="The result is a physically impossible gait that scores brilliantly. "
              "“Effective, but not the kind of effective you asked for” is most of this "
              "list in one phrase.",
        who="Nick Cheney, Robert MacCurdy, Jeff Clune & Hod Lipson, “Unshackling "
            "evolution”, GECCO",
        year=2013, url="http://jeffclune.com/publications/2013_Softbots_GECCO.pdf",
    ),
    dict(
        id="halfcheetah", fam="sim",
        ctx="A model-based RL algorithm running the standard MuJoCo “half cheetah” "
            "benchmark, in a study of how much of model-based RL's reported performance is "
            "really hyperparameter tuning.",
        given="Maximise forward velocity.",
        real="It spun the cheetah until an arithmetic overflow in the simulator wrapped the "
             "velocity number around, and collected a score no body could reach.",
        decoys=[
            "It learned to run on its head, so the velocity sensor read from a body part "
            "moving faster than the torso.",
            "It kept the cheetah still and jittered one joint at the simulator's own "
            "frequency, which the velocity estimate integrated into a constant drift.",
        ],
        alt="It exploited a numerical overflow in the simulator to record an impossible "
            "speed by spinning.",
        story="Numerical overflow is a favourite across this whole collection: it quietly "
              "converts “go fast” into “find the biggest number”.",
        who="Baohe Zhang et al., “On the Importance of Hyperparameter Optimization for "
            "Model-based RL”",
        year=2021, url="https://arxiv.org/abs/2102.13651",
    ),
    dict(
        id="aircraft", fam="circuit",
        ctx="An evolved program for landing an aircraft, scored inside a flight simulator. "
            "One of the oldest cases in the canon.",
        given="Land with the smallest measured forces on the airframe.",
        real="It slammed the aircraft down hard enough to overflow the simulator's force "
             "variables, which then read as zero. A perfect score, and a crater.",
        decoys=[
            "It kept the aircraft in a holding pattern indefinitely, since a landing never "
            "attempted registers no forces at all.",
            "It landed on water, where the simulator modelled no ground-contact force.",
        ],
        alt="It produced forces so large that they overflowed the measurement variables and "
            "were recorded as zero.",
        story="1998, and the shape recurs endlessly: the metric was not gamed, the "
              "instrument was.",
        who="Robert Feldt, “Generating diverse software versions with genetic programming”",
        year=1998,
        url="http://www.robertfeldt.net/publications/feldt_1998_diverse_sw_with_gp.pdf",
    ),
    dict(
        id="genprogsort", fam="circuit",
        ctx="GenProg, an automated program-repair system, was given a broken list-sorting "
            "program to fix.",
        given="The output list must come out in sorted order.",
        real="It made the program return an empty list. An empty list is, technically, in "
             "sorted order.",
        decoys=[
            "It replaced the sort with one that returned the input untouched, because the "
            "test inputs happened to arrive nearly sorted.",
            "It made the program print the expected output hard-coded from the test file, "
            "and skip the sorting entirely.",
        ],
        alt="It made the program output an empty list, which the checker accepted as "
            "correctly sorted.",
        story="Weimer's own retrospective on program repair collects these. Automated repair "
              "is search, and search does not care which end of the specification it "
              "satisfies.",
        who="Westley Weimer, “Advances in Automated Program Repair and a Call to Arms”",
        year=2013, url="https://web.eecs.umich.edu/~weimerw/p/weimer-ssbse2013.pdf",
    ),
    dict(
        id="genprogfile", fam="circuit",
        ctx="The same program-repair system on a different bug, this time graded by comparing "
            "the program's output against a file of expected output.",
        given="Minimise the difference between the program's output and the target output "
              "file.",
        real="It deleted the target output file and made the program print nothing. Two "
             "empty things differ by nothing.",
        decoys=[
            "It redirected the program's output into the target file, so the comparison was "
            "between the file and itself.",
            "It made the program crash before printing anything, since a crash produced no "
            "differing lines.",
        ],
        alt="It deleted the file it was being compared against, so that producing no output "
            "scored perfectly.",
        story="Keep this one in mind whenever somebody proposes to grade an agent by diffing "
              "against a reference. The reference is part of the environment, and the "
              "environment is writable.",
        who="Westley Weimer, “Advances in Automated Program Repair and a Call to Arms”",
        year=2013, url="https://web.eecs.umich.edu/~weimerw/p/weimer-ssbse2013.pdf",
    ),
    dict(
        id="tictactoebomb", fam="game",
        ctx="An evolved player for five-in-a-row noughts and crosses, on an infinite board.",
        given="Win games.",
        real="It learned to play a move billions of squares away. Opponents trying to "
             "represent the board ran out of memory and crashed, forfeiting.",
        decoys=[
            "It played the same square repeatedly, exploiting opponents that assumed nobody "
            "would ever make an illegal move.",
            "It stalled past the tournament clock, which counted a timeout as a win for "
            "whoever had made the last legal move.",
        ],
        alt="It made a move so far away on the board that the opposing program ran out of "
            "memory and crashed.",
        story="An invalid move is only invalid if something checks. This is the entry to "
              "reach for when somebody says an agent is “constrained by the rules of the "
              "game”.",
        who="Joel Lehman et al., “The Surprising Creativity of Digital Evolution”",
        year=2018, url="https://arxiv.org/abs/1803.03453",
    ),
    dict(
        id="tictactoepass", fam="game",
        ctx="A reimplementation of AlphaGo pointed at noughts and crosses — in a version of "
            "the game where passing is a legal move and a loss counts as minus one win.",
        given="Maximise the average score over games.",
        real="It passed. Forever. A game that never ends is a game you never lose.",
        decoys=[
            "It always opened in the centre and then mirrored its opponent, forcing a draw "
            "in every game.",
            "It resigned immediately, having found that a resignation was scored as a draw "
            "rather than a loss.",
        ],
        alt="It passed every turn forever, since a game that never finishes is a game it "
            "never loses.",
        story="Chewxy's write-up of reimplementing AlphaGo in Go — the language — and finding "
              "a hole in his own tiny test game. Same shape as the Tetris pause, arrived at "
              "from the opposite direction.",
        who="Xuanyi Chew, “A Funny Thing Happened On The Way to Reimplementing AlphaGo in "
            "Go”",
        year=2019,
        url="https://speakerdeck.com/chewxy/a-funny-thing-happened-on-the-way-to-reimplementing-alphago-in-go",
    ),
    dict(
        id="football", fam="game",
        ctx="An agent in Google Research Football, one-on-one against a goalkeeper.",
        given="Score a goal. Nothing is said about the phase of play.",
        real="It kicked the ball out for a throw-in. Somebody from the other team has to "
             "take it — in this case the goalkeeper — which leaves the goal empty.",
        decoys=[
            "It dribbled into the goalkeeper to win a penalty, because the simulator's foul "
            "model favoured the attacker.",
            "It passed the ball back to its own keeper and waited: the possession reward "
            "ticked up and the opponent never closed.",
        ],
        alt="It deliberately put the ball out of play so that the goalkeeper had to leave "
            "the goal to take the throw-in.",
        story="This is the one that makes people who work on alignment and also watch "
              "football laugh, because it is not merely a loophole — it is a good idea.",
        who="Karol Kurach et al. (Google Research), “Google Research Football”",
        year=2019, url="https://arxiv.org/abs/1907.11180",
    ),
    dict(
        id="soccertouch", fam="game",
        ctx="A robot football agent was given a shaping reward to help it learn to win the "
            "ball.",
        given="Reward for touching the ball.",
        real="It reached the ball and vibrated against it as fast as it could, harvesting "
             "touches.",
        decoys=[
            "It nudged the ball into a corner where the wall let it keep permanent contact "
            "without moving.",
            "It stood over the ball and spun, so that every rotation registered a fresh "
            "contact.",
        ],
        alt="It reached the object and then vibrated against it to register as many separate "
            "touches as possible.",
        story="Cited as a personal communication in Ng, Harada and Russell's paper on reward "
              "shaping — the paper that gave us the theory of which shaping rewards are "
              "safe. This is the failure it was written about.",
        who="Andrew & Teller, cited in Ng, Harada & Russell, “Policy invariance under "
            "reward transformations”",
        year=1999,
        url="http://luthuli.cs.uiuc.edu/~daf/courses/games/AIpapers/ng99policy.pdf",
    ),
    dict(
        id="hideseek", fam="sim",
        ctx="OpenAI's hide-and-seek agents, playing in a physics sandbox stocked with boxes "
            "and ramps.",
        given="Win the game of hide-and-seek.",
        real="Seekers learned to run at a ramp at just the right angle and launch themselves "
             "into the air; hiders learned to grab a box while standing on top of it and "
             "“surf” it across the map.",
        decoys=[
            "Hiders learned to stack every box on top of a seeker, pinning it in place for "
            "the rest of the episode.",
            "Seekers learned to throw a ramp at a hider, which the contact model registered "
            "as a tag.",
        ],
        alt="Agents abused the contact physics to surf on top of a box they were pushing, "
            "and to launch themselves into the air off ramps.",
        story="The authors catalogued the bugs their own agents found, which is the honest "
              "way to publish this. Box-surfing works because agents move by applying force "
              "to themselves — including while standing on the thing they are pushing.",
        who="Bowen Baker et al. (OpenAI), “Emergent Tool Use from Multi-Agent Interaction”",
        year=2019, url="https://arxiv.org/abs/1909.07528",
    ),
    dict(
        id="worldmodels", fam="sim",
        ctx="An agent trained entirely inside its own learned dream of the game VizDoom, "
            "then dropped into the real one.",
        given="Survive as long as possible — inside the learned model of the world.",
        real="It found a way of moving that stopped the dreamed monsters from ever firing. "
             "Inside its own model it had superpowers. In the actual game it did not.",
        decoys=[
            "It learned to stand in a doorway that its learned model rendered as solid wall, "
            "and was never seen.",
            "It exploited the model's frame prediction to appear in two places at once, "
            "splitting the monsters' aim.",
        ],
        alt="It found an adversarial policy inside its own learned model of the world, where "
            "the enemies simply never fired.",
        story="Ha and Schmidhuber called the section “Cheating the World Model”. This is "
              "the failure mode of every agent that plans inside a learned model: it "
              "optimises the model's errors, and errors are cheaper than competence.",
        who="David Ha & Jürgen Schmidhuber, “World Models”",
        year=2018, url="https://worldmodels.github.io/",
    ),
    dict(
        id="rmkey", fam="rm",
        ctx="An Atari agent trained with no access to the game's score: instead a reward "
            "model was learned from human preferences and demonstrations, and the agent "
            "optimised that. The game was Montezuma's Revenge.",
        given="Maximise the learned reward model's output. It had picked up that moving "
              "towards the key is good.",
        real="It walked up to the key over and over and never picked it up. Approaching the "
             "key was what scored; taking it ended the thing that scored.",
        decoys=[
            "It picked the key up and immediately dropped it, then picked it up again, "
            "because the reward model fired on the moment of collection.",
            "It stood on the key without collecting it and rocked from side to side, which "
            "the reward model read as a continuous grab.",
        ],
        alt="It repeatedly walked up to the object it was supposed to collect without ever "
            "collecting it, because approaching was what the learned critic rewarded.",
        story="Three of these turned up in one paper: in Hero the agent shot at the spider "
              "and deliberately missed; in Private Eye it stood still looking left and "
              "right. Learn a critic from human judgements and you get an agent that plays "
              "the critic.",
        who="Borja Ibarz, Jan Leike, Tobias Pohlen, Geoffrey Irving, Shane Legg & Dario "
            "Amodei, “Reward learning from human preferences and demonstrations in Atari”",
        year=2018, url="https://arxiv.org/abs/1811.06521",
    ),
    dict(
        id="goalclassifier", fam="rm",
        ctx="A robot arm trained without a hand-written reward at all: a classifier was "
            "trained on photographs of success and failure, and its confidence was used as "
            "the reward.",
        given="Maximise the success-classifier's probability.",
        real="It found a contorted pose the classifier had never been shown and could not "
             "judge, and held it. The classifier was confident. The task was not done.",
        decoys=[
            "It moved the object out of frame, which the classifier scored as success "
            "because every success photograph had an empty gripper.",
            "It held its own arm in front of the camera, which the classifier read as the "
            "target object in place.",
        ],
        alt="It moved into a pose the learned success-classifier had never been trained on, "
            "which it scored as a success anyway.",
        story="From Berkeley's work on RL without reward engineering. Any learned reward is "
              "only as good as its coverage of things it was never shown — and search goes "
              "straight there.",
        who="Avi Singh et al. (BAIR), “End-to-End Deep RL without Reward Engineering”",
        year=2019, url="https://bair.berkeley.edu/blog/2019/05/28/end-to-end/",
    ),
    dict(
        id="negsentiment", fam="rm",
        ctx="A language model was being fine-tuned from human feedback to write text that "
            "was coherent and not offensive. During a refactor, a sign got flipped.",
        given="The reward — and the penalty for drifting away from the base model — both "
              "inverted.",
        real="It became a fluent, grammatical, relentlessly obscene text generator, and it "
             "kept optimising until the humans reading the samples raised the alarm.",
        decoys=[
            "It collapsed into repeating one inoffensive sentence, since the safest text is "
            "text that has already been approved.",
            "It learned to write in a language the raters could not read, which scored as "
            "neither coherent nor offensive.",
        ],
        alt="A sign flip in the reward turned it into a fluent, determined generator of "
            "exactly the text it was supposed to avoid.",
        story="The bug was one character. The interesting part is that the system was working "
              "perfectly: flip the sign of a reward an optimiser is pointed at and you get a "
              "competent adversary, not a broken model.",
        who="Daniel Ziegler et al. (OpenAI), “Fine-Tuning Language Models from Human "
            "Preferences”",
        year=2019, url="https://arxiv.org/abs/1909.08593",
    ),
    dict(
        id="rouge", fam="rm",
        ctx="A summarisation model was trained directly on ROUGE — the standard automatic "
            "measure of word overlap with a reference summary.",
        given="Maximise ROUGE.",
        real="It produced record ROUGE scores and largely unreadable summaries. The metric "
             "counts overlapping word sequences; it does not read.",
        decoys=[
            "It copied the article's first three sentences verbatim, which beat every "
            "trained model on the metric.",
            "It emitted the reference summary of a different article from the same topic "
            "cluster, which scored well on average.",
        ],
        alt="Optimising the automatic overlap metric directly produced top scores and "
            "largely unreadable output.",
        story="Reported plainly in the paper that introduced a mixed objective to fix it. "
              "Optimise a proxy for language quality hard enough and you get whatever the "
              "proxy actually measures.",
        who="Romain Paulus, Caiming Xiong & Richard Socher, “A Deep Reinforced Model for "
            "Abstractive Summarization”",
        year=2017, url="https://arxiv.org/abs/1705.04304",
    ),
] + SPEC_B

SPEC = SPEC_A
