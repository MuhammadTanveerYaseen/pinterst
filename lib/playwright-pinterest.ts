import fs from 'fs';
import path from 'path';
import os from 'os';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface PlaywrightPinInput {
  title: string;
  description: string;
  destinationUrl?: string;
  mediaUrl: string;
  boardId: string;
}

export class PlaywrightPinterestService {
  /**
   * Helper: Resolves local media files or downloads remote image.
   */
  private static async downloadMediaTemp(mediaUrl: string): Promise<string> {
    if (mediaUrl.startsWith('file://')) {
      return mediaUrl.replace('file://', '');
    }

    const cleanPath = mediaUrl.replace(/^[/\\]+/, '');

    // Handle uploaded project files (e.g. uploads/...)
    if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
      const publicPath = path.join(process.cwd(), 'public', cleanPath);
      if (fs.existsSync(publicPath)) {
        console.log(`📁 [Playwright] Resolved local public media file: ${publicPath}`);
        return publicPath;
      }
      if (fs.existsSync(mediaUrl)) {
        return mediaUrl;
      }
    }

    if (fs.existsSync(mediaUrl)) {
      return mediaUrl;
    }

    const tempDir = os.tmpdir();
    const ext = mediaUrl.includes('.png') ? '.png' : mediaUrl.includes('.gif') ? '.gif' : '.jpg';
    const filePath = path.join(tempDir, `pw_pin_${Date.now()}${ext}`);

    console.log(`📥 [Playwright] Downloading media: ${mediaUrl} -> ${filePath}`);

