import puppeteer from 'puppeteer';

const GOOGLE_URL = 'https://www.google.com';
const MAPS_HOST_IDENTIFIER = 'https://maps.google.';

const inputSelectors = ['input[name="q"]', 'textarea[name="q"]'];
const consentSelectors = [
  '#L2AGLb',
  'button[aria-label^="Accepter"]',
  'button[aria-label*="j\'accepte"]',
  'button[aria-label^="Accept"]',
  'button[aria-label^="Ich stimme zu"]',
  'form[action*="consent"] button[type="submit"]'
];

async function tryClick(page, selectors, options = {}) {
  for (const selector of selectors) {
    const handle = await page.$(selector);
    if (handle) {
      await handle.click(options);
      await page.waitForTimeout(500);
      await handle.dispose();
      return true;
    }
  }
  return false;
}

async function getTextContent(page, selectors) {
  for (const selector of selectors) {
    const handle = await page.$(selector);
    if (handle) {
      const text = await page.evaluate((el) => el.textContent || '', handle);
      await handle.dispose();
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }
  }
  return '';
}

async function getAttribute(page, selectors, attribute) {
  for (const selector of selectors) {
    const handle = await page.$(selector);
    if (handle) {
      const value = await page.evaluate((el, attr) => el.getAttribute(attr) || '', handle, attribute);
      await handle.dispose();
      if (value && value.trim().length > 0) {
        return value.trim();
      }
    }
  }
  return '';
}

function sanitizeNumber(value) {
  if (!value) return null;
  const normalized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

async function expandHoursSection(page) {
  const selectors = [
    'button[aria-label*="Horaires"]',
    'button[aria-label*="Hours"]',
    'button[jsaction*="pane.hours"]',
    'div[aria-label*="Horaires"] button',
    'div[aria-label*="Hours"] button'
  ];
  await tryClick(page, selectors, { delay: 200 });
  await page.waitForTimeout(1200);
}

async function extractHours(page) {
  const hours = await page.evaluate(() => {
    const result = [];
    const containers = [
      document.querySelector('div[aria-label*="Horaires"] table'),
      document.querySelector('div[aria-label*="Horaires"]'),
      document.querySelector('div[aria-label*="Hours"] table'),
      document.querySelector('div[aria-label*="Hours"]')
    ];

    for (const container of containers) {
      if (!container) continue;
      const rows = container.querySelectorAll('tr');
      if (rows.length > 0) {
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const day = cells[0].textContent?.trim();
            const hoursValue = cells[1].textContent?.trim();
            if (day) {
              result.push({ day, hours: hoursValue || null });
            }
          } else {
            const text = row.textContent?.trim();
            if (text) {
              const [day, ...rest] = text.split(':');
              result.push({ day: day.trim(), hours: rest.join(':').trim() || null });
            }
          }
        });
        break;
      }

      const listItems = container.querySelectorAll('li');
      if (listItems.length > 0) {
        listItems.forEach((item) => {
          const dayElement = item.querySelector('div:first-child');
          const hourElement = item.querySelector('div:nth-child(2)');
          const day = dayElement?.textContent?.trim();
          const hoursValue = hourElement?.textContent?.trim();
          if (day) {
            result.push({ day, hours: hoursValue || null });
          }
        });
        break;
      }
    }

    return result;
  });

  return hours.filter((entry) => entry.day);
}

async function collectPhotoUrls(page) {
  const photoTriggers = [
    'button[aria-label*="Photos"]',
    'button[jsaction*="pane.heroHeader.photo"]',
    'div[aria-label*="Photo"]',
    'button[aria-label*="Voir les photos"]',
    'button[aria-label*="All photos"]'
  ];

  const opened = await tryClick(page, photoTriggers, { delay: 150 });
  if (!opened) {
    return [];
  }

  try {
    await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
    const scrollableSelector = 'div[role="dialog"] div[role="region"], div[role="dialog"] div[aria-label]';

    for (let i = 0; i < 6; i += 1) {
      await page.evaluate((selector) => {
        const scrollable = document.querySelector(selector);
        if (scrollable) {
          scrollable.scrollBy(0, scrollable.scrollHeight);
        }
      }, scrollableSelector);
      await page.waitForTimeout(750);
    }

    const urls = await page.$$eval('div[role="dialog"] img', (images) => {
      const srcValues = images
        .map((img) => [img.getAttribute('src'), img.getAttribute('data-src'), img.getAttribute('srcset')])
        .flat()
        .filter((value) => typeof value === 'string')
        .map((value) => value.split(' ')[0]);

      return Array.from(new Set(srcValues)).filter((url) => url.includes('lh3.googleusercontent.com'));
    });

    await page.keyboard.press('Escape');

    return urls.slice(0, 20);
  } catch (error) {
    console.warn('Impossible de récupérer les photos :', error);
    return [];
  }
}

export async function scrapeBusinessInfo(businessName) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 720 }
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
  );

  try {
    await page.goto(GOOGLE_URL, { waitUntil: 'networkidle2', timeout: 45000 });
    await tryClick(page, consentSelectors);

    let inputFound = false;
    for (const selector of inputSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.click({ clickCount: 3 });
        await input.type(businessName, { delay: 75 });
        inputFound = true;
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }),
          page.keyboard.press('Enter')
        ]);
        break;
      }
    }

    if (!inputFound) {
      throw new Error('Champ de recherche Google introuvable.');
    }

    await page.waitForTimeout(2000);

    const mapsLink = await page.evaluate((hostIdentifier) => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const mapsAnchor = anchors.find((anchor) => anchor.href.startsWith(hostIdentifier));
      return mapsAnchor ? mapsAnchor.href : '';
    }, MAPS_HOST_IDENTIFIER);

    if (!mapsLink) {
      throw new Error("Impossible de trouver la fiche Google Maps pour cette entreprise.");
    }

    await page.goto(mapsLink, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(4000);

    await expandHoursSection(page);

    const name = await getTextContent(page, ['h1[class*="DUwDvf"]', 'h1.fontHeadlineLarge']);
    const description = await getTextContent(page, ['div[role="region"] div[aria-label*="Résumé"] span', 'div[data-section-id="summary"] div.Io6YTe']);
    const category = await getTextContent(page, ['button[jsaction*="pane.rating.category"] span', 'div[aria-label*="Catégorie"] span']);
    const address = await getTextContent(page, ['button[data-item-id*="address"] div[role="text"]', 'div[data-item-id*="address"]']);
    const phone = await getTextContent(page, ['button[data-item-id*="phone"] div[role="text"]', 'div[data-item-id*="phone"]']);
    const ratingText = await getTextContent(page, ['div.F7nice span[aria-hidden="true"]', 'span[aria-label*="étoiles"]', 'span[aria-label*="stars"]']);
    const reviewCountText = await getTextContent(page, ['div.F7nice span[role="img"] + span', 'span[aria-label*="avis"]', 'span[aria-label*="reviews"]']);

    const hours = await extractHours(page);
    const photoUrls = await collectPhotoUrls(page);
    const mapsUrl = page.url();

    return {
      name: name || businessName,
      description: description || '',
      category: category || '',
      address: address || '',
      phone: phone || '',
      rating: sanitizeNumber(ratingText),
      reviewCount: sanitizeNumber(reviewCountText),
      hours,
      photoUrls,
      mapsUrl
    };
  } finally {
    await browser.close();
  }
}
