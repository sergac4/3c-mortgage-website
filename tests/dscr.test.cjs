const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const defaults={value:'500000',loan:'375000',rent:'3500',rate:'7.5',years:'30',tax:'500',insurance:'150',hoa:'0',other:'0',payment_type:'amortizing',state:'CA',language:'en',purpose:'Purchase',property_type:'Single family'};
function setup(overrides={},query='?persona=duke&utm_source=instagram'){
 const elements={}, el=id=>elements[id]??=( {value:defaults[id]??'',hidden:true,children:[],listeners:{},addEventListener(k,f){this.listeners[k]=f;},replaceChildren(...c){this.children=c;this.textContent='';},append(c){this.children.push(c);},scrollIntoView(){}} );
 Object.entries({...defaults,...overrides}).forEach(([k,v])=>el(k).value=v);
 const ctx={document:{getElementById:el,createElement:()=>({})},location:{search:query},URL,URLSearchParams,Intl,window:{},navigator:{clipboard:{writeText:async t=>ctx.copied=t}}};vm.runInNewContext(fs.readFileSync('assets/dscr.js','utf8'),ctx);
 return {el,ctx,lines:()=>el('result').children.map(x=>x.textContent).join('\n')};
}
let t=setup();assert.match(t.lines(),/Monthly loan payment: \$2,622.05/);assert.match(t.lines(),/DSCR: 1.07/);assert.match(t.lines(),/Loan-to-value: 75.00%/);
t=setup({payment_type:'interest_only'});assert.match(t.lines(),/\$2,343.75/);assert.match(t.lines(),/DSCR: 1.17/);
t=setup({rate:'0'});assert.match(t.lines(),/\$1,041.67/);
t=setup({rate:'0',payment_type:'interest_only',tax:'0',insurance:'0'});assert.match(t.lines(),/DSCR unavailable/);
t=setup({rent:'-1'});assert.match(t.el('result').textContent,/Enter valid/);
t=setup({},'?persona=maria&utm_source=instagram');t.el('review').listeners.click();assert.equal(t.el('language').value,'es');t.el('load-form').listeners.click();
const url=new URL(t.el('form-slot').children[0].src);assert.match(url.searchParams.get('dscr_scenario'),/Persona: maria/);assert.match(url.searchParams.get('dscr_scenario'),/Loan: \$375,000.00/);assert.equal(t.el('form-link').href,url.href);
const clean=url.searchParams.get('dscr_borrower_summary');assert.equal(t.el('scenario-preview').textContent,clean);assert.match(clean,/Debt service coverage ratio \(DSCR\): 1.07/);assert.match(clean,/Payment structure: Principal and interest/);assert.doesNotMatch(clean,/Persona:|Platform:|Campaign:|Language:|Calculated:|amortizing|interest_only/);
t.el('calculator').listeners.input();assert.equal(t.el('form-slot').children.length,0);assert.equal(t.el('form-fallback').hidden,true);
console.log('PASS: amortization, interest-only, zero rate, zero expense, invalid inputs, Maria attribution, scenario handoff, stale-form clearing');

t=setup({payment_type:'interest_only',value:'450000',rate:'10.25',tax:'950',other:'750'});t.el('load-form').listeners.click();assert.match(t.el('scenario-preview').textContent,/DSCR\): 0.69/);assert.match(t.el('scenario-preview').textContent,/Payment structure: Interest-only/);assert.match(t.el('scenario-preview').textContent,/Total included housing expense: \$5,053.13/);
