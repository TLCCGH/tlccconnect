/* ================================
 SUPABASE CONFIG
================================ */
const SUPABASE_URL = 'https://qoaruwyvvjmsxbnhgbns.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LdiYXDLNwWqNt90rXEu-kw_2A2sif9X';
const TABLE_NAME = 'Contact';
const MENS_TABLE = 'Mens_Fellowship';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ================================
 GLOBAL STATE
================================ */
let currentUser = null;
let allContacts = [];
let currentFilter = 'All';
let isMensFellowshipView = false;
let pendingCalledId = null;
let pendingCalledStatus = null;
let currentRelative = { name: '', phone: '' };
let currentTableMode = 'general';

/* ================================
 THEME MANAGEMENT
================================ */
function initTheme() {
const savedTheme = localStorage.getItem('theme') || 'light';
 document.body.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
const currentTheme = document.body.getAttribute('data-theme');
const newTheme = currentTheme === 'light' ? 'dark' : 'light';
 document.body.setAttribute('data-theme', newTheme);
 localStorage.setItem('theme', newTheme);
}

initTheme();

/* ================================
 AUTH STATE
================================ */
(async () => {
const { data: { session } } = await supabaseClient.auth.getSession();
if (session) {
 currentUser = session.user;
showMainApp();
 }
})();

supabaseClient.auth.onAuthStateChange((event, session) => {
if (event === 'SIGNED_IN') {
 currentUser = session.user;
showMainApp();
 }
if (event === 'SIGNED_OUT') {
 currentUser = null;
showAuthScreen();
 }
});

/* ================================
 AUTH UI & LOGIN
================================ */
function showMainApp() {
 document.getElementById('authContainer').style.display = 'none';
 document.getElementById('mainApp').style.display = 'block';
loadContacts();
}

function showAuthScreen() {
 document.getElementById('authContainer').style.display = 'flex';
 document.getElementById('mainApp').style.display = 'none';
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
 e.preventDefault();
const email = document.getElementById('loginEmail').value;
const password = document.getElementById('loginPassword').value;
const loginBtn = document.getElementById('loginBtn');

 loginBtn.disabled = true;
 loginBtn.textContent = 'Logging in...';

const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

if (error) {
showAuthError(error.message);
showMessage('❌ ' + error.message, 'error');
 }

 loginBtn.disabled = false;
 loginBtn.textContent = 'Login';
});

async function logout() {
await supabaseClient.auth.signOut();
showMessage('👋 Logged out', 'success');
}

function showAuthError(message) {
const errorDiv = document.getElementById('authError');
 errorDiv.textContent = message;
 errorDiv.classList.add('show');
setTimeout(() => errorDiv.classList.remove('show'), 5000);
}

/* ================================
 NAVIGATION
================================ */
function switchPage(page) {
 document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
 document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

if (page === 'add') {
 document.getElementById('addPage').classList.add('active');
 document.querySelectorAll('.nav-item')[0].classList.add('active');
 } else {
 document.getElementById('viewPage').classList.add('active');
 document.querySelectorAll('.nav-item')[1].classList.add('active');

if (isMensFellowshipView) {
loadMensFellowship();
 } else {
loadContacts();
 }
 }
}

/* ================================
 PHONE FORMATTING
================================ */
function formatPhoneNumber(input) {
let value = input.value.replace(/\D/g, '');
 input.value = value;
}

document.getElementById('phone').addEventListener('input', function() {
formatPhoneNumber(this);
});

document.getElementById('altPhone').addEventListener('input', function() {
formatPhoneNumber(this);
});

document.getElementById('mensPersonalContact').addEventListener('input', function() {
formatPhoneNumber(this);
});

document.getElementById('mensAltContact').addEventListener('input', function() {
formatPhoneNumber(this);
});

