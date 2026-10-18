import React, {useState} from 'react';
import './studylab-github-auth.css';

const when = time => time ? new Date(time).toLocaleString('pl-PL', {dateStyle:'short',timeStyle:'short'}) : 'jeszcze nie synchronizowano';
export default function CloudAccount({cloud}) {
  const [email,setEmail] = useState('');
  const [otp,setOtp] = useState('');
  const [sent,setSent] = useState(false);
  const [showCode,setShowCode] = useState(false);
  const [notice,setNotice] = useState('');
  async function submitMail(e) {
    e.preventDefault();
    setNotice('');
    if(await cloud.sendCode(email)) {setSent(true);setNotice('Wysłano wiadomość. Otwórz e-mail i kliknij link potwierdzający. Wrócisz do StudyLab jako zalogowany użytkownik.');}
  }
  async function submitOtp(e) {
    e.preventDefault();
    if(await cloud.verifyCode(email,otp)) {setNotice('Zalogowano. Trwa pobieranie i łączenie postępów.');setOtp('');}
  }
  const active = cloud.phase === 'connected' || cloud.phase === 'syncing' || (cloud.phase==='error' && !!cloud.userId);
  return <>
    <div className="sc-section-title"><div><span className="sc-eyebrow">STUDYLAB / CHMURA</span><h2>Konto i synchronizacja</h2></div></div>
    <section className="sc-panel sc-cloud-panel">
      <div className="sc-between"><h3>Postępy na wszystkich urządzeniach</h3><span className={`sc-cloud-indicator sc-cloud-${cloud.phase}`}>{
        cloud.phase==='connected'?'● Połączono':cloud.phase==='syncing'?'◌ Synchronizowanie':cloud.phase==='unconfigured'?'○ Brak konfiguracji':cloud.phase==='error'?'! Problem z chmurą':cloud.phase==='account-mismatch'?'! Wymagana decyzja':'○ Tylko lokalnie'
      }</span></div>
      <p className="sc-muted">Zaloguj się przez GitHub bez limitu e-maili lub użyj dotychczasowego linku pocztowego. Postępy nadal zapisują się lokalnie i działają offline.</p>
      {!cloud.configured && <div className="sc-cloud-notice"><strong>Synchronizacja nie jest jeszcze skonfigurowana.</strong><p>Utwórz projekt Supabase, uruchom skrypt SQL i ustaw publiczne zmienne `PUBLIC_SUPABASE_URL` oraz `PUBLIC_SUPABASE_PUBLISHABLE_KEY` zgodnie z README paczki. Bez tych ustawień StudyLab działa dokładnie jak wcześniej, tylko lokalnie.</p></div>}
      {cloud.configured && !cloud.userId && <div className="sc-cloud-login">
        <div className="sc-github-login">
          <button className="sc-github-login-button" type="button" disabled={cloud.busy} onClick={()=>void cloud.signInWithGithub()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .8A11.2 11.2 0 0 0 8.46 22.63c.56.1.77-.24.77-.54v-2.1c-3.14.69-3.8-1.34-3.8-1.34-.51-1.3-1.26-1.65-1.26-1.65-1.03-.71.08-.7.08-.7 1.14.08 1.73 1.17 1.73 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.51-.28-5.16-1.25-5.16-5.56 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.98 0 0 .94-.3 3.09 1.16a10.74 10.74 0 0 1 5.62 0c2.15-1.46 3.09-1.16 3.09-1.16.61 1.55.23 2.7.11 2.98a4.3 4.3 0 0 1 1.16 3.03c0 4.32-2.65 5.27-5.18 5.55.41.35.77 1.02.77 2.06v3.05c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z"/></svg>
            {cloud.busy?'Przekierowywanie…':'Zaloguj się przez GitHub'}
          </button>
          <p className="sc-github-safety">Bez kodu i bez e-maila. Postępy przypisane są do Twojego konta Supabase, nie do repozytoriów na GitHubie.</p>
        </div>
        <div className="sc-github-divider">lub link e-mail</div>
        <form className="sc-form" onSubmit={submitMail}>
          <label className="sc-field"><span>Adres e-mail</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="twoj@email.pl" required /></label>
          <button className="sc-primary" type="submit" disabled={cloud.busy}>{cloud.busy?'Wysyłanie...':'Wyślij link logowania'}</button>
        </form>
        {sent && <div className="sc-cloud-notice"><strong>Sprawdź pocztę (także Spam)</strong><p>Kliknij link w tej samej przeglądarce, w której chcesz korzystać ze StudyLab. Nie kopiuj kodu z adresu URL. Jeśli link otworzy inną przeglądarkę, zalogujesz się tam.</p></div>}
        {sent && <button className="sc-secondary" type="button" onClick={()=>setShowCode(v=>!v)}>{showCode?'Ukryj pole kodu':'Mam kod zamiast linku'}</button>}
        {sent && showCode && <form className="sc-form sc-cloud-otp" onSubmit={submitOtp}>
          <label className="sc-field"><span>Jednorazowy kod z wiadomości</span><input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" minLength="6" maxLength="8" value={otp} onChange={e=>setOtp(e.target.value.replace(/\s/g,''))} placeholder="000000" required /></label>
          <button className="sc-secondary" type="submit" disabled={cloud.busy}>Zaloguj się kodem</button>
        </form>}
        {notice && <p role="status" className="sc-muted">{notice}</p>}
      </div>}
      {cloud.configured && cloud.userId && <div className="sc-cloud-account">
        <p><b>Zalogowane konto:</b> {cloud.email}</p>
        {cloud.phase !== 'account-mismatch' && <p className="sc-muted">Ostatnia synchronizacja: {when(cloud.lastSync)}. Aktualizacje wysyłane są po zmianach i sprawdzane także po powrocie do otwartej strony.</p>}
        {cloud.phase === 'account-mismatch' && <div className="sc-cloud-warning"><strong>W tej przeglądarce są dane innego konta.</strong><p>Nie wyślemy ich do nowego konta. Przed kontynuacją pobierz kopię JSON z zakładki „Moje materiały”. Potwierdzenie zastąpi dane lokalne danymi z obecnie zalogowanego konta.</p><button className="sc-secondary" onClick={()=>{if(window.confirm('Czy na pewno zastąpić lokalne postępy danymi obecnie zalogowanego konta? Najpierw zapisz kopię JSON.'))cloud.replaceWithAccount();}}>Zastąp lokalne dane z tego konta</button></div>}
        {cloud.phase !== 'account-mismatch' && <div className="sc-github-link-area">
          {cloud.githubLinked
            ? <span className="sc-github-linked">✓ GitHub jest powiązany z tym kontem</span>
            : <button className="sc-github-link-button" type="button" disabled={cloud.busy} onClick={()=>void cloud.linkGithub()}>Połącz GitHub z obecnym kontem</button>}
        </div>}
        <div className="sc-actions">
          <button className="sc-primary" disabled={cloud.busy || cloud.phase==='account-mismatch' || cloud.phase==='syncing'} onClick={()=>void cloud.syncNow()}>Synchronizuj teraz ↻</button>
          <button className="sc-secondary" disabled={cloud.busy} onClick={()=>void cloud.signOut()}>Wyloguj się na tym urządzeniu</button>
        </div>
      </div>}
      {cloud.error && <p className="sc-cloud-error" role="alert">{cloud.error}</p>}
      <p className="sc-muted sc-cloud-disclaimer">Nowe odpowiedzi zapisują się w chmurze tylko po zalogowaniu i z połączeniem internetowym. Połączenie z dwoma urządzeniami może wymagać do ok. 45 sekund lub kliknięcia „Synchronizuj teraz”. Przy jednoczesnym ocenianiu tej samej fiszki algorytm zachowuje najnowszy stan karty; historia obu ocen pozostaje zapisana.</p>
    </section>
  </>;
}
