import admin from 'firebase-admin';
import { Browser, Page } from 'puppeteer';
import { Actions, Command, LinkToVisitView, LinkToVisitViewForm, TicketType } from '../contract';
import { getBrowser, retryFunction, wait, waitFormUpdate, waitForReady } from '../util';

if (process.env.LOCAL_DEV !== undefined) {
    admin.initializeApp();
}

const login = (page: Page) => async (token: string) => {
    await page.setCookie({
        name: 'access_token',
        domain: 'myplace-app.com',
        path: '/',
        value: token,
    });
    await page.goto('https://myplace-app.com/', { waitUntil: 'networkidle0' });
};

const openVisitSystem = (browser: Browser, page: Page) => async () => {
    const [newPage] = await Promise.all([
        browser.waitForTarget((t) => t.opener() === page.target()).then((t) => t.page()),
        page.click(LinkToVisitView),
    ]);
    await newPage.waitForResponse((u) =>
        u.url().includes('https://visitview.knowlbo.co.jp/solasta-tenant')
    );
    return newPage;
};

const moveToVisitSystemForm = (page: Page) => async () => {
    await waitForReady(page).then((_) =>
        page.waitForSelector(LinkToVisitViewForm, {
            visible: true,
        })
    );
    await retryFunction(
        () =>
            Promise.all([
                page
                    .$(LinkToVisitView)
                    .then((_) => page.click(LinkToVisitViewForm))
                    .catch((_) => {
                        console.log(`${LinkToVisitView} maybe not found, wait for navigation...`);
                    }),
                page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 2000 }).catch((e) => {
                    if (
                        page.url() ===
                        'https://visitview.knowlbo.co.jp/solasta-tenant/officeview/OfficeView.WebPages/VisitorBooking/VisitorBookingDataPage.aspx'
                    ) {
                        return Promise.resolve();
                    }
                    throw e;
                }),
            ]),
        3
    ).then((_) => waitForReady(page));
};

const selectHost = (page: Page) => async (name: string) => {
    console.info(`Begin Select Host: ${name}`);
    await waitForReady(page).then((_) =>
        page.waitForSelector('#dropDownList_HostMember', {
            visible: true,
        })
    );
    const valueNameMap: [string, string][] = await page.$$eval(
        '#dropDownList_HostMember > option',
        (e) =>
            e.map((v) => [v.getAttribute('value') as string, v.innerHTML.replace(/\s/g, '').trim()])
    );
    const targetUser = valueNameMap.find(([_, v]) => v === name.replace(/\s/g, '').trim());
    if (targetUser === undefined) {
        throw new Error('This user is not selected');
    }
    await Promise.all([
        page.select('#dropDownList_HostMember', targetUser[0]),
        waitFormUpdate(page),
    ]);
    console.info(`End Select Host: ${name}`);
};

const selectReception = (page: Page) => async () => {
    console.info('Begin Select Reception');
    await waitForReady(page).then((_) =>
        page.waitForSelector('#dropDownList_SelectionFacilityRoom', {
            visible: true,
        })
    );
    await Promise.all([
        page.select('#dropDownList_SelectionFacilityRoom', '#0001'), // 15F 受付
        page.waitForNavigation({ waitUntil: 'networkidle0' }).then((_) => waitForReady(page)),
    ]);
    console.info('End Select Reception');
};

const addGuests = (page: Page) => async ({
    familyName,
    firstName,
    email,
    count,
}: {
    familyName: string;
    firstName?: string;
    email?: string;
    count?: number;
}) => {
    console.info('Begin Add Guests');
    await page.$eval('#textBox_Person_FamilyName', (e) => (e.nodeValue = ''));
    await page.waitFor(500);
    await page.type('#textBox_Person_FamilyName', familyName);
    if (firstName !== undefined) {
        await page.$eval('#textBox_Person_FirstName', (e) => (e.nodeValue = ''));
        await page.waitFor(500);
        await page.type('#textBox_Person_FirstName', firstName);
    }
    if (email !== undefined) {
        await page.$eval('#textBox_MailAddress', (e) => (e.nodeValue = ''));
        await page.type('#textBox_MailAddress', email);
    }
    if (count !== undefined) {
        await page.select('#dropDownList_CompanionCount', ('0000' + count).slice(-4));
    }

    Promise.all([
        page.click('#imageButton_VisitorPerson_Enter'),
        waitFormUpdate(page)
            .then((_) => waitForReady(page))
            .then(() => wait(1500)),
    ]);
    console.info('End Add Guests');
};