/* ================================
 TABLE SWITCHING
================================ */
function switchTable(table) {
 currentTableMode = table;
 
 document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
 event.target.classList.add('active');
 
 if (table === 'general') {
 document.getElementById('generalFields').style.display = 'block';
 document.getElementById('mensFields').style.display = 'none';
 
 document.getElementById('firstName').required = true;
 document.getElementById('lastName').required = true;
 document.getElementById('phone').required = true;
 document.getElementById('status').required = true;
 
 document.getElementById('mensFirstName').required = false;
 document.getElementById('mensLastName').required = false;
 document.getElementById('mensPersonalContact').required = false;
 } else {
 document.getElementById('generalFields').style.display = 'none';
 document.getElementById('mensFields').style.display = 'block';
 
 document.getElementById('firstName').required = false;
 document.getElementById('lastName').required = false;
 document.getElementById('phone').required = false;
 document.getElementById('status').required = false;
 
 document.getElementById('mensFirstName').required = true;
 document.getElementById('mensLastName').required = true;
 document.getElementById('mensPersonalContact').required = true;
 }
 
 document.getElementById('contactForm').reset();
}

/* ================================
 ADD CONTACT
================================ */
document.getElementById('contactForm').addEventListener('submit', async (e) => {
 e.preventDefault();

const submitBtn = document.getElementById('submitBtn');
 submitBtn.disabled = true;
 submitBtn.textContent = 'Saving...';

 if (currentTableMode === 'general') {
 const contactData = {
 'First Name': document.getElementById('firstName').value,
 'Last Name': document.getElementById('lastName').value,
 'Other names': document.getElementById('otherNames').value || null,
 'Phone': document.getElementById('phone').value,
 'Alt Phone': document.getElementById('altPhone').value || null,
 'Email': document.getElementById('email').value || null,
 'Status': document.getElementById('status').value,
 'Age group': document.getElementById('ageGroup').value || null,
 'Gender': document.getElementById('gender').value || null,
 'Marital Status': document.getElementById('maritalStatus').value || null,
 'date added': new Date().toISOString(),
 'Added By': currentUser.email,
 'Called': false,
 'Date Called': null,
 'Called By': null
 };

 const { error } = await supabaseClient
 .from(TABLE_NAME)
 .insert([contactData]);

 if (error) {
 console.error('Error adding contact:', error);
 showMessage('❌ ' + error.message, 'error');
 } else {
 showMessage('✅ Contact saved!');
 e.target.reset();
 }
 } else {
 const mensData = {
 'FIRST NAME': document.getElementById('mensFirstName').value,
 'OTHER NAME': document.getElementById('mensOtherName').value || null,
 'LAST NAME': document.getElementById('mensLastName').value,
 'ALIAS': document.getElementById('mensAlias').value || null,
 'MARITAL STATUS': document.getElementById('mensMaritalStatus').value || null,
 'AREA OF RESIDENCE': document.getElementById('mensAreaOfResidence').value || null,
 'OCCUPATION': document.getElementById('mensOccupation').value || null,
 'FRIENDS OR RELATIVES IN TLCC CONTACT': document.getElementById('mensRelatives').value || null,
 'FRIENDS OR RELATIVES IN TLCC CONTACT ALT': document.getElementById('mensRelativesAlt').value || null,
 'PERSONAL CONTACT': document.getElementById('mensPersonalContact').value,
 'ALT CONTACT': document.getElementById('mensAltContact').value || null,
 'EMAIL': document.getElementById('mensEmail').value || null,
 'date added': new Date().toISOString(),
 'Added By': currentUser.email,
 'Called': false,
 'Date Called': null,
 'Called By': null
 };

 const { error } = await supabaseClient
 .from(MENS_TABLE)
 .insert([mensData]);

 if (error) {
 console.error('Error adding Men\'s Fellowship member:', error);
 showMessage('❌ ' + error.message, 'error');
 } else {
 showMessage('✅ Men\'s Fellowship member saved!');
 e.target.reset();
 }
 }

 submitBtn.disabled = false;
 submitBtn.textContent = 'Add Contact';
});

/* ================================
 DATA LOADING
================================ */
async function loadContacts() {
const list = document.getElementById('contactsList');
 list.innerHTML = '<div class="loading">Loading contacts...</div>';

const { data, error } = await supabaseClient
.from(TABLE_NAME)
.select('*')
.order('date added', { ascending: false });

if (error) {
 console.error('Error loading contacts:', error);
 list.innerHTML = '<div class="empty-state">❌ Error loading contacts</div>';
return;
 }

 allContacts = data || [];
 isMensFellowshipView = false;
applyFilters();
}

