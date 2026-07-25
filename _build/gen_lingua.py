#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_lingua.py -- build core/data/lingua.js for LINGUAGUESSR.

WHAT THIS IS
    LINGUAGUESSR shows a real sentence in a real language and asks the player to
    place it. Every `text` in the output is a VERBATIM paragraph lifted from a
    published source; nothing is composed by this script or by hand. The metadata
    around it (script name, family, answer countries, speaker estimate, the three
    escalating hints) is authored in the LANGS table below.

SOURCES
    UDHR  Universal Declaration of Human Rights, XML corpus formerly published by
          the Unicode Consortium as "UDHR in Unicode" (retired Jan 2024) and still
          maintained at https://github.com/eric-muller/udhr .
          Files: data/udhr/udhr_<code>.xml . The UDHR itself is a United Nations
          document; the corpus is freely redistributable. Article paragraphs only --
          the preamble is skipped because it names the United Nations.
    WIKI  Wikipedia REST summaries,
          https://<wiki>.wikipedia.org/api/rest_v1/page/summary/<title> (CC BY-SA 4.0),
          used only for languages the UDHR corpus does not carry (N'Ko, Sindhi, Odia).
          Per-language titles are resolved from Wikidata sitelinks.

    Both are cached under _build/cache/ so the script is re-runnable offline.

SELECTION RULES (enforced in code, not by eye)
    * text length inside a per-script window (80-220 chars for alphabets; lower
      floor for logographic scripts where a character carries a whole morpheme)
    * text must NOT contain the language's own name in any spelling we know of,
      and must NOT contain any country name / demonym / capital city from
      core/data/countries.js, in any of that file's spellings, nor any per-entry
      `avoid` string. A sample that names the answer is worthless.
    * paragraphs that show off the script's signature letters (`prefer`) score higher
    * the same UDHR article is spread across languages so the pool is not 60x Article 1
    * fully deterministic: same inputs -> byte-identical output

RUN
    python3 _build/gen_lingua.py
"""

import hashlib
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, 'cache')
UDHR_DIR = os.path.join(CACHE, 'udhr')
WIKI_DIR = os.path.join(CACHE, 'wiki')
OUT = os.path.join(ROOT, 'core', 'data', 'lingua.js')

UDHR_RAW = 'https://raw.githubusercontent.com/eric-muller/udhr/main/data/udhr/udhr_%s.xml'
UDHR_INDEX_URL = 'https://raw.githubusercontent.com/eric-muller/udhr/main/data/udhr/index.xml'
UDHR_NS = '{http://efele.net/udhr}'
UDHR_CREDIT = 'UDHR (github.com/eric-muller/udhr, ex-unicode.org/udhr)'

WIKI_SUMMARY = 'https://%s.wikipedia.org/api/rest_v1/page/summary/%s'
WIKIDATA_ENTITY = ('https://www.wikidata.org/w/api.php?action=wbgetentities'
                   '&ids=%s&props=sitelinks&format=json')

MAXLEN = 220
MINLEN = 80
# Scripts where one character is a syllable or a whole morpheme: a shorter string
# is still a visually generous sample. Set per entry with dense=True.
DENSE_MINLEN = 45

# The only two UDHR paragraphs that name an organisation (the United Nations),
# as (article number, 0-based paragraph index). Skipped so no sample leaks its
# own provenance to the player.
SKIP_PARAS = {(26, 1), (29, 2)}

# ---------------------------------------------------------------------------
# THE LANGUAGE TABLE
# ---------------------------------------------------------------------------
# key       stable id
# lang      display name (the answer)
# script    human script label shown to the player after the reveal
# family    "Stock > branch"
# udhr      UDHR file code, or None when `wiki` is used instead
# wiki      (subdomain, page title) for the Wikipedia REST summary fallback
# countries ISO2 answer set -- where this language is official / co-official /
#           the majority everyday language. Also feeds the passport stamps.
# speakers  approximate total speakers (L1, or L1+L2 for standardised lects)
# prefer    characters that show off the script; scoring favours a passage with them
# avoid     extra substrings that would give the answer away in this language
# hints     exactly 3, escalating: script tell -> geographic tell -> near-giveaway
#
# Neither the hints nor the sample text may name the answer country.

LANGS = [

    # ---------------------------------------------------------------- Arabic script
    dict(
        key='arb', lang='Arabic', script='Arabic', family='Afro-Asiatic > Semitic',
        udhr='arb', countries=['EG', 'SA', 'IQ', 'DZ', 'MA', 'SD', 'SY', 'JO', 'AE', 'YE'],
        speakers=390000000, prefer='ضظصثة',
        avoid=['العربية', 'عربي'],
        hints=[
            'A right-to-left abjad with no vowel letters in ordinary print, and four '
            'heavy "emphatic" letters — ص ض ط ظ — that no other user of this script added later.',
            'The everyday written form is one shared standard from the Atlantic coast of '
            'Africa to the Persian Gulf, even though people speak very differently in each place.',
            'Look for the tied-off feminine ending ة and the definite article ال glued to the '
            'front of nouns: this is the original language of the script, not a borrower of it.',
        ],
    ),
    dict(
        key='pes', lang='Persian', script='Arabic (Perso-Arabic)', family='Indo-European > Iranian',
        udhr='pes_1', countries=['IR'],
        speakers=80000000, prefer='پچژگ',
        avoid=['فارسی', 'ایران', 'پارسی'],
        hints=[
            'Arabic letters plus four the Arabs never had: پ with three dots, چ with three, '
            'ژ with three above a ر, and گ with a doubled bar. Three-dot letters mean this is not Arabic.',
            'Written right to left across a high plateau between the Caspian and the Gulf; '
            'the grammar is European in bones — no gender at all, and verbs like "budan" for "to be".',
            'The ezāfe, a little unwritten -e linking noun to adjective, plus the plural '
            'ending ها, mark the language of Hafez, Ferdowsi and the Shāhnāmeh.',
        ],
    ),
    dict(
        key='urd', lang='Urdu', script='Arabic (Nastaʿlīq)', family='Indo-European > Indo-Aryan',
        udhr='urd', countries=['PK'],
        speakers=230000000, prefer='ٹڈڑںھ',
        avoid=['اردو', 'پاکستان', 'ہندوستان'],
        hints=[
            'Perso-Arabic sloping steeply down to the left in the Nastaʿlīq hand, with retroflex '
            'letters marked by a tiny superscript ط — ٹ ڈ ڑ — and a dedicated nasal ں with no dot.',
            'The state language of a large South Asian country; spoken, it is all but identical '
            'to a neighbouring language written in a completely different script.',
            'The two-eyed heh ھ used for aspiration (بھ, پھ, کھ) is the giveaway: an Indo-Aryan '
            'language wearing Persian clothes.',
        ],
    ),
    dict(
        key='pbu', lang='Pashto', script='Arabic (Pashto)', family='Indo-European > Iranian',
        udhr='pbu', countries=['AF'],
        speakers=40000000, prefer='ټډړڼږځڅښ',
        avoid=['پښتو', 'افغانستان', 'پښتون'],
        hints=[
            'Perso-Arabic with a set of letters invented nowhere else: ښ ږ ځ څ, and retroflexes '
            'marked by a small circle underneath — ټ ډ ړ ڼ. That little ring is the signature.',
            'An Iranian language of the mountains and the Khyber corridor, on both sides of the '
            'Durand Line, and one of two co-official languages of the country it dominates.',
            'The ending ـونه on plurals and the letter ږ put this east of the Persian plateau, '
            'among the Pashtun tribes.',
        ],
    ),
    dict(
        key='uig', lang='Uyghur', script='Arabic (Uyghur Ereb Yëziqi)', family='Turkic > Karluk',
        udhr='uig_arab', countries=['CN'],
        speakers=11000000, prefer='ئۇۆۈېۋڭ',
        avoid=['ئۇيغۇر', 'خىتاي', 'جۇڭگو'],
        hints=[
            'Arabic script made fully alphabetic: every vowel is written, using ا ە ې و ۇ ۆ ۈ, '
            'and words bristle with the hamza-carrier ئ at the start of syllables.',
            'A Turkic language of oasis towns along the old Silk Road, spoken in the far west '
            'of a state whose majority language is not written in this script at all.',
            'Turkic vowel harmony plus the velar nasal ڭ, written right to left — this is the '
            'language of Kashgar and Ürümqi.',
        ],
    ),

    # ---------------------------------------------------------------- Cyrillic
    dict(
        key='rus', lang='Russian', script='Cyrillic', family='Indo-European > Slavic',
        udhr='rus', countries=['RU', 'BY', 'KZ', 'KG'],
        speakers=255000000, prefer='ыъэё',
        avoid=['росси', 'русск'],
        hints=[
            'Cyrillic with the hard sign ъ and the back vowel ы — the pair that no southern '
            'Slavic Cyrillic keeps — plus э for a bare "e".',
            'The largest Slavic language, spread from the Baltic to the Pacific by a single state '
            'and still the lingua franca of most of the ex-Soviet republics.',
            'Endings in -ый / -ого / -ться and the word «человек» for "person". If you can see '
            'both ы and ъ but no і and no ї, you have the biggest of the three East Slavic tongues.',
        ],
    ),
    dict(
        key='ukr', lang='Ukrainian', script='Cyrillic', family='Indo-European > Slavic',
        udhr='ukr', countries=['UA'],
        speakers=35000000, prefer='їєґі',
        avoid=['україн', 'украін'],
        hints=[
            'Cyrillic with four letters its big eastern neighbour does not have: і, ї, є and ґ. '
            'If you see ї or є, you can stop guessing that other language.',
            'East Slavic, written in a country of black-earth plains and a big southern peninsula, '
            'with a capital on a river that gave its name to a medieval state.',
            'No ы, no ъ, but plenty of і and the greeting «Доброго дня» — the second-largest '
            'East Slavic language.',
        ],
    ),
    dict(
        key='srp', lang='Serbian', script='Cyrillic (Serbian)', family='Indo-European > Slavic',
        udhr='srp_cyrl', countries=['RS', 'BA', 'ME'],
        speakers=12000000, prefer='ћђњљџ',
        avoid=['срби', 'србиј', 'југослав'],
        hints=[
            'Cyrillic, but with letters found nowhere else: ћ and ђ with their little crossbars, '
            'and the ligatures љ њ џ. One sound, one letter, strictly.',
            'A South Slavic standard in the western Balkans whose speakers can read the same '
            'language in Latin letters too — the alphabet is a choice, not a barrier.',
            'Vuk Karadžić built this alphabet in the 1810s; ј was borrowed straight out of the '
            'Latin alphabet, which is why it looks out of place.',
        ],
    ),
    dict(
        key='bul', lang='Bulgarian', script='Cyrillic', family='Indo-European > Slavic',
        udhr='bul', countries=['BG'],
        speakers=8000000, prefer='ъщ',
        avoid=['българ', 'болгар'],
        hints=[
            'Cyrillic that uses ъ as a full vowel in the middle of ordinary words — not as a '
            'silent hard sign — and has no infinitive verbs at all.',
            'The oldest literary Slavic tradition, in a Balkan country between the Danube and '
            'the Aegean; the definite article is stuck on the END of the noun.',
            'The tell is a Slavic language with Balkan grammar: no noun cases at all, articles '
            'stuck on the end, and «да» where the others would use an infinitive. Cyrillic began here.',
        ],
    ),
    dict(
        key='mkd', lang='Macedonian', script='Cyrillic (Macedonian)', family='Indo-European > Slavic',
        udhr='mkd', countries=['MK'],
        speakers=2000000, prefer='ѓќѕљњџ',
        avoid=['македон'],
        hints=[
            'Cyrillic with two acute-accented letters, ѓ and ќ, and the archaic ѕ (dz) — that '
            'trio appears in no other alphabet in use today.',
            'A small South Slavic state in the central Balkans, landlocked, with Greek, Albanian, '
            'Bulgarian and Serbian neighbours all around it.',
            'Three definite articles glued to the end of nouns (-от, -ов, -он) to mark distance — '
            'a Balkan feature no other Slavic language has.',
        ],
    ),
    dict(
        key='khk', lang='Mongolian', script='Cyrillic (Mongolian)', family='Mongolic',
        udhr='khk', countries=['MN'],
        speakers=5500000, prefer='өүң',
        avoid=['монгол'],
        hints=[
            'Cyrillic plus two extra rounded vowels, ө and ү, and a very high count of ы, '
            'үү and өө doubled vowels — a non-Slavic language wearing a Slavic alphabet.',
            'A vast, thinly peopled steppe country wedged between two giants, which adopted '
            'this alphabet in the 1940s and still writes its old vertical script for ceremony.',
            'Vowel harmony, long doubled vowels and the ending -ийн everywhere: the language '
            'of Chinggis Khan, in Soviet-era letters.',
        ],
    ),
    dict(
        key='kaz', lang='Kazakh', script='Cyrillic (Kazakh)', family='Turkic > Kipchak',
        udhr='kaz', countries=['KZ'],
        speakers=14000000, prefer='әғқңөұүһі',
        avoid=['қазақ', 'казах'],
        hints=[
            'The most decorated Cyrillic alphabet in the world: ә ғ қ ң ө ұ ү һ і, nine letters '
            'added to the Russian set. Look for ұ — a у with a bar through the stem.',
            'A Turkic language of the great central steppe, in the ninth-largest country on Earth, '
            'which is slowly switching this alphabet over to Latin.',
            'Turkic vowel harmony written in Cyrillic, with қ and ғ for the deep back consonants; '
            'the state that writes it moved its capital 1,200 km north in 1997.',
        ],
    ),
    dict(
        key='tgk', lang='Tajik', script='Cyrillic (Tajik)', family='Indo-European > Iranian',
        udhr='tgk', countries=['TJ'],
        speakers=8500000, prefer='ғқҳҷӯӣ',
        avoid=['тоҷик', 'тадж'],
        hints=[
            'Cyrillic with six letters carrying descenders and macrons — ғ қ ҳ ҷ ӯ ӣ. The ӣ with '
            'a bar on top is unique to this alphabet.',
            'Not a Turkic language despite the neighbourhood: a Persian dialect continuum in the '
            'high mountains of Central Asia, written in Cyrillic since the 1930s.',
            'If you transliterated it into Arabic script you would get something a reader in '
            'Tehran could follow — same language, different clothes.',
        ],
    ),
    dict(
        key='bel', lang='Belarusian', script='Cyrillic (Belarusian)', family='Indo-European > Slavic',
        udhr='bel', countries=['BY'],
        speakers=5000000, prefer='ўі',
        avoid=['беларус', 'белорус'],
        hints=[
            'Cyrillic with ў — a у wearing a breve — which exists in no other Cyrillic alphabet, '
            'plus і instead of и and no letter щ at all.',
            'East Slavic, spoken in a flat, forested, landlocked country between the Baltic states, '
            'Poland and a much larger eastern neighbour.',
            'Spelling follows pronunciation ruthlessly, so unstressed o is written а — "малако" '
            'for milk. That, and ў, pin it down.',
        ],
    ),

    # ---------------------------------------------------------------- own-alphabet Europe / Near East
    dict(
        key='ell', lang='Greek', script='Greek', family='Indo-European > Hellenic',
        udhr='ell_monotonic', countries=['GR', 'CY'],
        speakers=13500000, prefer='ξψθφω',
        avoid=['ελλ', 'ελλάδ', 'κύπρ'],
        hints=[
            'Its own alphabet, ancestor of both Latin and Cyrillic: θ ξ ψ ω φ, a final-position '
            'sigma ς that differs from the σ used everywhere else in a word, and acute accents.',
            'A single country and a divided island carry this language; the alphabet has been in '
            'continuous use for about 2,700 years.',
            'The article ο / η / το and endings in -ος, -ης, -ου: you are reading the language of '
            'Homer, in its modern monotonic spelling.',
        ],
    ),
    dict(
        key='heb', lang='Hebrew', script='Hebrew', family='Afro-Asiatic > Semitic',
        udhr='heb', countries=['IL'],
        speakers=9500000, prefer='אבםןףץש',
        avoid=['עברית', 'ישראל'],
        hints=[
            'A right-to-left square script with five letters that change shape at the end of a '
            'word — ך ם ן ף ץ — and no capital letters at all.',
            'Revived as an everyday spoken language barely a century ago, in one small eastern '
            'Mediterranean state, after nearly two millennia as a liturgical language only.',
            'The definite article is a single letter ה glued to the front, and the word for '
            '"and" is a single ו: a Semitic language, but not the one with 400 million speakers.',
        ],
    ),
    dict(
        key='ydd', lang='Yiddish', script='Hebrew (Yiddish orthography)', family='Indo-European > Germanic',
        udhr='ydd', countries=['IL', 'US'],
        speakers=1500000, prefer='ױײאַאָ',
        avoid=['ייִדיש', 'אידיש'],
        hints=[
            'Hebrew letters, but used as a full alphabet with written vowels, plus digraphs found '
            'nowhere in Hebrew itself: װ, ױ and ײ, and pointed אַ / אָ.',
            'A Germanic language — really — carried across Central and Eastern Europe by Ashkenazi '
            'Jews, now spoken mostly in a few diaspora communities and one Middle Eastern state.',
            'Sound out the consonants and you get German with Slavic and Hebrew loanwords: '
            '"ער איז" is "er ist". A Germanic language in a Semitic script.',
        ],
    ),
    dict(
        key='hye', lang='Armenian', script='Armenian', family='Indo-European > Armenian',
        udhr='hye', countries=['AM'],
        speakers=6700000, prefer='ձղջռև',
        avoid=['հայ', 'հայաստան'],
        hints=[
            'A unique alphabet of 38 rounded, looping letters with tall ascenders and deep '
            'descenders, and a ligature և; the full stop is a colon-like ։ and questions end in ՞.',
            'The only language in its own branch of Indo-European, spoken in a small landlocked '
            'Caucasus republic and a very large worldwide diaspora.',
            'Mesrop Mashtots designed this alphabet around AD 405 to translate the Bible; it '
            'has barely changed since.',
        ],
    ),
    dict(
        key='kat', lang='Georgian', script='Georgian (Mkhedruli)', family='Kartvelian',
        udhr='kat', countries=['GE'],
        speakers=4000000, prefer='ღძწჭყჟ',
        avoid=['ქართ', 'საქართველო'],
        hints=[
            'Round, bouncing, unicase letters — there are no capitals — that look like nothing '
            'else on Earth: ღ ძ წ ჭ ყ ჟ. Every letter sits on the line with loops above and below.',
            'A language isolate family of the South Caucasus, spoken between the Black Sea and '
            'the mountains, in a country famous for wine and a very long alphabet.',
            'Consonant clusters that look impossible — გვფრცქვნის — and verb forms that pack the '
            'subject and two objects into one word.',
        ],
    ),

    # ---------------------------------------------------------------- Latin, distinctive
    dict(
        key='pol', lang='Polish', script='Latin (Polish)', family='Indo-European > Slavic',
        udhr='pol', countries=['PL'],
        speakers=40000000, prefer='ąęłżźćńś',
        avoid=['polsk', 'polak'],
        hints=[
            'Latin letters with nasal hooks under a and e — ą, ę — a crossed ł, and the digraphs '
            'sz, cz, rz, szcz stacked up into words that look unpronounceable.',
            'The largest Slavic language written in Latin letters, in a flat country on the '
            'Vistula between Germany and the East Slavs.',
            'A dotted ż next to an accented ź in the same sentence, and words like "wszystkich": '
            'West Slavic, Catholic, Latin-alphabet.',
        ],
    ),
    dict(
        key='ces', lang='Czech', script='Latin (Czech)', family='Indo-European > Slavic',
        udhr='ces', countries=['CZ'],
        speakers=10700000, prefer='řůěščž',
        avoid=['česk', 'čech'],
        hints=[
            'Latin with the háček (č š ž ř ě) and two different long-u marks: ú at the start of a '
            'word, ů in the middle. The letter ř exists in essentially no other language.',
            'A West Slavic language of Bohemia and Moravia, landlocked in the middle of Europe, '
            'with a famously vowel-free tongue-twister about a finger through a throat.',
            'Jan Hus invented the háček here around 1400. Fixed first-syllable stress, ř, and ů — '
            'that combination is unique.',
        ],
    ),
    dict(
        key='hun', lang='Hungarian', script='Latin (Hungarian)', family='Uralic > Ugric',
        udhr='hun', countries=['HU'],
        speakers=13000000, prefer='őűáéíóöü',
        avoid=['magyar', 'magyarország'],
        hints=[
            'Latin with double acute accents — ő and ű — which no other language uses, plus the '
            'trigraph dzs and long strings of suffixes glued onto one word.',
            'A Uralic island in the middle of Europe: its nearest relatives are 2,000 km north-east, '
            'and none of its neighbours can understand a word.',
            'Agglutination with vowel harmony, 18 cases, and words ending -ban / -ben / -nak: '
            'the Carpathian Basin, not Slavic and not Germanic.',
        ],
    ),
    dict(
        key='tur', lang='Turkish', script='Latin (Turkish)', family='Turkic > Oghuz',
        udhr='tur', countries=['TR', 'CY'],
        speakers=88000000, prefer='ğışçöü',
        avoid=['türk', 'turkiy'],
        hints=[
            'Latin with a soft g that has a breve — ğ — and, crucially, a dotless ı alongside '
            'the dotted i, so the capital of i is İ. That i/ı pair is the fingerprint.',
            'A Turkic language that switched from Arabic script to Latin in 1928 by decree, '
            'spoken astride the Bosphorus and on part of a divided island.',
            'Vowel harmony plus suffix chains like -lerimizden, and the ubiquitous "ve" for "and". '
            'Its speakers straddle two continents at a strait, and drink çay out of tulip glasses.',
        ],
    ),
    dict(
        key='vie', lang='Vietnamese', script='Latin (Quốc ngữ)', family='Austroasiatic > Vietic',
        udhr='vie', countries=['VN'],
        speakers=86000000, prefer='ạệốửỡ',
        avoid=['việt', 'viet nam'],
        hints=[
            'Latin so heavily accented that letters carry TWO marks at once — ế, ộ, ữ, ậ — one for '
            'vowel quality and one for tone. Words are one syllable each, separated by spaces.',
            'The national language of a long, thin South-East Asian country that used Chinese '
            'characters for centuries before Portuguese and French missionaries romanised it.',
            'Horned vowels ơ and ư plus a dot-below tone mark, and monosyllables everywhere. '
            'Six tones, a lot of phở, and a script designed by a 17th-century Jesuit.',
        ],
    ),
    dict(
        key='isl', lang='Icelandic', script='Latin (Icelandic)', family='Indo-European > Germanic',
        udhr='isl', countries=['IS'],
        speakers=350000, prefer='þðæö',
        avoid=['ísland', 'íslen'],
        hints=[
            'Latin keeping two letters medieval English threw away: thorn þ and eth ð, plus æ '
            'and accented vowels á é í ó ú ý.',
            'A North Atlantic island language of about 350,000 speakers, so conservative that '
            'its readers can still handle 13th-century sagas.',
            'New words are coined from native roots rather than borrowed — a computer is a '
            '"number-prophetess" — and nouns take four cases. Thorn þ seals it.',
        ],
    ),
    dict(
        key='yor', lang='Yoruba', script='Latin (Yoruba)', family='Niger-Congo > Volta-Niger',
        udhr='yor', countries=['NG', 'BJ'],
        speakers=46000000, prefer='ẹọṣ',
        avoid=['yorùbá', 'yoruba', 'naijiria'],
        hints=[
            'Latin with dots UNDER letters — ẹ, ọ, ṣ — and acute or grave accents ON TOP of the '
            'same vowels to mark three tones. Under-dot plus over-accent is the signature.',
            'A West African language of about 45 million people, spoken across a coastal belt '
            'either side of a border drawn by Europeans, plus a large Atlantic diaspora.',
            'The letter combination gb, and no letters q, v, x or z at all — the language of '
            'Ifá divination, Lagos and Ibadan.',
        ],
    ),
    dict(
        key='mlt', lang='Maltese', script='Latin (Maltese)', family='Afro-Asiatic > Semitic',
        udhr='mlt', countries=['MT'],
        speakers=520000, prefer='ħġżċ',
        avoid=['malti', 'malta'],
        hints=[
            'Latin with a barred h — ħ — a dotted ġ and ċ, and the digraph għ that is written '
            'but barely pronounced. The barred ħ is unique to this alphabet.',
            'The only Semitic language written in Latin letters and the only one that is an '
            'official EU language, spoken on a tiny archipelago south of Sicily.',
            'Arabic grammar and vocabulary with Italian and English loanwords bolted on: '
            '"kif int?" for "how are you", but "grazzi" for thanks.',
        ],
    ),
    dict(
        key='cym', lang='Welsh', script='Latin (Welsh)', family='Indo-European > Celtic',
        udhr='cym', countries=['GB'],
        speakers=900000, prefer='ŵŷll',
        avoid=['cymra', 'cymru', 'prydain'],
        hints=[
            'Latin where w and y are vowels, ll and dd and ff are single letters, and circumflexed '
            'ŵ and ŷ turn up. Words begin with ll- and end in -wch.',
            'A Celtic language of a mountainous western peninsula of a large island, with road '
            'signs in two languages and about 900,000 speakers.',
            'Initial consonants mutate — a word can start p-, b- or mh- depending on what comes '
            'before it — and the verb comes first in the sentence.',
        ],
    ),
    dict(
        key='gle', lang='Irish', script='Latin (Irish)', family='Indo-European > Celtic',
        udhr='gle', countries=['IE'],
        speakers=1800000, prefer='áéíóúbhmhdh',
        avoid=['gaeilge', 'éire', 'eire'],
        hints=[
            'Latin with only acute accents (á é í ó ú) and huge silent-looking clusters: bh, mh, '
            'dh, gh, th, fh. Vowels cluster in fours — "aoi", "eoi".',
            'A Celtic language, first official language of a small Atlantic republic, though most '
            'of its citizens speak the other one day to day.',
            'The verb comes first, there is no word for yes or no, and an h after a consonant '
            'softens it. Look for "an" and "agus".',
        ],
    ),
    dict(
        key='lit', lang='Lithuanian', script='Latin (Lithuanian)', family='Indo-European > Baltic',
        udhr='lit', countries=['LT'],
        speakers=3000000, prefer='ąęįųūčšž',
        avoid=['lietuv'],
        hints=[
            'Latin with hooked vowels ą ę į ų, a long ū, and háček letters č š ž — but, unlike '
            'its northern neighbour, no ģ ķ ļ ņ with cedillas.',
            'One of only two surviving Baltic languages, on the south-eastern Baltic coast; '
            'famously archaic, it preserves Indo-European endings lost everywhere else.',
            'Masculine nouns end -as, -is, -us and everything declines through seven cases; '
            'Sanskrit scholars study it for how old it sounds.',
        ],
    ),
    dict(
        key='lav', lang='Latvian', script='Latin (Latvian)', family='Indo-European > Baltic',
        udhr='lav', countries=['LV'],
        speakers=1500000, prefer='āēīūģķļņčšž',
        avoid=['latvij', 'latvie'],
        hints=[
            'Latin with macrons over long vowels (ā ē ī ū) AND cedilla-like tails under ģ ķ ļ ņ. '
            'That combination of bars above and commas below is unique.',
            'The middle of the three Baltic states, with a Hanseatic capital on a river mouth '
            'and a language related to only one other in the world.',
            'Stress always falls on the first syllable, nouns end -s or -a, and foreign names get '
            'a native ending bolted on — even in passports.',
        ],
    ),
    dict(
        key='est', lang='Estonian', script='Latin (Estonian)', family='Uralic > Finnic',
        udhr='est', countries=['EE'],
        speakers=1100000, prefer='õäöü',
        avoid=['eesti', 'estonia'],
        hints=[
            'Latin with õ — an o with a tilde — alongside ä, ö and ü. Doubled vowels and doubled '
            'consonants everywhere: "kuu", "kõik", "tuppa".',
            'A Finnic language on the southern shore of the Gulf of Finland; its speakers can '
            'half-follow the language across the water but nothing to the south.',
            'Fourteen cases, no future tense, no grammatical gender, and three lengths for every '
            'sound. The tilde-o is the tell.',
        ],
    ),
    dict(
        key='fin', lang='Finnish', script='Latin (Finnish)', family='Uralic > Finnic',
        udhr='fin', countries=['FI'],
        speakers=5400000, prefer='ääöyy',
        avoid=['suomi', 'suome', 'finland'],
        hints=[
            'Latin with ä and ö but never õ, almost no b, c, f, q, w, x or z, and words full of '
            'doubled vowels and doubled consonants: "kaikki", "ihmisoikeuksien".',
            'A Uralic language of lakes and forest at the top of the Baltic, official alongside '
            'a Germanic minority language in the same country.',
            'Fifteen cases and no prepositions — everything is a suffix — and the word ends in '
            '-nen, -inen or -sta. Not Indo-European at all.',
        ],
    ),
    dict(
        key='ron', lang='Romanian', script='Latin (Romanian)', family='Indo-European > Romance',
        udhr='ron_1993', countries=['RO', 'MD'],
        speakers=25000000, prefer='ășțîâ',
        avoid=['român', 'romîn', 'moldov'],
        hints=[
            'Latin with a comma-below ș and ț (not a cedilla), plus ă, î and â — three separate '
            'ways of writing central vowels.',
            'The only Romance language in eastern Europe, an island of Latin surrounded by Slavic '
            'and Hungarian speakers, spoken in two neighbouring states.',
            'The definite article is glued onto the END of the noun — "omul" for "the man" — a '
            'Balkan trait no other Romance language has.',
        ],
    ),
    dict(
        key='als', lang='Albanian', script='Latin (Albanian)', family='Indo-European > Albanian',
        udhr='als', countries=['AL', 'XK', 'MK'],
        speakers=7500000, prefer='ëç',
        avoid=['shqip', 'shqipër'],
        hints=[
            'Latin using only two accented letters — ë and ç — but leaning hard on digraphs: '
            'dh, gj, ll, nj, rr, sh, th, xh, zh. The ë appears constantly at the end of words.',
            'The sole survivor of its own branch of Indo-European, spoken along the Adriatic and '
            'in a landlocked neighbour that broke away in 2008.',
            'Its alphabet was fixed at a congress in Monastir in 1908; nothing else in Europe '
            'looks quite like "gjithë" and "njerëzore".',
        ],
    ),
    dict(
        key='eus', lang='Basque', script='Latin (Basque)', family='Language isolate',
        udhr='eus', countries=['ES', 'FR'],
        speakers=800000, prefer='tzktxz',
        avoid=['euskara', 'euskal', 'espainia'],
        hints=[
            'Plain Latin with almost no accents, but a startling density of tz, tx, ts, x and k. '
            'Words like "gizarte", "eskubide", "bakoitzak".',
            'A language isolate in the western Pyrenees, straddling a border between a Romance-'
            'speaking kingdom and a Romance-speaking republic, related to nothing else alive.',
            'Ergative case marking with -k on the subject of transitive verbs, and numbers counted '
            'in twenties. It was there before Latin arrived and outlived it.',
        ],
    ),
    dict(
        key='afr', lang='Afrikaans', script='Latin (Afrikaans)', family='Indo-European > Germanic',
        udhr='afr', countries=['ZA', 'NA'],
        speakers=17000000, prefer='ê ô ï y',
        avoid=['afrikaan', 'suid-afrika'],
        hints=[
            'Latin that looks like Dutch with the grammar filed off: "die" for "the", "nie ... nie" '
            'doubled negation, and circumflexes on ê and ô.',
            'A Germanic language of the far south of Africa, official in one large republic and '
            'widely spoken in the desert country next door.',
            'Verbs never conjugate — "ek is, jy is, hulle is" — and the diminutive -tjie is '
            'everywhere. A daughter language of 17th-century Dutch.',
        ],
    ),
    dict(
        key='swh', lang='Swahili', script='Latin (Swahili)', family='Niger-Congo > Bantu',
        udhr='swh', countries=['TZ', 'KE', 'UG', 'CD'],
        speakers=200000000, prefer='mwkwnyng',
        avoid=['kiswahili', 'swahili', 'tanzania', 'kenya'],
        hints=[
            'Plain Latin, no accents at all, but every word is built from prefixes: wa-, ki-, vi-, '
            'm-, ma-, and consonant pairs mb, nd, ng, ny, mw.',
            'A Bantu language of the East African coast, carried inland by trade, now the working '
            'language of the African Union and of several large countries around one great lake.',
            'Noun classes agreeing right across the sentence — "watu wote wanazaliwa" — and Arabic '
            'loanwords like "haki" and "serikali" from centuries of Indian Ocean trade.',
        ],
    ),
    dict(
        key='zul', lang='Zulu', script='Latin (Zulu)', family='Niger-Congo > Bantu',
        udhr='zul', countries=['ZA'],
        speakers=28000000, prefer='hlnkqcx',
        avoid=['isizulu', 'zulu', 'ningizimu afrika'],
        hints=[
            'Latin where c, q and x are not what you expect: they spell three different clicks. '
            'Plus hl, dl, ntsh and long prefix chains — "abantu", "ngokwemvelo".',
            'A Bantu language of the south-eastern coast of Africa, the biggest home language in '
            'a country with eleven official ones.',
            'Clicks written with c (dental), x (lateral) and q (palatal) were borrowed from Khoisan '
            'neighbours — that trio inside ordinary words is the giveaway.',
        ],
    ),
    dict(
        key='som', lang='Somali', script='Latin (Somali)', family='Afro-Asiatic > Cushitic',
        udhr='som', countries=['SO', 'DJ', 'ET'],
        speakers=22000000, prefer='xcdhaa',
        avoid=['soomaali', 'somali'],
        hints=[
            'Latin with no accents but a wild spelling convention: x is a hard pharyngeal h, c is '
            'the Arabic ayn, and doubled vowels aa, ee, ii, oo, uu are everywhere.',
            'A Cushitic language of the Horn of Africa, official in one republic on the Indian '
            'Ocean and widely spoken in the tiny state and the highlands beside it.',
            'Words beginning with c- and x- that are not English sounds at all — "cadaalad", '
            '"xuquuq" — reveal an Afro-Asiatic language romanised only in 1972.',
        ],
    ),
    dict(
        key='ind', lang='Indonesian', script='Latin (Indonesian)', family='Austronesian > Malayic',
        udhr='ind', countries=['ID'],
        speakers=200000000, prefer='ngmengkeber',
        avoid=['indonesia', 'bahasa indonesia'],
        hints=[
            'Plain Latin, no accents, but heavy with the prefixes me-, ber-, pe-, ke-...-an and '
            'reduplicated words joined by nothing: "orang-orang", "hak-hak".',
            'The national language of the largest archipelago on Earth, standardised from a trade '
            'language of the Malacca Strait so that no single island group would dominate.',
            'Words like "dan", "yang", "dengan" and "kemerdekaan"; Dutch loanwords ("kantor") '
            'rather than English ones distinguish it from its cousin across the strait.',
        ],
    ),
    dict(
        key='tgl', lang='Tagalog', script='Latin (Filipino)', family='Austronesian > Philippine',
        udhr='tgl', countries=['PH'],
        speakers=82000000, prefer='ngmga',
        avoid=['tagalog', 'pilipin', 'filipin'],
        hints=[
            'Latin studded with ng as a single letter and the word "mga" for plurals, plus Spanish '
            'loanwords sitting inside Austronesian grammar.',
            'The basis of the national language of a South-East Asian archipelago of 7,000 islands '
            'that spent three centuries under Spain and fifty years under the USA.',
            'Infixes cut into the middle of words — "sumulat" from "sulat" — and "ang", "ng", "sa" '
            'mark every phrase. Look for "karapatan" and "kalayaan".',
        ],
    ),
    dict(
        key='haw', lang='Hawaiian', script='Latin (Hawaiian)', family='Austronesian > Polynesian',
        udhr='haw', countries=['US'],
        speakers=25000, prefer='ʻāēīōū',
        avoid=['hawai', 'amelika'],
        hints=[
            'Only thirteen letters, a macron over long vowels, and the ʻokina — a turned '
            'apostrophe that is a real consonant. Every word ends in a vowel.',
            'A Polynesian language of a mid-Pacific island chain that is now part of a large '
            'continental republic, revived from near-extinction through immersion schools.',
            'No s, no t in most words, and k where its Polynesian cousins have t: "kanaka", '
            '"aloha", "pono", "kūlana".',
        ],
    ),
    dict(
        key='nav', lang='Navajo', script='Latin (Navajo)', family='Na-Dené > Athabaskan',
        udhr='nav', countries=['US'],
        speakers=170000, prefer='ąęįǫłńáí',
        avoid=['diné', 'navajo'],
        hints=[
            'Latin with hooks under vowels for nasalisation (ą ę į ǫ), acute accents for high '
            'tone, a barred ł, and clusters like tł, dz, ts, gh.',
            'An Athabaskan language of a high desert plateau in the south-west of a large '
            'continental republic — the most-spoken Indigenous language north of Mexico.',
            'Its verbs are famously complex, and it was used unbroken as a battlefield code in '
            'the Pacific in the 1940s.',
        ],
    ),
    dict(
        key='hat', lang='Haitian Creole', script='Latin (Haitian)', family='Creole > French-based',
        udhr='hat_kreyol', countries=['HT'],
        speakers=12000000, prefer='èòoungn',
        avoid=['ayiti', 'haiti', 'kreyòl'],
        hints=[
            'Latin spelled strictly phonetically: è and ò with grave accents, "ou" for the u sound, '
            '"an", "en", "on" for nasals, and "y" and "w" as glides.',
            'A French-based creole spoken by essentially the entire population of one Caribbean '
            'country, which won its independence from France in 1804.',
            'French words with the grammar rebuilt: "tout moun fèt lib", "yo genyen", "pou". '
            'The spelling was made official in 1979.',
        ],
    ),
    dict(
        key='azj', lang='Azerbaijani', script='Latin (Azerbaijani)', family='Turkic > Oghuz',
        udhr='azj_latn', countries=['AZ'],
        speakers=24000000, prefer='əğışöü',
        avoid=['azərbaycan', 'azerbaycan'],
        hints=[
            'Latin with the schwa ə used as an ordinary letter — the only Latin alphabet in the '
            'world that does — plus ğ, ı, ö, ü, ç and ş.',
            'A Turkic language of the eastern Caucasus, on the Caspian, whose speakers south of '
            'the border write it in Arabic script instead.',
            'Almost mutually intelligible with the Turkic language of Anatolia, but this alphabet '
            'has been changed three times in a century — Arabic, then Cyrillic, then Latin again.',
        ],
    ),

    # ---------------------------------------------------------------- Indic abugidas
    dict(
        key='hin', lang='Hindi', script='Devanagari', family='Indo-European > Indo-Aryan',
        udhr='hin', countries=['IN'],
        speakers=610000000, prefer='ीेैोौ',
        avoid=['हिन्दी', 'हिंदी', 'भारत'],
        hints=[
            'Every word hangs from a continuous horizontal bar, with vowel marks clipped above, '
            'below, before and after the consonant. No capital letters, and the full stop is a '
            'vertical stroke ।',
            'The most-spoken language of a vast northern river plain; a near-identical spoken '
            'language next door is written right-to-left in a completely different script.',
            'The postpositions का / की / के and the sentence-final है, plus Sanskrit-heavy '
            'vocabulary where its twin would use Persian words.',
        ],
    ),
    dict(
        key='mar', lang='Marathi', script='Devanagari', family='Indo-European > Indo-Aryan',
        udhr='mar', countries=['IN'],
        speakers=99000000, prefer='ळ्यंश',
        avoid=['मराठी', 'भारत', 'महाराष्ट्र'],
        hints=[
            'Devanagari, the same barred script as its northern neighbour, but with a letter '
            'the northern standard does not use: ळ, a retroflex L.',
            'Spoken on the western Deccan plateau and down to a huge port city on the Arabian '
            'Sea — the state language of the subcontinent\'s financial capital.',
            'Three genders instead of two, the ending -आहे for "is", and possessives in '
            '-चा / -ची / -चे. It has its own 13th-century literary tradition.',
        ],
    ),
    dict(
        key='nep', lang='Nepali', script='Devanagari', family='Indo-European > Indo-Aryan',
        udhr='nep', countries=['NP'],
        speakers=32000000, prefer='छन्नुहुन',
        avoid=['नेपाल', 'नेपाली'],
        hints=[
            'Devanagari again — the barred script of the northern plains — but the verbs end in '
            'छ, छन् and गर्नु, which the big plains language never does.',
            'The language of a Himalayan republic sandwiched between the two most populous '
            'countries on Earth, plus the hill districts either side of it.',
            'Honorifics तपाईं and हजुर, and a calendar running about 57 years ahead of the '
            'Gregorian one. Ex-Gurkha communities carry it worldwide.',
        ],
    ),
    dict(
        key='ben', lang='Bengali', script='Bengali (Bangla)', family='Indo-European > Indo-Aryan',
        udhr='ben', countries=['BD', 'IN'],
        speakers=270000000, prefer='ৎয়ঃঞ',
        avoid=['বাংলা', 'বাঙ্গালী', 'ভারত'],
        hints=[
            'A headstroke script like Devanagari, but the letters are rounder and hook sharply '
            'to the left; look for the triangular য, the tailed ৎ and the crowded conjuncts.',
            'Spoken across a great delta at the head of a bay — one whole country plus the state '
            'on the other side of the border, together well over 250 million people.',
            'This is the only language whose speakers were shot dead defending it: 21 February '
            '1952 is now International Mother Language Day.',
        ],
    ),
    dict(
        key='pan', lang='Punjabi', script='Gurmukhi', family='Indo-European > Indo-Aryan',
        udhr='pan', countries=['IN'],
        speakers=113000000, prefer='ਂੰੜਖ਼',
        avoid=['ਪੰਜਾਬ', 'ਭਾਰਤ'],
        hints=[
            'A barred script whose letters sit on flat feet and whose alphabet opens with three '
            'vowel-carriers ੳ ਅ ੲ; nukta dots turn ਖ into ਖ਼. Nothing else looks quite like ੜ.',
            'The tongue of a five-rivers region cut in two by a 1947 border; on the far side the '
            'same language is written in Perso-Arabic instead.',
            'Guru Angad standardised this script in the 16th century for Sikh scripture — the '
            'name means "from the Guru\'s mouth".',
        ],
    ),
    dict(
        key='guj', lang='Gujarati', script='Gujarati', family='Indo-European > Indo-Aryan',
        udhr='guj', countries=['IN'],
        speakers=57000000, prefer='ળઞઙૃ',
        avoid=['ગુજરાત', 'ભારત'],
        hints=[
            'Devanagari with the roof taken off: the same family of letter shapes, but no '
            'horizontal bar joining them, so the words float open and round.',
            'A western coastal state of the subcontinent facing the Arabian Sea, with an '
            'enormous merchant diaspora in East Africa, Britain and North America.',
            'Gandhi\'s mother tongue. Look for the ending -છે and the postposition -નું.',
        ],
    ),
    dict(
        key='tam', lang='Tamil', script='Tamil', family='Dravidian > Southern',
        udhr='tam', countries=['IN', 'LK', 'SG', 'MY'],
        speakers=87000000, prefer='ழஃஎஐ',
        avoid=['தமிழ்', 'இந்திய', 'இலங்கை'],
        hints=[
            'Big, open, loopy letters with hardly any stacked conjuncts, so the line looks '
            'unusually sparse; the alphabet has no separate letters for voiced or aspirated '
            'consonants, and ழ is unique to it.',
            'A Dravidian classical language of the far south of the subcontinent and the north '
            'and east of the island below it, plus official status in a South-East Asian city-state.',
            'Two thousand years of continuous literature, an unbroken diglossia between the '
            'written and spoken forms, and the ஃ (aytam) character.',
        ],
    ),
    dict(
        key='tel', lang='Telugu', script='Telugu', family='Dravidian > South-Central',
        udhr='tel', countries=['IN'],
        speakers=96000000, prefer='ఁౌృఞ',
        avoid=['తెలుగు', 'భారత'],
        hints=[
            'Round bodies each capped with a little tick or check-mark, and vowel signs that '
            'hang below the line. Its near-twin script to the west has squarer headmarks.',
            'The largest Dravidian language, spoken along the eastern coast of the subcontinent\'s '
            'south across two neighbouring states.',
            'Most words end in a vowel, which earned it the nickname "the Italian of the East"; '
            'the script split from its western twin only around the 15th century.',
        ],
    ),
    dict(
        key='kan', lang='Kannada', script='Kannada', family='Dravidian > Southern',
        udhr='kan', countries=['IN'],
        speakers=59000000, prefer='ಱಃೕೂ',
        avoid=['ಕನ್ನಡ', 'ಭಾರತ', 'ಕರ್ನಾಟಕ'],
        hints=[
            'Round letters topped with squarish headmarks — the near-twin of the script used on '
            'the coast to its east, but the tops are flatter and you see ಠ and ಱ.',
            'A Dravidian language of the inland Deccan plateau, centred on the city that became '
            'the subcontinent\'s software capital.',
            'Eight of its writers have won the country\'s top literary prize, more than in any '
            'other of its languages; the script also writes Tulu and Konkani.',
        ],
    ),
    dict(
        key='mal', lang='Malayalam', script='Malayalam', family='Dravidian > Southern',
        udhr='mal', countries=['IN'],
        speakers=37000000, prefer='ൻർൽൾഞ',
        avoid=['മലയാള', 'ഭാരത', 'കേരള'],
        hints=[
            'The roundest of the southern scripts — long sweeping curls and big loops — with a '
            'set of "chillu" letters that stand alone at the end of a word: ൻ ർ ൽ ൾ ൺ.',
            'Spoken on a narrow, wet, tropical coastal strip at the south-western tip of the '
            'subcontinent, walled off from the interior by mountains.',
            'Its name is a palindrome in Latin letters. Enormous Gulf-migrant population, near-'
            'universal literacy, and the longest consonant clusters of any Dravidian language.',
        ],
    ),
    dict(
        key='sin', lang='Sinhala', script='Sinhala', family='Indo-European > Indo-Aryan',
        udhr='sin', countries=['LK'],
        speakers=17000000, prefer='ේැඟඤ',
        avoid=['සිංහල', 'ලංකා'],
        hints=[
            'Bubbly, almost entirely curved letters — there is barely a straight line in it — '
            'with vowel signs that curl right round the consonant.',
            'An Indo-Aryan language stranded about 2,000 km from its nearest relatives, on a '
            'teardrop-shaped island, sharing the place with a Dravidian language.',
            'It has prenasalised stops (ඟ, ඬ, ඳ) that no other Indo-Aryan language kept, and '
            'the writing was shaped by palm-leaf styluses that would tear on a straight stroke.',
        ],
    ),

    # ---------------------------------------------------------------- mainland South-East Asia
    dict(
        key='tha', lang='Thai', script='Thai', family='Kra-Dai > Tai',
        udhr='tha', countries=['TH'],
        speakers=61000000, prefer='ฏฎฬฤ',
        avoid=['ไทย', 'สยาม'],
        hints=[
            'Each letter starts from a small circle and no spaces separate the words, only the '
            'phrases; four tone marks and several vowel signs perch above and below the line.',
            'A Tai language of a South-East Asian kingdom that was never colonised, wedged '
            'between the Mekong and two seas.',
            'Forty-four consonant letters for twenty-one sounds, because the Sanskrit and Pali '
            'spellings were kept intact — and a royal vocabulary used only for the monarchy.',
        ],
    ),
    dict(
        key='lao', lang='Lao', script='Lao', family='Kra-Dai > Tai',
        udhr='lao', countries=['LA'],
        speakers=30000000, prefer='ຯໆຫງ',
        avoid=['ລາວ', 'ປະເທດລາວ'],
        hints=[
            'The rounder, simpler sibling of the script next door: same loop-started letters and '
            'no word spaces, but far fewer characters and no silent Sanskrit spellings.',
            'A landlocked Tai country strung along the Mekong, the only one in its region with '
            'no coastline at all.',
            'A 20th-century spelling reform made it purely phonetic; the same language is spoken '
            'by far more people in the big region across the river to the west.',
        ],
    ),
    dict(
        key='khm', lang='Khmer', script='Khmer', family='Austroasiatic > Khmeric',
        udhr='khm', countries=['KH'],
        speakers=18000000, prefer='ញឆធៈ',
        avoid=['ខ្មែរ', 'កម្ពុជា'],
        hints=[
            'Tall, angular letters with little shoulders and flags, and a second consonant '
            'stacked underneath the first as a subscript; no spaces between words.',
            'An Austroasiatic language — not Tai, not Sino-Tibetan — of a lower-Mekong kingdom '
            'whose ancestors built the largest religious monument on Earth.',
            'It has no tones at all, unlike everything around it, and the longest alphabet in '
            'the world by Guinness\'s count: 74 letters.',
        ],
    ),
    dict(
        key='mya', lang='Burmese', script='Myanmar', family='Sino-Tibetan > Lolo-Burmese',
        udhr='mya', countries=['MM'],
        speakers=43000000, prefer='ဿဋဎဌ',
        avoid=['မြန်မာ', 'ဗမာ'],
        hints=[
            'Circles. Nearly every letter is built from one or more rings — ကခဂဃင — because it '
            'was scratched onto palm leaves that split along a straight stroke.',
            'A Sino-Tibetan language of a delta-and-mountain country between the subcontinent '
            'and mainland South-East Asia, on the Bay of Bengal.',
            'Three tones, a strong split between the written literary form and the spoken one, '
            'and the doubled ဿ. The Mon people passed the script on around the 11th century.',
        ],
    ),
    dict(
        key='bod', lang='Tibetan', script='Tibetan', family='Sino-Tibetan > Bodish',
        udhr='bod', countries=['CN', 'IN', 'NP'],
        speakers=6000000, prefer='ཀྵཞཛྷ',
        avoid=['བོད', 'རྒྱ་ནག'],
        hints=[
            'Letters hang from a bar with a small triangular head, syllables are separated by a '
            'raised dot ་ and sentences closed with a vertical stroke །; consonants stack downwards.',
            'The language of the world\'s highest plateau, now written in an autonomous region '
            'of a very large state, in Himalayan border districts, and in exile communities.',
            'Spelling froze in the 9th century while pronunciation moved on, so half the letters '
            'in a word are silent — the script of the Buddhist canon.',
        ],
    ),
    dict(
        key='dzo', lang='Dzongkha', script='Tibetan', family='Sino-Tibetan > Bodish',
        udhr='dzo', countries=['BT'],
        speakers=650000, prefer='ཨིགཔའ',
        avoid=['འབྲུག', 'རྫོང་ཁ'],
        hints=[
            'The same head-barred, stacking Himalayan script as its big northern neighbour uses, '
            'written in the same letters — here the language is the difference, not the writing.',
            'The national language of a small Himalayan kingdom that measures Gross National '
            'Happiness and did not allow television until 1999.',
            'Its name means "the language of the fortress" — the dzongs are the fortified '
            'monasteries that run each district.',
        ],
    ),
    dict(
        key='jav', lang='Javanese', script='Javanese (Aksara Jawa)', family='Austronesian > Malayo-Polynesian',
        udhr='jav_java', countries=['ID'],
        speakers=82000000, prefer='ꦁꦼꦶꦺ',
        avoid=['ꦗꦮ', 'ꦤꦸꦱꦤ꧀ꦠꦫ'],
        hints=[
            'Ornate, rounded letters that all sit at the same height with little curls on top, '
            'and "killer" marks hanging below to cancel the built-in vowel. A Brahmi descendant.',
            'The traditional writing of the most populous island on Earth, now taught in school '
            'but almost entirely replaced by Latin letters in daily life.',
            'The language has three politeness registers — you pick a different word for "eat" '
            'depending on who you are talking to — and about 80 million speakers.',
        ],
    ),

    # ---------------------------------------------------------------- East Asia
    dict(
        key='cmn_hans', lang='Chinese (Simplified)', script='Han (Simplified)',
        family='Sino-Tibetan > Sinitic', dense=True,
        udhr='cmn_hans', countries=['CN', 'SG'],
        speakers=1100000000, prefer='国门车学习',
        avoid=['中国', '中华'],
        hints=[
            'Logographs — one block per syllable, no alphabet — in their reduced forms: 门 车 '
            '国 学 有 far fewer strokes than the older versions used elsewhere.',
            'The everyday writing of the mainland of the most populous state on Earth and of a '
            'South-East Asian city-state; the unsimplified forms survive on an island and in two '
            'coastal territories.',
            'The four commonest characters are 的 是 在 了, and 们 marks a plural. The '
            'simplification was decreed in the 1950s and 60s.',
        ],
    ),
    dict(
        key='cmn_hant', lang='Chinese (Traditional)', script='Han (Traditional)',
        family='Sino-Tibetan > Sinitic', dense=True,
        udhr='cmn_hant', countries=['TW', 'HK', 'MO'],
        speakers=1100000000, prefer='國門車學習',
        avoid=['中國', '台灣', '臺灣', '中華'],
        hints=[
            'The same logographs in their full, unreduced forms: 國 門 車 學 — count the strokes '
            'and compare with the stripped-down versions used on the mainland.',
            'Kept as the standard on a large island a hundred miles off the south-east coast of '
            'the mainland, and in two small former-colonial coastal territories.',
            'Written vertically in older books, still using 繁體字 in newspapers, and the place '
            'where Zhuyin/Bopomofo — not Pinyin — is taught to children.',
        ],
    ),
    dict(
        key='jpn', lang='Japanese', script='Japanese (Kanji + Kana)', family='Japonic',
        dense=True,
        udhr='jpn', countries=['JP'],
        speakers=123000000, prefer='のはをするれた',
        avoid=['日本'],
        hints=[
            'Three systems mixed in one line: Chinese characters plus two syllabaries — the '
            'angular カタカナ for loanwords and the cursive ひらがな for grammar. The little の '
            'and は between the characters are the tell.',
            'The language of a long four-island archipelago off the east Asian coast, with '
            'essentially no relatives anywhere else.',
            'Verbs go last, particles mark every role (は, が, を, に), and the writing has no '
            'spaces at all — the script mixture does the word-separating.',
        ],
    ),
    dict(
        key='kor', lang='Korean', script='Hangul', family='Koreanic', dense=True,
        udhr='kor', countries=['KR', 'KP'],
        speakers=81000000, prefer='ᄒᆫ글습니다',
        avoid=['한국', '조선', '대한'],
        hints=[
            'Alphabetic letters made of circles, squares and straight lines, but stacked into '
            'square syllable blocks: 한 글 습 니 다. Nothing else in the world is built like this.',
            'Spoken on a peninsula split in two since 1945, between a large continental power '
            'and an island archipelago.',
            'King Sejong\'s scholars published it in 1446 and shaped each consonant to picture '
            'the mouth making it — ㄱ is the back of the tongue, ㅁ is the lips.',
        ],
    ),

    # ---------------------------------------------------------------- Africa
    dict(
        key='amh', lang='Amharic', script='Ethiopic (Geʽez)', family='Afro-Asiatic > Semitic',
        udhr='amh', countries=['ET'],
        speakers=60000000, prefer='ጸፀኸጐ',
        avoid=['አማርኛ', 'ኢትዮጵያ'],
        hints=[
            'An abugida of some 270 characters where each consonant grows little legs, loops and '
            'bars to mark its seven vowels; the word separator is a double dot ፡ and the full '
            'stop is ።',
            'A Semitic language — cousin to Arabic and Hebrew — spoken in the highlands of the '
            'Horn of Africa, the working language of a large federal republic there.',
            'It is written left to right, unlike its Semitic cousins, and the script it uses is '
            'the only indigenous African writing system still in wide official use.',
        ],
    ),
    dict(
        key='tir', lang='Tigrinya', script='Ethiopic (Geʽez)', family='Afro-Asiatic > Semitic',
        udhr='tir', countries=['ER', 'ET'],
        speakers=9500000, prefer='ቐቕዅጐ',
        avoid=['ትግርኛ', 'ኤርትራ', 'ኢትዮጵያ'],
        hints=[
            'The same Ethiopic syllabary as its larger southern neighbour, but with a series the '
            'other standard dropped: ቐ ቑ ቒ ቓ ቔ ቕ ቖ.',
            'A Semitic language spoken on both sides of a hard-fought Red Sea border — the main '
            'language of one small coastal state and of the province just south of it.',
            'It is the closest living relative of Geʽez, the ancient liturgical language whose '
            'alphabet everyone in the region still writes.',
        ],
    ),
    dict(
        key='zgh', lang='Tamazight (Berber)', script='Tifinagh (Neo-Tifinagh)',
        family='Afro-Asiatic > Berber',
        udhr='zgh', countries=['MA', 'DZ'],
        speakers=14000000, prefer='ⵣⵯⵖⵕ',
        avoid=['ⵜⴰⵎⴰⵣⵉⵖⵜ', 'ⵍⵎⵖⵔⵉⴱ'],
        hints=[
            'Geometric shapes — circles, crosses, chevrons and dot-clusters (ⵣ ⵎ ⵍ ⵓ ⵢ) — that '
            'look like runes but are an ancient Saharan alphabet, revived and standardised in 2003.',
            'The indigenous language of North Africa west of the Nile, now co-official with '
            'Arabic in a kingdom facing both the Atlantic and the Mediterranean.',
            'The letter ⵣ (yaz) is the emblem of the Amazigh movement; the Tuareg have been '
            'writing the older form of these letters on rock for two thousand years.',
        ],
    ),
    dict(
        key='fuf', lang='Pular (Fula)', script='Adlam', family='Niger-Congo > Atlantic',
        udhr='fuf_adlm', countries=['GN', 'SN', 'ML'],
        speakers=37000000, prefer='𞤢𞤫𞤭𞤮',
        avoid=['𞤘𞤭𞤲𞤫'],
        hints=[
            'Right to left, in rounded letters with long tails and dots, that belong to no older '
            'script family — one of the youngest alphabets on Earth, devised in the late 1980s.',
            'It writes a herders\' language of the West African savanna, spread in a belt from '
            'the Atlantic coast eastward across the Sahel.',
            'Two teenage brothers, Ibrahima and Abdoulaye Barry, invented it; the name is an '
            'acronym of its first four letters and means "the alphabet that stops a people vanishing".',
        ],
    ),
    dict(
        key='vai', lang='Vai', script='Vai', family='Niger-Congo > Mande',
        udhr='vai', countries=['LR', 'SL'],
        speakers=200000, prefer='ꕉꕌꖃꗪ',
        avoid=['ꕙꔤ'],
        hints=[
            'A syllabary — around 200 characters, one per consonant-plus-vowel — with no '
            'relationship to any other script; it was designed from nothing, not adapted.',
            'Used on the West African Atlantic coast, around the border between a republic '
            'founded by freed American slaves and the colony next door.',
            'Momolu Duwalu Bukele said the whole system came to him in a dream in the 1830s; it '
            'is one of very few indigenous African scripts still in everyday use.',
        ],
    ),

    # ---------------------------------------------------------------- Americas & the Arctic
    dict(
        key='chr', lang='Cherokee', script='Cherokee', family='Iroquoian',
        udhr='chr_cased', countries=['US'],
        speakers=2000, prefer='ᏣᎳᎩᏍᏬ',
        avoid=['ᏣᎳᎩ'],
        hints=[
            'Characters that look like Latin and Greek letters wearing the wrong hats — Ꭰ Ꭱ Ꮃ '
            'Ꮈ Ꮝ Ꮤ — except each one is a whole syllable and none has the sound you expect.',
            'An Iroquoian language of the south-eastern woodlands of a large continental republic, '
            'and of the nation forcibly marched a thousand miles west in the 1830s.',
            'Sequoyah built this syllabary around 1821 without being able to read any language at '
            'all; within a few years his people had a newspaper printed in it.',
        ],
    ),
    dict(
        key='ike', lang='Inuktitut', script='Canadian Aboriginal Syllabics', family='Eskimo-Aleut > Inuit',
        udhr='ike', countries=['CA'],
        speakers=40000, prefer='ᐃᐄᐅᐆᐊ',
        avoid=['ᐃᓄᒃᑎᑐᑦ', 'ᑲᓇᑕ'],
        hints=[
            'Triangles, hooks and chevrons that ROTATE to change their vowel — ᐃ ᐄ ᐅ ᐆ ᐊ ᐋ — '
            'with tiny raised characters for a final consonant. One shape, four directions.',
            'An Inuit language of the Arctic, co-official in a vast, treeless northern territory '
            'carved out of a large country in 1999.',
            'Words are built by piling suffix on suffix until one word does the job of an English '
            'sentence; a missionary adapted the syllabics from a Cree system in the 1850s.',
        ],
    ),
    dict(
        key='csw', lang='Cree', script='Canadian Aboriginal Syllabics', family='Algic > Algonquian',
        udhr='csw', countries=['CA'],
        speakers=95000, prefer='ᐊᒥᓯᑭᓇ',
        avoid=['ᓀᐦᐃᔭᐍᐏᐣ'],
        hints=[
            'The same rotating triangles and hooks as the Arctic script — but a different set of '
            'raised finals, and a lot more ᒥ, ᓯ, ᐧ and ᐦ.',
            'An Algonquian language of the boreal forest and the prairies, the most widely spoken '
            'Indigenous language of a large northern country.',
            'James Evans devised these syllabics in the 1840s for this language first; the Arctic '
            'people to the north-east borrowed them afterwards.',
        ],
    ),

    # ---------------------------------------------------------------- other one-off scripts
    dict(
        key='div', lang='Dhivehi (Maldivian)', script='Thaana', family='Indo-European > Indo-Aryan',
        udhr='div', countries=['MV'],
        speakers=350000, prefer='ޢޣޥޱ',
        avoid=['ދިވެހި', 'ރާއްޖެ'],
        hints=[
            'Written right to left, but the consonants are derived from ARABIC AND INDIC '
            'NUMERALS, and every single vowel must be marked above or below — no bare consonants.',
            'The language of a low-lying atoll nation strung across the equator in the Indian '
            'Ocean, with fewer than half a million speakers.',
            'Thaana appeared in the 16th century, reportedly so that magical writing could not be '
            'read by outsiders; the first nine consonants are literally the digits one to nine.',
        ],
    ),
    dict(
        key='aii', lang='Assyrian Neo-Aramaic', script='Syriac', family='Afro-Asiatic > Semitic',
        udhr='aii', countries=['IQ', 'SY', 'IR', 'TR'],
        speakers=600000, prefer='ܸܼܵܲ',
        avoid=['ܐܬܘܪ', 'ܥܝܪܐܩ'],
        hints=[
            'A right-to-left cursive that looks like an older, rounder relative of Arabic — '
            'because it is one. Letters join up, and two dots (siyame) over a word make it plural.',
            'A modern descendant of the language Jesus spoke, kept alive by Christian communities '
            'on the plains around Nineveh, in the mountains of the north, and in a huge diaspora.',
            'Vowels are written as little dots and dashes above and below the line in the eastern '
            'style; the script has been in use for over two thousand years.',
        ],
    ),
    dict(
        key='khk_mong', lang='Mongolian (Traditional)', script='Mongolian (vertical)', family='Mongolic',
        udhr='khk_mong', countries=['CN', 'MN'],
        speakers=5500000, prefer='ᠠᠣᠤᠰ',
        avoid=['ᠮᠣᠩᠭᠣᠯ'],
        hints=[
            'Written VERTICALLY, top to bottom, with the columns running LEFT to right — a '
            'flowing spine with teeth, hooks and tails hanging off it. Almost nothing else alive '
            'is written this way.',
            'The classical script of a steppe people: still the everyday writing in an autonomous '
            'region of a very large southern state, and being restored in the independent country '
            'to its north.',
            'It was adapted from the Old Uyghur alphabet, which came from Sogdian, which came from '
            'Aramaic — the whole line simply turned ninety degrees.',
        ],
    ),
    dict(
        key='iii', lang='Nuosu (Yi)', script='Yi (Liangshan)', family='Sino-Tibetan > Lolo-Burmese',
        dense=True,
        udhr='iii', countries=['CN'],
        speakers=2000000, prefer='ꆈꌠꉙꀖ',
        avoid=['ꆈꌠ'],
        hints=[
            'A syllabary of about 1,100 spiky, angular characters that look like abstract stick '
            'figures — no strokes shared with the Han characters used all around it.',
            'A Tibeto-Burman language of the cold mountains of the south-west of a very large '
            'country, where it is co-official in an autonomous prefecture.',
            'The classic form ran vertically and had thousands of variants; the state standardised '
            'it to 819 syllable signs plus tone marks in 1974 and turned it on its side.',
        ],
    ),

    # ---------------------------------------------------------------- Wikipedia-sourced
    dict(
        key='nqo', lang="N'Ko (Manding)", script="N'Ko", family='Mande > Manding',
        wiki=('nqo', 'Q1420'), sc='Nkoo',
        gloss='Opening of the Wikipedia article "Car / automobile" in this language '
              '(Wikidata Q1420). A statement of the passage\'s subject, not a word-for-word '
              'translation.',
        countries=['GN', 'ML', 'CI'],
        speakers=40000000, prefer='ߒߞߏߊ',
        avoid=['ߖߌ߬ߣߍ߫', 'ߡߊ߬ߟߌ'],
        hints=[
            'Right to left, with every vowel written and a tone mark on nearly all of them; the '
            'letters hang from a line above and curl underneath. It belongs to no older family.',
            'It writes the Manding languages of the West African savanna interior — the heartland '
            'of a medieval West African empire, high up the river Niger.',
            'Solomana Kanté devised it in 1949 to answer a claim that African languages could not '
            'be written; the name means "I say" in every Manding variety.',
        ],
    ),
    dict(
        key='snd', lang='Sindhi', script='Arabic (Sindhi)', family='Indo-European > Indo-Aryan',
        wiki=('sd', 'Q283'), sc='Arab',
        gloss='Opening of the Wikipedia article "Water" in this language (Wikidata Q283). '
              'A description of the passage\'s subject, not a word-for-word translation.',
        countries=['PK', 'IN'],
        speakers=33000000, prefer='ڪڳٻڦٿ',
        avoid=['سنڌي', 'پاڪستان', 'سنڌ', 'ڀارت'],
        hints=[
            'Perso-Arabic taken to its extreme — 52 letters — including ones with FOUR dots (ٿ ڦ) '
            'and dots stacked in diamonds and arcs: ڪ, ڳ, ٻ, ڇ. Nothing else is this densely dotted.',
            'An Indo-Aryan language of the lower valley and delta of a great river that gave a '
            'whole subcontinent its name.',
            'Implosive consonants ٻ ڄ ڏ ڳ, which almost no other language of the region has; a '
            'large community across the eastern border writes it in Devanagari instead.',
        ],
    ),
    dict(
        key='ory', lang='Odia', script='Odia (Oriya)', family='Indo-European > Indo-Aryan',
        wiki=('or', 'Q283'), sc='Orya',
        gloss='Opening of the Wikipedia article "Water" in this language (Wikidata Q283). '
              'A description of the passage\'s subject, not a word-for-word translation.',
        countries=['IN'],
        speakers=35000000, prefer='ଓଣଡ଼ଢ଼',
        avoid=['ଓଡ଼ିଆ', 'ଭାରତ', 'ଓଡ଼ିଶା'],
        hints=[
            'Almost every letter is capped with a big rounded umbrella, so the line looks like a '
            'row of domes — the palm-leaf stylus would have torn a straight horizontal bar.',
            'A classical Indo-Aryan language of an eastern coastal state on the Bay of Bengal, '
            'famous for a chariot festival that gave English the word "juggernaut".',
            'It is the only eastern Indo-Aryan language that is not heavily Persianised, and one '
            'of a handful given official "classical language" status.',
        ],
    ),

    # ---------------------------------------------------------------- widely-taught Latin
    dict(
        key='spa', lang='Spanish', script='Latin (Spanish)', family='Indo-European > Romance',
        udhr='spa', countries=['ES', 'MX', 'AR', 'CO', 'PE', 'CL', 'VE', 'CU', 'GT', 'EC'],
        speakers=500000000, prefer='ñáíó¿¡',
        avoid=['españ', 'castellano'],
        hints=[
            'Latin with exactly one extra letter, ñ, and inverted punctuation opening a question '
            'or an exclamation: ¿ and ¡. Accents only ever go one way, á é í ó ú.',
            'A Romance language carried across an ocean by one Iberian kingdom; it is now the '
            'majority language of about twenty countries on another continent.',
            'Look for the words "de", "que", "los" and "derecho"; the -ción ending answers to '
            'English -tion, and every noun is either el or la.',
        ],
    ),
    dict(
        key='fra', lang='French', script='Latin (French)', family='Indo-European > Romance',
        udhr='fra', countries=['FR', 'BE', 'CH', 'CA', 'CD', 'CI', 'SN', 'ML', 'HT', 'CM'],
        speakers=310000000, prefer='çèêëœù',
        avoid=['françai', 'france'],
        hints=[
            'Latin with a cedilla ç, circumflexes on â ê î ô û, a grave è and the ligature œ. '
            'Words end in silent consonants — -ent, -ez, -aux — that are written but not said.',
            'A Romance language of a western European republic, spread by empire until it became '
            'the most widespread language of west and central Africa.',
            'Two words for "you", a partitive "du / de la", and "qui", "est", "leur" everywhere. '
            'Its academy has been arguing about spelling since 1635.',
        ],
    ),
    dict(
        key='deu', lang='German', script='Latin (German)', family='Indo-European > Germanic',
        udhr='deu_1996', countries=['DE', 'AT', 'CH', 'LI', 'LU', 'BE'],
        speakers=135000000, prefer='äöüß',
        avoid=['deutsch'],
        hints=[
            'Latin with three umlauts (ä ö ü) and the sharp s, ß — a letter no other language '
            'uses — plus nouns capitalised in the Middle Of Sentences.',
            'A Germanic language official in a large central European federation, in an alpine '
            'republic, in a multilingual confederation and in two tiny neighbours.',
            'Compound nouns run for twenty letters, verbs get flung to the end of the clause, '
            'and there are three genders and four cases to keep straight.',
        ],
    ),
    dict(
        key='ita', lang='Italian', script='Latin (Italian)', family='Indo-European > Romance',
        udhr='ita', countries=['IT', 'CH', 'SM', 'VA'],
        speakers=67000000, prefer='àèéìòù',
        avoid=['italia', 'italian'],
        hints=[
            'Latin with only grave and acute accents on final vowels (à, è, ù) and no k, w, x or '
            'y in native words. Almost every word ends in a vowel.',
            'A Romance language of a long Mediterranean peninsula plus an alpine canton to its '
            'north, two tiny enclaves, and a wide emigrant diaspora.',
            'Double consonants change meaning (nono vs nonno), articles come in six flavours '
            '(il, lo, la, i, gli, le), and "gli" is a sound no neighbour has.',
        ],
    ),
    dict(
        key='por', lang='Portuguese', script='Latin (Portuguese)', family='Indo-European > Romance',
        udhr='por_BR', countries=['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'],
        speakers=265000000, prefer='ãõçâê',
        avoid=['portug', 'brasil'],
        hints=[
            'Latin with nasal tildes on ã and õ — a combination no other European language '
            'writes — plus ç and circumflexes. Words end -ão, -ões, -ção.',
            'A Romance language taken from a small Atlantic kingdom to a vast South American '
            'country, to southern Africa and to an island nation off the west African coast.',
            'It has a personal infinitive no other Romance language kept, and "não", "são", '
            '"então" litter every page.',
        ],
    ),
    dict(
        key='nld', lang='Dutch', script='Latin (Dutch)', family='Indo-European > Germanic',
        udhr='nld', countries=['NL', 'BE', 'SR'],
        speakers=25000000, prefer='ijeeaaoeuu',
        avoid=['nederland', 'holland', 'vlaam'],
        hints=[
            'Latin, almost accent-free, but stuffed with doubled vowels — aa, ee, oo, uu — and '
            'the digraph ij treated as a single letter, plus -sch and -ijk endings.',
            'A Germanic language of a low-lying North Sea delta and the northern half of the '
            'kingdom next door, plus one South American republic.',
            'The definite articles are de and het, "zijn" means both "to be" and "his", and '
            'the g is a sound most foreigners cannot make.',
        ],
    ),
    dict(
        key='dan', lang='Danish', script='Latin (Danish)', family='Indo-European > Germanic',
        udhr='dan', countries=['DK'],
        speakers=6000000, prefer='æøå',
        avoid=['danmark', 'dansk'],
        hints=[
            'Latin with three extra vowels at the end of the alphabet: æ, ø and å. Its two '
            'Scandinavian neighbours use ä and ö instead of æ and ø.',
            'The language of a small, flat kingdom of peninsulas and islands guarding the '
            'entrance to the Baltic, plus two vast North Atlantic self-governing territories.',
            'The definite article is glued to the end of the noun (huset = the house), and the '
            'numbers above forty are counted in twenties: halvtreds is two-and-a-half twenties.',
        ],
    ),
    dict(
        key='hrv', lang='Croatian', script='Latin (Croatian)', family='Indo-European > Slavic',
        udhr='hrv', countries=['HR', 'BA'],
        speakers=6800000, prefer='čćžšđ',
        avoid=['hrvat'],
        hints=[
            'Latin with the háček trio č š ž plus two letters for the same soft sounds a '
            'neighbouring Cyrillic alphabet writes as ћ and ђ: ć and đ.',
            'A South Slavic language of a long Adriatic coastline and its hinterland, and one of '
            'three official languages of the country immediately inland.',
            'Its alphabet is a one-to-one transliteration of a Cyrillic one — the same language '
            'continuum, two scripts, and a lot of 20th-century politics.',
        ],
    ),
    dict(
        key='slk', lang='Slovak', script='Latin (Slovak)', family='Indo-European > Slavic',
        udhr='slk', countries=['SK'],
        speakers=5200000, prefer='ôľĺŕä',
        avoid=['sloven'],
        hints=[
            'Latin with háčeks like its western neighbour, but also a circumflex ô and two '
            'syllabic consonants that take length marks: ĺ and ŕ — vowel-free words like "vlk".',
            'A West Slavic language of a small, mountainous, landlocked country that separated '
            'peacefully from its partner state on the first day of 1993.',
            'It has no ř and no ů — the two letters that mark out the language it split from — '
            'but it does have the rule that long syllables cannot follow one another.',
        ],
    ),
    dict(
        key='kal', lang='Greenlandic (Kalaallisut)', script='Latin (Greenlandic)',
        family='Eskimo-Aleut > Inuit',
        udhr='kal', countries=['GL'],
        speakers=57000, prefer='qllffnng',
        avoid=['kalaallit', 'nunaat', 'danmark'],
        hints=[
            'Latin, but the words are enormous and full of q, double consonants and -rp-, -ss-, '
            '-tt-: one word regularly does the work of a whole English sentence.',
            'An Inuit language, the sole official language of the world\'s largest island — a '
            'self-governing territory of a small European kingdom.',
            'It is polysynthetic: suffixes stack until a single word means "he says he will not '
            'be able to go". Its Arctic cousins to the west use syllabics instead of Latin.',
        ],
    ),
]


# ---------------------------------------------------------------------------
# fetching
# ---------------------------------------------------------------------------

def http_get(url, timeout=40):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'misha-arcade-lingua-builder/1.0 (static puzzle game data build)',
        'Accept': '*/*',
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def cached(path, url, minsize=200):
    if os.path.exists(path) and os.path.getsize(path) > minsize:
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = http_get(url)
    with open(path, 'wb') as f:
        f.write(data)
    return path


def udhr_path(code):
    return os.path.join(UDHR_DIR, 'udhr_%s.xml' % code)


def fetch_udhr(code):
    return cached(udhr_path(code), UDHR_RAW % code, 500)


def udhr_scripts():
    """file code -> ISO 15924 script code, straight from the corpus index."""
    p = cached(os.path.join(CACHE, 'udhr_index.xml'), UDHR_INDEX_URL, 10000)
    out = {}
    for u in ET.parse(p).getroot():
        f = u.get('f')
        if f:
            out[f] = u.get('iso15924') or ''
    return out


def wiki_summary(wiki, title):
    """Cached Wikipedia REST summary -> the plain-text `extract`."""
    # the title is usually non-Latin, so key the cache on a hash of it, not on
    # a slug -- otherwise every article in the same wiki collapses to one filename.
    slug = '%s_%s' % (wiki, hashlib.sha1(title.encode('utf-8')).hexdigest()[:12])
    p = os.path.join(WIKI_DIR, '%s.json' % slug)
    cached(p, WIKI_SUMMARY % (wiki, urllib.parse.quote(title, safe='')), 100)
    d = json.load(open(p, encoding='utf-8'))
    return d.get('extract') or ''


def wikidata_sitelink(qid, wiki):
    """Resolve the per-language article title for a Wikidata item."""
    p = os.path.join(CACHE, 'wikidata_%s.json' % qid)
    cached(p, WIKIDATA_ENTITY % qid, 100)
    d = json.load(open(p, encoding='utf-8'))
    links = d['entities'][qid]['sitelinks']
    entry = links.get(wiki + 'wiki')
    return entry['title'] if entry else None


# ---------------------------------------------------------------------------
# extraction
# ---------------------------------------------------------------------------

WS = re.compile(r'\s+')


def clean(s):
    s = unicodedata.normalize('NFC', s)
    # strip bidi/format controls that would confuse a length check but keep ZWNJ/ZWJ,
    # which are meaningful in Perso-Arabic and Indic scripts.
    s = ''.join(ch for ch in s if ch not in '‎‏‪‫‬⁦⁧⁨⁩')
    s = WS.sub(' ', s).strip()
    return s


def udhr_paragraphs(code):
    """-> [(article_number:int, para_index:int, text:str)] for articles only."""
    tree = ET.parse(udhr_path(code))
    root = tree.getroot()
    out = []
    for art in root.iter(UDHR_NS + 'article'):
        try:
            n = int(art.get('number'))
        except (TypeError, ValueError):
            continue
        paras = [p for p in art.iter(UDHR_NS + 'para')]
        for i, p in enumerate(paras):
            if (n, i) in SKIP_PARAS:
                continue
            t = clean(''.join(p.itertext()))
            if t:
                out.append((n, i, t))
    return out


# Sentence terminators across the scripts in play: Latin/Greek/Cyrillic full stop,
# Arabic full stop, Devanagari/Bengali/Odia danda, CJK/Ethiopic/Armenian/Urdu stops,
# Thai has none (space-delimited), N'Ko uses its own comma-ish separator.
TERMINATORS = '.۔।॥。．！？!?；;።፡։՞՜:߹'


def sentences(text):
    """Split a plain-text passage into sentence-ish chunks, terminators kept."""
    out, cur = [], ''
    for ch in text:
        cur += ch
        if ch in TERMINATORS:
            out.append(cur.strip())
            cur = ''
    if cur.strip():
        out.append(cur.strip())
    return [s for s in out if s]


def passages(text, lo, hi):
    """Every run of consecutive sentences whose length lands in [lo, hi]."""
    ss = sentences(text)
    out = []
    for a in range(len(ss)):
        acc = ''
        for b in range(a, len(ss)):
            acc = (acc + ' ' + ss[b]).strip()
            if len(acc) > hi:
                break
            if len(acc) >= lo:
                out.append((a, b, acc))
    return out


# ---------------------------------------------------------------------------
# giveaway blocklist, built from the shipped country DB
# ---------------------------------------------------------------------------

def load_countries():
    src = open(os.path.join(ROOT, 'core', 'data', 'countries.js'), encoding='utf-8').read()
    m = re.search(r'window\.AD_COUNTRIES\s*=\s*(\[.*?\n\]);', src, re.S)
    if not m:
        raise SystemExit('could not find the AD_COUNTRIES array in countries.js')
    return json.loads(m.group(1))


def country_terms(c):
    out = []
    for s in [c.get('n'), c.get('cap'), c.get('demo')] + list(c.get('alt') or []):
        if s and len(s) >= 4:
            out.append(s.lower())
    return out


# English common nouns that happen to be somebody's country name or alt spelling.
# Keeping them would reject honest prose ("a North Atlantic island language").
HOMOGRAPHS = {'island', 'islands', 'jersey', 'turkey', 'guinea', 'union', 'georgia'}


def build_blocklist(countries):
    """Lowercased strings that must never appear in a sample."""
    bad = set()
    for c in countries:
        bad.update(country_terms(c))
    for s in ['iran', 'iraq', 'cuba', 'peru', 'chad', 'togo', 'laos', 'mali', 'oman',
              'fiji', 'chile', 'india', 'china', 'japan', 'korea', 'nepal']:
        bad.add(s)
    return bad - HOMOGRAPHS


def has_blocked(text, blocklist, extra):
    """First giveaway term found in `text`, or None.

    `extra` (endonyms, non-Latin) is matched as a plain substring, because word
    boundaries are meaningless in an unspaced or non-Latin script. The English
    country list is matched on word boundaries so that "Romance" does not trip
    over "Roman" and "woman" does not trip over "Oman".
    """
    low = text.lower()
    for s in extra:
        if s and s.lower() in low:
            return s
    if re.search(r'[A-Za-z]{4}', text):
        words = set(re.findall(r"[a-zÀ-ɏ']+", low))
        for s in blocklist:
            if ' ' in s or '-' in s:
                if s in low:
                    return s
            elif s in words:
                return s
    return None


# ---------------------------------------------------------------------------
# selection
# ---------------------------------------------------------------------------

def stable_hash(s):
    return int(hashlib.sha1(s.encode('utf-8')).hexdigest()[:8], 16)


def min_len_for(entry):
    return DENSE_MINLEN if entry.get('dense') else MINLEN


def choose(entry, paras, blocklist, article_use):
    """Deterministically pick the best (article, para, text) for one language."""
    lo = min_len_for(entry)
    prefer = set(entry.get('prefer') or '')
    extra = list(entry.get('avoid') or []) + [entry['lang'].lower()]
    best = None
    rejected = 0
    for (n, i, t) in paras:
        if not (lo <= len(t) <= MAXLEN):
            continue
        if has_blocked(t, blocklist, extra):
            rejected += 1
            continue
        score = 0.0
        score += 6.0 * len(prefer & set(t)) / max(1, len(prefer))   # shows off the script
        score -= 3.0 * article_use.get(n, 0)                        # spread across articles
        score -= abs(len(t) - 155) / 60.0                           # mid-length reads best
        score += (stable_hash('%s|%d|%d' % (entry['key'], n, i)) % 1000) / 100000.0
        cand = (score, n, i, t)
        if best is None or cand[0] > best[0]:
            best = cand
    return best, rejected


# ---------------------------------------------------------------------------
# writing
# ---------------------------------------------------------------------------

HEADER = """/* core/data/lingua.js -- window.AD_LINGUA : real language + writing-system samples
   for LINGUAGUESSR ("read the writing, place the language").

   SOURCES (every `text` is verbatim; nothing here was composed for the game)
     UDHR -- Universal Declaration of Human Rights, XML corpus formerly published by the
             Unicode Consortium as "UDHR in Unicode" and now maintained at
             https://github.com/eric-muller/udhr (data/udhr/udhr_<code>.xml).
             The UDHR is a United Nations document. Article paragraphs only.
     WIKI -- Wikipedia REST summaries (https://<wiki>.wikipedia.org/api/rest_v1/), CC BY-SA 4.0,
             used only for languages the UDHR corpus does not carry.
   Each sample records its own `src`. `gloss` is the English of the same passage.
   Script names, families, answer countries, speaker estimates and the three escalating
   hints are authored metadata, checked against the sources named above.

   Generated by _build/gen_lingua.py -- do not edit by hand, re-run the script.
*/
window.AD_LINGUA = """

FOOTER = """;

window.AD_LINGUA_BY = (function (a, o) {
  for (var k = 0; k < a.length; k++) { o[a[k].key] = a[k]; }
  return o;
})(window.AD_LINGUA.samples, {});
"""


def write_out(samples, meta):
    payload = {
        'version': 1,
        'generated': meta['generated'],
        'sources': {
            'UDHR': UDHR_CREDIT,
            'WIKI': 'Wikipedia REST summaries (CC BY-SA 4.0)',
        },
        'counts': {
            'samples': len(samples),
            'scripts': len(set(s['script'] for s in samples)),
            'families': len(set(s['family'] for s in samples)),
        },
        'samples': samples,
    }
    body = json.dumps(payload, ensure_ascii=False, indent=1, sort_keys=False)
    body = body.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(HEADER)
        f.write(body)
        f.write(FOOTER)
    # prove the payload is strict JSON by reading it back the way a validator would
    src = open(OUT, encoding='utf-8').read()
    chunk = src[src.index('window.AD_LINGUA = ') + len('window.AD_LINGUA = '):]
    chunk = chunk[:chunk.rindex(';\n\nwindow.AD_LINGUA_BY')]
    json.loads(chunk)
    return os.path.getsize(OUT)


# ---------------------------------------------------------------------------

def main():
    import datetime
    countries = load_countries()
    by_iso = dict((c['i'], c) for c in countries)
    valid_iso = set(by_iso)
    blocklist = build_blocklist(countries)

    # English UDHR, for the glosses
    fetch_udhr('eng')
    eng = {}
    eng_art = {}
    for (n, i, t) in udhr_paragraphs('eng'):
        eng[(n, i)] = t
        eng_art.setdefault(n, []).append(t)

    scripts_by_file = udhr_scripts()

    samples = []
    article_use = {}
    problems = []

    for e in LANGS:
        rec = None
        if e.get('udhr'):
            try:
                fetch_udhr(e['udhr'])
                paras = udhr_paragraphs(e['udhr'])
            except Exception as exc:                   # noqa: BLE001
                problems.append('%s: UDHR fetch/parse failed: %s' % (e['key'], exc))
                continue
            best, rejected = choose(e, paras, blocklist, article_use)
            if best is None:
                problems.append('%s: no UDHR paragraph passed the filters '
                                '(%d article paras, %d blocked)' % (e['key'], len(paras), rejected))
                continue
            score, n, i, text = best
            article_use[n] = article_use.get(n, 0) + 1
            # Translations do not always split an article into the same number of
            # paragraphs as the English does. Only trust a paragraph-for-paragraph
            # gloss when the counts agree; otherwise gloss the whole article.
            same_shape = len(eng_art.get(n, [])) == sum(1 for (a2, _b, _c) in paras if a2 == n)
            gloss = (eng.get((n, i)) if same_shape else None) or ' '.join(eng_art.get(n, []))
            if len(gloss) > 300:
                gloss = gloss[:297].rsplit(' ', 1)[0] + '...'
            rec = dict(
                text=text, gloss=gloss,
                sc=e.get('sc') or scripts_by_file.get(e['udhr'], ''),
                src='%s :: udhr_%s.xml, Article %d%s'
                    % (UDHR_CREDIT, e['udhr'], n, '' if i == 0 else ' (para %d)' % (i + 1)),
            )

        elif e.get('wiki'):
            wiki, qid = e['wiki']
            try:
                title = wikidata_sitelink(qid, wiki)
                if not title:
                    raise RuntimeError('no %swiki sitelink on %s' % (wiki, qid))
                extract = clean(wiki_summary(wiki, title))
            except Exception as exc:                   # noqa: BLE001
                problems.append('%s: wiki fetch failed: %s' % (e['key'], exc))
                continue
            cands = passages(extract, min_len_for(e), MAXLEN)
            extra = list(e.get('avoid') or []) + [e['lang'].lower()]
            prefer = set(e.get('prefer') or '')
            best = None
            for (a, b, t) in cands:
                if has_blocked(t, blocklist, extra):
                    continue
                sc = 6.0 * len(prefer & set(t)) / max(1, len(prefer))
                sc -= abs(len(t) - 155) / 60.0
                sc -= 0.5 * a                          # prefer the opening of the article
                if best is None or sc > best[0]:
                    best = (sc, a, b, t)
            if best is None:
                problems.append('%s: no wiki passage passed the filters' % e['key'])
                continue
            rec = dict(
                text=best[3], gloss=e['gloss'], sc=e.get('sc', ''),
                src='Wikipedia (CC BY-SA 4.0) :: %s.wikipedia.org REST summary of "%s" '
                    '(Wikidata %s), opening lines' % (wiki, title, qid),
            )
        else:
            problems.append('%s: no source configured' % e['key'])
            continue

        bad_iso = [c for c in e['countries'] if c not in valid_iso]
        if bad_iso:
            problems.append('%s: ISO2 not in countries.js: %s' % (e['key'], bad_iso))
        if len(e['hints']) != 3:
            problems.append('%s: %d hints, expected 3' % (e['key'], len(e['hints'])))
        # A hint may name a NEIGHBOUR ("between Poland and a larger eastern
        # neighbour") -- that is the game. It may never name the answer itself.
        answer_terms = set()
        for iso in e['countries']:
            answer_terms.update(country_terms(by_iso[iso]) if iso in by_iso else [])
        answer_terms -= HOMOGRAPHS
        for hi, h in enumerate(e['hints']):
            hit = has_blocked(h, answer_terms, list(e.get('avoid') or []))
            if hit:
                problems.append('%s: hint %d names the answer ("%s")' % (e['key'], hi + 1, hit))

        samples.append({
            'key': e['key'],
            'lang': e['lang'],
            'script': e['script'],
            'sc': rec['sc'],
            'family': e['family'],
            'text': rec['text'],
            'gloss': rec['gloss'],
            'countries': e['countries'],
            'speakers': e['speakers'],
            'hints': e['hints'],
            'src': rec['src'],
        })

    size = write_out(samples, {'generated': datetime.date.today().isoformat()})
    print('wrote %s' % OUT)
    print('  %d bytes | %d samples | %d writing systems (ISO 15924) | %d language families'
          % (size, len(samples),
             len(set(s['sc'] for s in samples)),
             len(set(s['family'].split(' > ')[0] for s in samples))))
    by_src = {}
    for s in samples:
        by_src[s['src'].split(' ::')[0]] = by_src.get(s['src'].split(' ::')[0], 0) + 1
    print('  sources: %s' % by_src)
    print('  unsourced: %d' % sum(1 for s in samples if not s['src']))
    for p in problems:
        print('  ! ' + p)
    return 0


if __name__ == '__main__':
    sys.exit(main())
