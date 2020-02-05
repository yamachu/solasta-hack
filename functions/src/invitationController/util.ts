import { Browser, launch, Page } from 'puppeteer';
import { VisitViewFormUrl } from './contract';

export const waitFormUpdate = (page: Page, timeout?: number) =>
    page.waitForResponse((v) => v.url() === VisitViewFormUrl, {
        timeout: timeout || 10000,
    });

export const waitForReady = (page: Page) =>
    page.waitForFunction(
        () =>
            window.document.readyState === 'interactive' ||
            window.document.readyState === 'complete'
    );

export const retryFunction = <T>(fn: () => T, count: number): Promise<T> => {
    let p = Promise.reject().catch((_) => fn());
    for (let i = 0; i < count; i++) {
        p = p.catch((_) => fn());
    }
    return p;
};

export const wait = (interval: number): Promise<void> =>
    new Promise((resolve) => setTimeout(() => resolve(), interval));

export const getBrowser = async (): Promise<Browser> => {
    const isLocal = process.env.LOCAL_DEV !== undefined;
    console.log(`isLocal: ${isLocal}`);

    const options = {
        headless: isLocal ? false : true,
        args: ['--lang=ja', '--no-sandbox'],
        timeout: 10000,
    };

    console.log('try launch');
    return await launch(options);
};