async function loadMensFellowship() {
const list = document.getElementById('contactsList');
 list.innerHTML = "<div class='loading'>Loading Men's Fellowship...</div>";
 console.log('Loading Men\'s Fellowship from table:', MENS_TABLE);

const { data, error } = await supabaseClient
.from(MENS_TABLE)
.select('*');

if (error) {
 console.error("Men's Fellowship Fetch Error:", error);
 list.innerHTML = "<div class='empty-state'>❌ Error loading Men's Fellowship<br>Check console for details</div>";
return;
 }

 console.log('Men\'s Fellowship data loaded:', data);
 allContacts = data || [];
 isMensFellowshipView = true;
applyFilters();
}

/* ================================
 FILTERING & SEARCH
================================ */
function toggleFilterMenu() {
 document.getElementById('filterMenu').classList.toggle('show');
}

document.addEventListener('click', function(event) {
const filterMenu = document.getElementById('filterMenu');
const filterBtn = document.querySelector('.filter-icon-btn');

if (filterMenu && filterMenu.classList.contains('show') &&
!filterMenu.contains(event.target) &&
 filterBtn && !filterBtn.contains(event.target)) {
 filterMenu.classList.remove('show');
 }
});

document.getElementById('filterMenu').addEventListener('click', e => {
 e.stopPropagation();
});

document.querySelectorAll('input[name="statusFilter"]').forEach(radio => {
 radio.addEventListener('change', function(e) {
 e.stopPropagation();
 currentFilter = this.value;
 console.log('Filter changed to:', this.value);

if (this.value === "Men's Fellowship") {
 isMensFellowshipView = true;
loadMensFellowship();
 } else {
 isMensFellowshipView = false;
loadContacts();
 }

setTimeout(() => {
 document.getElementById('filterMenu').classList.remove('show');
 }, 150);
 });

 radio.addEventListener('touchend', function(e) {
 e.stopPropagation();
 e.preventDefault();

if (!this.checked) {
this.checked = true;
this.dispatchEvent(new Event('change', { bubbles: true }));
 }
 }, { passive: false });
});

function applyFilters() {
let filtered = allContacts;
const searchInput = document.getElementById('searchInput');
const term = searchInput ? searchInput.value.toLowerCase() : '';

 console.log('Applying filters. isMensFellowshipView:', isMensFellowshipView, 'Total contacts:', allContacts.length);

if (term) {
 filtered = filtered.filter(c => {
if (isMensFellowshipView) {
const fName = c['FIRST NAME'] || '';
const lName = c['LAST NAME'] || '';
const alias = c['ALIAS'] || '';
return `${fName} ${lName} ${alias}`.toLowerCase().includes(term);
 } else {
const fName = c['First Name'] || '';
const lName = c['Last Name'] || '';
return `${fName} ${lName}`.toLowerCase().includes(term);
 }
 });
 }

if (!isMensFellowshipView && currentFilter !== 'All' && currentFilter !== "Men's Fellowship") {
 filtered = filtered.filter(c => c['Status'] === currentFilter);
 }

updateContactCount(filtered.length);

if (isMensFellowshipView) {
 console.log('Displaying Men\'s Fellowship:', filtered.length, 'members');
displayMensFellowship(filtered);
 } else {
 console.log('Displaying Contacts:', filtered.length, 'contacts');
displayContacts(filtered);
 }
}

document.getElementById('searchInput').addEventListener('input', applyFilters);

