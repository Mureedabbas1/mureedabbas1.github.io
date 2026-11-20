(function(){
const GROUPS=[
 {key:"r1",name:"Route 1 · Salam Interchange to Piplan",cities:["Shahpur","Bhera","Khushab","Johar Abad","Quaidabad","Piplan"]},
 {key:"r2",name:"Route 2 · Bhabra to Khanqah Dogran / Farooqabad",cities:["Bhabra","Hilalpur","Bherowal","Midhranjha","Sial Mor","Pindi Bhattian","Sukheki","Kalyki Mandi","Khanqah Dogran","Farooqabad"]}
];
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const cityKey=s=>({joharabad:"joharabad",sialmor:"sialmor",kalyki:"kalykimandi"}[norm(s)]||norm(s));
const routeOf=d=>GROUPS.find(g=>g.cities.some(c=>cityKey(c)===cityKey(d.city)))||null;
const bal=d=>balances.find(x=>x.dealer_id===d.id)||{};
const amount=d=>Number(bal(d).current_balance??d.opening_balance??0);
const sorted=arr=>arr.slice().sort((a,b)=>{const x=amount(a),y=amount(b),g=v=>v>0?0:v===0?1:2;return g(x)-g(y)||(g(x)===0?y-x:g(x)===2?x-y:String(a.name).localeCompare(String(b.name)));});
function cityBlock(city,list){
 return '<section class="panel" data-city-group="'+esc(city)+'"><div class="toolbar"><h2>'+esc(city)+' <span class="tag">'+list.length+' dealers</span></h2></div><div class="tablewrap"><table><thead><tr><th>Dealers</th><th>Phone</th><th>Opening Balance</th><th>Outstanding Balance</th><th>Account</th></tr></thead><tbody>'+
 sorted(list).map(d=>'<tr><td><strong>'+esc(d.name)+'</strong></td><td>'+esc(d.phone||"—")+'</td><td class="money">'+fmt(d.opening_balance)+'</td><td class="money '+(amount(d)<0?'negative':'positive')+'">'+fmt(amount(d))+'</td><td><button class="btn alt" data-open-dealer="'+d.id+'">Open Account →</button></td></tr>').join("")+
 '</tbody></table></div></section>';
}
dealerPage=function(){
 const all=dealers.filter(d=>d.active!==false), unassigned=all.filter(d=>!routeOf(d));
 let h='<section class="panel"><div class="toolbar"><div><h2>Routes → Cities → Dealer Accounts</h2><span class="small">Separate bills, payments and balances for every dealer</span></div><input class="search" id="routeDealerSearch" placeholder="Search name, city or phone" style="max-width:270px"></div><div class="grid"><div class="stat"><small>Total Dealers</small><strong>'+all.length+'</strong></div><div class="stat"><small>Route 1</small><strong>'+all.filter(d=>routeOf(d)?.key==="r1").length+'</strong></div><div class="stat"><small>Route 2</small><strong>'+all.filter(d=>routeOf(d)?.key==="r2").length+'</strong></div><div class="stat"><small>Needs Assignment</small><strong>'+unassigned.length+'</strong></div></div></section>';
 GROUPS.forEach(g=>{
  h+='<section class="panel"><div class="routebox"><strong>'+g.name+'</strong><span class="small">Route: '+g.cities.join(" → ")+'</span></div>';
  g.cities.forEach(city=>{const list=all.filter(d=>routeOf(d)?.key===g.key&&cityKey(d.city)===cityKey(city));if(list.length)h+=cityBlock(city,list);});
  h+='</section>';
 });
 if(unassigned.length){const groups={};unassigned.forEach(d=>(groups[d.city||"City Not Listed"]??=[]).push(d));h+='<section class="panel"><div class="routebox"><strong>Unassigned Cities / Needs Confirmation</strong><span class="small">These cities need confirmation before being assigned to a route.</span></div>'+Object.keys(groups).sort().map(c=>cityBlock(c,groups[c])).join("")+'</section>';}
 return h;
};
function dealerNavigationList(){
 const all=dealers.filter(d=>d.active!==false),ordered=[];
 GROUPS.forEach(g=>g.cities.forEach(city=>{
  ordered.push(...sorted(all.filter(d=>routeOf(d)?.key===g.key&&cityKey(d.city)===cityKey(city))));
 }));
 const unassigned=all.filter(d=>!routeOf(d)),groups={};
 unassigned.forEach(d=>(groups[d.city||"City Not Listed"]??=[]).push(d));
 Object.keys(groups).sort().forEach(city=>ordered.push(...sorted(groups[city])));
 return ordered;
}
function whatsappNumbers(raw){
 const matches=String(raw||"").match(/(?:\\+?92|0)?3\\d{9}/g)||[];
 return [...new Set(matches.map(value=>{let n=value.replace(/\\D/g,"");if(n.startsWith("0"))n="92"+n.slice(1);else if(n.startsWith("3"))n="92"+n;return n;}).filter(n=>/^923\\d{9}$/.test(n)))];
}
function detail(){
 const d=dealers.find(x=>x.id===window.__marcoDealerId);if(!d)return '<section class="panel">Dealer not found.</section>';
 const ss=sales.filter(x=>x.dealer_id===d.id), pp=payments.filter(x=>x.dealer_id===d.id);
 const totalPaid=pp.reduce((n,p)=>n+Number(p.amount||0),0);
 const dealerPhones=whatsappNumbers(d.phone);
 const accountMessage="*MARCO ICE CREAM*\\nSalesman: Anayat Ali\\nDate: "+dateNow()+"\\n\\n*Dealer Account Statement*\\n\\nDear "+d.name+",\\n\\nHere is your latest account statement:\\n\\n📍 City: "+(d.city||"")+"\\n💰 Outstanding Balance: Rs. "+amount(d)+"\\n🧾 Bills Number: "+ss.length+"\\n💵 Total Payments Received: Rs. "+totalPaid+"\\n\\nPlease review your account and let us know if you have any questions.\\n\\nFor any queries, contact:\\n📞 +923042156214\\n\\nThank you for your business!\\n\\n*MARCO ICE CREAM*";
 const whatsappButtons=dealerPhones.map((phone,i)=>'<a class="btn alt" href="https://wa.me/'+phone+'?text='+encodeURIComponent(accountMessage)+'" target="_blank" rel="noopener">WhatsApp '+(i+1)+'</a>').join("");
 const navDealers=dealerNavigationList(),navIndex=navDealers.findIndex(x=>x.id===d.id);
 let h='<section class="panel"><button class="btn alt" id="backDealers">← All Dealers</button><div class="toolbar" style="margin:12px 0"><span class="small">Dealer '+(navIndex+1)+' of '+navDealers.length+'</span><div class="actions"><button class="btn alt" id="prevDealer" '+(navIndex<=0?'disabled':'')+'>← Previous</button><button class="btn alt" id="nextDealer" '+(navIndex<0||navIndex>=navDealers.length-1?'disabled':'')+'>Next →</button></div></div><div class="toolbar"><div><h2>'+esc(d.name)+'</h2><span class="small">'+esc(d.city||"")+' · '+esc(d.phone||"Phone not added")+'</span></div><div class="actions">'+(whatsappButtons||'<button class="btn alt" id="missingDealerPhone">Add WhatsApp Number</button>')+'<button class="btn" id="newDealerBill">＋ New Bill</button></div></div><div class="grid"><div class="stat"><small>Outstanding Balance</small><strong>'+fmt(amount(d))+'</strong></div><div class="stat"><small>Total Bills</small><strong>'+ss.length+'</strong></div><div class="stat"><small>Total Payments</small><strong>'+fmt(totalPaid)+'</strong></div><div class="stat"><small>Opening Balance</small><strong>'+fmt(d.opening_balance)+'</strong></div></div><button class="btn alt" id="receiveDealer">＋ Receive Payment</button></section>';
 h+='<section class="panel"><h2>Bills & Items</h2><div class="tablewrap"><table><thead><tr><th>Date</th><th>Item</th><th>Quantity</th><th>Rate</th><th>Amount</th><th>WhatsApp</th></tr></thead><tbody>';
 h+=ss.map(s=>{const its=s.sale_items||[],sum=its.reduce((n,i)=>n+Number(i.quantity||0)*Number(i.sale_rate||0),0);const msg="MARCO ICE CREAM\nDealer: "+d.name+"\nDate: "+String(s.sold_at||"").slice(0,10)+"\nBill: "+s.id+"\n"+its.map(i=>i.product_name+" | "+i.quantity+" x Rs "+Number(i.sale_rate||0)).join("\n")+"\nBill total: Rs "+sum+"\nOutstanding: Rs "+amount(d);const phone=String(d.phone||"").replace(/\D/g,"");return its.map(i=>'<tr><td>'+String(s.sold_at||"").slice(0,10)+'</td><td>'+esc(i.product_name)+'</td><td>'+i.quantity+'</td><td>'+fmt(i.sale_rate)+'</td><td>'+fmt(Number(i.quantity||0)*Number(i.sale_rate||0))+'</td><td><a class="btn alt" target="_blank" rel="noopener" href="https://wa.me/'+phone+'?text='+encodeURIComponent(msg)+'">WhatsApp</a></td></tr>').join("");}).join("")||'<tr><td colspan="6" class="empty">No bills yet.</td></tr>';
 h+='</tbody></table></div></section><section class="panel"><h2>Payment History</h2><div class="tablewrap"><table><thead><tr><th>Date</th><th>Method</th><th>Notes</th><th>Amount</th></tr></thead><tbody>';
 h+=pp.map(p=>'<tr><td>'+String(p.paid_at||"").slice(0,10)+'</td><td>'+esc(p.method||"")+'</td><td>'+esc(p.notes||"")+'</td><td>'+fmt(p.amount)+'</td></tr>').join("")||'<tr><td colspan="4" class="empty">No payments yet.</td></tr>';
 return h+'</tbody></table></div></section>';
}
const oldRender=render;
render=function(){if(tab==="dealerDetail"){$("#content").innerHTML=detail();bindDetail();return;}oldRender();};
function bindDetail(){
 $("#backDealers").onclick=()=>{tab="dealers";render();};
 const navDealers=dealerNavigationList(),navIndex=navDealers.findIndex(x=>x.id===window.__marcoDealerId);
 $("#prevDealer")?.addEventListener("click",()=>{if(navIndex>0){window.__marcoDealerId=navDealers[navIndex-1].id;render();}});
 $("#nextDealer")?.addEventListener("click",()=>{if(navIndex>=0&&navIndex<navDealers.length-1){window.__marcoDealerId=navDealers[navIndex+1].id;render();}});
 $("#newDealerBill").onclick=openBill;
 $("#receiveDealer").onclick=openReceive;
 $("#missingDealerPhone")?.addEventListener("click",e=>{e.preventDefault();alert("Add the dealer's WhatsApp number to the dealer profile first.");});
}
function line(){
 return '<div class="bill-line" style="display:grid;grid-template-columns:1.5fr .6fr .8fr auto;gap:7px"><div class="field"><label>Item</label><select class="bp" required><option value="">Select</option>'+products.map(p=>'<option value="'+p.id+'">'+esc(p.name)+'</option>').join("")+'</select></div><div class="field"><label>Quantity</label><input class="bq" type="number" min="1" required></div><div class="field"><label>Dealers Rate</label><input class="br" type="number" min="0" step=".01" required></div><button type="button" class="close rm">×</button></div>';
}
function bindLines(){document.querySelectorAll(".bill-line").forEach(row=>{row.querySelector(".bp").onchange=e=>{const p=products.find(x=>x.id===e.target.value);if(p)row.querySelector(".br").value=p.factory_rate??"";};row.querySelector(".rm").onclick=()=>{if(document.querySelectorAll(".bill-line").length>1)row.remove();};});}
function openBill(){
 const d=dealers.find(x=>x.id===window.__marcoDealerId);
 openModal("New Bill · "+d.name,'<form id="dbf"><div class="field"><label>Date</label><input id="bdate" type="date" value="'+dateNow()+'" required></div><div id="blines">'+line()+'</div><button type="button" class="btn alt" id="addline">＋ Add Item</button><div class="field"><label>Payment Type</label><select id="btype"><option value="credit">Credit</option><option value="cash">Cash</option><option value="partial">Partial</option></select></div><div class="field"><label>Amount Received Now</label><input id="bpaid" type="number" min="0" value="0" required></div><div class="field"><label>Notes / Bill Number</label><input id="bmemo"></div><button class="btn">Save Bill</button></form>');
 $("#addline").onclick=()=>{$("#blines").insertAdjacentHTML("beforeend",line());bindLines();};bindLines();$("#dbf").onsubmit=saveBill;
}
async function saveBill(e){
 e.preventDefault();if(!route?.id)return alert("Please start the relevant route in Current Route first.");
 const d=dealers.find(x=>x.id===window.__marcoDealerId);
 const items=[...document.querySelectorAll(".bill-line")].map(row=>({p:products.find(p=>p.id===row.querySelector(".bp").value),q:Number(row.querySelector(".bq").value),rate:Number(row.querySelector(".br").value)}));
 if(items.some(x=>!x.p||x.q<=0||!Number.isFinite(x.rate)||x.rate<0))return alert("Enter a valid item, quantity and rate.");
 const total=items.reduce((n,x)=>n+x.q*x.rate,0),paid=Number($("#bpaid").value||0),type=$("#btype").value;
 if(paid<0||paid>total||(type==="cash"&&paid!==total)||(type==="credit"&&paid!==0)||(type==="partial"&&(paid<=0||paid>=total)))return alert("Enter a valid payment amount.");
 const {data:s,error}=await sb.from("sales").insert({route_id:route.id,dealer_id:d.id,payment_type:type,sold_at:new Date($("#bdate").value+"T12:00:00").toISOString(),notes:$("#bmemo").value}).select().single();
 if(error)return alert(error.message);
 const rows=items.map(x=>({sale_id:s.id,product_name:x.p.name,quantity:x.q,purchase_rate:Number(x.p.factory_rate||0),sale_rate:x.rate}));
 const {error:ie}=await sb.from("sale_items").insert(rows);if(ie)return alert("Bill created, but items could not be saved: "+ie.message);
 if(paid>0){const {error:pe}=await sb.from("dealer_payments").insert({dealer_id:d.id,route_id:route.id,amount:paid,method:"cash",notes:"Bill payment · "+($("#bmemo").value||s.id)});if(pe)return alert("Bill saved, but payment could not be saved: "+pe.message);}
 $("#modal").classList.add("hidden");await refresh();render();
 const sum=items.reduce((n,x)=>n+x.q*x.rate,0),message="MARCO ICE CREAM\nDealer: "+d.name+"\nDate: "+$("#bdate").value+"\nBill: "+s.id+"\n"+rows.map(x=>x.product_name+" | "+x.quantity+" x Rs "+x.sale_rate+" = Rs "+(x.quantity*x.sale_rate)).join("\n")+"\nBill total: Rs "+sum+"\nReceived: Rs "+paid+"\nOutstanding: Rs "+amount(d);
 const phone=String(d.phone||"").replace(/\D/g,"");if(phone&&confirm("Bill saved. Send it via WhatsApp?"))window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(message),"_blank","noopener");
}
function openReceive(){
 const d=dealers.find(x=>x.id===window.__marcoDealerId);
 openModal("Receive Payment · "+d.name,'<form id="drf"><div class="field"><label>Amount (PKR)</label><input id="ramount" type="number" min="1" required></div><div class="field"><label>Method</label><select id="rmethod"><option>cash</option><option>bank</option><option>easypaisa</option><option>jazzcash</option></select></div><div class="field"><label>Notes</label><input id="rnote"></div><button class="btn">Save</button></form>');
 $("#drf").onsubmit=async e=>{e.preventDefault();const {error}=await sb.from("dealer_payments").insert({dealer_id:d.id,route_id:route?.id||null,amount:Number($("#ramount").value),method:$("#rmethod").value,notes:$("#rnote").value});if(error)return alert(error.message);$("#modal").classList.add("hidden");await refresh();render();};
}
const oldBind=bindPage;
bindPage=function(){
 oldBind();
 document.querySelectorAll("[data-open-dealer]").forEach(b=>b.onclick=()=>{window.__marcoDealerId=b.dataset.openDealer;tab="dealerDetail";render();});
 const search=$("#routeDealerSearch");if(search)search.addEventListener("input",()=>{const q=search.value.toLowerCase();document.querySelectorAll("[data-city-group]").forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?"":"none");});
};
routePage=function(){
 const r=route||{},s=summary.find(x=>x.route_id===r.id)||{};
 const routeCards=GROUPS.map(g=>'<div class="routebox"><strong>'+g.name+'</strong><span class="small">'+g.cities.join(" → ")+'</span><div class="small">'+dealers.filter(d=>routeOf(d)?.key===g.key).length+' dealers</div></div>').join("");
 return '<section class="panel"><div class="toolbar"><h2>Route Management</h2><span class="tag">'+(r.status||"No Active Route")+'</span></div><div class="routebox"><strong>'+(r.route_name||"No route started yet")+'</strong><span class="small">Salesperson: '+(r.salesman||"Anayat Ali")+' · Date: '+(r.route_date||"—")+'</span></div><div class="actions" style="margin:14px 0"><button class="btn alt" id="routeNew" '+(r.id?'disabled':'')+'>Start New Route</button><button class="btn" id="routeClose" '+(r.id?'':'disabled')+'>Close Route & Calculate Accounts</button><button class="btn alt" data-go="dealers">View Dealers</button></div><div class="grid"><div class="stat"><small>Sales</small><strong>'+fmt(s.sales_total)+'</strong></div><div class="stat"><small>Expenses</small><strong>'+fmt(s.expenses_total)+'</strong></div><div class="stat"><small>Profit</small><strong>'+fmt(s.net_profit)+'</strong></div><div class="stat"><small>Factory Stock Entries</small><strong>'+loads.filter(x=>x.route_id===r.id).length+'</strong></div></div><h2>Assigned Routes</h2><div class="split">'+routeCards+'</div><h2>Route History</h2><div class="tablewrap"><table><thead><tr><th>Date</th><th>Route</th><th>Salesperson</th><th>Status</th></tr></thead><tbody>'+summary.map(x=>'<tr><td>'+esc(x.route_date||"")+'</td><td>'+esc(x.route_name||"")+'</td><td>'+esc(x.salesman||"")+'</td><td>'+esc(x.status||"")+'</td></tr>').join("")+'</tbody></table></div></section>';
};
startRoute=async function(){
 const choice=prompt("Select route:\n1 = Shahpur → Piplan\n2 = Bhabra → Farooqabad","1");if(choice===null)return;
 const g=choice.trim()==="1"?GROUPS[0]:choice.trim()==="2"?GROUPS[1]:null;if(!g)return alert("Please select 1 or 2 only.");
 const {error}=await sb.from("routes").insert({salesman:"Anayat Ali",route_name:g.name,route_date:dateNow(),status:"open",vehicle_expense_paid_by:"Distributor",notes:"Route sequence: "+g.cities.join(" → ")});
 if(error)return alert(error.message);await refresh();render();
};

