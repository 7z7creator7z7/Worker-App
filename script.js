const tg = window.Telegram.WebApp;

tg.expand();

const STORAGE_KEY = "workerMiniApp";

let db = JSON.parse(localStorage.getItem(STORAGE_KEY));

if(!db){

    db={

        balance:0,

        totalSpent:0,

        totalWorkedDays:0,

        carryDays:0,

        withdraws:[],

        weeks:[]

    };

}

/* ================= MIGRATION ================= */

db.weeks.forEach(week=>{

    if(!week.days) return;

    // Eski format bo'lsa
    if(typeof week.days[0]==="number"){

        week.days=week.days.map(v=>({

            checked:v,

            used:false

        }));

    }

});

saveDB();

function saveDB(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
}

const userPhoto=document.getElementById("user-photo");
const userName=document.getElementById("user-name");
const userId=document.getElementById("user-id");

const balance=document.getElementById("balance");
const spentMoney=document.getElementById("spentMoney");
const workedDays=document.getElementById("workedDays");
const totalSpent=document.getElementById("totalSpent");

const withdrawModal=document.getElementById("withdrawModal");
const withdrawButton=document.getElementById("withdrawButton");
const closeWithdraw=document.getElementById("closeWithdraw");
const saveWithdraw=document.getElementById("saveWithdraw");

const imageInput=document.getElementById("imageInput");
const itemName=document.getElementById("itemName");
const itemPrice=document.getElementById("itemPrice");

const historyList=document.getElementById("historyList");

function formatMoney(value){

    return Number(value).toLocaleString("uz-UZ")+" so'm";

}

function loadTelegram(){

    if(tg.initDataUnsafe.user){

        const u=tg.initDataUnsafe.user;

        userName.textContent=u.first_name+(u.last_name?" "+u.last_name:"");

        userId.textContent="ID : "+u.id;

        if(u.photo_url){

            userPhoto.src=u.photo_url;

        }

    }

}

function updateStats(){

    balance.textContent=formatMoney(db.balance);

    spentMoney.textContent=formatMoney(db.totalSpent);

    workedDays.textContent=db.totalWorkedDays;

    totalSpent.textContent="Jami : "+formatMoney(db.totalSpent);

}

withdrawButton.onclick=()=>{

    withdrawModal.classList.remove("hidden");

};

closeWithdraw.onclick=()=>{

    withdrawModal.classList.add("hidden");

};

loadTelegram();
updateStats();
// ================= HISTORY =================

function renderHistory(){

    historyList.innerHTML="";

    if(db.withdraws.length===0){

        historyList.innerHTML=`
        <div class="history-empty">
            Hozircha ma'lumot yo'q
        </div>
        `;

        return;

    }

    db.withdraws.forEach(item=>{

        historyList.innerHTML+=`

        <div class="history-item">

            <img src="${item.image}">

            <div class="history-name">

                ${item.name}

                <br>

                <small>${item.date}</small>

            </div>

            <div class="history-price">

                ${formatMoney(item.price)}

            </div>

        </div>

        `;

    });

}

// ================= IMAGE TO BASE64 =================

function imageToBase64(file){

    return new Promise(resolve=>{

        const reader=new FileReader();

        reader.onload=e=>resolve(e.target.result);

        reader.readAsDataURL(file);

    });

}

// ================= SAVE WITHDRAW =================
saveWithdraw.onclick = async () => {

    const file = imageInput.files[0];
    const name = itemName.value.trim();
    const price = Number(itemPrice.value);

    // ================= VALIDATION =================
    if (!file) {
        topShowPopup("❌ Rasm tanlang", "error");
        return;
    }

    if (!name) {
        topShowPopup("❌ Nom kiriting", "error");
        return;
    }

    if (!price || price <= 0) {
        topShowPopup("❌ Narx kiriting", "error");
        return;
    }

    // ================= BALANCE CHECK =================
    if (db.balance < price) {
        topShowPopup("❌ Mablag yetarli emas", "error");
        return;
    }

    try {

        const image = await imageToBase64(file);

        // ================= SAVE DATA =================
        db.withdraws.unshift({
            image: image,
            name: name,
            price: price,
            date: new Date().toLocaleDateString("uz-UZ")
        });

        // balance kamaytirish
        db.balance -= price;

        db.totalSpent += price;

        saveDB();
        updateStats();
        renderHistory();

        // ================= RESET INPUTS =================
        imageInput.value = "";
        itemName.value = "";
        itemPrice.value = "";

        withdrawModal.classList.add("hidden");

        topShowPopup("✅ Muvaffaqiyatli yechildi", "success");

    } catch (err) {
        console.log(err);
        topShowPopup("❌ Xatolik yuz berdi", "error");
    }
};

renderHistory();
// ================= WEEK SYSTEM =================

const weekTitle = document.getElementById("weekTitle");

const prevWeek = document.getElementById("prevWeek");
const nextWeek = document.getElementById("nextWeek");

const checkboxes = [
    document.getElementById("monday"),
    document.getElementById("tuesday"),
    document.getElementById("wednesday"),
    document.getElementById("thursday"),
    document.getElementById("friday"),
    document.getElementById("saturday"),
    document.getElementById("sunday")
];

function getWeekKey(){

    const now = new Date();

    const year = now.getFullYear();

    const start = new Date(year,0,1);

    const diff = Math.floor((now-start)/86400000);

    const week = Math.ceil((diff+start.getDay()+1)/7);

    return year+"-W"+week;

}