/* ================================
 DISPLAY CONTACTS (TABLE 1)
================================ */
function displayContacts(contacts) {
const list = document.getElementById('contactsList');

if (!contacts.length) {
 list.innerHTML = '<div class="empty-state">📭 No contacts found</div>';
return;
 }

 list.innerHTML = contacts.map(c => {
const contactData = encodeURIComponent(JSON.stringify(c));
const ageGroupDisplay = getAgeGroupDisplay(c['Age group']);
const hasMultiplePhones = c['Phone'] && c['Alt Phone'];

return `
 <div class="contact-card ${isNewContact(c['date added']) ? 'has-new-badge' : ''}">
${isNewContact(c['date added']) ? '<div class="new-badge">New</div>' : ''}
 <div class="contact-header">
 <div class="contact-name">${c['First Name'] || ''} ${c['Last Name'] || ''}</div>
 <div class="contact-status">${c['Status'] || ''}</div>
 </div>
 <div class="contact-info">
 <div class="info-item">📞 ${c['Phone'] || 'N/A'}${c['Alt Phone'] ? ` / ${c['Alt Phone']}` : ''}</div>
${c['Email'] ? `<div class="info-item">📧 ${c['Email']}</div>` : ''}
${ageGroupDisplay ? `<div class="info-item">👤 ${ageGroupDisplay}</div>` : ''}
 </div>
 <div class="contact-actions">
${hasMultiplePhones 
  ? `<button class="action-btn call-btn" onclick="showPhoneMenu(event, '${c['Phone']}', '${c['Alt Phone'] || ''}', 'call')">📞 Call</button>`
  : `<button class="action-btn call-btn" onclick="makeCall('${c['Phone'] || ''}')">📞 Call</button>`
}
${c['Phone'] 
  ? hasMultiplePhones
    ? `<button class="action-btn whatsapp-btn" onclick="showPhoneMenu(event, '${c['Phone']}', '${c['Alt Phone']}', 'whatsapp', '${escapeHtml(c['First Name'])}')">💬 WhatsApp</button>`
    : `<button class="action-btn whatsapp-btn" onclick="openWhatsApp('${contactData}')">💬 WhatsApp</button>`
  : ''
}
 <button class="action-btn mark-called-btn ${c['Called'] ? 'called' : ''}" onclick="handleCalledClick(${c.id}, ${c['Called']})">
${c['Called'] ? '✓ Called' : 'Mark'}
 </button>
 </div>
 </div>`;
 }).join('');
}

/* ================================
 DISPLAY MEN'S FELLOWSHIP (TABLE 2)
================================ */
function displayMensFellowship(members) {
const list = document.getElementById('contactsList');
 console.log('displayMensFellowship called with', members.length, 'members');

if (!members.length) {
 list.innerHTML = '<div class="empty-state">📭 No Men\'s Fellowship members found</div>';
return;
 }

 list.innerHTML = members.map(m => {
const memberId = m.id || m.ID || m.Id || m._id;
 console.log('Member ID found:', memberId, 'from member:', m);

const firstName = m['FIRST NAME'] || '';
const lastName = m['LAST NAME'] || '';
const alias = m['ALIAS'] || '';
const maritalStatus = m['MARITAL STATUS'] || '';
const occupation = m['OCCUPATION'] || '';
const personalContact = m['PERSONAL CONTACT'] || 'N/A';
const altContact = m['ALT CONTACT'] || '';
const email = m['EMAIL'] || '';
const dateAdded = m['date added'] || m['Date Added'] || m['DATE ADDED'];

const relativesStr = m['FRIENDS OR RELATIVES IN TLCC CONTACT'] || '';
const relativesAltStr = m['FRIENDS OR RELATIVES IN TLCC CONTACT ALT'] || '';
const relatives = parseRelatives(relativesStr);
const relativesAlt = parseRelatives(relativesAltStr);
const allRelatives = [...relatives, ...relativesAlt];

const displayName = alias ? `${firstName} ${lastName} <span style="color: #2595e8; font-weight: 500;">(${alias})</span>` : `${firstName} ${lastName}`;
const statusInfo = [maritalStatus, occupation].filter(Boolean).join(' • ');
const hasMultiplePhones = personalContact !== 'N/A' && altContact;

return `
 <div class="contact-card ${isNewContact(dateAdded) ? 'has-new-badge' : ''}">
${isNewContact(dateAdded) ? '<div class="new-badge">New</div>' : ''}
 <div class="contact-header">
 <div class="contact-name">${displayName}</div>
 <div class="contact-status">Men's Fellowship</div>
 </div>
 <div class="contact-info">
${statusInfo ? `<div class="info-item">ℹ️ ${statusInfo}</div>` : ''}
${allRelatives.length > 0 ? `
 <div class="info-item">
 👥 Relatives: ${allRelatives.map(r =>
`<span class="relative-chip" onclick="showRelativePopover('${escapeHtml(r.name)}', '${r.phone}')">${escapeHtml(r.name)}</span>`
 ).join('')}
 </div>
 ` : ''}
 <div class="info-item">📞 ${personalContact}${altContact ? ` / ${altContact}` : ''}</div>
${email ? `<div class="info-item">📧 ${email}</div>` : ''}
 </div>
 <div class="contact-actions">
${hasMultiplePhones
  ? `<button class="action-btn call-btn" onclick="showPhoneMenu(event, '${personalContact}', '${altContact}', 'call')">📞 Call</button>`
  : `<button class="action-btn call-btn" onclick="makeCall('${personalContact}')">📞 Call</button>`
}
${personalContact !== 'N/A' 
  ? hasMultiplePhones
    ? `<button class="action-btn whatsapp-btn" onclick="showPhoneMenu(event, '${personalContact}', '${altContact}', 'whatsapp', '${escapeHtml(firstName)}')">💬 WhatsApp</button>`
    : `<button class="action-btn whatsapp-btn" onclick="openWhatsAppSimple('${personalContact}', '${escapeHtml(firstName)}')">💬 WhatsApp</button>`
  : ''
}
 <button class="action-btn mark-called-btn ${m['Called'] ? 'called' : ''}" onclick="handleMensCalledClick('${memberId}', ${m['Called'] || false})">
${m['Called'] ? '✓ Called' : 'Mark'}
 </button>
 </div>
 </div>`;
 }).join('');
}

