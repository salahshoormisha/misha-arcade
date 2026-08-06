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