function createWeek(){

    const key = getWeekKey();

    let week = db.weeks.find(w=>w.key===key);

    if(!week){

        db.weeks.push({

            key:key,

            locked:false,

days:[
{checked:0,used:false},
{checked:0,used:false},
{checked:0,used:false},
{checked:0,used:false},
{checked:0,used:false},
{checked:0,used:false},
{checked:0,used:false}
]

        });

        saveDB();

        week=db.weeks[db.weeks.length-1];

    }

    return week;

}

let currentWeekIndex=0;

function renderWeek(){

    const week=db.weeks[currentWeekIndex];

    if(!week) return;

    weekTitle.textContent=week.key;

    checkboxes.forEach((box,index)=>{

const day = week.days[index];

box.checked = day.checked;

box.disabled = week.locked;

box.parentElement.classList.remove("used-day");

if(day.used){

    box.parentElement.classList.add("used-day");

}

    });

}

checkboxes.forEach((box,index)=>{

    box.onchange=()=>{

        const week=db.weeks[currentWeekIndex];

        if(week.locked) return;

week.days[index].checked = box.checked;

        saveDB();

    };

});


createWeek();

currentWeekIndex=db.weeks.length-1;

renderWeek();
// ================= MONDAY 00:00 CHECK =================

function checkNewWeek(){

    const currentKey = getWeekKey();

    const lastWeek = db.weeks[db.weeks.length - 1];

    if(lastWeek.key !== currentKey){

        // Eski haftani LOCK qilish
        lastWeek.locked = true;

// ================= BONUS SYSTEM =================

// Shu haftada nechta belgilangan kun
const worked = lastWeek.days.filter(d => d.checked).length;

db.totalWorkedDays += worked;

// carryDays yangilash
db.carryDays += worked;

// Bonus berish
calculateBonus();

        // Yangi hafta yaratish
        db.weeks.push({

            key:currentKey,

            locked:false,

days:[
{checked:0,used:false},
{checked:0,used:false},
{checked:0,used:false},
{checked:0,used:false},
{checked:0,used:false},
{checked:0,used:false},
{checked:0,used:false}
]

        });

        saveDB();

    }

}

checkNewWeek();

// ================= AUTO SAVE =================

function saveWeek(){

    const week = db.weeks[currentWeekIndex];

    if(!week) return;

    checkboxes.forEach((box,index)=>{

week.days[index].checked = box.checked;

    });

    saveDB();

    updateStats();

}

checkboxes.forEach(box=>{

    box.addEventListener("change",saveWeek);

});

// ================= START =================

renderHistory();

updateStats();

renderWeek();

console.log("✅ Worker Mini App ishga tushdi.");
// ================= WEEK NAVIGATION =================

function refreshWeekButtons(){

    prevWeek.disabled = currentWeekIndex === 0;

    nextWeek.disabled = currentWeekIndex === db.weeks.length - 1;

}

function openWeek(index){

    if(index < 0 || index >= db.weeks.length) return;

    currentWeekIndex = index;

    const week = db.weeks[currentWeekIndex];

    weekTitle.textContent = week.key;

    checkboxes.forEach((box,i)=>{

const day = week.days[i];

box.checked = day.checked;

box.disabled = week.locked;

box.parentElement.classList.remove("used-day");

if(day.used){

    box.parentElement.classList.add("used-day");

}

    });

    refreshWeekButtons();

}

prevWeek.onclick = ()=>{

    if(currentWeekIndex>0){

        openWeek(currentWeekIndex-1);

    }

};

nextWeek.onclick = ()=>{

    if(currentWeekIndex<db.weeks.length-1){

        openWeek(currentWeekIndex+1);

    }

};

openWeek(db.weeks.length-1);

// ================= WEEK INFO =================

function getWorkedCount(days){

    return days.reduce((a,b)=>a+b,0);

}

function printWeekInfo(){

    const week=db.weeks[currentWeekIndex];

    console.log(

        "Hafta:",

        week.key,

        "| Kelgan:",

        getWorkedCount(week.days),

        "| Locked:",

        week.locked

    );

}

printWeekInfo();
let popupTimer;
function calculateBonus(){

    let available=[];

    db.weeks.forEach(week=>{

        week.days.forEach(day=>{

            if(day.checked && !day.used){

                available.push(day);

            }

        });

    });

    while(available.length>=7){

        db.balance+=100000;

        for(let i=0;i<7;i++){

            available[i].used=true;

        }

        available.splice(0,7);

    }

    saveDB();

}
function topShowPopup(message,type="success"){

    const popup=document.querySelector("#top-popup");

    if(!popup){
        console.log("Popup topilmadi");
        return;
    }

    popup.textContent=message;

    popup.classList.remove("success","error","warning","show");

    popup.classList.add(type);

    void popup.offsetWidth;

    popup.classList.add("show");

    clearTimeout(popupTimer);

    popupTimer=setTimeout(()=>{
        popup.classList.remove("show");
    },5000);

}
const user = Telegram.WebApp.initDataUnsafe.user;
const name = user?.first_name || "USER";

setTimeout(() => {
    topShowPopup(`👋 Hush kelibsiz, ${name}`, "success");
}, 1000);
document.addEventListener("DOMContentLoaded", function () {

    const helpBtn = document.getElementById("helpBtn");
    const helpModal = document.getElementById("helpModal");
    const closeHelp = document.getElementById("closeHelp");

    if (!helpBtn || !helpModal || !closeHelp) {
        console.log("Help element topilmadi");
        return;
    }

    helpBtn.onclick = () => {
        helpModal.classList.remove("help-hidden");
    };

    closeHelp.onclick = () => {
        helpModal.classList.add("help-hidden");
    };

    helpModal.onclick = (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add("help-hidden");
        }
    };

});