/* ================================
 PARSE RELATIVES DATA
================================ */
function parseRelatives(relativesString) {
if (!relativesString) return [];
const parts = relativesString.split(',').map(s => s.trim());
const relatives = [];

 parts.forEach(part => {
const match = part.match(/(\d+)\s*-\s*(.+)/);
if (match) {
 relatives.push({
phone: match[1].trim(),
name: match[2].trim()
 });
 }
 });

return relatives;
}

/* ================================
 RELATIVE POPOVER
================================ */
function showRelativePopover(name, phone) {
 currentRelative = { name, phone };
 document.getElementById('relativeName').textContent = name;
 document.getElementById('relativePhone').textContent = phone;
 document.getElementById('relativePopover').classList.add('show');
}

function closeRelativePopover() {
const popover = document.getElementById('relativePopover');
if (popover) {
 popover.classList.remove('show');
 }
 currentRelative = { name: '', phone: '' };
}

function callRelative() {
if (currentRelative.phone) {
 window.location.href = `tel:${currentRelative.phone}`;
 }
closeRelativePopover();
}

function whatsappRelative() {
if (currentRelative.phone) {
const formattedPhone = formatPhoneForWhatsApp(currentRelative.phone);
const message = encodeURIComponent(`Hello, ${currentRelative.name}`);
 window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
 }
closeRelativePopover();
}

document.addEventListener('click', function(event) {
const popover = document.getElementById('relativePopover');
if (popover && popover.classList.contains('show') && event.target === popover) {
closeRelativePopover();
 }
});

/* ================================
 ACTIONS & HELPERS
================================ */
function getAgeGroupDisplay(ageGroup) {
if (!ageGroup) return '';

const ageRanges = {
 'Youth': '0-17',
 'Young Adult': '18-35',
 'Adult': '36-55',
 'Senior': '56+'
};

return ageRanges[ageGroup] || ageGroup;
}

function makeCall(phone) {
if (phone && phone !== 'N/A') window.location.href = `tel:${phone}`;
}

