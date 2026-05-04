const ADJECTIVES = [
  'amber',  'brave',  'bright', 'calm',   'clever', 'cold',   'cozy',   'crisp',
  'dark',   'dim',    'dusty',  'early',  'faint',  'foggy',  'frosted','fuzzy',
  'golden', 'grand',  'grim',   'happy',  'icy',    'jolly',  'kind',   'lazy',
  'lumpy',  'merry',  'misty',  'mossy',  'muddy',  'noble',  'old',    'proud',
  'quick',  'rosy',   'rough',  'rusty',  'salty',  'sandy',  'sharp',  'silent',
  'silver', 'sleepy', 'snowy',  'stormy', 'tall',   'tidy',   'warm',   'wild',
  'windy',  'zesty',
]

const NOUNS = [
  'apple',  'barn',   'bear',   'brook',  'cave',   'cliff',  'cloud',  'crab',
  'dock',   'duck',   'eagle',  'fern',   'field',  'frog',   'gate',   'glen',
  'goat',   'grove',  'hawk',   'hill',   'igloo',  'isle',   'jar',    'kite',
  'lake',   'lamp',   'leaf',   'mill',   'mist',   'moon',   'moss',   'nest',
  'oak',    'owl',    'path',   'pine',   'quail',  'reef',   'river',  'rock',
  'sail',   'snail',  'stone',  'tide',   'tree',   'vale',   'vase',   'wolf',
  'yard',   'zone',
]

const VERBS = [
  'bakes',  'bends',  'blows',  'calls',  'claps',  'dances', 'digs',   'drifts',
  'draws',  'eats',   'fades',  'falls',  'flips',  'flies',  'glows',  'grabs',
  'grows',  'hides',  'hops',   'hunts',  'jumps',  'keeps',  'kicks',  'lands',
  'laps',   'lifts',  'melts',  'moves',  'naps',   'nods',   'opens',  'packs',
  'pops',   'reads',  'rests',  'roams',  'runs',   'shines', 'sings',  'sits',
  'sleeps', 'swims',  'talks',  'tips',   'uses',   'waits',  'walks',  'wanders',
  'yells',  'zips',
]

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generatePassphrase(): string {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)} ${pick(VERBS)}`
}

/** Lowercase, trim, collapse extra spaces */
export function normalizePassphrase(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}