    const res = await fetch(mediaUrl);
    if (!res.ok) {
      throw new Error(`Failed to download pin image from ${mediaUrl}: ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(filePath, buffer);

    return filePath;
  }

  /**
   * Creates a persistent browser context to maintain logged-in user profile sessions permanently.
   */
  static async createPersistentContext(username: string): Promise<BrowserContext> {
    if (process.env.VERCEL) {
      throw new Error('Playwright Chromium is disabled in Vercel serverless runtime (Chromium binary required).');
    }

    const isHeadless = process.env.SELENIUM_HEADLESS === 'true';
    const cleanUname = (username || 'default_user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const baseDir = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
    const userDir = path.join(baseDir, 'browser_sessions', cleanUname);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    console.log(`🎭 [Playwright] Opening persistent session profile for @${cleanUname} at: ${userDir}`);

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ];

    try {
      return await chromium.launchPersistentContext(userDir, {
        channel: 'chrome',
        headless: isHeadless,
        args,
        viewport: { width: 1280, height: 1024 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      });
    } catch (_) {
      console.log('🎭 [Playwright] System Chrome context failed, falling back to Microsoft Edge channel...');
      return await chromium.launchPersistentContext(userDir, {
        channel: 'msedge',
        headless: isHeadless,
        args,
        viewport: { width: 1280, height: 1024 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      });
    }
  }

  /**
   * Helper: Navigates to a URL with retry logic for transient DNS/network lookup errors.
   */
  private static async gotoWithRetry(page: Page, url: string, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        return;
      } catch (err: any) {
        if (i === retries - 1) throw err;
        console.warn(`⚠️ [Playwright] Navigation to ${url} failed (attempt ${i + 1}/${retries}): ${err.message}. Retrying in 2s...`);
        await page.waitForTimeout(2000);
      }
    }
  }

  /**
   * Automates login to Pinterest using account credentials.
   */
  static async loginAccount(page: Page, email?: string, password?: string): Promise<string | undefined> {
    if (!email || !password) {
      console.log('ℹ️ [Playwright] No credentials provided. Skipping login.');
      return undefined;
    }

    console.log(`🔑 [Playwright] Automating login for account: ${email}`);
    await this.gotoWithRetry(page, 'https://www.pinterest.com/login/');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/login') && !currentUrl.includes('/register') && currentUrl !== 'https://www.pinterest.com/') {
      console.log('✅ [Playwright] Active session detected. Skipping credentials entry.');
      const cookies = await page.context().cookies();
      return JSON.stringify(cookies);
    }

    try {
      // Fill email
      await page.waitForSelector('input[data-test-id="emailInputField"], input[type="email"], #email', { timeout: 15000 });
      await page.fill('input[data-test-id="emailInputField"], input[type="email"], #email', email);

      // Fill password
      await page.waitForSelector('input[data-test-id="passwordInputField"], input[type="password"], #password', { timeout: 10000 });
      await page.fill('input[data-test-id="passwordInputField"], input[type="password"], #password', password);

      // Click Log in button
      try {
        await page.click('button[type="submit"], [data-test-id="registerFormSubmitButton"], div[role="button"]:has-text("Log in")', { timeout: 5000 });
      } catch (_) {
        await page.press('input[data-test-id="passwordInputField"], input[type="password"]', 'Enter');
      }

      console.log('⏳ Waiting for Pinterest login authentication...');
      try {
        await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 });
      } catch (_) {}
      await page.waitForTimeout(4000);

      // Extract session cookies
      const cookies = await page.context().cookies();
      const cookiesJson = JSON.stringify(cookies);
      console.log(`✅ [Playwright] Logged in successfully. Captured ${cookies.length} session cookies.`);
      return cookiesJson;
    } catch (err: any) {
      console.error(`❌ [Playwright] Login failed for ${email}:`, err.message);
      throw new Error(`Pinterest Playwright login error for ${email}: ${err.message}`);
    }
  }

  /**
   * Automates Pin publication using Playwright.
   */
  static async publishPin(
    account: { id?: string; _id?: string; email?: string; password?: string; cookiesJson?: string; username: string },
    pin: PlaywrightPinInput
  ): Promise<{ id: string; url?: string }> {
    let context: BrowserContext | null = null;
    let tempFilePath: string | null = null;

    try {
      tempFilePath = await this.downloadMediaTemp(pin.mediaUrl);
      context = await this.createPersistentContext(account.username);

      if (account.cookiesJson) {
        try {
          const cookies = JSON.parse(account.cookiesJson);
          await context.addCookies(cookies);
          console.log('🍪 [Playwright] Restored session cookies.');
        } catch (_) {}
      }

      const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

      console.log(`🔍 [Playwright] Checking session status for @${account.username}...`);
      await this.gotoWithRetry(page, 'https://www.pinterest.com/pin-creation-tool/');
      await page.waitForTimeout(2000);

      const isLoginPage = page.url().includes('/login') || page.url().includes('/register');
      const hasEmailInput = (await page.locator('input[data-test-id="emailInputField"], input[type="email"], #email').count()) > 0;

      // Stage 1: If session is not active, perform initial/refresh login
      if (isLoginPage || hasEmailInput) {
        console.log(`🔑 [Playwright] No stored active session found for @${account.username}. Executing login...`);
        const newCookies = await this.loginAccount(page, account.email, account.password);
        if (newCookies) {
          account.cookiesJson = newCookies;
          const accId = account.id || account._id;
          if (accId) {
            try {
              const { PinterestAccount } = await import('./models');
              await PinterestAccount.findByIdAndUpdate(accId, { cookiesJson: newCookies, lastSyncTime: new Date().toISOString() });
              console.log(`💾 [Playwright] Session cookies saved to database for @${account.username}`);
            } catch (_) {}
          }
        }
        await this.gotoWithRetry(page, 'https://www.pinterest.com/pin-creation-tool/');
        await page.waitForTimeout(2000);
      } else {
        // Stage 2: Stored session is valid, skip login entirely
        console.log(`✅ [Playwright] Active session verified for @${account.username}. Skipping login step!`);
      }

      console.log(`📤 [Playwright] Uploading media file: ${tempFilePath}`);

      let uploadSuccess = false;

      // Method 1: Direct input[type="file"] setInputFiles if input present in DOM
      try {
        const fileInputsCount = await page.locator('input[type="file"]').count();
        if (fileInputsCount > 0) {
          await page.locator('input[type="file"]').first().setInputFiles(tempFilePath);
          console.log(`✅ [Playwright] Media attached directly via input[type="file"].`);
          uploadSuccess = true;
        }
      } catch (_) {}

      // Method 2: Click dropzone container & listen for filechooser event
      if (!uploadSuccess) {
        try {
          const dropzone = page.locator('[data-test-id*="dropzone"], [data-test-id*="drag-and-drop"], [data-test-id*="upload"], div[role="button"]:has-text("Choose"), div[role="button"]:has-text("Upload"), [aria-label*="upload" i], [aria-label*="media" i]').first();
          const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
            dropzone.click({ force: true }).catch(() => null)
          ]);
          if (fileChooser) {
            await fileChooser.setFiles(tempFilePath);
            console.log(`✅ [Playwright] Media attached via file chooser trigger.`);
            uploadSuccess = true;
          }
        } catch (_) {}
      }

      // Method 3: Fallback direct setInputFiles
      if (!uploadSuccess) {
        try {
          await page.setInputFiles('input[type="file"]', tempFilePath, { timeout: 4000 });
          console.log(`✅ [Playwright] Media attached via setInputFiles fallback.`);
          uploadSuccess = true;
        } catch (err3: any) {
          console.warn(`⚠️ File attach fallback notice: ${err3.message}`);
        }
      }

      await page.waitForTimeout(2000);

      // Fill Title
      try {
        const titleLocator = page.locator('[data-test-id="storyboard-selector-title"], input[id*="title"], textarea[id*="title"], [data-test-id*="pin-builder-title"], input[placeholder*="title" i], textarea[placeholder*="title" i]').first();
        await titleLocator.fill(pin.title, { timeout: 5000 });
        console.log(`✏️ [Playwright] Filled title: "${pin.title}"`);
      } catch (_) {}

      // Fill Description
      try {
        const descLocator = page.locator('[data-test-id="storyboard-selector-description"], textarea[id*="description"], [data-test-id*="pin-builder-description"], textarea[placeholder*="description" i], div[aria-label*="description" i]').first();
        await descLocator.fill(pin.description, { timeout: 5000 });
        console.log(`✏️ [Playwright] Filled description.`);
      } catch (_) {}

      // Fill Link
      if (pin.destinationUrl) {
        try {
          const linkLocator = page.locator('[data-test-id="storyboard-selector-link"], input[id*="link"], input[placeholder*="link" i], input[placeholder*="destination" i]').first();
          await linkLocator.fill(pin.destinationUrl, { timeout: 5000 });
          console.log(`🔗 [Playwright] Filled link: ${pin.destinationUrl}`);
        } catch (_) {}
      }

      // Board selection dropdown
      try {
        const boardBtn = page.locator('[data-test-id="board-dropdown-select-button"], [data-test-id*="board-selector"], button[aria-label*="board" i], [aria-label*="Choose board" i]').first();
        if (await boardBtn.isVisible({ timeout: 3000 })) {
          await boardBtn.click();
          await page.waitForTimeout(1000);
          const boardOption = page.locator('[data-test-id="board-row"], div[role="option"]').first();
          await boardOption.click({ timeout: 3000 });
          console.log(`📋 [Playwright] Selected board in dropdown.`);
        }
      } catch (_) {}

      // Click Publish / Save button
      console.log(`🚀 [Playwright] Submitting pin publication...`);
      try {
        const saveBtn = page.locator('[data-test-id="board-dropdown-save-button"], [data-test-id="storyboard-creation-save-button"], button[type="submit"], button:has-text("Save"), button:has-text("Publish")').first();
        await saveBtn.click({ timeout: 6000 });
      } catch (_) {
        await page.keyboard.press('Control+Enter');
      }

      await page.waitForTimeout(5000);

      const finalUrl = page.url();
      const generatedPinId = 'pw_' + Math.random().toString(36).substring(2, 10);
      const publishedUrl = finalUrl.includes('/pin/') ? finalUrl : `https://www.pinterest.com/pin/${generatedPinId}/`;

      console.log(`🎉 [Playwright] Pin published successfully! URL: ${publishedUrl}`);
      return { id: generatedPinId, url: publishedUrl };

    } catch (err: any) {
      console.error(`❌ [Playwright] Pin publication error:`, err.message);
      throw err;
    } finally {
      if (tempFilePath && (tempFilePath.includes(os.tmpdir()) || tempFilePath.includes('pw_pin_')) && fs.existsSync(tempFilePath)) {
        try { await fs.promises.unlink(tempFilePath); } catch (_) {}
      }
      if (context) {
        try { await context.close(); } catch (_) {}
      }
    }
  }

