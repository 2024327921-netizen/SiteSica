const DB='sica-local',STORE='pendentes';
function open(){return new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id_sincronizacao'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
export async function pending(){const d=await open();return new Promise((ok,no)=>{const r=d.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
export async function savePending(x){const d=await open();return new Promise((ok,no)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(x);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
export async function removePending(id){const d=await open();return new Promise((ok,no)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).delete(id);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