const selectDate = (page: Page) => async (date: Date) => {
    console.info('Begin Select Date');

    await page.click('#checkBox_IsVisitorBookingDate');
    await waitForReady(page);

    const moveTargetMonth = async () => {
        while (true) {
            await page.waitForSelector(
                '#calendar_VisitorBookingDate > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(2)',
                { visible: true }
            );
            // select month
            const yearAndMonth = await page.$eval(
                '#calendar_VisitorBookingDate > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(2)',
                (v) => v.innerHTML
            );

            const targetYear = date.getFullYear();
            const targetMonth = date.getMonth() + 1;
            const calendarYear = parseInt(yearAndMonth.split('年')[0], 10);
            const calendarMonth = parseInt(yearAndMonth.split('年')[1].split('月')[0], 10);

            if (targetYear === calendarYear && targetMonth === calendarMonth) {
                break;
            }

            if (targetYear < calendarYear && targetMonth < calendarMonth) {
                throw new Error('cannot past date');
            }

            // next month
            await Promise.all([
                page.click(
                    '#calendar_VisitorBookingDate > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(3) > a'
                ),
                waitFormUpdate(page).then(() => wait(300)),
            ]);
        }
    };

    await moveTargetMonth();

    const dateAndMonth = `${date.getMonth() + 1}月${date.getDate()}日`;
    await page.waitForXPath(
        `//*[@id="calendar_VisitorBookingDate"]/tbody/tr/td/a[@title="${dateAndMonth}"]`,
        { visible: true }
    );

    await Promise.all([
        page
            .$x(`//*[@id="calendar_VisitorBookingDate"]/tbody/tr/td/a[@title="${dateAndMonth}"]`)
            .then((v) => v[0].click()),
        waitFormUpdate(page).then(() => wait(300)),
    ]);

    await Promise.all([
        page.select('#dropDownList_VisitorBookingTime_Hour', 'H07'),
        waitFormUpdate(page).then(() => wait(300)),
    ]);

    await Promise.all([
        page.select('#dropDownList_VisitorBookingEndTime_Hour', 'H24'),
        waitFormUpdate(page).then(() => wait(300)),
    ]);
    console.info('End Select Date');
};

const selectVisitorClass = (page: Page) => async (ticketType: TicketType) => {
    console.info(`Begin Select Visitor Class: ${ticketType}`);
    await waitForReady(page).then((_) =>
        page.waitForSelector('#dropDownList_VisitorClass', {
            visible: true,
        })
    );
    const valueNameMap: [
        string,
        string
    ][] = await page.$$eval('#dropDownList_VisitorClass > option', (e) =>
        e.map((v) => [v.getAttribute('value') as string, v.innerHTML.replace(/\s/g, '').trim()])
    );
    await Promise.all([
        page.select('#dropDownList_VisitorClass', valueNameMap[ticketType][0]),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    console.info(`End Select Visitor Class: ${ticketType}`);
};

const submit = (page: Page) => async () => {
    console.info('Begin Submit');
    await Promise.all([page.click('#imageButton_OK0'), waitFormUpdate(page)]);
    console.info('End Submit');
};

const addAction = async (action: Actions) => {
    if (action.action !== Command.Add) {
        return;
    }
    const browser = await getBrowser();
    console.log('begin add');
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'ja-JP',
    });

    const config = await admin
        .firestore()
        .doc('/admin/token')
        .get();
    const token = config.get('accessToken');

    await login(page)(token);
    const newPage = await openVisitSystem(browser, page)();
    await newPage.setExtraHTTPHeaders({
        'Accept-Language': 'ja-JP',
    });
    await moveToVisitSystemForm(newPage)();
    await selectHost(newPage)(action.host);
    await selectReception(newPage)();

    for (let i = 0; i < (action.count || 1); i++) {
        await addGuests(newPage)({
            familyName: `${action.host}のお客`,
        });
        await newPage.waitFor(500);
    }

    await selectDate(newPage)(action.date);
    await selectVisitorClass(newPage)(action.ticketType);

    await submit(newPage)();

    console.info('Closing...');
    await browser.close();
    console.info('Closed');
};

export default addAction;
