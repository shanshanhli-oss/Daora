/** Refresh the local editable-project handoff: source + exact offline HTML + proof images. */
import {readFile,writeFile,rm,cp,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=path.resolve('.'),out=path.join(root,'deliverables');
const base=[
 'index.html','package.json','package-lock.json','vite.config.js','.gitignore','.daora-standalone.css',
 'README.md','PERFORMANCE.md','TESTING.md','CHANGELOG.md',
 'JOURNEY-VERIFICATION.log','STANDALONE-VERIFICATION.log','VERIFICATION v1.1.log',
 'daora-standalone.html',
];
for(const folder of ['src','scripts','tests','public'])for(const file of await readdir(path.join(root,folder),{recursive:true,withFileTypes:true}))if(file.isFile())base.push(path.relative(root,path.join(file.parentPath,file.name)));
const screenshots=(await readdir(path.join(root,'screenshots'))).filter(name=>/^journey-(landing|room|portals-detail|panel|walk|mobile)\.png$/.test(name));
if(screenshots.length!==6)throw Error(`Expected six accepted journey screenshots, got ${screenshots.length}`);
await rm(path.join(out,'source'),{recursive:true,force:true});
await mkdir(path.join(out,'source','daora'),{recursive:true});
for(const relative of base){
 const destination=path.join(out,'source','daora',relative);await mkdir(path.dirname(destination),{recursive:true});await cp(path.join(root,relative),destination);
}
await mkdir(path.join(out,'source','daora','screenshots'),{recursive:true});
for(const name of screenshots)await cp(path.join(root,'screenshots',name),path.join(out,'source','daora','screenshots',name));
const accepted=await readFile(path.join(root,'daora-standalone.html'));
const manifest=await readFile(path.join(out,'README.txt'),'utf8');
await writeFile(path.join(out,'source','daora','HANDOFF.txt'),manifest);
// Use Python's standard library so no zip executable or environment package is required.
execFileSync('python3',['-c',`from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import hashlib,json
root=Path.cwd(); out=root/'deliverables'; base=out/'source'/'daora'; archive=out/'DAORA-Cursor-project.zip'
files=[p for p in sorted(base.rglob('*')) if p.is_file()]
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=9) as z:
 for p in files:z.write(p,'daora/'+str(p.relative_to(base)))
with ZipFile(archive) as z:
 assert z.testzip() is None
 names=z.namelist();assert 'daora/src/journey-memory.js' in names;assert 'daora/tests/journey-smoke.mjs' in names;assert 'daora/daora-standalone.html' in names
 print(f'ZIP verified: {len(names)} files; CRC all valid; {archive.stat().st_size:,} bytes')
manifest={'version':'1.1.0','product':'DAORA · Journey Memory','utc':'2026-11-06T16:00:00Z (verified on 6 November 2026)','offline_html_sha256':hashlib.sha256((out/'DAORA.html').read_bytes()).hexdigest(),'zip_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'zip_files':len(files),'zip_bytes':archive.stat().st_size,'screenshot_count':6,'source_included':True,'external_deploy':False}
(out/'MANIFEST.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\\n')
print(json.dumps(manifest,ensure_ascii=False))`],{cwd:root,stdio:'inherit'});
