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
import urllib.request
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, 'cache')
UDHR_DIR = os.path.join(CACHE, 'udhr')
WIKI_DIR = os.path.join(CACHE, 'wiki')
OUT = os.path.join(ROOT, 'core', 'data', 'lingua.js')

UDHR_RAW = 'https://raw.githubusercontent.com/eric-muller/udhr/main/data/udhr/udhr_%s.xml'
UDHR_NS = '{http://efele.net/udhr}'
UDHR_CREDIT = 'UDHR (github.com/eric-muller/udhr, ex-unicode.org/udhr)'

MAXLEN = 220
MINLEN = 80
# scripts where one character is a syllable or a whole morpheme: a shorter string
# is still a visually generous sample.
DENSE_SCRIPTS = {'Hans', 'Hant', 'Jpan', 'Hang', 'Yiii'}
DENSE_MINLEN = 45

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
            'Endings in -ый / -ого / -ться and the word «человек» for "person": this is the '
            'East Slavic standard, not its Ukrainian or Belarusian cousins.',
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
            'Words like «България» aside, the tell is a Slavic language with Balkan grammar: '
            'no cases, postposed articles, and «да» where others use "to".',
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
            'Turkic vowel harmony written in Cyrillic, with қ and ғ for the deep back consonants — '
            'this is the language of Astana and Almaty.',
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
            'Vowel harmony plus suffix chains like -lerimizden, and the ubiquitous "ve" for "and": '
            'the Oghuz language of Istanbul and Ankara.',
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
            'Horned vowels ơ and ư plus a dot-below tone mark, and monosyllables everywhere — '
            'this is Hanoi and Saigon.',
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
        avoid=['român', 'roman', 'moldov'],
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


def udhr_path(code):
    return os.path.join(UDHR_DIR, 'udhr_%s.xml' % code)


def fetch_udhr(code):
    p = udhr_path(code)
    if os.path.exists(p) and os.path.getsize(p) > 500:
        return p
    os.makedirs(UDHR_DIR, exist_ok=True)
    data = http_get(UDHR_RAW % code)
    with open(p, 'wb') as f:
        f.write(data)
    return p


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
            t = clean(''.join(p.itertext()))
            if t:
                out.append((n, i, t))
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


def build_blocklist(countries):
    """Lowercased strings that must never appear in a sample."""
    bad = set()
    for c in countries:
        for s in [c.get('n'), c.get('cap'), c.get('demo')] + list(c.get('alt') or []):
            if s and len(s) >= 5:
                bad.add(s.lower())
    # a few short but unmistakable ones the >=5 filter drops
    for s in ['iran', 'iraq', 'cuba', 'peru', 'chad', 'togo', 'laos', 'mali', 'oman',
              'fiji', 'chile', 'india', 'china', 'japan', 'korea', 'nepal']:
        bad.add(s)
    # generic words that legitimately appear in the UDHR and are NOT giveaways
    for s in ['georgia']:   # "Georgia" never appears, but guard the concept
        bad.discard(s)
    return bad


def has_blocked(text, blocklist, extra):
    low = text.lower()
    for s in extra:
        if s and s.lower() in low:
            return s
    # Only Latin-script text can collide with the English country names.
    if re.search(r'[A-Za-z]{4}', text):
        for s in blocklist:
            if s in low:
                return s
    return None


# ---------------------------------------------------------------------------
# selection
# ---------------------------------------------------------------------------

def stable_hash(s):
    return int(hashlib.sha1(s.encode('utf-8')).hexdigest()[:8], 16)


def script_key(entry):
    return entry['script'].split(' ')[0]


def min_len_for(entry):
    label = entry['script']
    for d in DENSE_SCRIPTS:
        pass
    if entry.get('dense'):
        return DENSE_MINLEN
    return MINLEN


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
    valid_iso = set(c['i'] for c in countries)
    blocklist = build_blocklist(countries)

    # English UDHR, for the glosses
    fetch_udhr('eng')
    eng = {}
    eng_art = {}
    for (n, i, t) in udhr_paragraphs('eng'):
        eng[(n, i)] = t
        eng_art.setdefault(n, []).append(t)

    samples = []
    article_use = {}
    problems = []

    for e in LANGS:
        if not e.get('udhr'):
            continue
        try:
            fetch_udhr(e['udhr'])
            paras = udhr_paragraphs(e['udhr'])
        except Exception as exc:                       # noqa: BLE001
            problems.append('%s: fetch/parse failed: %s' % (e['key'], exc))
            continue
        best, rejected = choose(e, paras, blocklist, article_use)
        if best is None:
            problems.append('%s: no paragraph passed the filters (%d article paras, %d blocked)'
                            % (e['key'], len(paras), rejected))
            continue
        score, n, i, text = best
        article_use[n] = article_use.get(n, 0) + 1
        gloss = eng.get((n, i)) or ' '.join(eng_art.get(n, []))
        if len(gloss) > 300:
            gloss = gloss[:297].rsplit(' ', 1)[0] + '...'
        bad_iso = [c for c in e['countries'] if c not in valid_iso]
        if bad_iso:
            problems.append('%s: unknown ISO2 %s' % (e['key'], bad_iso))
        assert len(e['hints']) == 3, e['key']
        samples.append({
            'key': e['key'],
            'lang': e['lang'],
            'script': e['script'],
            'family': e['family'],
            'text': text,
            'gloss': gloss,
            'countries': e['countries'],
            'speakers': e['speakers'],
            'hints': e['hints'],
            'src': '%s :: udhr_%s.xml, Article %d' % (UDHR_CREDIT, e['udhr'], n)
                   + ('' if i == 0 else ' (para %d)' % (i + 1)),
        })

    size = write_out(samples, {'generated': datetime.date.today().isoformat()})
    print('wrote %s  (%d bytes, %d samples, %d scripts, %d families)'
          % (OUT, size, len(samples),
             len(set(s['script'] for s in samples)),
             len(set(s['family'] for s in samples))))
    for p in problems:
        print('  ! ' + p)
    return 0


if __name__ == '__main__':
    sys.exit(main())
