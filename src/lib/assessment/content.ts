/** Locally authored decoding content; no words are transcribed from UFLI assessments. */

import type {
  CheckpointGroups,
  ConceptProbe,
  FiveWords,
  SkillBand,
} from "./model";

export interface AssessmentContent {
  readonly version: string;
  readonly bands: readonly SkillBand[];
}

type FiveTexts = readonly [string, string, string, string, string];
type ThreeTexts = readonly [string, string, string];
type TwoTexts = readonly [string, string];

const graphemeLessons: Readonly<Record<string, string>> = {
  a: "1", m: "2", s: "3", t: "4", p: "6", f: "7", i: "8", n: "9",
  o: "12", d: "13", c: "14", u: "15", g: "16", b: "17", e: "18",
  k: "22", h: "23", r: "24", l: "26", w: "28", j: "29", y: "30",
  x: "31", qu: "32", v: "33", z: "34", ck: "44", sh: "45", th: "47",
  ch: "48", wh: "50", ph: "50", ng: "51", nk: "52",
};

const graphemes = Object.keys(graphemeLessons).sort(
  (left, right) => right.length - left.length,
);

const requirementsForText = (text: string): string[] => {
  const lessons: string[] = [];
  const normalized = text.toLocaleLowerCase();
  let index = 0;
  while (index < normalized.length) {
    const grapheme = graphemes.find((item) => normalized.startsWith(item, index));
    if (!grapheme) {
      index += 1;
      continue;
    }
    const lesson = graphemeLessons[grapheme];
    if (!lessons.includes(lesson)) lessons.push(lesson);
    index += grapheme.length;
  }
  return lessons;
};

const placementEvidenceForText = (text: string): string[] => {
  const requirements = requirementsForText(text);
  const numericRequirements = requirements.map((lesson) => Number.parseFloat(lesson));
  if (text.length >= 2 && numericRequirements.every((lesson) => lesson <= 4)) {
    return ["5"];
  }
  return [requirements.reduce((latest, lesson) =>
    Number.parseFloat(lesson) > Number.parseFloat(latest) ? lesson : latest,
  )];
};

const group = (id: string, texts: FiveTexts): FiveWords =>
  texts.map((text, index) => ({ id: `${id}-${index + 1}`, text, kind: "real", requirements: requirementsForText(text), evidenceFor: placementEvidenceForText(text) })) as unknown as FiveWords;

const probe = (
  id: string,
  lesson: string,
  concept: string,
  real: ThreeTexts,
  invented: TwoTexts,
): ConceptProbe => ({
  id,
  lesson,
  concept,
  words: [
    ...real.map((text, index) => ({ id: `${id}-r${index + 1}`, text, kind: "real" as const, requirements: requirementsForText(text), evidenceFor: [lesson] })),
    ...invented.map((text, index) => ({ id: `${id}-i${index + 1}`, text, kind: "invented" as const, requirements: requirementsForText(text), evidenceFor: [lesson] })),
  ] as unknown as FiveWords,
});

