import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));const read=x=>fs.readFileSync(path.join(root,x),'utf8');
test('RLS protects folders by UID on select/insert/update/delete',()=>{
 const sql=read('tools/PRYWATNA_BIBLIOTEKA_KONTA_18_5.sql');
 for(const operation of ['select','insert','update','delete'])assert.match(sql,new RegExp(`for ${operation} to authenticated`));
 assert.ok((sql.match(/\(storage\.foldername\(name\)\)\[1\]/g)||[]).length>=5);
 assert.match(sql,/public=false/);assert.match(sql,/owner_id=\(select auth\.uid\(\)::text\)/);
 assert.doesNotMatch(sql,/__YOUR_SUPABASE_UID__/);
});
test('cloud library includes books and lectures with fail-closed login',()=>{
 const s=read('src/lib/studylab-private-books.mjs');
 assert.match(s,/\['book','lecture'\]/);assert.match(s,/sb\.auth\.getUser\(\)/);
 assert.match(s,/getPrivateBook/);assert.match(s,/deletePrivateBook/);
 assert.match(s,/header!==['"]%PDF-/);assert.doesNotMatch(s,/studylab_is_books_owner/);
});
test('drafts are account-scoped; migration is optional',()=>{
 const s=read('src/lib/studylab-private-drafts.mjs');
 assert.match(s,/\$\{uid\}\/drafts/);assert.match(s,/listPrivateDrafts/);assert.match(s,/removePrivateDraft/);
 const auth=read('src/lib/studylab-author-store.mjs');assert.match(auth,/listLegacyAuthorDrafts/);
 const ui=read('src/components/materials/PrivateBooksAccess.jsx');assert.match(ui,/Skopiuj lokalne PDF na moje konto/);
});
test('does not put public GitHub publishing on user-facing library',()=>{
 const s=read('src/components/materials/PrivateBooksAccess.jsx');assert.doesNotMatch(s,/publishDraft|\/publish/);
});

test('document lookup is cloud-only; old IndexedDB requires explicit migration',()=>{
 const s=read('src/lib/materials-store.mjs');
 assert.match(s,/export const listDocuments = listPrivateDocuments/);
 assert.match(s,/listLegacyDocuments/);
 assert.match(s,/isPrivateBookId\(id\)\?getPrivateBook/);
});
test('drafts require login and cannot modify GitHub public content',()=>{
 const s=read('src/lib/studylab-private-drafts.mjs');assert.match(s,/authorizedPrivateUser\(\)/);
 const author=read('src/components/materials/AuthoringStudio.jsx');
 assert.match(author,/STUDYLAB-18-4-NO-COURSE-PUBLISH/);
 assert.match(author,/STUDYLAB-18-5-PRIVATE-DRAFT-MIGRATION/);
});
