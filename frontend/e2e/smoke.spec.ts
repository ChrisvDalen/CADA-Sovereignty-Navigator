import { expect, test } from '@playwright/test';

// Hermetisch houden: een hangende fontdownload blokkeert anders de app-boot.
test.beforeEach(async ({ context }) => {
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, (route) => route.abort());
});

/**
 * Smoketest door de kern van het instrument: aanmelden via de magic-link
 * (dev-modus toont de link direct), een dossier openen en in de wizard landen.
 */
test('aanmelden via magic-link en een dossier starten', async ({ page }) => {
  // Zonder sessie word je naar de aanmeldpagina gestuurd
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel('E-mailadres').fill('smoke@gemeente.nl');
  await page.getByRole('button', { name: 'Stuur aanmeldlink' }).click();

  // Ontwikkelmodus: de aanmeldlink staat direct in de pagina
  await page.getByTestId('dev-login-link').click();

  // Aangemeld: de startpagina toont het dossierformulier
  const orgInput = page.getByLabel('Naam van uw organisatie');
  await expect(orgInput).toBeVisible();
  await expect(page.getByText('smoke@gemeente.nl')).toBeVisible();

  // Dossier openen en in stap 2 (toepassingen profileren) landen
  await orgInput.fill('Gemeente Smoke');
  await page.getByRole('button', { name: 'Start de risicoanalyse' }).click();
  await expect(page).toHaveURL(/\/assessment\/.+\/toepassingen/);
  await expect(page.getByText('Dossier · Gemeente Smoke')).toBeVisible();
});
