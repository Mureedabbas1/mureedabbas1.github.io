(function(){
const GROUPS=[
 {key:"r1",name:"روٹ 1 · سلام انٹرچینج سے پپلاں",cities:["Shahpur","Bhera","Khushab","Johar Abad","Quaidabad","Piplan"]},
 {key:"r2",name:"روٹ 2 · بھابڑا سے خانقاہ ڈوگراں / فاروق آباد",cities:["Bhabra","Hilalpur","Bherowal","Midhranjha","Sial Mor","Pindi Bhattian","Sukheki","Kalyki Mandi","Khanqah Dogran","Farooqabad"]}
];
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const cityKey=s=>({joharabad:"joharabad",sialmor:"sialmor",kalyki:"kalykimandi"}[norm(s)]||norm(s));
const routeOf=d=>GROUPS.find(g=>g.cities.some(c=>cityKey(c)===cityKey(d.city)))||null;
const bal=d=>balances.find(x=>x.dealer_id===d.id)||{};
const amount=d=>Number(bal(d).current_balance??d.opening_balance??0);
const sorted=arr=>arr.slice().sort((a,b)=>{const x=amount(a),y=amount(b),g=v=>v>0?0:v===0?1:2;return g(x)-g(y)||(g(x)===0?y-x:g(x)===2?x-y:String(a.name).localeCompare(String(b.name)));});
function cityBlock(city,list){
 return '<section class="panel" data-city-group="'+esc(city)+'"><div class="toolbar"><h2>'+esc(city)+' <span class="tag">'+list.length+' ڈیلر</span></h2></div><div class="tablewrap"><table><thead><tr><th>ڈیلر</th><th>فون</th><th>ابتدائی بیلنس</th><th>موجودہ بقایا</th><th>اکاؤنٹ</th></tr></thead><tbody>'+
 sorted(list).map(d=>'<tr><td><strong>'+esc(d.name)+'</strong></td><td>'+esc(d.phone||"—")+'</td><td class="money">'+fmt(d.opening_balance)+'</td><td class="money '+(amount(d)<0?'negative':'positive')+'">'+fmt(amount(d))+'</td><td><button class="btn alt" data-open-dealer="'+d.id+'">اکاؤنٹ کھولیں →</button></td></tr>').join("")+
 '</tbody></table></div></section>';
}
dealerPage=function(){
 const all=dealers.filter(d=>d.active!==false), unassigned=all.filter(d=>!routeOf(d));
 let h='<section class="panel"><div class="toolbar"><div><h2>روٹ → شہر → ڈیلر اکاؤنٹس</h2><span class="small">ہر ڈیلر کے بل، وصولی اور بقایا الگ</span></div><input class="search" id="dealerSearch" placeholder="نام، شہر یا فون تلاش کریں" style="max-width:270px"></div><div class="grid"><div class="stat"><small>کل ڈیلرز</small><strong>'+all.length+'</strong></div><div class="stat"><small>روٹ 1</small><strong>'+all.filter(d=>routeOf(d)?.key==="r1").length+'</strong></div><div class="stat"><small>روٹ 2</small><strong>'+all.filter(d=>routeOf(d)?.key==="r2").length+'</strong></div><div class="stat"><small>تصدیق طلب</small><strong>'+unassigned.length+'</strong></div></div></section>';
 GROUPS.forEach(g=>{
  h+='<section class="panel"><div class="routebox"><strong>'+g.name+'</strong><span class="small">راستہ: '+g.cities.join(" → ")+'</span></div>';
  g.cities.forEach(city=>{const list=all.filter(d=>routeOf(d)?.key===g.key&&cityKey(d.city)===cityKey(city));if(list.length)h+=cityBlock(city,list);});
  h+='</section>';
 });
 if(unassigned.length){const groups={};unassigned.forEach(d=>(groups[d.city||"شہر درج نہیں"]??=[]).push(d));h+='<section class="panel"><div class="routebox"><strong>غیر مختص / تصدیق طلب شہر</strong><span class="small">ان شہروں کو درست روٹ میں شامل کرنے کے لیے تصدیق باقی ہے۔</span></div>'+Object.keys(groups).sort().map(c=>cityBlock(c,groups[c])).join("")+'</section>';}
 return h;
};
function detail(){
 const d=dealers.find(x=>x.id===window.__marcoDealerId);if(!d)return '<section class="panel">ڈیلر نہیں ملا۔</section>';
 const ss=sales.filter(x=>x.dealer_id===d.id), pp=payments.filter(x=>x.dealer_id===d.id);
 const totalPaid=pp.reduce((n,p)=>n+Number(p.amount||0),0);
 let h='<section class="panel"><button class="btn alt" id="backDealers">← تمام ڈیلرز</button><div class="toolbar"><div><h2>'+esc(d.name)+'</h2><span class="small">'+esc(d.city||"")+' · '+esc(d.phone||"")+'</span></div><button class="btn" id="newDealerBill">＋ نیا بل</button></div><div class="grid"><div class="stat"><small>موجودہ بقایا</small><strong>'+fmt(amount(d))+'</strong></div><div class="stat"><small>کل بلز</small><strong>'+ss.length+'</strong></div><div class="stat"><small>کل وصولی</small><strong>'+fmt(totalPaid)+'</strong></div><div class="stat"><small>ابتدائی بیلنس</small><strong>'+fmt(d.opening_balance)+'</strong></div></div><button class="btn alt" id="receiveDealer">＋ رقم وصول کریں</button></section>';
 h+='<section class="panel"><h2>بلز اور آئٹمز</h2><div class="tablewrap"><table><thead><tr><th>تاریخ</th><th>آئٹم</th><th>مقدار</th><th>ریٹ</th><th>رقم</th><th>WhatsApp</th></tr></thead><tbody>';
 h+=ss.map(s=>{const its=s.sale_items||[],sum=its.reduce((n,i)=>n+Number(i.quantity||0)*Number(i.sale_rate||0),0);const msg="MARCO ICE CREAM\nDealer: "+d.name+"\nDate: "+String(s.sold_at||"").slice(0,10)+"\nBill: "+s.id+"\n"+its.map(i=>i.product_name+" | "+i.quantity+" x Rs "+Number(i.sale_rate||0)).join("\n")+"\nBill total: Rs "+sum+"\nOutstanding: Rs "+amount(d);const phone=String(d.phone||"").replace(/\D/g,"");return its.map(i=>'<tr><td>'+String(s.sold_at||"").slice(0,10)+'</td><td>'+esc(i.product_name)+'</td><td>'+i.quantity+'</td><td>'+fmt(i.sale_rate)+'</td><td>'+fmt(Number(i.quantity||0)*Number(i.sale_rate||0))+'</td><td><a class="btn alt" target="_blank" rel="noopener" href="https://wa.me/'+phone+'?text='+encodeURIComponent(msg)+'">WhatsApp</a></td></tr>').join("");}).join("")||'<tr><td colspan="6" class="empty">ابھی کوئی بل موجود نہیں۔</td></tr>';
 h+='</tbody></table></div></section><section class="panel"><h2>ادائیگیوں کی ہسٹری</h2><div class="tablewrap"><table><thead><tr><th>تاریخ</th><th>طریقہ</th><th>نوٹس</th><th>رقم</th></tr></thead><tbody>';
 h+=pp.map(p=>'<tr><td>'+String(p.paid_at||"").slice(0,10)+'</td><td>'+esc(p.method||"")+'</td><td>'+esc(p.notes||"")+'</td><td>'+fmt(p.amount)+'</td></tr>').join("")||'<tr><td colspan="4" class="empty">ادائیگی موجود نہیں۔</td></tr>';
 return h+'</tbody></table></div></section>';
}
const oldRender=render;
render=function(){if(tab==="dealerDetail"){$("#content").innerHTML=detail();bindDetail();return;}oldRender();};
function bindDetail(){
 $("#backDealers").onclick=()=>{tab="dealers";render();};
 $("#newDealerBill").onclick=openBill;
 $("#receiveDealer").onclick=openReceive;
}
function line(){
 return '<div class="bill-line" style="display:grid;grid-template-columns:1.5fr .6fr .8fr auto;gap:7px"><div class="field"><label>آئٹم</label><select class="bp" required><option value="">منتخب کریں</option>'+products.map(p=>'<option value="'+p.id+'">'+esc(p.name)+'</option>').join("")+'</select></div><div class="field"><label>مقدار</label><input class="bq" type="number" min="1" required></div><div class="field"><label>ڈیلر ریٹ</label><input class="br" type="number" min="0" step=".01" required></div><button type="button" class="close rm">×</button></div>';
}
function bindLines(){document.querySelectorAll(".bill-line").forEach(row=>{row.querySelector(".bp").onchange=e=>{const p=products.find(x=>x.id===e.target.value);if(p)row.querySelector(".br").value=p.factory_rate??"";};row.querySelector(".rm").onclick=()=>{if(document.querySelectorAll(".bill-line").length>1)row.remove();};});}
function openBill(){
 const d=dealers.find(x=>x.id===window.__marcoDealerId);
 openModal("نیا بل · "+d.name,'<form id="dbf"><div class="field"><label>تاریخ</label><input id="bdate" type="date" value="'+dateNow()+'" required></div><div id="blines">'+line()+'</div><button type="button" class="btn alt" id="addline">＋ مزید آئٹم</button><div class="field"><label>ادائیگی کی قسم</label><select id="btype"><option value="credit">ادھار</option><option value="cash">Cash</option><option value="partial">جزوی</option></select></div><div class="field"><label>ابھی وصول رقم</label><input id="bpaid" type="number" min="0" value="0" required></div><div class="field"><label>نوٹس / بل نمبر</label><input id="bmemo"></div><button class="btn">بل محفوظ کریں</button></form>');
 $("#addline").onclick=()=>{$("#blines").insertAdjacentHTML("beforeend",line());bindLines();};bindLines();$("#dbf").onsubmit=saveBill;
}
async function saveBill(e){
 e.preventDefault();if(!route?.id)return alert("پہلے Current Route میں متعلقہ روٹ شروع کریں۔");
 const d=dealers.find(x=>x.id===window.__marcoDealerId);
 const items=[...document.querySelectorAll(".bill-line")].map(row=>({p:products.find(p=>p.id===row.querySelector(".bp").value),q:Number(row.querySelector(".bq").value),rate:Number(row.querySelector(".br").value)}));
 if(items.some(x=>!x.p||x.q<=0||!Number.isFinite(x.rate)||x.rate<0))return alert("آئٹم، مقدار اور ریٹ درست درج کریں۔");
 const total=items.reduce((n,x)=>n+x.q*x.rate,0),paid=Number($("#bpaid").value||0),type=$("#btype").value;
 if(paid<0||paid>total||(type==="cash"&&paid!==total)||(type==="credit"&&paid!==0)||(type==="partial"&&(paid<=0||paid>=total)))return alert("ادائیگی کی رقم درست درج کریں۔");
 const {data:s,error}=await sb.from("sales").insert({route_id:route.id,dealer_id:d.id,payment_type:type,sold_at:new Date($("#bdate").value+"T12:00:00").toISOString(),notes:$("#bmemo").value}).select().single();
 if(error)return alert(error.message);
 const rows=items.map(x=>({sale_id:s.id,product_name:x.p.name,quantity:x.q,purchase_rate:Number(x.p.factory_rate||0),sale_rate:x.rate}));
 const {error:ie}=await sb.from("sale_items").insert(rows);if(ie)return alert("بل بنا مگر آئٹمز محفوظ نہیں ہوئے: "+ie.message);
 if(paid>0){const {error:pe}=await sb.from("dealer_payments").insert({dealer_id:d.id,route_id:route.id,amount:paid,method:"cash",notes:"Bill payment · "+($("#bmemo").value||s.id)});if(pe)return alert("بل محفوظ ہے مگر وصولی محفوظ نہیں ہوئی: "+pe.message);}
 $("#modal").classList.add("hidden");await refresh();render();
 const sum=items.reduce((n,x)=>n+x.q*x.rate,0),message="MARCO ICE CREAM\nDealer: "+d.name+"\nDate: "+$("#bdate").value+"\nBill: "+s.id+"\n"+rows.map(x=>x.product_name+" | "+x.quantity+" x Rs "+x.sale_rate+" = Rs "+(x.quantity*x.sale_rate)).join("\n")+"\nBill total: Rs "+sum+"\nReceived: Rs "+paid+"\nOutstanding: Rs "+amount(d);
 const phone=String(d.phone||"").replace(/\D/g,"");if(phone&&confirm("بل محفوظ ہوگیا۔ WhatsApp پر بھیجیں؟"))window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(message),"_blank","noopener");
}
function openReceive(){
 const d=dealers.find(x=>x.id===window.__marcoDealerId);
 openModal("رقم وصول کریں · "+d.name,'<form id="drf"><div class="field"><label>رقم (PKR)</label><input id="ramount" type="number" min="1" required></div><div class="field"><label>طریقہ</label><select id="rmethod"><option>cash</option><option>bank</option><option>easypaisa</option><option>jazzcash</option></select></div><div class="field"><label>نوٹس</label><input id="rnote"></div><button class="btn">محفوظ کریں</button></form>');
 $("#drf").onsubmit=async e=>{e.preventDefault();const {error}=await sb.from("dealer_payments").insert({dealer_id:d.id,route_id:route?.id||null,amount:Number($("#ramount").value),method:$("#rmethod").value,notes:$("#rnote").value});if(error)return alert(error.message);$("#modal").classList.add("hidden");await refresh();render();};
}
const oldBind=bindPage;
bindPage=function(){
 oldBind();
 document.querySelectorAll("[data-open-dealer]").forEach(b=>b.onclick=()=>{window.__marcoDealerId=b.dataset.openDealer;tab="dealerDetail";render();});
 const search=$("#dealerSearch");if(search)search.addEventListener("input",()=>{const q=search.value.toLowerCase();document.querySelectorAll("[data-city-group]").forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?"":"none");});
};
routePage=function(){
 const r=route||{},s=summary.find(x=>x.route_id===r.id)||{};
 const routeCards=GROUPS.map(g=>'<div class="routebox"><strong>'+g.name+'</strong><span class="small">'+g.cities.join(" → ")+'</span><div class="small">'+dealers.filter(d=>routeOf(d)?.key===g.key).length+' ڈیلرز</div></div>').join("");
 return '<section class="panel"><div class="toolbar"><h2>روٹ مینجمنٹ</h2><span class="tag">'+(r.status||"کوئی فعال روٹ نہیں")+'</span></div><div class="routebox"><strong>'+(r.route_name||"ابھی کوئی روٹ شروع نہیں")+'</strong><span class="small">سیلز مین: '+(r.salesman||"Anayat Ali")+' · تاریخ: '+(r.route_date||"—")+'</span></div><div class="actions" style="margin:14px 0"><button class="btn alt" id="routeNew" '+(r.id?'disabled':'')+'>نیا روٹ شروع کریں</button><button class="btn" id="routeClose" '+(r.id?'':'disabled')+'>روٹ بند کریں اور حساب بنائیں</button><button class="btn alt" data-go="dealers">ڈیلرز دیکھیں</button></div><div class="grid"><div class="stat"><small>سیلز</small><strong>'+fmt(s.sales_total)+'</strong></div><div class="stat"><small>اخراجات</small><strong>'+fmt(s.expenses_total)+'</strong></div><div class="stat"><small>منافع</small><strong>'+fmt(s.net_profit)+'</strong></div><div class="stat"><small>فیکٹری اسٹاک انٹریز</small><strong>'+loads.filter(x=>x.route_id===r.id).length+'</strong></div></div><h2>مقررہ روٹس</h2><div class="split">'+routeCards+'</div><h2>روٹ ہسٹری</h2><div class="tablewrap"><table><thead><tr><th>تاریخ</th><th>روٹ</th><th>سیلز مین</th><th>حالت</th></tr></thead><tbody>'+summary.map(x=>'<tr><td>'+esc(x.route_date||"")+'</td><td>'+esc(x.route_name||"")+'</td><td>'+esc(x.salesman||"")+'</td><td>'+esc(x.status||"")+'</td></tr>').join("")+'</tbody></table></div></section>';
};
startRoute=async function(){
 const choice=prompt("Select route:\n1 = Shahpur → Piplan\n2 = Bhabra → Farooqabad","1");if(choice===null)return;
 const g=choice.trim()==="1"?GROUPS[0]:choice.trim()==="2"?GROUPS[1]:null;if(!g)return alert("صرف 1 یا 2 منتخب کریں۔");
 const {error}=await sb.from("routes").insert({salesman:"Anayat Ali",route_name:g.name,route_date:dateNow(),status:"open",vehicle_expense_paid_by:"Distributor",notes:"Route sequence: "+g.cities.join(" → ")});
 if(error)return alert(error.message);await refresh();render();
};
})();