import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function pages(source){
 source=source.replaceAll("\r\n","\n");
 const strings=source.match(/var STR = (\{[\s\S]*?\n  \});/);if(!strings)throw Error('Missing UI translations');
 const table=vm.runInNewContext('('+strings[1]+')',Object.create(null),{timeout:100});
 const meta=JSON.parse(source.match(/var PAGE_META = (\{[^\n]+\});/)[1]);
 const alternates='\n  <link rel="alternate" hreflang="da" href="https://wordfaker.com/da/">\n  <link rel="alternate" hreflang="en" href="https://wordfaker.com/en/">\n  <link rel="alternate" hreflang="x-default" href="https://wordfaker.com/">';
 const result={};
 for(const lang of ['en','da']){
  const url='https://wordfaker.com/'+lang+'/';const m=meta[lang];
  const end=source.indexOf('</head>');let head=source.slice(0,end),body=source.slice(end);
  head=head.replace(/<html lang="[^"]+">/,'<html lang="'+lang+'">').replace(/<title>[^<]*<\/title>/,'<title>'+escape(m.title)+'</title>');
  const values={'description':m.description,'og:title':m.title,'og:description':m.description,'og:url':url,'og:locale':m.locale,'og:image:alt':m.title,'twitter:title':m.title,'twitter:description':m.description};
  head=head.replace(/<meta (name|property)="([^"]+)" content="[^"]*">/g,(all,attr,key)=>values[key]?'<meta '+attr+'="'+key+'" content="'+escape(values[key])+'">':all);
  head=head.replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g,'');
  head=head.replace(/<link rel="canonical" href="[^"]+">/,'<link rel="canonical" href="'+url+'">'+alternates);
  head=head.replace(/(<script type="application\/ld\+json">)([^<]+)(<\/script>)/,(_,a,json,b)=>{const data=JSON.parse(json);data.url=url;data.description=m.description;return a+JSON.stringify(data)+b;});
  // Localize only actual HTML, never strings or code in the application script.
  const split=body.indexOf('<script');let html=split<0?body:body.slice(0,split);const code=split<0?'':body.slice(split);
  html=html.replace(/(<([a-z][\w-]*)\b[^>]*\bdata-t="([^"]+)"[^>]*>)[^<]*(<\/\2>)/g,(all,open,tag,key,close)=>typeof table[lang][key]==='string'?open+escape(table[lang][key])+close:all);
  html=html.replace(/(<input\b[^>]*data-t-ph="([^"]+)"[^>]*\bplaceholder=")[^"]*(")/g,(all,a,key,b)=>typeof table[lang][key]==='string'?a+escape(table[lang][key])+b:all);
  html=html.replace(/(id="feedback-link"[^>]*href=")[^"]*"/, '$1https://munthesystems.dk/systems/feedback/wordfaker?lang='+lang+'"');
  html=html.replace(/(id="feedback-link"[^>]*aria-label=")[^"]*"/, '$1'+(lang==='da'?'Send feedback eller kontakt os':'Send feedback or contact us')+'"');
  html=html.replace(/(<a\b[^>]*id="feedback-link"[^>]*>)[^<]*(<\/a>)/,(_,a,b)=>a+(lang==='da'?'Feedback &amp; kontakt':'Feedback &amp; contact')+b);
  result[lang]=head+html+code;
 }
 return result;
}
export function build(check=false){
 const outputs=pages(fs.readFileSync(path.join(root,'index.html'),'utf8'));
 const files={'index.html':outputs.en,'da/index.html':outputs.da,'en/index.html':outputs.en,'sitemap.xml':'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://wordfaker.com/da/</loc></url>\n  <url><loc>https://wordfaker.com/en/</loc></url>\n</urlset>\n'};
 for(const [name,content]of Object.entries(files)){
  const file=path.join(root,name);
  if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')!==content)throw Error('Stale generated page: '+name);}
  else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}
 }
 return files;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){build(process.argv.includes('--check'));console.log('DA/EN pages and sitemap '+(process.argv.includes('--check')?'verified':'built'));}
