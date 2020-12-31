const puppeteer = require('puppeteer');
const h = require('./src/helper');
const tenderWayFillForm = require('./src/tenderWay');
const { app, BrowserWindow, ipcMain } = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if(BrowserWindow.getAllWindows.length === 0) {
        createWindow();
    }
});

ipcMain.handle('autoFillForm', (event, ...args) => {
    const account = args[0];
    const ext = args[1];
    const password = args[2]
    const ip = args[3];
    const name = args[4];
    const tenderWay = args[5];
    const awardWay = args[6];
    const multipleAward = args[7];
    console.log(`account: ${account}, ext: ${ext}, password: ${password}`);
    console.log(`ip: ${ip}`);
    console.log(`username: ${name}`);
    console.log(`tenderWay: ${tenderWay}`);
    console.log(`awardWay: ${awardWay}`);
    console.log(`multipleAward: ${multipleAward}`);
    autoFill(account, ext, password, ip, name, tenderWay, awardWay, multipleAward).catch(e => console.log(`error: ${e}`));
});

ipcMain.handle('deleteTempRecords', (event, ...args) => {
    const account = args[0];
    const ext = args[1];
    const password = args[2]
    const ip = args[3];
    const name = args[4];
    console.log(`account: ${account}, ext: ${ext}, password: ${password}`);
    console.log(`ip: ${ip}`);
    console.log(`username: ${name}`);
    deleteTempRecords(account, ext, password, ip, name).catch(e => console.log(`error: ${e}`));
});

function commonPuppeteerConfig() {

}

async function autoFill(account, ext, password, ip, name, tenderWay, awardWay, multipleAward) {
    const locationHref = ip === '180' ? '202.39.47.180' : '202.39.47.161';
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            '--start-maximized'
        ]
    });
    const page = await browser.newPage();
    page.setViewport({ width: 0, height: 0 });
    page.setDefaultNavigationTimeout(0);
    
    await page.goto(`http://${locationHref}/tps/`);

    // 登入
    await page.type('#orgUserId', account, { delay: 100 });
    await page.type('#orgUserIdExt', ext, { delay: 100 });
    await page.type('#orgPassword', password, { delay: 100 });
    await page.evaluate(() => orgLogin('pwd'));

    // 導向新增招標公告
    await page.waitForNavigation();
    await page.goto(`http://${locationHref}/tps/TenderManagement/showTenderTmp`);

    // 輸入標案案號
    const fileName = h.generateFileName(name);
    await page.type('#tenderCaseNo', fileName, { delay: 100 });
    
    // 選擇招標方式
    await page.select('#fkPmsTenderWay', tenderWay);

    // 決標方式/複數非複數
    if((awardWay !== null && awardWay !== '') && (multipleAward !== null && multipleAward !== '')) {
        // fkPmsAwardWay_1
        await page.click('#fkPmsAwardWay_' + awardWay);
        await page.click('#isMultipleAward_' + multipleAward);
    }

    // 新增
    await page.click('#sbt_New');

    if(tenderWay === '1' && awardWay === '1') {
        await page.click('#yes');
    }

    // 填表單
    await page.waitForNavigation();
    tenderWayFillForm.dep(page);
    
    await page.waitForNavigation();
    tenderWayFillForm.buyInfo(page, fileName, tenderWay);

    await page.waitForNavigation();
    tenderWayFillForm.info(page, tenderWay);

    await page.waitForNavigation();
    tenderWayFillForm.vars(page, tenderWay);

    await page.waitForNavigation();
    tenderWayFillForm.other(page, fileName, tenderWay);

    await page.waitForNavigation();
    if(tenderWay === '12') {
        await page.waitForNavigation();
        tenderWayFillForm.vendorStatement(page);
        await page.waitForNavigation();
        tenderWayFillForm.priceList(page);
        await page.waitForNavigation();
        tenderWayFillForm.threePurpose(page);
        // await page.waitForNavigation();
        // tenderWayFillForm.upload(page, tenderWay);
    }

    if(multipleAward === 'Y') {
        await page.waitForNavigation();
        tenderWayFillForm.item(page, tenderWay);
    }

    await page.waitForNavigation();
    tenderWayFillForm.upload(page, tenderWay);
}

async function deleteTempRecords(account, ext, password, ip, name) {
    const locationHref = ip === '180' ? '202.39.47.180' : '202.39.47.161';
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            '--start-maximized'
        ]
    });
    const page = await browser.newPage();
    page.setViewport({ width: 0, height: 0 });
    page.setDefaultNavigationTimeout(0);
    
    await page.goto(`http://${locationHref}/tps/`);

    // 登入
    await page.type('#orgUserId', account, { delay: 100 });
    await page.type('#orgUserIdExt', ext, { delay: 100 });
    await page.type('#orgPassword', password, { delay: 100 });
    await page.evaluate(() => orgLogin('pwd'));

    // 導向新增招標公告
    await page.waitForNavigation();
    await page.goto(`http://${locationHref}/tps/TenderManagement/showTenderTmp`);

    // await page.waitForNavigation();
    
    while(true) {
        await page.evaluate(() => toggle('openList'));
        await page.type('#search_option', name, { delay: 100 });
        await page.click('input[type="submit"][value="查詢"]');
        await page.waitForNavigation();
        const elementCountHandle = await page.$('span.red');
        const elementCount = await page.evaluateHandle(e => e.innerText, elementCountHandle);
        const count = await elementCount.jsonValue();
        console.log(`elementCount: ${elementCount}`);
        console.log(`count: ${count}`);
        console.log(`count after parseInt: ${parseInt(count)}`);
        if(parseInt(count) === 0) break;
        // await page.evaluate(() => toggle('openList'));
        await page.waitForTimeout(3000);
        await page.evaluate(() => {
            document.querySelector('input[name=deleteinfo]').click();
            document.querySelector('a[id=yes]').click();
        });
        await page.waitForNavigation();
    }
}