/* Simple guided home screen and route picker */
dashboard=function(){
 const recv=balances.reduce((n,d)=>n+Math.max(0,Number(d.current_balance||0)),0);
 const pay=balances.reduce((n,d)=>n+Math.max(0,-Number(d.current_balance||0)),0);
 const rs=summary.find(x=>x.route_id===route?.id)||{};
 return '<section class="panel"><div class="toolbar"><div><h2 style="font-size:22px;margin-bottom:4px">Today at a glance</h2><div class="small">Follow the steps below to manage your ice cream deliveries.</div></div><span class="tag">'+(route?'Route in progress':'No active route')+'</span></div>'+
 '<div class="routebox"><strong>'+(route?.route_name||'Start your delivery route')+'</strong><span class="small">'+(route?'Date: '+esc(route.route_date||'')+' · Salesperson: '+esc(route.salesman||'Anayat Ali'):'Choose Route 1 or Route 2 before recording stock, sales or expenses.')+'</span></div>'+
 '<div class="grid"><div class="stat"><small>Total Dealers</small><strong>'+dealers.length+'</strong></div><div class="stat"><small>Money to Collect</small><strong>'+fmt(recv)+'</strong></div><div class="stat"><small>Money to Pay</small><strong>'+fmt(pay)+'</strong></div><div class="stat"><small>Route Sales</small><strong>'+fmt(rs.sales_total||0)+'</strong></div></div>'+
 '<h2 style="margin:20px 0 10px">What would you like to do?</h2><div class="grid">'+
 '<button class="btn" id="simpleStartRoute" style="min-height:74px" '+(route?'disabled':'')+'>① Start Route</button>'+
 '<button class="btn alt" data-go="stock" style="min-height:74px">② Add Factory Stock</button>'+
 '<button class="btn alt" data-go="sales" style="min-height:74px">③ Create Dealer Bill</button>'+
 '<button class="btn alt" data-go="expenses" style="min-height:74px">④ Add Route Expense</button>'+
 '<button class="btn alt" data-go="payments" style="min-height:74px">⑤ Receive Dealer Payment</button>'+
 '<button class="btn dark" data-go="dealers" style="min-height:74px">Open Dealer Accounts</button></div>'+
 '<section class="panel"><div class="toolbar"><h2>Route totals</h2><button class="btn alt" data-go="route">View Route Details</button></div><div class="grid"><div><small class="muted">Sales</small><strong>'+fmt(rs.sales_total||0)+'</strong></div><div><small class="muted">Expenses</small><strong>'+fmt(rs.expenses_total||0)+'</strong></div><div><small class="muted">Estimated Profit</small><strong>'+fmt(rs.net_profit||0)+'</strong></div></div></section></section>';
};
const previousSimpleBind=bindPage;
bindPage=function(){
 previousSimpleBind();
 document.querySelector('#simpleStartRoute')?.addEventListener('click',startRoute);
};
startRoute=async function(){
 openModal('Start a Delivery Route','<p class="small">Select the route you are delivering today.</p><form id="simpleRouteForm"><div class="field"><label>Delivery Route</label><select id="simpleRouteChoice" required><option value="">Choose a route</option><option value="1">Route 1 · Salam Interchange to Piplan</option><option value="2">Route 2 · Bhabra to Farooqabad</option></select></div><button class="btn" style="width:100%">Start This Route</button></form>');
 document.querySelector('#simpleRouteForm').onsubmit=async e=>{
  e.preventDefault();
  const g=GROUPS[document.querySelector('#simpleRouteChoice').value==='1'?0:1];
  const {error}=await sb.from('routes').insert({salesman:'Anayat Ali',route_name:g.name,route_date:dateNow(),status:'open',vehicle_expense_paid_by:'Distributor',notes:'Route sequence: '+g.cities.join(' → ')});
  if(error)return alert(error.message);
  document.querySelector('#modal').classList.add('hidden');await refresh();render();
 };
};

