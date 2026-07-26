# -*- coding: utf-8 -*-
"""OFFICE pack — 6 boards. Calendars, Slack, grant cycles and the vocabulary of
getting things shipped. Written for a research-institute office rather than a
sales floor. Deliberately names no real colleagues."""

BOARDS = [

{
 "title": "Calendar Tetris",
 "diff": 1,
 "groups": [
   {"name": "KINDS OF MEETING", "tiles": ["STANDUP", "ALL-HANDS", "ONE-ON-ONE", "RETRO"],
    "note": "The standup is meant to be fifteen minutes standing up. It is neither."},
   {"name": "CALENDAR SETTINGS", "tiles": ["TENTATIVE", "RECURRING", "BUSY", "DECLINE"],
    "note": "'Recurring' is how a thirty-minute meeting quietly becomes twenty-six hours a year."},
   {"name": "SLACK STATUSES", "tiles": ["IN A MEETING", "OUT SICK", "HEADS DOWN", "ON A CALL"],
    "note": "Only one of these is ever set honestly and it is the one with the thermometer emoji."},
   {"name": "___ ROOM", "tiles": ["BOARD", "BREAK", "WAR", "GREEN"],
    "note": "Boardroom, break room, war room, green room. An office contains at most one of them and calls it all four."},
 ],
 "traps": [
   ["BUSY", 2, "'Busy' is a calendar availability setting and also, in every workplace on earth, somebody's Slack status."],
 ],
 "epilogue": "BUSY is the only word here that lives in two apps at once. IN A MEETING, OUT SICK, HEADS DOWN and ON A CALL are sentences you type at a person; TENTATIVE, RECURRING and DECLINE are buttons you click at a machine.",
},

{
 "title": "Reply All",
 "diff": 2,
 "groups": [
   {"name": "EMAIL SIGN-OFFS", "tiles": ["BEST", "REGARDS", "CHEERS", "THANKS"],
    "note": "'Best' is the safe one, 'Regards' is the cold one, 'Cheers' is the one that gives you away as British, and 'Thanks' depends entirely on the punctuation."},
   {"name": "PASSIVE-AGGRESSIVE EMAIL", "tiles": ["PER MY LAST", "CIRCLING BACK", "AS DISCUSSED", "GENTLE NUDGE"],
    "note": "'Per my last email' means you did not read my last email. 'As discussed' means you agreed to this and I have receipts."},
   {"name": "BUTTONS IN A MAIL CLIENT", "tiles": ["REPLY ALL", "FORWARD", "ARCHIVE", "SNOOZE"],
    "note": "Snooze was invented so a message could be ignored on a schedule rather than at random."},
   {"name": "___ BOX", "tiles": ["IN", "OUT", "SAND", "CHECK"],
    "note": "Inbox, outbox, sandbox, checkbox. Two are full, one is empty, one is where the good ideas go."},
 ],
 "traps": [
   ["THANKS", 1, "'Thanks.' with a full stop is among the most passive-aggressive constructions available in written English, so it has a genuine claim on the second group."],
 ],
 "epilogue": "THANKS is a sign-off and a threat depending on the punctuation, which is exactly why it's here. BEST, REGARDS and CHEERS have no hidden edge, so the sign-off group needs a fourth and the passive-aggressive group already has one.",
},

{
 "title": "Ship It",
 "diff": 3,
 "groups": [
   {"name": "PROJECT TRACKERS", "tiles": ["ASANA", "TRELLO", "JIRA", "NOTION"],
    "note": "Every team migrates between these roughly every eighteen months and the tasks never survive the move."},
   {"name": "TASK STATUSES", "tiles": ["BLOCKED", "IN PROGRESS", "BACKLOG", "DONE"],
    "note": "'Backlog' is the polite word for the place work goes to be quietly forgotten."},
   {"name": "CORPORATE VERBS", "tiles": ["LEVERAGE", "IDEATE", "ONBOARD", "SOCIALISE"],
    "note": "All four already had perfectly good meanings and were taken anyway. 'Socialise' used to mean going to a party."},
   {"name": "___ BOARD", "tiles": ["KAN", "ON", "WHITE", "DASH"],
    "note": "Kanban, onboard, whiteboard, dashboard. The first one is where the second one gets explained on the third one and reported on the fourth."},
 ],
 "traps": [
   ["ONBOARD", 3, "ONBOARD is visibly ON + BOARD, sitting directly above a ___ BOARD group. It is a verb here, not a compound."],
 ],
 "epilogue": "ONBOARD is the pivot and the purple gives it away: ON is already in the compound group, so ONBOARD cannot be. LEVERAGE, IDEATE and SOCIALISE are three verbs looking for a fourth, and there is only one candidate on the board.",
},

{
 "title": "Out of Office",
 "diff": 3,
 "groups": [
   {"name": "WAYS TO SAY YOU'RE AWAY", "tiles": ["PTO", "OOO", "ANNUAL LEAVE", "SABBATICAL"],
    "note": "PTO is American, annual leave is British, OOO is what the auto-reply calls it, and a sabbatical is the one you have to earn."},
   {"name": "OFFICE FURNITURE", "tiles": ["TASK CHAIR", "PHONE BOOTH", "WHITEBOARD", "MONITOR ARM"],
    "note": "The phone booth is the single best purchase an open-plan office ever makes and the last one it ever budgets for."},
   {"name": "VIDEO-CALL DISASTERS", "tiles": ["MUTE", "FROZEN", "ECHO", "CAT FILTER"],
    "note": "The cat filter incident of 2021 involved a Texas judge, a county attorney and the sentence 'I'm here live, I'm not a cat.'"},
   {"name": "___ DESK", "tiles": ["HOT", "HELP", "FRONT", "STANDING"],
    "note": "Hot desk, help desk, front desk, standing desk. Only one of them belongs to a person."},
 ],
 "traps": [
   ["STANDING", 1, "A standing desk is office furniture in every catalogue ever printed, and there is an office-furniture group right there."],
 ],
 "epilogue": "STANDING is furniture in spirit and a compound in fact. TASK CHAIR, PHONE BOOTH, WHITEBOARD and MONITOR ARM are already four things you could put in a van, so the desk group keeps its fourth leg.",
},

{
 "title": "Grant Cycle",
 "diff": 4,
 "groups": [
   {"name": "PARTS OF A GRANT PROPOSAL", "tiles": ["ABSTRACT", "BUDGET", "TIMELINE", "DELIVERABLES"],
    "note": "The abstract is written last, the budget is written first, and the timeline is written by an optimist."},
   {"name": "ACADEMIC JOB TITLES", "tiles": ["POSTDOC", "FELLOW", "DEAN", "CHAIR"],
    "note": "'Chair' is the head of a department and 'Dean' the head of a school, and no two universities agree on which outranks the other."},
   {"name": "WHAT THE OFFICE MANAGER ORDERS", "tiles": ["NAMETAGS", "COFFEE PODS", "EXTENSION LEAD", "FLIP CHART"],
    "note": "Nobody notices any of these until the day one of them is missing, at which point it is the only thing anybody notices."},
   {"name": "___ CHAIR", "tiles": ["ARM", "HIGH", "WHEEL", "DECK"],
    "note": "Armchair, highchair, wheelchair, deckchair. Four seats, four completely different lives."},
 ],
 "traps": [
   ["CHAIR", 3, "There is a ___ CHAIR group on this board and a tile that says CHAIR. Everybody looks. It is a job title — the person who runs the department."],
 ],
 "epilogue": "The purple is a trap built out of a job title: CHAIR cannot be a ___ CHAIR because it is the chair. POSTDOC, FELLOW and DEAN need a fourth colleague, and ARM, HIGH, WHEEL and DECK are already a full set of furniture.",
},

{
 "title": "The Fellows",
 "diff": 4,
 "groups": [
   {"name": "SUMMER-FELLOW STARTER PACK", "tiles": ["LANYARD", "LAPTOP STICKER", "REUSABLE CUP", "TOTE BAG"],
    "note": "By week three the lanyard is in a drawer, the sticker is on the laptop for life, and there are four identical tote bags under the desk."},
   {"name": "WORDS THAT MEAN 'MEETING'", "tiles": ["HUDDLE", "SYNC", "CATCH-UP", "TOUCH BASE"],
    "note": "Three of them are sports metaphors and the fourth is what two clocks do. None of them is shorter than the meeting it describes."},
   {"name": "SLACK REACTIONS, BY EMOJI NAME", "tiles": ["EYES", "TADA", "ROCKET", "PLUS ONE"],
    "note": "eyes means 'I have seen this and will not be replying', tada means 'shipped', rocket means 'shipping', and plus-one means 'I agree but not enough to type'."},
   {"name": "___ SHEET", "tiles": ["SPREAD", "TIME", "BALANCE", "CHEAT"],
    "note": "Spreadsheet, timesheet, balance sheet, cheat sheet. Three of them are the same document at different levels of honesty."},
 ],
 "traps": [
   ["HUDDLE", 2, "A Huddle is a literal Slack feature — you start one from the sidebar — so it belongs to the Slack group as squarely as it belongs to the meeting group."],
 ],
 "epilogue": "HUDDLE is a Slack button AND a word for a meeting, which is the whole problem with the modern workplace in one tile. EYES, TADA, ROCKET and PLUS ONE are emoji and nothing else, so the Slack group fills itself and the huddle goes back to being a meeting.",
},

]
