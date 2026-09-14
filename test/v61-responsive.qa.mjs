import { chromium } from 'file:///C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const edge='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const baseline=pathToFileURL('D:\\20606김승현\\느\\_꽃을보다_V60_baseline_dev.html').href+'?noRemoteImages';
const current=pathToFileURL('D:\\20606김승현\\느\\꽃을보다_V61\\꽃을보다_V61_dev.html').href+'?noRemoteImages';
const widths=[320,360,390,412];
const themes=['light','dark'];
const textSizes=['medium','large'];
const browser=await chromium.launch({headless:true,executablePath:edge});
const results=[];

const rect=(value)=>({left:value.left,right:value.right,top:value.top,bottom:value.bottom,width:value.width,height:value.height});
const within=(inner,outer,tolerance=.6)=>inner.left>=outer.left-tolerance && inner.right<=outer.right+tolerance && inner.top>=outer.top-tolerance && inner.bottom<=outer.bottom+tolerance;

try {
  for(const width of widths) {
    for(const theme of themes) {
      const metrics={};
      for(const textSize of textSizes) {
        const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
        const baselinePage=await context.newPage();
        await baselinePage.goto(baseline,{waitUntil:'load'});
        await baselinePage.evaluate(({theme,textSize})=>{
          document.documentElement.dataset.theme=theme;
          document.documentElement.dataset.textSize=textSize;
        },{theme,textSize});
        const baselineFeature=await baselinePage.locator('.editorial-feature').evaluate((node)=>{
          const r=(target)=>{const value=target.getBoundingClientRect();return {left:value.left,right:value.right,top:value.top,bottom:value.bottom,width:value.width,height:value.height};};
          return {card:r(node),image:r(node.querySelector('.editorial-feature-image'))};
        });
        await baselinePage.close();

        const page=await context.newPage();
        const errors=[];
        page.on('pageerror',(error)=>errors.push(error.message));
        await page.goto(current,{waitUntil:'load'});
        await page.evaluate(({theme,textSize})=>{
          document.documentElement.dataset.theme=theme;
          document.documentElement.dataset.textSize=textSize;
        },{theme,textSize});

        const home=await page.evaluate(()=>{
          const section=(title)=>[...document.querySelectorAll('section.content-section')].find((node)=>node.querySelector('h2')?.textContent.trim()===title);
          const feature=document.querySelector('.editorial-feature');
          const featureImage=feature.querySelector('.editorial-feature-image');
          const featureTitle=feature.querySelector('h1');
          const featureDescription=feature.querySelector('.feature-description');
          const relay=document.querySelector('.flower-relay');
          const weekly=section('이번 주 볼 꽃');
          const places=section('꽃 보러 가기');
          const weather=[...document.querySelectorAll('.home-screen > .weather-note')].at(-1);
          const search=document.querySelector('.home-find-panel');
          const header=document.querySelector('.app-header');
          const date=document.querySelector('.app-date-context');
          const settings=document.querySelector('.settings-button');
          const placeholders=[...relay.querySelectorAll('.flower-relay-placeholder')];
          const buttons=[...document.querySelectorAll('.home-screen .btn')];
          const r=(node)=>{const value=node.getBoundingClientRect();return {left:value.left,right:value.right,top:value.top,bottom:value.bottom,width:value.width,height:value.height};};
          relay.querySelector('.flower-relay-target strong').textContent='아주아주긴꽃이름반응형레이아웃검사용';
          return {
            documentWidth:document.documentElement.scrollWidth,
            viewportWidth:document.documentElement.clientWidth,
            feature:r(feature),featureImage:r(featureImage),featureTitle:r(featureTitle),featureDescription:r(featureDescription),
            titleDescriptionGap:featureDescription.getBoundingClientRect().top-featureTitle.getBoundingClientRect().bottom,
            relay:r(relay),weekly:r(weekly),places:r(places),weather:r(weather),search:r(search),header:r(header),date:r(date),settings:r(settings),
            buttons:buttons.map(r),
            placeholderRatios:placeholders.map((node)=>{const box=node.getBoundingClientRect();return box.width/box.height;}),
            placeholderChildren:placeholders.map((node)=>node.childNodes.length),
            placeholderText:placeholders.map((node)=>node.textContent),
            railScrollable:weekly.querySelector('.flower-rail').scrollWidth>=weekly.querySelector('.flower-rail').clientWidth,
            navLabels:[...document.querySelectorAll('.bottom-nav .nav-label')].map((node)=>node.textContent.trim()),
            mainImageConnected:featureImage.tagName==='IMG' && Boolean(featureImage.getAttribute('src')),
            weeklyImages:[...weekly.querySelectorAll('.flower-poster-image')].every((node)=>node.tagName==='IMG' && Boolean(node.getAttribute('src'))),
            fontSizes:{
              main:Number.parseFloat(getComputedStyle(featureTitle).fontSize),
              description:Number.parseFloat(getComputedStyle(featureDescription).fontSize),
              section:Number.parseFloat(getComputedStyle(relay.querySelector('h2')).fontSize),
              relay:Number.parseFloat(getComputedStyle(relay.querySelector('.flower-relay-description')).fontSize),
              flower:Number.parseFloat(getComputedStyle(weekly.querySelector('.flower-poster-title strong')).fontSize)
            }
          };
        });

        assert.ok(home.documentWidth<=home.viewportWidth,`${width}/${theme}/${textSize}: home horizontal overflow`);
        assert.ok(Math.abs(home.feature.width-baselineFeature.card.width)<.6,`${width}/${theme}/${textSize}: feature width changed`);
        assert.ok(home.feature.height<=baselineFeature.card.height+.6,`${width}/${theme}/${textSize}: feature height increased (${home.feature.height} > ${baselineFeature.card.height})`);
        assert.ok(Math.abs(home.featureImage.width-baselineFeature.image.width)<.6,`${width}/${theme}/${textSize}: feature image width changed`);
        assert.ok(Math.abs(home.featureImage.height-baselineFeature.image.height)<.6,`${width}/${theme}/${textSize}: feature image height changed`);
        assert.ok(home.titleDescriptionGap>=5,`${width}/${theme}/${textSize}: feature title spacing`);
        assert.ok(home.search.bottom<home.feature.top && home.feature.bottom<home.relay.top && home.relay.bottom<home.weekly.top && home.weekly.bottom<home.places.top && home.places.bottom<home.weather.top,`${width}/${theme}/${textSize}: home order`);
        assert.ok(home.buttons.every((box)=>box.left>=-.6 && box.right<=width+.6),`${width}/${theme}/${textSize}: clipped home button`);
        assert.ok(home.placeholderRatios.every((value)=>Math.abs(value-4/3)<.03),`${width}/${theme}/${textSize}: placeholder ratio`);
        assert.ok(home.placeholderChildren.every((value)=>value===0) && home.placeholderText.every((value)=>value===''),`${width}/${theme}/${textSize}: placeholder content`);
        assert.ok(home.date.right<=home.settings.left+.6,`${width}/${theme}/${textSize}: header controls overlap`);
        assert.equal(home.railScrollable,true);
        assert.equal(home.mainImageConnected,true);
        assert.equal(home.weeklyImages,true);
        assert.deepEqual(home.navLabels,['행사','홈','도감']);

        await page.locator('[data-action="switch-tab"][data-tab="encyclopedia"]').click();
        await page.evaluate(({theme,textSize})=>{
          document.documentElement.dataset.theme=theme;
          document.documentElement.dataset.textSize=textSize;
        },{theme,textSize});
        const encyclopedia=await page.evaluate(()=>{
          const grid=document.querySelector('.encyclopedia-grid');
          const card=grid.querySelector('.flower-poster');
          const title=card.querySelector('.flower-poster-title');
          const name=title.querySelector('strong');
          const status=title.querySelector('.status');
          name.textContent='아주아주긴꽃이름반응형레이아웃검사용';
          const r=(node)=>{const value=node.getBoundingClientRect();return {left:value.left,right:value.right,top:value.top,bottom:value.bottom,width:value.width,height:value.height};};
          return {
            documentWidth:document.documentElement.scrollWidth,
            viewportWidth:document.documentElement.clientWidth,
            card:r(card),title:r(title),name:r(name),status:r(status),
            statusWhiteSpace:getComputedStyle(status).whiteSpace,
            statusFont:Number.parseFloat(getComputedStyle(status).fontSize),
            flowerFont:Number.parseFloat(getComputedStyle(name).fontSize),
            scientificFont:Number.parseFloat(getComputedStyle(card.querySelector('.flower-poster-scientific')).fontSize),
            decorationCount:grid.querySelectorAll('.bloom-flow,.bloom-symbol').length,
            imageCount:grid.querySelectorAll('img.flower-poster-image').length,
            favoriteFilter:Boolean(document.querySelector('[data-action="toggle-favorite-filter"]')),
            searchWidth:document.querySelector('.search-field input').getBoundingClientRect().width
          };
        });
        assert.ok(encyclopedia.documentWidth<=encyclopedia.viewportWidth,`${width}/${theme}/${textSize}: encyclopedia horizontal overflow`);
        assert.equal(encyclopedia.decorationCount,0,`${width}/${theme}/${textSize}: decorative bloom symbols remain`);
        assert.ok(encyclopedia.imageCount>0,`${width}/${theme}/${textSize}: actual flower images missing`);
        assert.equal(encyclopedia.favoriteFilter,true);
        assert.equal(encyclopedia.statusWhiteSpace,'nowrap');
        assert.ok(within(encyclopedia.name,encyclopedia.title) && within(encyclopedia.status,encyclopedia.title),`${width}/${theme}/${textSize}: title/status outside row`);
        assert.ok(encyclopedia.name.right<=encyclopedia.status.left+.6,`${width}/${theme}/${textSize}: title/status overlap`);
        assert.ok(encyclopedia.status.right<=encyclopedia.card.right+.6,`${width}/${theme}/${textSize}: status outside card`);
        assert.ok(encyclopedia.searchWidth>=150,`${width}/${theme}/${textSize}: search field too narrow`);
        assert.deepEqual(errors,[]);

        metrics[textSize]={home:home.fontSizes,encyclopedia:{flower:encyclopedia.flowerFont,scientific:encyclopedia.scientificFont,status:encyclopedia.statusFont}};
        results.push({width,theme,textSize,home:'pass',encyclopedia:'pass'});
        await context.close();
      }

      for(const group of [metrics.medium.home,metrics.medium.encyclopedia]) {
        for(const value of Object.values(group)) assert.ok(value>0);
      }
      for(const section of ['home','encyclopedia']) {
        for(const key of Object.keys(metrics.medium[section])) {
          const ratio=metrics.large[section][key]/metrics.medium[section][key];
          assert.ok(ratio>=1.135 && ratio<=1.145,`${width}/${theme}/${section}/${key}: large ratio ${ratio}`);
        }
      }
    }
  }

  const context=await browser.newContext({viewport:{width:390,height:900},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await page.goto(current,{waitUntil:'load'});
  const originalSettings=await page.evaluate(()=>localStorage.getItem('flower-info.settings.v1'));
  await page.locator('.settings-button').click();
  await page.locator('[data-control-id="setting-bodyTextSize"] > summary').click();
  await page.locator('[data-select-action="setting-select"][data-control-id="setting-bodyTextSize"][data-value="large"]').click();
  assert.equal(await page.locator('html').getAttribute('data-text-size'),'large');
  await page.reload({waitUntil:'load'});
  assert.equal(await page.locator('html').getAttribute('data-text-size'),'large');
  await page.locator('[data-action="switch-tab"][data-tab="encyclopedia"]').click();
  assert.equal(await page.locator('html').getAttribute('data-text-size'),'large');
  await page.locator('[data-action="switch-tab"][data-tab="events"]').click();
  assert.equal(await page.locator('html').getAttribute('data-text-size'),'large');
  results.push({flow:'large-setting-persists-across-reload-and-tabs',ok:true});

  await page.locator('[data-action="switch-tab"][data-tab="home"]').click();
  const target=page.locator('.home-find-panel');
  await target.evaluate((node)=>{
    const touch=(x,y)=>new Touch({identifier:1,target:node,clientX:x,clientY:y,pageX:x,pageY:y,screenX:x,screenY:y,radiusX:1,radiusY:1,rotationAngle:0,force:1});
    node.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[touch(250,100)],changedTouches:[touch(250,100)]}));
    node.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],changedTouches:[touch(100,100)]}));
  });
  await page.waitForTimeout(50);
  assert.equal(await page.locator('.nav-item.is-active .nav-label').textContent(),'도감');
  await page.waitForTimeout(500);
  await page.locator('[data-action="switch-tab"][data-tab="home"]').click();
  const rail=page.locator('.flower-rail');
  await rail.evaluate((node)=>{
    const touch=(x,y)=>new Touch({identifier:2,target:node,clientX:x,clientY:y,pageX:x,pageY:y,screenX:x,screenY:y,radiusX:1,radiusY:1,rotationAngle:0,force:1});
    node.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[touch(250,650)],changedTouches:[touch(250,650)]}));
    node.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],changedTouches:[touch(100,650)]}));
  });
  await page.waitForTimeout(50);
  assert.equal(await page.locator('.nav-item.is-active .nav-label').textContent(),'홈');
  results.push({gesture:'home-to-encyclopedia',ok:true},{gesture:'weekly-rail-keeps-home',ok:true});

  await page.evaluate((value)=>{
    if(value===null) localStorage.removeItem('flower-info.settings.v1');
    else localStorage.setItem('flower-info.settings.v1',value);
  },originalSettings);
  await context.close();
} finally {
  await browser.close();
}

console.log(JSON.stringify({checks:results.length,results},null,2));
