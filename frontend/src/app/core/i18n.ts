import { Injectable, signal } from '@angular/core';

export type Lang = 'nl' | 'en';

const STORAGE_KEY = 'cada-lang';

/**
 * Vertalingen voor de kern-/toegangsschermen. Sleutels zijn stabiel; ontbreekt
 * een sleutel in een taal, dan valt {@link LocaleStore.t} terug op het
 * Nederlands en anders op de sleutel zelf.
 */
export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  nl: {
    'lang.name': 'Nederlands',
    'lang.switchTo': 'English',

    'common.loading': 'Bezig met laden…',
    'common.backToStart': 'Terug naar start',
    'common.signOut': 'Afmelden',

    'deadline.prefix': 'De CADA is van kracht per augustus 2026 —',
    'deadline.daysLeft': 'nog {days} dagen',
    'deadline.today': 'vanaf vandaag van kracht',
    'deadline.passed': 'sinds {days} dagen van kracht',

    'start.eyebrow': 'Cloud and AI Development Act · augustus 2026',
    'start.stepLabel': 'Stap 1 van 4 · Voorbereiding',
    'start.openDossier': 'Open een dossier',
    'start.orgIntro':
      'Vul de naam van uw organisatie in. Uw voortgang wordt automatisch bewaard, zodat u de analyse later kunt hervatten.',
    'start.orgLabel': 'Naam van uw organisatie',
    'start.orgPlaceholder': 'Bijv. Gemeente Utrecht',
    'start.submit': 'Start de risicoanalyse',
    'start.submitBusy': 'Bezig met starten…',
    'start.resumeFound': 'Eerdere sessie gevonden',
    'start.resume': 'Sessie hervatten →',
    'start.allDossiers': 'Alle dossiers →',
    'start.referenceData': 'Leveranciersreferentiedata →',
    'start.signedInAs': 'Aangemeld als',
    'start.disclaimer':
      'Dit instrument is indicatief. Raadpleeg altijd een juridisch adviseur voor een bindende interpretatie van de CADA.',

    'login.eyebrow': 'Aanmelden',
    'login.title': 'Toegang tot uw dossiers',
    'login.intro':
      'Vul uw e-mailadres in; u ontvangt een eenmalige aanmeldlink. Een wachtwoord is niet nodig.',
    'login.emailLabel': 'E-mailadres',
    'login.submit': 'Stuur aanmeldlink',
    'login.submitBusy': 'Bezig…',
    'login.sentEyebrow': 'Controleer uw inbox',
    'login.sentTitle': 'Aanmeldlink verstuurd',
    'login.sentTo': 'We hebben een aanmeldlink aangemaakt voor',
    'login.sentValidity': 'De link is 15 minuten geldig en eenmalig te gebruiken.',
    'login.devHint': 'Ontwikkelmodus: zonder mailserver wordt de link hier direct getoond.',
    'login.logHint': 'Geen mail ontvangen? De beheerder vindt de link ook in het serverlog.',
    'login.directLogin': 'Direct aanmelden',
    'login.otherEmail': 'Ander e-mailadres gebruiken',
    'login.privacy': 'Dossiers zijn persoonlijk: alleen de eigenaar kan ze inzien en bewerken.',

    'dossiers.headerTag': 'Dossieroverzicht',
    'dossiers.eyebrow': 'Portfolio',
    'dossiers.title': 'Alle dossiers',
    'dossiers.intro':
      'Overzicht van alle gestarte analyses met het aantal geprofileerde toepassingen en de gevonden compliance-gaps.',
    'dossiers.statDossiers': 'Dossiers',
    'dossiers.statApplications': 'Toepassingen',
    'dossiers.statGaps': 'Compliance-gaps',
    'dossiers.levelDistribution': 'Niveauverdeling (portfolio)',
    'dossiers.colOrg': 'Organisatie',
    'dossiers.colStarted': 'Gestart',
    'dossiers.colApplications': 'Toepassingen',
    'dossiers.colGaps': 'Gaps',
    'dossiers.open': 'Openen →',
    'dossiers.rename': 'Hernoemen',
    'dossiers.archive': 'Archiveren',
    'dossiers.unarchive': 'Herstellen',
    'dossiers.delete': 'Verwijderen',
    'dossiers.save': 'Opslaan',
    'dossiers.cancel': 'Annuleren',
    'dossiers.showArchived': 'Toon gearchiveerde',
    'dossiers.hideArchived': 'Verberg gearchiveerde',
    'dossiers.archivedTag': 'Gearchiveerd',
    'dossiers.empty': 'Er zijn nog geen dossiers.',
    'dossiers.startFirst': 'Start een eerste analyse.',
    'dossiers.confirmDelete':
      'Weet u zeker dat u dit dossier definitief wilt verwijderen? Alle toepassingen en momentopnames gaan verloren.',
  },
  en: {
    'lang.name': 'English',
    'lang.switchTo': 'Nederlands',

    'common.loading': 'Loading…',
    'common.backToStart': 'Back to start',
    'common.signOut': 'Sign out',

    'deadline.prefix': 'The CADA takes effect in August 2026 —',
    'deadline.daysLeft': '{days} days left',
    'deadline.today': 'in effect from today',
    'deadline.passed': 'in effect for {days} days',

    'start.eyebrow': 'Cloud and AI Development Act · August 2026',
    'start.stepLabel': 'Step 1 of 4 · Preparation',
    'start.openDossier': 'Open a dossier',
    'start.orgIntro':
      'Enter your organisation’s name. Your progress is saved automatically so you can resume the analysis later.',
    'start.orgLabel': 'Your organisation’s name',
    'start.orgPlaceholder': 'E.g. City of Utrecht',
    'start.submit': 'Start the risk analysis',
    'start.submitBusy': 'Starting…',
    'start.resumeFound': 'Earlier session found',
    'start.resume': 'Resume session →',
    'start.allDossiers': 'All dossiers →',
    'start.referenceData': 'Supplier reference data →',
    'start.signedInAs': 'Signed in as',
    'start.disclaimer':
      'This tool is indicative. Always consult a legal advisor for a binding interpretation of the CADA.',

    'login.eyebrow': 'Sign in',
    'login.title': 'Access your dossiers',
    'login.intro':
      'Enter your email address; you will receive a one-time sign-in link. No password required.',
    'login.emailLabel': 'Email address',
    'login.submit': 'Send sign-in link',
    'login.submitBusy': 'Working…',
    'login.sentEyebrow': 'Check your inbox',
    'login.sentTitle': 'Sign-in link sent',
    'login.sentTo': 'We created a sign-in link for',
    'login.sentValidity': 'The link is valid for 15 minutes and can be used once.',
    'login.devHint': 'Development mode: without a mail server the link is shown here directly.',
    'login.logHint': 'No email? The administrator can also find the link in the server log.',
    'login.directLogin': 'Sign in directly',
    'login.otherEmail': 'Use a different email address',
    'login.privacy': 'Dossiers are personal: only the owner can view and edit them.',

    'dossiers.headerTag': 'Dossier overview',
    'dossiers.eyebrow': 'Portfolio',
    'dossiers.title': 'All dossiers',
    'dossiers.intro':
      'Overview of all started analyses with the number of profiled applications and the compliance gaps found.',
    'dossiers.statDossiers': 'Dossiers',
    'dossiers.statApplications': 'Applications',
    'dossiers.statGaps': 'Compliance gaps',
    'dossiers.levelDistribution': 'Level distribution (portfolio)',
    'dossiers.colOrg': 'Organisation',
    'dossiers.colStarted': 'Started',
    'dossiers.colApplications': 'Applications',
    'dossiers.colGaps': 'Gaps',
    'dossiers.open': 'Open →',
    'dossiers.rename': 'Rename',
    'dossiers.archive': 'Archive',
    'dossiers.unarchive': 'Restore',
    'dossiers.delete': 'Delete',
    'dossiers.save': 'Save',
    'dossiers.cancel': 'Cancel',
    'dossiers.showArchived': 'Show archived',
    'dossiers.hideArchived': 'Hide archived',
    'dossiers.archivedTag': 'Archived',
    'dossiers.empty': 'There are no dossiers yet.',
    'dossiers.startFirst': 'Start a first analysis.',
    'dossiers.confirmDelete':
      'Are you sure you want to permanently delete this dossier? All applications and snapshots will be lost.',
  },
};

/** Bewaart de gekozen taal en levert vertalingen; reactief onder signalen. */
@Injectable({ providedIn: 'root' })
export class LocaleStore {
  private readonly _lang = signal<Lang>(this.initial());
  readonly lang = this._lang.asReadonly();

  private initial(): Lang {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return stored === 'en' || stored === 'nl' ? stored : 'nl';
  }

  set(lang: Lang): void {
    this._lang.set(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage kan ontbreken (bijv. private mode); taal blijft dan per sessie.
    }
  }

  toggle(): void {
    this.set(this._lang() === 'nl' ? 'en' : 'nl');
  }

  /** Vertaalt een sleutel en vult {placeholders} in. Reactief op {@link lang}. */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this._lang();
    const value = TRANSLATIONS[lang][key] ?? TRANSLATIONS.nl[key] ?? key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
  }
}