function showPhoneMenu(event, phone1, phone2, action, firstName = '') {
 event.stopPropagation();
 
const menu = document.getElementById('phoneMenu');
const menuContent = document.getElementById('phoneMenuContent');
 
let html = '<h4>Select Phone Number</h4><div class="phone-options">';
 
if (action === 'call') {
 html += `
 <button class="phone-option" onclick="makeCall('${phone1}'); closePhoneMenu();">
 <span class="phone-label">Primary</span>
 <span class="phone-number">${phone1}</span>
 </button>`;
 
if (phone2) {
 html += `
 <button class="phone-option" onclick="makeCall('${phone2}'); closePhoneMenu();">
 <span class="phone-label">Alternative</span>
 <span class="phone-number">${phone2}</span>
 </button>`;
 }
 } else if (action === 'whatsapp') {
const formattedPhone1 = formatPhoneForWhatsApp(phone1);
const formattedPhone2 = phone2 ? formatPhoneForWhatsApp(phone2) : '';
const message = encodeURIComponent(`Hello${firstName ? ', ' + firstName : ''}`);
 
 html += `
 <button class="phone-option" onclick="window.open('https://wa.me/${formattedPhone1}?text=${message}', '_blank'); closePhoneMenu();">
 <span class="phone-label">Primary</span>
 <span class="phone-number">${phone1}</span>
 </button>`;
 
if (phone2) {
 html += `
 <button class="phone-option" onclick="window.open('https://wa.me/${formattedPhone2}?text=${message}', '_blank'); closePhoneMenu();">
 <span class="phone-label">Alternative</span>
 <span class="phone-number">${phone2}</span>
 </button>`;
 }
 }
 
 html += '</div>';
 menuContent.innerHTML = html;
 menu.classList.add('show');
}

function closePhoneMenu() {
const menu = document.getElementById('phoneMenu');
if (menu) {
 menu.classList.remove('show');
 }
}