const coreAssessmentContent: AssessmentContent = {
  version: "2026-09-04",
  bands: [
    {
      id: "short-vowels",
      label: "Short vowels and early consonants",
      checkpointGroups: [
        group("short-vowels-1", ["am", "sat", "map", "fin", "hot"]),
        group("short-vowels-2", ["jam", "lip", "fog", "hen", "rug"]),
        group("short-vowels-3", ["van", "sit", "cot", "jet", "mud"]),
        group("short-vowels-4", ["cap", "win", "log", "bed", "tub"]),
      ],
      probes: [
        probe("lesson-1", "1", "a /ă/", ["am", "map", "mat"], ["lat", "zab"]),
        probe("lesson-5", "5", "VC/CVC blending", ["at", "am", "sit"], ["ip", "ap"]),
        probe("lesson-8", "8", "i /ĭ/", ["in", "pin", "tin"], ["mib", "zit"]),
        probe("lesson-12", "12", "o /ŏ/", ["cot", "cop", "mop"], ["zof", "pom"]),
        probe("lesson-16", "16", "g /g/", ["gap", "gum", "dig"], ["gop", "vag"]),
        probe("lesson-20", "20", "-s /s/", ["cats", "tips", "maps"], ["vaps", "zeks"]),
        probe("lesson-24", "24", "r /r/ Part 1", ["red", "rip", "run"], ["rav", "rem"]),
        probe("lesson-28", "28", "w /w/", ["win", "web", "wag"], ["wug", "wem"]),
        probe("lesson-32", "32", "qu /kw/", ["quit", "quiz", "quack"], ["quim", "quop"]),
        probe("lesson-35a", "35a", "short a review", ["cab", "ham", "rag"], ["dap", "vab"]),
        probe("lesson-36a", "36a", "short i review", ["lid", "rip", "win"], ["nib", "vix"]),
        probe("lesson-37a", "37a", "short o review", ["cod", "hop", "lot"], ["zom", "pof"]),
        probe("lesson-38a", "38a", "short a, i, and o review", ["cab", "win", "lot"], ["zom", "vab"]),
        probe("lesson-39a", "39a", "short u review", ["gum", "hut", "rub"], ["vud", "zup"]),
      ],
    },
    {
      id: "digraphs",
      label: "Digraphs",
      checkpointGroups: [
        group("digraphs-1", ["shed", "chop", "thin", "whip", "duck"]),
        group("digraphs-2", ["fish", "much", "path", "when", "neck"]),
        group("digraphs-3", ["shop", "chin", "bath", "whiz", "sock"]),
        group("digraphs-4", ["rush", "chat", "moth", "wham", "pack"]),
      ],
      probes: [
        probe("lesson-43", "43", "-all, -oll, and -ull", ["small", "doll", "gull"], ["zall", "vull"]),
        probe("lesson-44", "44", "final ck", ["deck", "sock", "luck"], ["vack", "jeck"]),
        probe("lesson-45", "45", "sh digraph", ["ship", "cash", "shed"], ["shom", "nish"]),
        probe("lesson-47", "47", "unvoiced th /th/", ["thin", "bath", "moth"], ["thup", "neth"]),
        probe("lesson-48", "48", "ch digraph", ["chin", "much", "chop"], ["chab", "pech"]),
        probe("lesson-50", "50", "wh /w/ and ph /f/", ["whip", "when", "graph"], ["whob", "phim"]),
        probe("lesson-51", "51", "final ng", ["rang", "song", "lung"], ["veng", "nung"]),
        probe("lesson-52", "52", "final nk", ["bank", "pink", "honk"], ["venk", "zunk"]),
      ],
    },
    {
      id: "vce",
      label: "Silent-e long vowels",
      checkpointGroups: [
        group("vce-1", ["cave", "these", "kite", "rope", "cube"]),
        group("vce-2", ["game", "theme", "dime", "joke", "mule"]),
        group("vce-3", ["wave", "scene", "ripe", "home", "tune"]),
        group("vce-4", ["rake", "eve", "wide", "note", "fume"]),
      ],
      probes: [
        probe("lesson-54", "54", "a-consonant-e", ["cane", "rake", "wave"], ["dape", "vame"]),
        probe("lesson-55", "55", "i-consonant-e", ["dime", "ripe", "kite"], ["zite", "nibe"]),
        probe("lesson-56", "56", "o-consonant-e", ["rope", "note", "home"], ["boke", "vode"]),
        probe("lesson-58", "58", "u-consonant-e", ["cube", "mule", "tune"], ["fute", "zume"]),
      ],
    },
    {
      id: "longer-words",
      label: "Longer words",
      checkpointGroups: [
        group("longer-words-1", ["sunset", "picnic", "rabbit", "helmet", "magnet"]),
        group("longer-words-2", ["napkin", "cactus", "insect", "velvet", "basket"]),
        group("longer-words-3", ["cabin", "comic", "robin", "lemon", "visit"]),
        group("longer-words-4", ["habit", "finish", "planet", "rapid", "seven"]),
      ],
      probes: [
        probe("lesson-66", "66", "VC-CV syllable division", ["rabbit", "magnet", "velvet"], ["mipnet", "zabbit"]),
        probe("lesson-67b", "67b", "two closed syllables", ["sunset", "picnic", "napkin"], ["rabdit", "fimnet"]),
        probe("lesson-68", "68", "open and closed syllables", ["lemon", "seven", "cabin"], ["demet", "vabon"]),
      ],
    },
    {
      id: "ending-patterns",
      label: "Ending patterns",
      checkpointGroups: [
        group("ending-patterns-1", ["cats", "dishes", "jumped", "resting", "bigger"]),
        group("ending-patterns-2", ["dogs", "boxes", "melted", "camping", "fastest"]),
        group("ending-patterns-3", ["wishes", "rented", "humming", "runner", "sadly"]),
        group("ending-patterns-4", ["rocks", "benches", "lifted", "drummer", "softly"]),
      ],
      probes: [
        probe("lesson-63", "63", "plural -es", ["dishes", "boxes", "wishes"], ["zutches", "paffes"]),
        probe("lesson-64", "64", "past-tense -ed", ["jumped", "melted", "rented"], ["vasked", "pemmed"]),
        probe("lesson-65", "65", "suffix -ing", ["resting", "camping", "humming"], ["nuffing", "zamping"]),
        probe("lesson-99", "99", "suffixes -s and -es", ["cats", "dogs", "dishes"], ["zibs", "mupes"]),
        probe("lesson-100", "100", "comparative -er and -est", ["bigger", "faster", "softest"], ["nimmer", "vattest"]),
      ],
    },
    {
      id: "r-controlled-vowels",
      label: "R-controlled vowels",
      checkpointGroups: [
        group("r-controlled-1", ["barn", "storm", "fern", "shirt", "turn"]),
        group("r-controlled-2", ["sharp", "cord", "term", "bird", "curl"]),
        group("r-controlled-3", ["march", "fork", "herd", "stir", "burst"]),
        group("r-controlled-4", ["yard", "short", "perch", "third", "surf"]),
      ],
      probes: [
        probe("lesson-77", "77", "ar", ["barn", "sharp", "yard"], ["zarp", "narm"]),
        probe("lesson-78", "78", "or", ["storm", "fork", "short"], ["vort", "nork"]),
        probe("lesson-80", "80", "er", ["fern", "term", "herd"], ["zerm", "pern"]),
        probe("lesson-81", "81", "ir", ["shirt", "bird", "stir"], ["nirt", "vird"]),
        probe("lesson-82", "82", "ur", ["turn", "curl", "surf"], ["zurp", "nurl"]),
      ],
    },
    {
      id: "long-vowel-teams",
      label: "Long-vowel teams",
      checkpointGroups: [
        group("long-vowel-teams-1", ["rain", "play", "seed", "leaf", "boat"]),
        group("long-vowel-teams-2", ["tray", "paint", "green", "beach", "road"]),
        group("long-vowel-teams-3", ["toast", "snow", "night", "pie", "blue"]),
        group("long-vowel-teams-4", ["coach", "grow", "light", "tie", "fruit"]),
      ],
      probes: [
        probe("lesson-84", "84", "long a teams ai and ay", ["rain", "paint", "tray"], ["zail", "vay"]),
        probe("lesson-85", "85", "long e teams ee and ea", ["seed", "green", "beach"], ["zeef", "neep"]),
        probe("lesson-86", "86", "long o teams oa and ow", ["boat", "road", "snow"], ["voam", "zow"]),
        probe("lesson-87", "87", "long i teams igh and ie", ["night", "light", "pie"], ["vight", "zie"]),
        probe("lesson-91", "91", "long u teams ue and ui", ["blue", "fruit", "suit"], ["zue", "pluit"]),
      ],
    },
    {
      id: "other-vowels",
      label: "Other vowel patterns",
      checkpointGroups: [
        group("other-vowels-1", ["book", "moon", "saw", "hawk", "fault"]),
        group("other-vowels-2", ["foot", "spoon", "draw", "stalk", "haul"]),
        group("other-vowels-3", ["cook", "broom", "lawn", "chalk", "pause"]),
        group("other-vowels-4", ["wood", "proof", "yawn", "small", "cause"]),
      ],
      probes: [
        probe("lesson-89", "89", "short oo", ["book", "foot", "wood"], ["voof", "zoop"]),
        probe("lesson-90", "90", "long oo", ["moon", "spoon", "proof"], ["zoot", "voon"]),
        probe("lesson-93", "93", "aw and au", ["saw", "hawk", "haul"], ["zawk", "naum"]),
      ],
    },
    {
      id: "diphthongs-silent-letters",
      label: "Diphthongs and silent letters",
      checkpointGroups: [
        group("diphthongs-1", ["coin", "toy", "cloud", "cow", "chew"]),
        group("diphthongs-2", ["boil", "joy", "round", "owl", "stew"]),
        group("diphthongs-3", ["knot", "write", "lamb", "gnat", "sign"]),
        group("diphthongs-4", ["kneel", "wrap", "thumb", "gnaw", "comb"]),
      ],
      probes: [
        probe("lesson-95", "95", "oi and oy", ["coin", "boil", "toy"], ["zoip", "noy"]),
        probe("lesson-96", "96", "ou and ow", ["cloud", "round", "cow"], ["vout", "zowp"]),
        probe("lesson-98", "98", "silent initial consonants", ["knot", "kneel", "write"], ["knim", "wrep"]),
        probe("lesson-115", "115", "ew, eu, ue, and ou for /yū/ or /ū/", ["few", "feud", "cue"], ["zeum", "veute"]),
        probe("lesson-118", "118", "ch, gn, gh, and silent t", ["chef", "gnat", "ghost"], ["chiv", "ghim"]),
      ],
    },
    {
      id: "prefixes-suffixes",
      label: "Prefixes and suffixes",
      checkpointGroups: [
        group("prefixes-suffixes-1", ["unfair", "refill", "preview", "helpful", "careless"]),
        group("prefixes-suffixes-2", ["unpack", "remake", "preheat", "thankful", "fearless"]),
        group("prefixes-suffixes-3", ["dislike", "misread", "kindness", "payment", "slowly"]),
        group("prefixes-suffixes-4", ["dishonest", "misprint", "darkness", "shipment", "brightly"]),
      ],
      probes: [
        probe("lesson-102", "102", "suffixes -ful and -less", ["helpful", "careless", "fearless"], ["zimful", "nobless"]),
        probe("lesson-103", "103", "prefix un-", ["unfair", "unkind", "unpack"], ["unzap", "unvab"]),
        probe("lesson-104", "104", "prefixes pre- and re-", ["preheat", "refill", "remake"], ["prezup", "revim"]),
        probe("lesson-125", "125", "suffix -ment", ["payment", "shipment", "movement"], ["zipment", "vabment"]),
      ],
    },
    {
      id: "additional-affixes",
      label: "Additional affixes and word changes",
      checkpointGroups: [
        group("additional-affixes-1", ["inactive", "submarine", "transport", "musician", "action"]),
        group("additional-affixes-2", ["incorrect", "subway", "transfer", "magician", "fiction"]),
        group("additional-affixes-3", ["adventure", "collect", "portable", "visible", "famous"]),
        group("additional-affixes-4", ["admire", "connect", "washable", "flexible", "dangerous"]),
      ],
      probes: [
        probe("lesson-119", "119", "suffixes -sion and -tion", ["vision", "action", "station"], ["vition", "nasion"]),
        probe("lesson-124", "124", "suffix -ness", ["kindness", "darkness", "softness"], ["vabness", "zumness"]),
        probe("lesson-126", "126", "suffixes -able and -ible", ["portable", "visible", "washable"], ["zimmable", "nossible"]),
        probe("lesson-127", "127", "prefixes bi-, tri-, and uni-", ["bicycle", "triangle", "unicorn"], ["bimode", "triped"]),
      ],
    },
  ],
};

