const puppeteer = require('puppeteer');
const h = require('./src/helper');
const tenderWayFillForm = require('./src/tenderWay');
const { app, BrowserWindow, ipcMain } = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        width: 600,
        height: 400,
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
    const ip = args[0];
    const tenderWay = args[1];
    const awardWay = args[2];
    const multipleAward = args[3];
    console.log(`ip: ${ip}`);
    console.log(`tenderWay: ${tenderWay}`);
    autoFill(ip, tenderWay, awardWay, multipleAward).catch(e => console.log(`error: ${e}`));
});

async function autoFill(ip, tenderWay, awardWay, multipleAward) {
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
    await page.type('#orgUserId', '3.13.50', { delay: 100 });
    await page.type('#orgUserIdExt', '0', { delay: 100 });
    await page.type('#orgPassword', 'abc123', { delay: 100 });
    await page.evaluate(() => orgLogin('pwd'));

    // 導向新增招標公告
    await page.waitForNavigation();
    await page.goto(`http://${locationHref}/tps/TenderManagement/showTenderTmp`);

    // 輸入標案案號
    const fileName = h.generateFileName();
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
        // tenderWayFillForm.upload(page, tenderWay);
        await page.waitForNavigation();
        tenderWayFillForm.vendorStatement(page);
        await page.waitForNavigation();
        tenderWayFillForm.priceList(page);
        await page.waitForNavigation();
        tenderWayFillForm.threePurpose(page);
        await page.waitForNavigation();
        tenderWayFillForm.upload(page, tenderWay);
    }

    if(multipleAward === 'Y') {
        tenderWayFillForm.item(page, tenderWay);
    }
}