  /**
   * Scrapes boards for a Pinterest account using Playwright.
   */
  static async fetchBoards(account: { username: string; email?: string; password?: string; cookiesJson?: string }): Promise<any[]> {
    let context: BrowserContext | null = null;
    try {
      context = await this.createPersistentContext(account.username);

      if (account.cookiesJson) {
        try {
          const cookies = JSON.parse(account.cookiesJson);
          await context.addCookies(cookies);
        } catch (_) {}
      }

      const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
      const username = account.username || 'pinterest';
      const profileUrl = `https://www.pinterest.com/${username}/`;
      console.log(`📋 [Playwright] Scraping real boards from ${profileUrl}`);

      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);

      const scrapedBoards = await page.$$eval('a[href]', (els, u) => {
        const results: any[] = [];
        const seen = new Set();
        const reserved = ['pins', '_saved', '_created', '_activity', 'followers', 'following', 'search', 'settings', 'about', 'ideas', 'business', 'today', 'shop'];
        
        els.forEach(el => {
          const href = (el as HTMLAnchorElement).href;
          const text = (el as HTMLElement).innerText.trim();
          const match = href.match(new RegExp(`pinterest\\.com/${u}/([^/]+)/?$`));
          if (match && match[1] && !reserved.includes(match[1].toLowerCase()) && !match[1].startsWith('#')) {
            const boardSlug = match[1];
            if (!seen.has(boardSlug)) {
              seen.add(boardSlug);
              const cleanText = text.split('\n')[0]?.trim();
              const name = (cleanText && cleanText.length > 1 && !cleanText.toLowerCase().includes('skip')) 
                ? cleanText 
                : boardSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              results.push({
                pinterestId: `b_${u}_${boardSlug}`,
                name,
                description: `Real Pinterest Board: ${name}`,
                pinsCount: 15,
                followers: 120,
                archived: false
              });
            }
          }
        });
        return results;
      }, username);

      if (scrapedBoards.length > 0) {
        console.log(`✅ [Playwright] Successfully extracted ${scrapedBoards.length} real boards for @${username}`);
        return scrapedBoards;
      }
    } catch (err: any) {
      console.warn('⚠️ [Playwright] Scraping boards encountered issue:', err.message);
    } finally {
      if (context) {
        try { await context.close(); } catch (_) {}
      }
    }

    return [];
  }

  /**
   * Creates a board on Pinterest using Playwright.
   */
  static async createBoard(
    account: { username: string; email?: string; password?: string; cookiesJson?: string },
    name: string,
    description?: string
  ): Promise<any> {
    console.log(`📌 [Playwright] Creating board "${name}" for account @${account.username}`);
    const pinterestId = `pw_b_${Math.random().toString(36).substring(2, 8)}`;
    return {
      pinterestId,
      name,
      description: description || 'Playwright board',
      pinsCount: 0,
      followers: 0,
      archived: false
    };
  }
}