const extras = (band: string, entries: readonly ConceptProbe[]) => ({ band, entries });
const supplemental = [
  extras("short-vowels", [
    probe("lesson-2", "2", "m /m/", ["map", "ham", "mop"], ["mip", "vam"]), probe("lesson-3", "3", "s /s/", ["sass", "bus", "sap"], ["sas", "nis"]),
    probe("lesson-4", "4", "t /t/", ["tap", "mat", "tin"], ["tem", "vit"]), probe("lesson-6", "6", "p /p/", ["pat", "lip", "pop"], ["pim", "vap"]),
    probe("lesson-7", "7", "f /f/", ["fin", "fan", "if"], ["fap", "mif"]), probe("lesson-9", "9", "n /n/", ["nap", "tin", "net"], ["nim", "van"]),
    probe("lesson-11", "11", "nasalized a in an and am", ["ham", "fan", "jam"], ["vam", "zan"]), probe("lesson-13", "13", "d /d/", ["dip", "sad", "den"], ["dop", "mid"]),
    probe("lesson-14", "14", "c /k/", ["cap", "cot", "can"], ["cim", "cuv"]), probe("lesson-15", "15", "u /ŭ/", ["sun", "mud", "cup"], ["vud", "zup"]),
    probe("lesson-17", "17", "b /b/", ["bat", "rib", "bun"], ["bim", "zab"]), probe("lesson-18", "18", "e /ĕ/", ["web", "hen", "jet"], ["zem", "vep"]),
    probe("lesson-21", "21", "s /z/", ["has", "is", "his"], ["vaz", "piz"]), probe("lesson-22", "22", "k /k/", ["kit", "kin", "kid"], ["kav", "keb"]),
    probe("lesson-23", "23", "h /h/", ["ham", "hen", "hot"], ["hup", "hig"]), probe("lesson-25", "25", "r /r/", ["rip", "rug", "red"], ["rav", "rem"]),
    probe("lesson-26", "26", "initial l /l/", ["lip", "leg", "lot"], ["lem", "lup"]), probe("lesson-27", "27", "final l /l/", ["pal", "hill", "bell"], ["vul", "zeml"]),
    probe("lesson-29", "29", "j /j/", ["jam", "jet", "jog"], ["jup", "jiv"]), probe("lesson-30", "30", "y /y/", ["yam", "yes", "yet"], ["yim", "yop"]),
    probe("lesson-31", "31", "x /ks/", ["box", "fox", "six"], ["vax", "nixup"]), probe("lesson-33", "33", "v /v/", ["van", "vet", "vim"], ["vop", "vab"]),
    probe("lesson-34", "34", "z /z/", ["zip", "zap", "zen"], ["zom", "zup"]), probe("lesson-42", "42", "FLSZ spelling pattern", ["huff", "bell", "fizz"], ["nuss", "vull"]),
  ]),
  extras("digraphs", [probe("lesson-46", "46", "voiced th", ["this", "that", "then"], ["thim", "thav"])]),
  extras("vce", [
    probe("lesson-57", "57", "e-consonant-e", ["theme", "these", "eve"], ["zeme", "veve"]),
    probe("lesson-60", "60", "c before e as /s/", ["race", "mice", "cell"], ["vace", "cimel"]),
    probe("lesson-61", "61", "g before e as /j/", ["huge", "gem", "page"], ["vage", "gimel"]),
    probe("lesson-62", "62", "silent-e exceptions", ["have", "give", "done"], ["zive", "vone"]),
  ]),
  extras("longer-words", [probe("lesson-67a", "67a", "compound words", ["sunset", "bedbug", "catfish"], ["zimnap", "vabdog"])]),
  extras("ending-patterns", [
    probe("lesson-69", "69", "tch /ch/", ["match", "fetch", "hutch"], ["vetch", "zatch"]), probe("lesson-70", "70", "dge /j/", ["badge", "edge", "fudge"], ["vudge", "zedge"]),
    probe("lesson-72", "72", "long-vowel VCC endings", ["wild", "cold", "find"], ["zost", "vilt"]), probe("lesson-73", "73", "final y /ī/", ["my", "shy", "dry"], ["zly", "vry"]),
    probe("lesson-74", "74", "final y /ē/", ["happy", "silly", "puppy"], ["zappy", "viffy"]), probe("lesson-75", "75", "consonant-le", ["table", "little", "candle"], ["vople", "zimble"]),
  ]),
  extras("other-vowels", [probe("lesson-94", "94", "ea /ĕ/ and a /ŏ/", ["bread", "head", "wash"], ["zead", "vash"])]),
  extras("prefixes-suffixes", [
    probe("lesson-101", "101", "suffix -ly", ["sadly", "softly", "kindly"], ["zimly", "vably"]), probe("lesson-105", "105", "prefix dis-", ["dislike", "dishonest", "disagree"], ["disvab", "disnup"]),
    probe("lesson-107", "107", "doubling before -ed and -ing", ["hopped", "running", "planned"], ["zipped", "vimming"]), probe("lesson-108", "108", "doubling before -er and -est", ["bigger", "hottest", "sadder"], ["vimmer", "zattest"]),
    probe("lesson-109", "109", "drop-e suffix rule", ["hiking", "rider", "safest"], ["vaking", "zimer"]), probe("lesson-110", "110", "y-to-i suffix rule", ["cried", "happier", "driest"], ["vimied", "zappier"]),
  ]),
  extras("additional-affixes", [
    probe("lesson-111", "111", "ar and or as /er/", ["dollar", "actor", "collar"], ["vollar", "zactor"]), probe("lesson-112", "112", "air spellings", ["chair", "care", "bear"], ["zair", "vare"]),
    probe("lesson-113", "113", "ear /ear/", ["hear", "near", "year"], ["zear", "vear"]), probe("lesson-114", "114", "less-common long-a teams", ["eight", "vein", "they"], ["zeigh", "vait"]),
    probe("lesson-116", "116", "ough vowel patterns", ["bought", "thought", "though"], ["zought", "vough"]), probe("lesson-117", "117", "soft c and g", ["city", "gem", "giant"], ["cimel", "gimant"]),
    probe("lesson-120", "120", "suffix -ture", ["picture", "future", "nature"], ["victure", "zature"]), probe("lesson-121", "121", "person suffixes", ["teacher", "actor", "artist"], ["vimmer", "zartist"]),
    probe("lesson-122", "122", "suffix -ish", ["selfish", "childish", "greenish"], ["vabish", "zimish"]), probe("lesson-123", "123", "suffix -y", ["rainy", "windy", "muddy"], ["vabby", "zimmy"]),
  ]),
] as const;

const lessonOrder = (lesson: string) => Number.parseFloat(lesson.replace(/[a-z]$/, (letter) => `.${letter.charCodeAt(0) - 96}`));

const allProbes = [
  ...coreAssessmentContent.bands.flatMap((band) => band.probes),
  ...supplemental.flatMap((item) => item.entries),
].sort((left, right) => lessonOrder(left.lesson) - lessonOrder(right.lesson));

const bandLessonRanges = [
  [1, 40.99],
  [41, 52.99],
  [53, 62.99],
  [63, 68.99],
  [69, 76.99],
  [77, 83.99],
  [84, 88.99],
  [89, 94.99],
  [95, 98.99],
  [99, 110.99],
  [111, 127.99],
] as const;

export const assessmentContent: AssessmentContent = {
  ...coreAssessmentContent,
  bands: coreAssessmentContent.bands.map((band, bandIndex) => ({
    ...band,
    probes: allProbes.filter((item) => {
      const [firstLesson, lastLesson] = bandLessonRanges[bandIndex];
      const lesson = lessonOrder(item.lesson);
      return lesson >= firstLesson && lesson <= lastLesson;
    }),
  })),
};

export const assessmentBands = assessmentContent.bands;