function openWhatsApp(contactData) {
const contact = JSON.parse(decodeURIComponent(contactData));
const phone = contact['Phone'];

if (phone && phone !== 'N/A') {
const formattedPhone = formatPhoneForWhatsApp(phone);
const greeting = getWhatsAppGreeting(contact);
 window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(greeting)}`, '_blank');
 }
}

function openWhatsAppSimple(phone, firstName) {
if (phone && phone !== 'N/A') {
const formattedPhone = formatPhoneForWhatsApp(phone);
const message = encodeURIComponent(`Hello, ${firstName}`);
 window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
 }
}

function getWhatsAppGreeting(contact) {
const firstName = contact['First Name'] || '';
const lastName = contact['Last Name'] || '';
const age = contact['Age group'] || '';
const gender = contact['Gender'] || '';
const marital = contact['Marital Status'] || '';

if (age === 'Adult' || age === 'Senior') {
if (gender === 'Male') return `Hello, Mr ${lastName}`;
if (gender === 'Female') {
return marital === 'Married' ? `Hello, Mrs ${lastName}` :
 marital === 'Single' ? `Hello, Miss ${firstName}` : `Hello, Madam ${firstName}`;
 }
 }

return `Hello, ${firstName}`;
}

function formatPhoneForWhatsApp(phone) {
let cleaned = phone.replace(/\D/g, '');
return cleaned.startsWith('0') ? '233' + cleaned.substring(1) : cleaned;
}

function escapeHtml(text) {
const div = document.createElement('div');
 div.textContent = text;
return div.innerHTML;
}

/* ================================
 CALLED STATUS HANDLING
================================ */
function handleCalledClick(id, currentStatus) {
if (currentStatus) {
 pendingCalledId = id;
 pendingCalledStatus = currentStatus;
 document.getElementById('calledMenu').classList.add('show');
 } else {
toggleCalled(id, currentStatus);
 }
}

function handleMensCalledClick(id, currentStatus) {
 console.log('handleMensCalledClick called:', { id, currentStatus });

if (currentStatus) {
 pendingCalledId = id;
 pendingCalledStatus = currentStatus;
 document.getElementById('calledMenu').classList.add('show');
 } else {
toggleMensCalled(id, currentStatus);
 }
}

async function toggleCalled(id, status) {
const newStatus = !status;

const { error } = await supabaseClient.from(TABLE_NAME).update({
'Called': newStatus,
'Date Called': newStatus ? new Date().toISOString() : null,
'Called By': newStatus ? currentUser.email : null
 }).eq('id', id);

if (error) {
 console.error('Error updating called status:', error);
showMessage('❌ Error updating status: ' + error.message, 'error');
 } else {
showMessage(newStatus ? '✅ Marked as called' : '✅ Called status removed');
loadContacts();
 }
}

async function toggleMensCalled(id, status) {
const newStatus = !status;
 console.log('toggleMensCalled - Input params:', { id, status, newStatus });

if (!id || id === 'undefined') {
 console.error('Invalid ID provided to toggleMensCalled:', id);
showMessage('❌ Error: Cannot update - invalid member ID', 'error');
return;
 }

const updateData = {
'Called': newStatus,
'Date Called': newStatus ? new Date().toISOString() : null,
'Called By': newStatus ? currentUser.email : null
 };

 console.log('toggleMensCalled - Updating:', { table: MENS_TABLE, id, newStatus, updateData });

const possibleIdColumns = ['id', 'ID', 'Id', '_id'];
let updateResult = null;
let lastError = null;

for (const idColumn of possibleIdColumns) {
try {
const { data, error } = await supabaseClient
.from(MENS_TABLE)
.update(updateData)
.eq(idColumn, id)
.select();

if (!error) {
 updateResult = data;
 console.log(`Update successful using ID column "${idColumn}":`, data);
break;
 } else {
 lastError = error;
 console.log(`Tried "${idColumn}" column, got error:`, error.message);
 }
 } catch (e) {
 console.log(`Exception with "${idColumn}":`, e);
 lastError = e;
 }
 }

if (updateResult) {
showMessage(newStatus ? '✅ Marked as called' : '✅ Called status removed');
loadMensFellowship();
 } else {
 console.error('All ID column attempts failed. Last error:', lastError);
showMessage('❌ Error: ' + (lastError?.message || 'Could not find ID column'), 'error');
 }
}

function closeCalledMenu() {
 document.getElementById('calledMenu').classList.remove('show');
 pendingCalledId = null;
 pendingCalledStatus = null;
}

function confirmRemoveCalled() {
if (pendingCalledId) {
if (isMensFellowshipView) {
toggleMensCalled(pendingCalledId, true);
 } else {
toggleCalled(pendingCalledId, true);
 }
 }
closeCalledMenu();
}

/* ================================
 HELPER FUNCTIONS
================================ */
function isNewContact(dateAdded) {
if (!dateAdded) return false;

const today = new Date();
const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const sixDaysAgo = new Date(todayDate);
 sixDaysAgo.setDate(todayDate.getDate() - 6);

const contactDate = new Date(dateAdded);
const contactDateOnly = new Date(contactDate.getFullYear(), contactDate.getMonth(), contactDate.getDate());

return contactDateOnly >= sixDaysAgo;
}

function updateContactCount(count) {
const countText = document.getElementById('countText');
if (countText) {
 countText.textContent = `${count} Contact${count !== 1 ? 's' : ''}`;
 }
}

function showMessage(text, type = 'success') {
const msg = document.getElementById('message');
 msg.textContent = text;
 msg.className = `message show ${type}`;
setTimeout(() => msg.classList.remove('show'), 3000);
}

/* ================================
 GLOBAL SCOPE EXPORTS
================================ */
window.makeCall = makeCall;
window.openWhatsApp = openWhatsApp;
window.openWhatsAppSimple = openWhatsAppSimple;
window.handleCalledClick = handleCalledClick;
window.handleMensCalledClick = handleMensCalledClick;
window.confirmRemoveCalled = confirmRemoveCalled;
window.closeCalledMenu = closeCalledMenu;
window.showRelativePopover = showRelativePopover;
window.closeRelativePopover = closeRelativePopover;
window.callRelative = callRelative;
window.whatsappRelative = whatsappRelative;
window.toggleFilterMenu = toggleFilterMenu;
window.switchPage = switchPage;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.switchTable = switchTable;
window.showPhoneMenu = showPhoneMenu;
window.closePhoneMenu = closePhoneMenu;
window.getAgeGroupDisplay = getAgeGroupDisplay;
