import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {pages,build,root} from './build-pages.mjs';
const source=fs.readFileSync(root+'/index.html','utf8');
test('actual DA/EN HTML is localized before JavaScript, reciprocal and canonical',()=>{
 const out=pages(source);for(const lang of ['da','en']){
  const html=out[lang];assert.match(html,new RegExp('<html lang="'+lang+'">'));
  assert.match(html,new RegExp('rel="canonical" href="https://wordfaker.com/'+lang+'/"'));
  for(const code of ['da','en'])assert.match(html,new RegExp('hreflang="'+code+'" href="https://wordfaker.com/'+code+'/"'));
  assert.doesNotMatch(html,/hreflang="(?:es|fr|de|uk|ru)"/);
  assert.match(html,lang==='da'?/data-t="lead">Alle/:/data-t="lead">Everyone/);
  assert.match(html,lang==='da'?/data-t="settings">Indstillinger/:/data-t="settings">Settings/);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)/)[1]);assert.equal(schema.url,'https://wordfaker.com/'+lang+'/');assert.equal(schema.isAccessibleForFree,true);
  assert.match(html,/tracker\.894a456da1305558\.js/);assert.match(html,/data-feedback="false"/);
 }
});
test('all generated outputs are current and language builds preserve identical gameplay code',()=>{
 build(true);const out=pages(source);const script=html=>html.slice(html.indexOf('  var STR ='));
 assert.equal(script(out.da),script(out.en));assert.equal(script(out.da),script(source));
});
test('explicit DA/EN routes beat saved preference without clearing players or an active round',()=>{
 const code=source.match(/function urlLanguage\(\) \{[\s\S]*?\n  \}/)[0];
 for(const lang of ['da','en'])for(const suffix of ['/','/index.html','']){
  const ctx={location:{pathname:'/'+lang+suffix}};vm.runInNewContext(code,ctx);assert.equal(ctx.urlLanguage(),lang);
 }
 for(const pathname of ['/unknown/','/danish/','/en/secret/']){const ctx={location:{pathname}};vm.runInNewContext(code,ctx);assert.equal(ctx.urlLanguage(),null);}
 const choose=source.match(/function chooseLanguage\(l\) \{[\s\S]*?\n  \}/)[0];
 const ctx={state:{ui:'en',langs:['en'],players:['Ada','Bo','Chen'],phase:'reveal',wordIdx:14,evil:2,turn:1},validLang:l=>['da','en','fr'].includes(l),history:{replaceState:(_,__,url)=>ctx.url=url}};
 for(const f of ['save','applyStrings','renderPlayers','renderLangs','renderCategories'])ctx[f]=()=>{};
 vm.runInNewContext(choose,ctx);ctx.chooseLanguage('da');assert.equal(ctx.url,'/da/');assert.equal(ctx.state.ui,'da');assert.equal(ctx.state.phase,'reveal');assert.equal(ctx.state.wordIdx,14);assert.equal(ctx.state.turn,1);assert.equal(ctx.state.players.length,3);assert.equal(ctx.state.langs.join(','),'en,da');
 ctx.chooseLanguage('fr');assert.equal(ctx.state.ui,'fr');assert.equal(ctx.url,'/');ctx.chooseLanguage('xx');assert.equal(ctx.state.ui,'fr');
});
