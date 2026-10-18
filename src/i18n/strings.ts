export type Language = 'en' | 'nl';

const messages = {
  en: {
    actionFailed: 'Action failed. Please try again.',
    couldNotUpdate: 'Could not update. Please try again.',
    noConfirmation: 'No confirmation received. Showing reported state.',
    notFound: 'Not found',
    unavailable: 'Unavailable',
    unknown: 'Unknown',
    temperature: 'Temperature',
    humidity: 'humidity',
    light: 'light',
    lights: 'lights',
    on: 'On',
    off: 'Off',
    onLower: 'on',
    offLower: 'off',
    updating: 'Updating…',
    onOffOnly: 'On/off only',
    brightness: (name: string) => `${name} brightness`,
    unavailableCount: (count: number) =>
      `${count} ${count === 1 ? 'light' : 'lights'} unavailable`,
    roomLightsOn: (count: number) =>
      `${count} ${count === 1 ? 'light' : 'lights'} on`,
    unavailableShort: (count: number) => `${count} unavailable`,
    lighting: 'Lighting',
    turnAllOn: 'Turn all configured lights on',
    turnAllOff: 'Turn all configured lights off',
    allOn: 'All on',
    allOff: 'All off',
    scenes: 'Scenes',
    activate: (name: string) => `Activate ${name}`,
    activating: 'Activating…',
    activated: (name: string) => `${name} activated`,
    turnOn: 'Turn on',
    turnOff: 'Turn off',
    pause: 'Pause',
    play: 'Play',
    status: {
      on: 'On',
      off: 'Off',
      unavailable: 'Unavailable',
      unknown: 'Unknown',
      playing: 'Playing',
      paused: 'Paused',
      idle: 'Idle',
      standby: 'Standby',
      buffering: 'Buffering',
      recording: 'Recording',
      cleaning: 'Cleaning',
      docked: 'Docked',
      charging: 'Charging',
      returning: 'Returning',
      starting: 'Starting',
      stopped: 'Stopped',
      armed: 'Armed',
      triggered: 'Triggered',
      open: 'Open',
      closed: 'Closed',
      locked: 'Locked',
      unlocked: 'Unlocked',
      heating: 'Heating',
      cooling: 'Cooling',
    } as Record<string, string>,
    previewTitle: 'Home Room Cards',
    previewSubtitle: 'Living room · interactive component preview',
    language: 'Language',
    english: 'English',
    dutch: 'Dutch',
    theme: 'Theme',
    both: 'Both',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    layout: 'Layout',
    phone: 'Phone',
    wide: 'Wide',
    failAction: 'Fail next action',
    externalChange: 'External light change',
    reset: 'Reset',
    mockNotice:
      'Fictional entities · local mock service calls · no Home Assistant connection. State events arrive after a short delay.',
    mockServiceCalls: 'Mock service calls',
    interactHint: 'Interact with a card to inspect service calls.',
    media: 'Media',
    roomHeaderCard: 'Room header',
    roomHeaderDescription: 'Inline room readings and lighting summary.',
    sceneCard: 'Room scenes',
    sceneDescription: 'Compact, single-tap scene buttons.',
    lightCard: 'Light control',
    lightDescription: 'A light with an always-visible brightness slider.',
    lightingCard: 'Room lighting',
    lightingDescription: 'Explicit lights and room-level controls.',
    deviceCard: 'Media device',
    deviceDescription: 'Compact media state and primary action.',
  },
  nl: {
    actionFailed: 'Actie mislukt. Probeer het opnieuw.',
    couldNotUpdate: 'Bijwerken mislukt. Probeer het opnieuw.',
    noConfirmation:
      'Geen bevestiging ontvangen. De gemelde status wordt getoond.',
    notFound: 'Niet gevonden',
    unavailable: 'Niet beschikbaar',
    unknown: 'Onbekend',
    temperature: 'Temperatuur',
    humidity: 'luchtvochtigheid',
    light: 'lamp',
    lights: 'lampen',
    on: 'Aan',
    off: 'Uit',
    onLower: 'aan',
    offLower: 'uit',
    updating: 'Bijwerken…',
    onOffOnly: 'Alleen aan/uit',
    brightness: (name: string) => `Helderheid van ${name}`,
    unavailableCount: (count: number) =>
      `${count} ${count === 1 ? 'lamp niet' : 'lampen niet'} beschikbaar`,
    roomLightsOn: (count: number) =>
      `${count} ${count === 1 ? 'lamp' : 'lampen'} aan`,
    unavailableShort: (count: number) => `${count} niet beschikbaar`,
    lighting: 'Verlichting',
    turnAllOn: 'Schakel alle ingestelde lampen in',
    turnAllOff: 'Schakel alle ingestelde lampen uit',
    allOn: 'Alles aan',
    allOff: 'Alles uit',
    scenes: 'Scènes',
    activate: (name: string) => `Activeer ${name}`,
    activating: 'Activeren…',
    activated: (name: string) => `${name} geactiveerd`,
    turnOn: 'Inschakelen',
    turnOff: 'Uitschakelen',
    pause: 'Pauzeren',
    play: 'Afspelen',
    status: {
      on: 'Aan',
      off: 'Uit',
      unavailable: 'Niet beschikbaar',
      unknown: 'Onbekend',
      playing: 'Speelt af',
      paused: 'Gepauzeerd',
      idle: 'Inactief',
      standby: 'Stand-by',
      buffering: 'Bufferen',
      recording: 'Opnemen',
      cleaning: 'Schoonmaken',
      docked: 'Op het basisstation',
      charging: 'Opladen',
      returning: 'Keert terug',
      starting: 'Opstarten',
      stopped: 'Gestopt',
      armed: 'Ingeschakeld',
      triggered: 'Geactiveerd',
      open: 'Open',
      closed: 'Gesloten',
      locked: 'Vergrendeld',
      unlocked: 'Ontgrendeld',
      heating: 'Verwarmen',
      cooling: 'Koelen',
    } as Record<string, string>,
    previewTitle: 'Home Room Cards',
    previewSubtitle: 'Woonkamer · interactieve componentpreview',
    language: 'Taal',
    english: 'Engels',
    dutch: 'Nederlands',
    theme: 'Thema',
    both: 'Beide',
    lightTheme: 'Licht',
    darkTheme: 'Donker',
    layout: 'Indeling',
    phone: 'Telefoon',
    wide: 'Breed',
    failAction: 'Laat volgende actie mislukken',
    externalChange: 'Externe wijziging van lamp',
    reset: 'Herstellen',
    mockNotice:
      'Fictieve entiteiten · lokale mock-serviceaanroepen · geen verbinding met Home Assistant. Statusupdates volgen na een korte vertraging.',
    mockServiceCalls: 'Mock-serviceaanroepen',
    interactHint: 'Gebruik een kaart om serviceaanroepen te bekijken.',
    media: 'Media',
    roomHeaderCard: 'Kamerkop',
    roomHeaderDescription:
      'Kamerwaarden en verlichtingsoverzicht in één kaart.',
    sceneCard: 'Kamerscènes',
    sceneDescription: 'Compacte scèneknoppen met één tik.',
    lightCard: 'Lampbediening',
    lightDescription: 'Een lamp met een altijd zichtbare helderheidsregelaar.',
    lightingCard: 'Kamerverlichting',
    lightingDescription: 'Ingestelde lampen en bediening voor de hele kamer.',
    deviceCard: 'Media-apparaat',
    deviceDescription: 'Compacte mediastatus en hoofdactie.',
  },
} as const;

export type MessageKey = keyof typeof messages.en;

export function languageOf(language?: string): Language {
  return language?.toLowerCase().split(/[-_]/, 1)[0] === 'nl' ? 'nl' : 'en';
}

export function ui(language?: string) {
  return messages[languageOf(language)];
}

export function localizedStatus(state: string, language?: string): string {
  const text = ui(language);
  return text.status[state.toLowerCase()] ?? text.unknown;
}

/** Localize a known legacy message while preserving the command API. */
export function localizedError(message: string, language?: string): string {
  const text = ui(language);
  switch (message) {
    case 'Action failed. Please try again.':
      return text.actionFailed;
    case 'Could not update. Please try again.':
      return text.couldNotUpdate;
    case 'No confirmation received. Showing reported state.':
      return text.noConfirmation;
    default:
      return message;
  }
}