/* Guided route stock workflow: factory load -> dealer sales -> expenses -> returned stock -> carry forward */
let routeReturns=[];
const baseRefresh=refresh;
refresh=async function(){
 await baseRefresh();
 try{const {data,error}=await sb.from('route_returns').select('*').order('created_at');if(error)throw error;routeReturns=data||[];}
 catch(e){alert('Return stock could not be loaded: '+e.message);}
};
function routeStockRows(routeId){
 const rows=products.filter(p=>p.active!==false).map(p=>{
  const loaded=loads.filter(x=>x.route_id===routeId&&(x.product_id===p.id||(!x.product_id&&norm(x.product_name)===norm(p.name)))).reduce((n,x)=>n+Number(x.quantity||0),0);
  const sold=sales.filter(x=>x.route_id===routeId).flatMap(x=>x.sale_items||[]).filter(x=>x.product_id===p.id||(!x.product_id&&norm(x.product_name)===norm(p.name))).reduce((n,x)=>n+Number(x.quantity||0),0);
  const returned=routeReturns.filter(x=>x.route_id===routeId&&x.product_id===p.id).reduce((n,x)=>n+Number(x.quantity||0),0);
  return {p,loaded,sold,returned,remaining:loaded-sold-returned};
 }).filter(x=>x.loaded>0||x.sold>0||x.returned>0);
 return rows;
}
function routeStockTable(routeId){
 const rows=routeStockRows(routeId);
 if(!rows.length)return '<p class="small">No stock recorded for this route yet. Add factory stock to begin.</p>';
 return '<div class="tablewrap"><table><thead><tr><th>Ice Cream Item</th><th>Loaded</th><th>Sold</th><th>Returned</th><th>In Vehicle</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td><strong>'+esc(x.p.name)+'</strong></td><td>'+x.loaded+'</td><td>'+x.sold+'</td><td>'+x.returned+'</td><td><strong>'+x.remaining+'</strong></td></tr>').join('')+
 '</tbody></table></div>';
}
dashboard=function(){
 const recv=balances.reduce((n,d)=>n+Math.max(0,Number(d.current_balance||0)),0);
 const rs=summary.find(x=>x.route_id===route?.id)||{};
 const rows=route?.id?routeStockRows(route.id):[];
 const inVehicle=rows.reduce((n,x)=>n+x.remaining,0);
 return '<section class="panel"><div class="toolbar"><div><h2 style="font-size:22px;margin-bottom:4px">Marco Route Manager</h2><div class="small">One simple place to manage each delivery route.</div></div><span class="tag">'+(route?'Route in progress':'Ready to start')+'</span></div>'+
 '<div class="routebox"><strong>'+(route?.route_name||'No active route')+'</strong><span class="small">'+(route?'Date: '+esc(route.route_date||'')+' · '+esc(route.salesman||''):'Start a route before adding stock, sales or expenses.')+'</span></div>'+
 '<div class="grid"><div class="stat"><small>Dealers</small><strong>'+dealers.length+'</strong></div><div class="stat"><small>Dealer Receivables</small><strong>'+fmt(recv)+'</strong></div><div class="stat"><small>Route Sales</small><strong>'+fmt(rs.sales_total||0)+'</strong></div><div class="stat"><small>Stock in Vehicle</small><strong>'+inVehicle+'</strong><span class="hint">Boxes / packs / units</span></div></div>'+
 '<h2 style="margin:20px 0 10px">Route Steps</h2><div class="grid">'+
 '<button class="btn" id="simpleStartRoute" style="min-height:68px" '+(route?'disabled':'')+'>① Start Route</button>'+
 '<button class="btn alt" data-go="stock" style="min-height:68px" '+(!route?'disabled':'')+'>② Load Factory Stock</button>'+
 '<button class="btn alt" data-go="sales" style="min-height:68px" '+(!route?'disabled':'')+'>③ Dealer Sales</button>'+
 '<button class="btn alt" data-go="expenses" style="min-height:68px" '+(!route?'disabled':'')+'>④ Route Expenses</button>'+
 '<button class="btn alt" id="homeReturnStock" style="min-height:68px" '+(!route?'disabled':'')+'>⑤ Return Stock</button>'+
 '<button class="btn dark" data-go="dealers" style="min-height:68px">Dealer Accounts</button></div>'+
 '<section class="panel"><div class="toolbar"><h2>Current Route Stock</h2><button class="btn alt" data-go="route">Route Summary</button></div>'+(route?routeStockTable(route.id):'<p class="small">Your carried-forward stock will appear here after you start the next route.</p>')+'</section>'+
 '<section class="panel"><h2>Route Money Summary</h2><div class="grid"><div class="stat"><small>Sales</small><strong>'+fmt(rs.sales_total||0)+'</strong></div><div class="stat"><small>Expenses</small><strong>'+fmt(rs.expenses_total||0)+'</strong></div><div class="stat"><small>Estimated Profit</small><strong>'+fmt(rs.net_profit||0)+'</strong></div></div></section></section>';
};
routePage=function(){
 const r=route||{},s=summary.find(x=>x.route_id===r.id)||{};
 const routeCards=GROUPS.map(g=>'<div class="routebox"><strong>'+g.name+'</strong><span class="small">'+g.cities.join(' → ')+'</span></div>').join('');
 return '<section class="panel"><div class="toolbar"><h2>Route Management</h2><span class="tag">'+(r.status||'No Active Route')+'</span></div>'+
 '<div class="routebox"><strong>'+esc(r.route_name||'No route started')+'</strong><span class="small">Date: '+esc(r.route_date||'—')+' · Salesperson: '+esc(r.salesman||'Anayat Ali')+'</span></div>'+
 '<div class="actions" style="margin:14px 0"><button class="btn alt" id="routeNew" '+(r.id?'disabled':'')+'>Start New Route</button><button class="btn" id="routeReturnClose" '+(r.id?'':'disabled')+'>Record Return Stock & Close Route</button></div>'+
 '<div class="grid"><div class="stat"><small>Sales</small><strong>'+fmt(s.sales_total||0)+'</strong></div><div class="stat"><small>Expenses</small><strong>'+fmt(s.expenses_total||0)+'</strong></div><div class="stat"><small>Estimated Profit</small><strong>'+fmt(s.net_profit||0)+'</strong></div><div class="stat"><small>Stock Items</small><strong>'+routeStockRows(r.id).length+'</strong></div></div>'+
 '<h2>Item-wise Stock Account</h2>'+(r.id?routeStockTable(r.id):'<p class="small">No active route.</p>')+
 '<h2>Route Patterns</h2><div class="split">'+routeCards+'</div>'+
 '<h2>Route History</h2><div class="tablewrap"><table><thead><tr><th>Date</th><th>Route</th><th>Salesperson</th><th>Status</th></tr></thead><tbody>'+summary.map(x=>'<tr><td>'+esc(x.route_date||'')+'</td><td>'+esc(x.route_name||'')+'</td><td>'+esc(x.salesman||'')+'</td><td>'+esc(x.status||'')+'</td></tr>').join('')+'</tbody></table></div></section>';
};
stockPage=function(){
 const r=route||{};
 return '<section class="panel"><div class="toolbar"><div><h2>Load Stock from Factory</h2><span class="small">Enter only the new stock collected from the factory. Carried stock is added automatically.</span></div><button class="btn" id="addFactoryStock" '+(r.id?'':'disabled')+'>＋ Add Factory Stock</button></div>'+
 (r.id?routeStockTable(r.id):'<p class="small">Start a route first.</p>')+
 '<p class="small">Stock quantities use the same counting unit for loading, dealer sales and returns. Use boxes/packs consistently for each product.</p></section>'+
 '<section class="panel"><h2>Factory Stock History</h2><div class="tablewrap"><table><thead><tr><th>Date</th><th>Route</th><th>Product</th><th>Source</th><th>Quantity</th><th>Factory Rate</th></tr></thead><tbody>'+
 loads.slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).map(x=>'<tr><td>'+String(x.created_at||'').slice(0,10)+'</td><td>'+esc(summary.find(z=>z.route_id===x.route_id)?.route_name||'Route')+'</td><td>'+esc(x.product_name)+'</td><td>'+((x.source||'factory')==='carry_forward'?'Carried Forward':'Factory')+'</td><td>'+x.quantity+'</td><td>'+fmt(x.purchase_rate)+'</td></tr>').join('')+'</tbody></table></div></section>';
};
salesPage=function(){
 const r=route||{};
 return '<section class="panel"><div class="toolbar"><div><h2>Dealer Sales</h2><span class="small">Select a dealer, add all items delivered and enter cash received. Unpaid amount stays in the dealer account.</span></div><button class="btn" id="createRouteBill" '+(r.id?'':'disabled')+'>＋ Create Dealer Bill</button></div>'+
 '<div class="grid"><div class="stat"><small>Route Sales</small><strong>'+fmt((summary.find(x=>x.route_id===r.id)||{}).sales_total||0)+'</strong></div><div class="stat"><small>Items Sold</small><strong>'+routeStockRows(r.id).reduce((n,x)=>n+x.sold,0)+'</strong></div></div>'+
 '<div class="tablewrap"><table><thead><tr><th>Date</th><th>Dealer</th><th>Items</th><th>Quantity</th><th>Bill Total</th><th>Payment Type</th></tr></thead><tbody>'+
 sales.filter(x=>x.route_id===r.id).map(s=>'<tr><td>'+String(s.sold_at||'').slice(0,10)+'</td><td>'+esc(dealers.find(d=>d.id===s.dealer_id)?.name||'')+'</td><td>'+esc((s.sale_items||[]).map(i=>i.product_name).join(', '))+'</td><td>'+(s.sale_items||[]).reduce((n,i)=>n+Number(i.quantity||0),0)+'</td><td>'+fmt((s.sale_items||[]).reduce((n,i)=>n+Number(i.quantity||0)*Number(i.sale_rate||0),0))+'</td><td>'+esc(s.payment_type||'credit')+'</td></tr>').join('')||'<tr><td colspan="6" class="empty">No dealer sales on this route yet.</td></tr>'+
 '</tbody></table></div></section>';
};
startRoute=async function(){
 if(route?.id)return alert('A route is already active. Close it before starting another route.');
 openModal('Start Delivery Route','<p class="small">Choose the route you are taking today. Any unassigned returned stock will be loaded into this route automatically.</p><form id="simpleRouteForm"><div class="field"><label>Delivery Route</label><select id="simpleRouteChoice" required><option value="">Choose a route</option><option value="1">Route 1 · Salam Interchange to Piplan</option><option value="2">Route 2 · Bhabra to Farooqabad</option></select></div><div class="field"><label>Route Date</label><input id="simpleRouteDate" type="date" value="'+dateNow()+'" required></div><button class="btn" style="width:100%">Start This Route</button></form>');
 $('#simpleRouteForm').onsubmit=async e=>{
  e.preventDefault();
  const g=GROUPS[$('#simpleRouteChoice').value==='1'?0:1];
  const {data:id,error}=await sb.rpc('start_marco_route',{p_route_name:g.name,p_route_date:$('#simpleRouteDate').value,p_salesman:'Anayat Ali'});
  if(error)return alert('Route could not be started: '+error.message);
  $('#modal').classList.add('hidden');await refresh();render();
  const carried=loads.filter(x=>x.route_id===id&&x.source==='carry_forward').reduce((n,x)=>n+Number(x.quantity||0),0);
  if(carried)alert('Route started. '+carried+' returned stock units carried forward automatically.');
 };
};
async function saveFactoryStock(e){
 e.preventDefault();
 if(!route?.id)return alert('Start a route first.');
 const p=products.find(x=>x.id===$('#factoryProduct').value);
 const qty=Number($('#factoryQty').value),rate=Number($('#factoryRate').value);
 if(!p||!Number.isFinite(qty)||qty<=0||!Number.isFinite(rate)||rate<0)return alert('Enter a valid product, quantity and factory rate.');
 const {error}=await sb.from('route_loads').insert({route_id:route.id,product_id:p.id,product_name:p.name,quantity:qty,purchase_rate:rate,source:'factory'});
 if(error)return alert('Stock was not saved: '+error.message);
 $('#modal').classList.add('hidden');await refresh();render();
}
function openFactoryStock(){
 openModal('Add Factory Stock','<form id="factoryStockForm"><div class="field"><label>Ice Cream Item</label><select id="factoryProduct" required><option value="">Select item</option>'+products.filter(p=>p.active!==false).map(p=>'<option value="'+p.id+'">'+esc(p.name)+'</option>').join('')+'</select></div><div class="field"><label>Boxes / Packs Loaded</label><input id="factoryQty" type="number" min="0.01" step="0.01" required></div><div class="field"><label>Factory Rate per Box / Pack (PKR)</label><input id="factoryRate" type="number" min="0" step="0.01" required></div><button class="btn" style="width:100%">Save Factory Stock</button></form>');
 $('#factoryProduct').onchange=()=>{const p=products.find(x=>x.id===$('#factoryProduct').value);if(p&&p.factory_rate!=null)$('#factoryRate').value=p.factory_rate;};
 $('#factoryStockForm').onsubmit=saveFactoryStock;
}
function openRouteReturnClose(){
 if(!route?.id)return alert('Start a route first.');
 const rows=routeStockRows(route.id);
 if(!rows.length)return alert('No stock has been loaded on this route.');
 const body='<p class="small">Enter the quantity physically returned in the vehicle. The suggested quantity is loaded minus sold. All quantities must balance before the route can close.</p>'+
 '<div class="tablewrap"><table><thead><tr><th>Item</th><th>Loaded</th><th>Sold</th><th>Return Quantity</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+esc(x.p.name)+'</td><td>'+x.loaded+'</td><td>'+x.sold+'</td><td><input class="returnQty" data-product="'+x.p.id+'" type="number" min="0" step="0.01" value="'+Math.max(0,x.returned+x.remaining)+'" style="width:100px"></td></tr>').join('')+
 '</tbody></table></div><div class="field"><label>Closing Notes (optional)</label><input id="routeClosingNotes" placeholder="Any stock difference or notes"></div><button class="btn" id="saveRouteReturns" style="width:100%">Save Returns & Close Route</button>';
 openModal('Returned Stock & Route Closing',body);
 $('#saveRouteReturns').onclick=async()=>{
  const entries=[...document.querySelectorAll('.returnQty')].map(el=>({product_id:el.dataset.product,quantity:Number(el.value),row:rows.find(x=>x.p.id===el.dataset.product)}));
  if(entries.some(x=>!Number.isFinite(x.quantity)||x.quantity<0))return alert('Enter valid returned quantities.');
  const mismatch=entries.find(x=>Math.abs(x.row.loaded-x.row.sold-x.quantity)>0.000001);
  if(mismatch)return alert('Stock does not balance for '+mismatch.row.p.name+'. Loaded must equal sold + returned.');
  const routeId=route.id;
  const payload=entries.filter(x=>x.quantity>0).map(x=>({route_id:routeId,product_id:x.product_id,product_name:x.row.p.name,quantity:x.quantity,purchase_rate:Number(x.row.p.factory_rate||0)}));
  if(payload.length){const {error}=await sb.from('route_returns').upsert(payload,{onConflict:'route_id,product_id'});if(error)return alert('Return stock was not saved: '+error.message);}
  const {data:totals,error:te}=await sb.from('route_profit_summary').select('*').eq('route_id',routeId).maybeSingle();
  if(te)return alert('Could not calculate route totals: '+te.message);
  const {data:ex,error:ee}=await sb.from('route_expenses').select('amount').eq('route_id',routeId);
  if(ee)return alert('Could not load expenses: '+ee.message);
  const expenseTotal=(ex||[]).reduce((n,x)=>n+Number(x.amount||0),0);
  const salesTotal=Number(totals?.sales_total||0),costTotal=Number(totals?.cost_of_goods||0);
  const {error:ce}=await sb.from('route_closings').upsert({route_id:routeId,closing_stock_value:payload.reduce((n,x)=>n+x.quantity*x.purchase_rate,0),sales_total:salesTotal,cost_of_goods:costTotal,expenses_total:expenseTotal,gross_profit:salesTotal-costTotal,net_profit:salesTotal-costTotal-expenseTotal,notes:$('#routeClosingNotes').value||'Route stock reconciled'}, {onConflict:'route_id'});
  if(ce)return alert('Return stock saved, but closing summary failed: '+ce.message);
  const {data:updated,error:ue}=await sb.from('routes').update({status:'closed',end_date:dateNow(),closed_at:new Date().toISOString()}).eq('id',routeId).eq('status','open').select('id').maybeSingle();
  if(ue||!updated)return alert('Return stock saved, but route status was not closed. '+(ue?.message||'Refresh and check the route.'));
  $('#modal').classList.add('hidden');await refresh();render();alert('Route closed. Returned stock will automatically be available on the next route.');
 };
}
const priorBindPage=bindPage;
bindPage=function(){
 priorBindPage();
 $('#simpleStartRoute')?.addEventListener('click',startRoute);
 $('#homeReturnStock')?.addEventListener('click',openRouteReturnClose);
 $('#routeNew')?.addEventListener('click',startRoute);
 $('#routeReturnClose')?.addEventListener('click',openRouteReturnClose);
 $('#addFactoryStock')?.addEventListener('click',openFactoryStock);
 $('#createRouteBill')?.addEventListener('click',()=>{
  if(!route?.id)return alert('Start a route first.');
  openModal('Select Dealer','<form id="selectBillDealer"><div class="field"><label>Dealer</label><select id="routeBillDealer" required><option value="">Select dealer</option>'+dealers.filter(d=>d.active!==false).map(d=>'<option value="'+d.id+'">'+esc(d.name)+' · '+esc(d.city||'')+'</option>').join('')+'</select></div><button class="btn" style="width:100%">Continue to Dealer Bill</button></form>');
  $('#selectBillDealer').onsubmit=e=>{e.preventDefault();window.__marcoDealerId=$('#routeBillDealer').value;$('#modal').classList.add('hidden');openBill();};
 });
};
const previousSaveBill=saveBill;
saveBill=async function(e){
 e.preventDefault();
 if(!route?.id)return alert('Start the relevant route first.');
 const d=dealers.find(x=>x.id===window.__marcoDealerId);
 const items=[...document.querySelectorAll('.bill-line')].map(row=>({p:products.find(p=>p.id===row.querySelector('.bp').value),q:Number(row.querySelector('.bq').value),rate:Number(row.querySelector('.br').value)}));
 if(items.some(x=>!x.p||x.q<=0||!Number.isFinite(x.rate)||x.rate<0))return alert('Enter a valid item, quantity and rate.');
 const totals={};items.forEach(x=>totals[x.p.id]=(totals[x.p.id]||0)+x.q);
 for(const [pid,q] of Object.entries(totals)){
  const p=products.find(x=>x.id===pid),stock=routeStockRows(route.id).find(x=>x.p.id===pid);
  const available=stock?.remaining||0;
  if(q>available)return alert('Not enough route stock for '+p.name+'. Available: '+available+'. Please add factory stock or check returned stock.');
 }
 const total=items.reduce((n,x)=>n+x.q*x.rate,0),paid=Number($('#bpaid').value||0),type=$('#btype').value;
 if(paid<0||paid>total||(type==='cash'&&paid!==total)||(type==='credit'&&paid!==0)||(type==='partial'&&(paid<=0||paid>=total)))return alert('Enter a valid payment amount.');
 const {data:s,error}=await sb.from('sales').insert({route_id:route.id,dealer_id:d.id,payment_type:type,sold_at:new Date($('#bdate').value+'T12:00:00').toISOString(),notes:$('#bmemo').value}).select().single();
 if(error)return alert(error.message);
 const rows=items.map(x=>({sale_id:s.id,product_id:x.p.id,product_name:x.p.name,quantity:x.q,purchase_rate:Number(x.p.factory_rate||0),sale_rate:x.rate}));
 const {error:ie}=await sb.from('sale_items').insert(rows);if(ie)return alert('Bill created, but items could not be saved: '+ie.message);
 if(paid>0){const {error:pe}=await sb.from('dealer_payments').insert({dealer_id:d.id,route_id:route.id,amount:paid,method:'cash',notes:'Bill payment · '+($('#bmemo').value||s.id)});if(pe)return alert('Bill saved, but payment could not be saved: '+pe.message);}
 $('#modal').classList.add('hidden');await refresh();render();
 const message='MARCO ICE CREAM\nDealer: '+d.name+'\nDate: '+$('#bdate').value+'\nBill: '+s.id+'\n'+rows.map(x=>x.product_name+' | '+x.quantity+' x Rs '+x.sale_rate+' = Rs '+(x.quantity*x.sale_rate)).join('\n')+'\nBill total: Rs '+total+'\nReceived: Rs '+paid+'\nOutstanding: Rs '+amount(d);
 const phone=String(d.phone||'').replace(/\D/g,'');if(phone&&confirm('Bill saved. Send it via WhatsApp?'))window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(message),'_blank','noopener');
};

/* If the original login boot completed before this extension loaded, refresh once with the extended data model. */
if(currentUser)refresh().then(()=>render());
})();