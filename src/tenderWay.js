const tenderWayFillForm = {
    dep: async (page) => {
        // 機關資料填分機即可
        await page.waitForSelector('#telExt').then(e => e.type('1234', { delay: 100 }));
        // await page.type('#telExt', '1234', { delay: 100 });
        await page.evaluate(() => SaveAndDirect('next'));
    },
    buyInfo: async (page, fileName, tenderWay) => {
        // 標案名稱
        await page.type('#tenderName', fileName, { delay: 100 });

        // 標的分類
        await page.type('#fkDmsProctrgCode', '5111', { delay: 100 });
        await page.keyboard.press('Tab');

        // 工程計畫編號
        await page.waitForSelector('#planNo').then(e => e.type('12345', { delay: 100 }));

        // 本採購案是否屬於建築工程
        await page.waitForSelector('#fkTpamBuildType_1').then(e => e.click());

        // 採購金額
        await page.type('#procurementAmount1', '990000', { delay: 100 });

        // 自辦
        await page.click('#By_itself');

        // 本採購是否屬「具敏感性或國安(含資安)疑慮之業務範疇」採購
        await page.click('#isSensitive_Y');

        // 本採購是否屬「涉及國家安全」採購
        await page.click('#isAffectSec_Y');

        // 所有金額欄位(由於沒id只好這樣做)
        const currencyInputElementHandles = await page.$$('input[type=text][id=currency]');
        for(let el of currencyInputElementHandles) {
            const innerHtmlContent = await page.evaluate(e => e.innerHTML, el);
            // const innerHtmlContent = await elInnerHtml.jsonValue();
            console.log(`innerHtmlContent: ${innerHtmlContent}`);
            if(innerHtmlContent === null || innerHtmlContent === '') await el.type('550000', { delay: 100 });
            // await el.click({ clickCount: 3 });
            // await el.type('550000', { delay: 100 });
        }

        // 預算金額是否公開
        await page.click('#budgetIsPdt_Y');

        // 預計金額是否公開
        await page.click('#estimatedProcIsPdt_Y');

        // 後續擴充
        await page.click('#fuRite_N');

        // 是否受機關補助
        await page.click('#isGrant_N');

        // 本案是否曾以不同案號辦理招標公告且已傳輸其無法決標公告，目前仍未決標
        await page.click('#isExTender_N');

        await page.evaluate(() => SaveAndDirect('next'));
    },
    info: async (page, tenderWay) => {
        // 是否訂有底價
        await page.click('#isGovernmentEstimate_N');
        await page.waitForSelector('#fkAtmNoEstimate_1').then(e => e.click());

        // 是否屬二以上機關之聯合採購(不適用共同供應契約規定)
        await page.click('#isJointProcurement_N');

        await page.evaluate(() => SaveAndDirect('next'));
    },
    vars: async (page, tenderWay) => {
        // 是否提供電子投標 => 資格文件, 規格文件
        if(tenderWay === '12') {
            await page.waitForSelector('#isEsubmitSpec_Y').then(e => e.click());
            await page.waitForSelector('#isEsubmitQualification_Y').then(e => e.click());
        }
        
        await page.click('#isEsubmit_Y');

        // 截止投標
        await page.type('#waitDay', '25', { delay: '100' });
        await page.keyboard.press('Tab');

        // 是否須繳納押標金
        await page.click('#isDeposite_N');

        // 投標文字
        await page.click('#fkTpamBlang_5');

        await page.evaluate(() => SaveAndDirect('next'));
    },
    other: async (page, fileName, tenderWay) => {
        // 履約地點
        // await page.select('#allCelocation', '2,2,N');

        // 履約期限
        await page.type('#fdts', '12345', { delay: 100 });

        // 是否依據採購法第11條之1，成立採購工作及審查小組
        await page.click('#isLaw111_Y');
        await page.waitForSelector('#isPoliMem_Y').then(e => e.click());
        await page.waitForSelector('#isPoliMemAtt_Y').then(e => e.click());
        await page.waitForSelector('#isPoliAtt_Y').then(e => e.click());
        await page.waitForSelector('#isAccMem_Y').then(e => e.click());
        await page.waitForSelector('#isAccMemAtt_Y').then(e => e.click());
        await page.waitForSelector('#isAccAtt_Y').then(e => e.click());

        await page.waitForTimeout(2000);

        // 本案採購契約是否採用主管機關訂定之範本
        await page.click('#isUsePccSample_Y');

        // 本案採購契約是否採用主管機關訂定之最新版範本
        await page.waitForSelector('#isUsePccNewSample_Y').then(e => e.click());

        // 是否屬災區重建工程
        await page.waitForSelector('#isReconstruct_Y').then(e => e.click());

        // 廠商資格摘要
        // const vendorCheckboxesDiv = await page.$('#venderDesc_checkbox');
        // const vendorCheckboxes = await vendorCheckboxesDiv.$$('input[type=checkbox]');
        // for(let checkbox of vendorCheckboxes) {
        //     await checkbox.click();
        // }
        await page.click('#isVendorDescs');
        await page.waitForSelector('#isVendorDescQua').then(e => e.click());
        await page.waitForSelector('#isVendorDescConIde_checkbox').then(e => e.click());
        await page.click('#vendorTax');
        await page.click('#vendorIndustry');

        // 是否訂有與履約能力有關之基本資格
        // basicAbilityArray
        const basicAbilityArray = await page.$$('input[name=basicAbilityArray]');
        for(let basic of basicAbilityArray) {
            const checkboxValue = await (await basic.getProperty('value')).jsonValue();
            if(checkboxValue === '1' || checkboxValue === '2') {
                await basic.click();
            }
        }
        
        // 附加說明
        await page.type('#descn', '測試測試測試\n測試測試測試\n測試測試測試');

        // 是否刊登英文公告
        if(tenderWay !== '12') {
            await page.click('#isEng_Y');
            await page.type('#engName', fileName, { delay: 100 });
            await page.type('#engContactPerson', 'Kevin Tung', { delay: 100 });
            await page.type('#telExt', '1234', { delay: 100 });
            await page.evaluate(() => insertSample());
            await page.type('#engDesc', 'some hinting text...');
        }

        // if(tenderWay === '12') {
        //     await page.evaluate(() => SaveAndDirect('up2'));
        // } else {
        // }
        await page.click('#Next_page');
    },
    upload: async (page, tenderWay) => {
        // await page.waitForNavigation();
        // await page.evaluate(() => SaveAndDirect('next'));
        // await page.type('#td_iteminfo_itemNo_0', '1', { delay: 100 });
        // await page.type('#td_iteminfo_itemName_0', '123', { delay: 100 });
        // await page.type('#td_iteminfo_itemUnit_0', '1', { delay: 100 });
        // await page.type('#td_iteminfo_itemQty_0', '1', { delay: 100 });
        // await page.evaluate(() => SaveAndDirect('next'));
        // await page.waitForNavigation();
        // await page.evaluate(() => SaveAndDirect('next'));
        // await page.waitForNavigation();
        await page.evaluate(() => SaveAndDirect('next'));
    },
    vendorStatement: async (page) => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.evaluate(() => SaveAndDirect('next'));
    },
    priceList: async (page) => {
        await page.type('#td_iteminfo_itemNo_0', '1', { delay: 100 });
        await page.type('#td_iteminfo_itemName_0', '123', { delay: 100 });
        await page.type('#td_iteminfo_itemUnit_0', '1', { delay: 100 });
        await page.type('#td_iteminfo_itemQty_0', '1', { delay: 100 });
        await page.evaluate(() => SaveAndDirect('next'));
    },
    threePurpose: async (page) => {
        await page.evaluate(() => SaveAndDirect('next'));
    },
    item: async (page, tenderWay) => {
        await page.waitForNavigation();
        await page.type('#tpamTenderItemToList[0].itemName', '123', { delay: 100 });
        await page.type('#tpamTenderItemToList[0].itemQty', '1', { delay: 100 });
        await page.type('#tpamTenderItemToList[0].itemUnit', '1', { delay: 100 });
        await page.type('#itemAmount_0', '550000', { delay: 100 });
        await page.evaluate(() => SaveAndDirect('next'));
    }
}

module.exports = tenderWayFillForm;