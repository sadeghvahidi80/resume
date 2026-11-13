/* Contact form handler - extracted from contact.html for CSP compliance.
   Loaded with defer; expects the #contact-form / #en-contact-form markup. */
window.CONTACT_CONFIG = { endpoint: "https://formspree.io/f/mppplvez" };
(function(){
var L={
 fa:{miss:'فیلدهای ستاره‌دار را کامل کنید.',slow:'لطفاً چند لحظه صبر کنید یا از تلگرام/ایمیل استفاده کنید.',send:'در حال ارسال…',done:'دریافت شد — در تلگرام و ایمیل پاسخ می‌دهم.',subj:'درخواست همکاری — ',n:'نام: ',c:'ارتباط: ',b:'درخواست همکاری — ',err:'ارسال خودکار ناموفق بود — یک لحظه دوباره تلاش کنید یا از پیش‌فرض ایمیل پایین استفاده کنید.'},
 en:{miss:'Please complete the required fields.',slow:'Please wait a few seconds, or use Telegram/email.',send:'Sending…',done:'Received — I will reply via Telegram or email.',subj:'Collaboration request — ',n:'Name: ',c:'Contact: ',b:'Collaboration request — ',err:'Automatic sending failed — try again in a moment, or use the email fallback below.'}
};
function buildTelegramPayload(d,lang){
  var isMail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact);
  var p={name:d.name, contact:d.contact, type:d.type, message:d.message, budget:d.budget, open_ts:d.open_ts, page:location.href, lang:document.documentElement.lang,
    email: isMail ? d.contact : "sadeghvahidi80@gmail.com",
    _subject: L[lang].subj+d.type,
    _gotcha: ""};
  return p;
}
async function sendToWorker(payload){
  var ep=(window.CONTACT_CONFIG&&window.CONTACT_CONFIG.endpoint)||"";
  if(!ep){return {ok:false,reason:"no-endpoint"};}
  try{
    var r=await fetch(ep,{method:"POST",headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(payload)});
    return {ok:r.ok,status:r.status};
  }catch(e){return {ok:false,reason:"network"};}
}
function bind(pre,formId,lang){
  var f=document.getElementById(formId);if(!f)return;
  var sending=false;
  var msgEl=document.getElementById(pre+'msg'), fb=document.getElementById(pre+'fallback'), mail=document.getElementById(pre+'mailto');
  document.getElementById(pre+'open-ts').value=String(Math.floor(Date.now()/1000));
  mail.addEventListener('click',function(){ fb.style.display='none'; });
  f.addEventListener('submit',async function(ev){
    ev.preventDefault();
    if(sending){return;}
    var honey=document.getElementById(pre+'honeypot');
    if(honey.value){msgEl.textContent='';return;}
    var t0=parseInt(document.getElementById(pre+'open-ts').value,10)||0;
    if(Math.floor(Date.now()/1000)-t0<3){msgEl.textContent=L[lang].slow;return;}
    var d={
      name:      document.getElementById(pre+'name').value.trim(),
      contact:   document.getElementById(pre+'contact').value.trim(),
      type:      document.getElementById(pre+'type').value,
      message:   document.getElementById(pre+'message').value,
      budget:    (document.getElementById(pre+'budget')||{value:''}).value.trim(),
      open_ts:   document.getElementById(pre+'open-ts').value
    };
    if(!d.name||!d.contact||!d.type||!d.message){msgEl.textContent=L[lang].miss;return;}
    msgEl.textContent=L[lang].send;
    var btn=f.querySelector('button[type="submit"]');
    sending=true;if(btn){btn.disabled=true;btn.setAttribute('aria-busy','true');}
    var res=await sendToWorker(buildTelegramPayload(d,lang));
    sending=false;if(btn){btn.disabled=false;btn.removeAttribute('aria-busy');}
    if(res.ok){msgEl.textContent=L[lang].done;f.reset();document.getElementById(pre+'open-ts').value=String(Math.floor(Date.now()/1000));return;}
    msgEl.textContent=L[lang].err;
    var body=L[lang].b+d.type+'\n'+L[lang].n+d.name+'\n'+L[lang].c+d.contact+'\n\n'+d.message;
    mail.href='mailto:sadeghvahidi80@gmail.com?subject='+encodeURIComponent(L[lang].subj+d.type)+'&body='+encodeURIComponent(body);
    fb.style.display='block';mail.focus();
  });
}
bind('cf-','contact-form','fa');
bind('ecf-','en-contact-form','en');
})();
