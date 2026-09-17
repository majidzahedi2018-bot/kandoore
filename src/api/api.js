// src/api/api.js
import { compressImage } from '../utils/imageCompressor';
export const API_BASE = 'https://kandoore.ir/api';
// ─── امنیت مرحله ۲: ارسال خودکار هدر توکن در همهٔ درخواست‌ها ───
const authHeaders = () => {
  try {
    const t = localStorage.getItem('kandooreh_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
};
const fetchWithAuth = (url, options = {}) =>
fetch(url, { ...options, headers: { ...(options.headers || {}), ...authHeaders() } });
// سرویس جلسه کاربر (توکن)
export const authApi = {
logout: async () => {
try {
const res = await fetchWithAuth(`${API_BASE}/auth.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'logout' }),
});
return await res.json();
} catch (e) { return { success: false }; }
},
};

/**
 * آپلود فایل تصویر روی هاست
 * @param {File|string} fileData - فایل انتخاب شده یا رشته base64
 * @param {string} type - نوع عکس (designs | stories | avatars | orders | reviews)
 * @param {number} userId - شناسه کاربر/خیاط
 */
export const uploadImage = async (fileData, type = 'designs', userId = 2) => {
try {
// ─── فشرده‌سازی هوشمند قبل از آپلود (حجم ↓ ~۹۰٪، بدون افت کیفیت محسوس) ───
let payload = fileData;
if (typeof fileData !== 'string') {
payload = await compressImage(fileData, type);
}
const formData = new FormData();
formData.append('type', type);
formData.append('user_id', userId);
if (typeof payload === 'string') {
formData.append('image_base64', payload);
} else {
formData.append('image', payload);
}
const res = await fetchWithAuth(`${API_BASE}/upload.php`, {
method: 'POST',
body: formData,
});
return await res.json();
} catch (error) {
console.error('خطا در آپلود عکس:', error);
return { success: false, message: 'خطا در ارتباط با سرور آپلود' };
}
};

/**
 * سرویس‌های مربوط به نمونه‌کارها (Designs)
 */
export const designsApi = {
  // دریافت طرح‌ها با پشتیبانی از تمام فیلترها و جستجوی پیشرفته
  getAll: async (category = '', tailorUserId = null, filters = {}) => {
    let url = `${API_BASE}/designs.php`;
    const params = [];
    if (tailorUserId) params.push(`tailor_user_id=${tailorUserId}`);
    if (category && category !== 'همه') params.push(`category=${encodeURIComponent(category)}`);
    if (filters.searchQuery) params.push(`search=${encodeURIComponent(filters.searchQuery)}`);
    if (filters.selectedCity) params.push(`city=${encodeURIComponent(filters.selectedCity)}`);
    if (filters.selectedStitch) params.push(`stitch=${encodeURIComponent(filters.selectedStitch)}`);
if (filters.garmentType) params.push(`garment_type=${encodeURIComponent(filters.garmentType)}`);
    if (filters.showAll) params.push(`show_all=1`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const res = await fetchWithAuth(url);
    return await res.json();
  },
  // ثبت نمونه‌کار جدید خیاط در دیتابیس
  create: async (designData) => {
    const res = await fetchWithAuth(`${API_BASE}/designs.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(designData),
    });
    return await res.json();
  },
  // حذف نمونه‌کار توسط خیاط
  delete: async (designId, userId) => {
    const res = await fetchWithAuth(`${API_BASE}/designs.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: designId, user_id: userId }),
    });
    return await res.json();
  },
  // ویرایش مشخصات نمونه‌کار توسط خیاط صاحب اثر
  update: async (designData) => {
    const res = await fetchWithAuth(`${API_BASE}/designs.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', ...designData }),
    });
    return await res.json();
  },
  // فعال/غیرفعال کردن واقعی نمونه‌کار در کاتالوگ عمومی
  toggleActive: async (designId, userId, isActive) => {
    const res = await fetchWithAuth(`${API_BASE}/designs.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_active', id: designId, user_id: userId, is_active: isActive ? 1 : 0 }),
    });
    return await res.json();
  },
};

/**
 * سرویس‌های مربوط به استوری‌های ۲۴ ساعته (Stories)
 */
export const storiesApi = {
  // دریافت استوری‌های معتبر روز
  getLiveStories: async () => {
    const res = await fetchWithAuth(`${API_BASE}/stories.php`);
    return await res.json();
  },

  // انتشار استوری جدید خیاط در هاست
  create: async (storyData) => {
    const res = await fetchWithAuth(`${API_BASE}/stories.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storyData),
    });
    return await res.json();
  },

  // حذف استوری توسط خیاط
  delete: async (storyId, userId) => {
    const res = await fetchWithAuth(`${API_BASE}/stories.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', story_id: storyId, user_id: userId }),
    });
    return await res.json();
  },
};

/**
 * سرویس‌های مربوط به سفارش‌ها (Orders)
 */
export const ordersApi = {
  // دریافت خلاصه واقعی کیف پول و بیعانه‌های امانی
  getWalletSummary: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/orders.php?action=wallet_summary&user_id=${userId}`);
    return await res.json();
  },

  // دریافت سفارش‌های خیاط یا مشتری
  getOrders: async (userId, isTailor = false) => {
    const param = isTailor ? `tailor_user_id=${userId}` : `user_id=${userId}`;
    const res = await fetchWithAuth(`${API_BASE}/orders.php?${param}`);
    return await res.json();
  },

  // تغییر مرحله دوخت توسط خیاط (۱ تا ۴)
  updateStep: async (orderId, nextStep, tailorUserId) => {
    const res = await fetchWithAuth(`${API_BASE}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_step', order_id: orderId, step: nextStep }),
    });
    return await res.json();
  },

 // ثبت سفارش جدید مشتری در دیتابیس MySQL
  createOrder: async (orderPayload) => {
    const res = await fetchWithAuth(`${API_BASE}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    return await res.json();
  },

    // پذیرش سفارش توسط خیاط (مرحله ۱ → ۲)
  approveOrder: async (orderId, tailorUserId) => {
    const res = await fetchWithAuth(`${API_BASE}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve_order', order_id: orderId, tailor_user_id: tailorUserId }),
    });
    return await res.json();
  },
  // رد سفارش توسط خیاط (مرحله ۱ → ۶)
  rejectOrder: async (orderId, tailorUserId, reason = '') => {
    const res = await fetchWithAuth(`${API_BASE}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject_order', order_id: orderId, tailor_user_id: tailorUserId, reason }),
    });
    return await res.json();
  },
  // پرداخت بیعانه توسط مشتری (مرحله ۲ → ۳)
  payDeposit: async (orderId, userId) => {
    const res = await fetchWithAuth(`${API_BASE}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pay_deposit', order_id: orderId, user_id: userId }),
    });
    return await res.json();
  },
    approveOrder: async (orderId, tailorUserId) => {
    const res = await fetchWithAuth(`${API_BASE}/orders.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve_order', order_id: orderId, tailor_user_id: tailorUserId }) });
    return await res.json();
  },
  rejectOrder: async (orderId, tailorUserId, reason = '') => {
    const res = await fetchWithAuth(`${API_BASE}/orders.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject_order', order_id: orderId, tailor_user_id: tailorUserId, reason }) });
    return await res.json();
  },
  payDeposit: async (orderId, userId) => {
    const res = await fetchWithAuth(`${API_BASE}/orders.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pay_deposit', order_id: orderId, user_id: userId }) });
    return await res.json();
  },
  // تأیید کد تحویل محرمانه مشتری توسط خیاط
  verifyDeliveryCode: async (orderId, code, tailorUserId) => {
    const res = await fetchWithAuth(`${API_BASE}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_delivery_code', order_id: orderId, code, tailor_user_id: tailorUserId }),
    });
    return await res.json();
  },
};

/**
 * سرویس‌های مربوط به داشبورد و پروفایل خیاط (Tailor)
 */
export const tailorApi = {
  // دریافت ۳ خیاط برتر بر اساس بیشترین سفارشات واقعی
  getTopTailors: async () => {
    const res = await fetchWithAuth(`${API_BASE}/tailor.php?action=top_tailors`);
    return await res.json();
  },

  // دریافت لیست تمام خیاطان فعال برای انتخاب در سفارش
  getAllTailors: async () => {
    const res = await fetchWithAuth(`${API_BASE}/tailor.php?action=list`);
    return await res.json();
  },

  // دریافت اطلاعات کامل پروفایل خیاط (آدرس، تخصص‌ها، ریتینگ و...)
  getFullProfile: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/tailor.php?user_id=${userId}`);
    return await res.json();
  },

  // دریافت اطلاعات پروفایل و آمار زنده داشبورد خیاط
  getDashboardData: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/tailor.php?user_id=${userId}`);
    return await res.json();
  },

  // تغییر وضعیت آنلاین / آماده پذیرش سفارش
  toggleAcceptingOrders: async (userId, isAccepting) => {
    const res = await fetchWithAuth(`${API_BASE}/tailor.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_accepting', user_id: userId, is_accepting: isAccepting ? 1 : 0 }),
    });
    return await res.json();
  },

  // ذخیره اطلاعات شماره شبا و حساب بانکی
  updateBankInfo: async (userId, shabaNumber, bankName) => {
    const res = await fetchWithAuth(`${API_BASE}/tailor.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_bank', user_id: userId, shaba_number: shabaNumber, bank_name: bankName }),
    });
    return await res.json();
  },

    // ذخیره کامل مشخصات، آدرس، تخصص‌ها و شماره شبای کارگاه خیاط
  updateFullProfile: async (profilePayload) => {
    const res = await fetchWithAuth(`${API_BASE}/tailor.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_profile', ...profilePayload }),
    });
    return await res.json();
  },
  // دریافت خلاصه تسویه، موجودی قابل تسویه واقعی و تاریخچه تراکنش‌ها
  getPayoutSummary: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/tailor.php?action=payout_summary&user_id=${userId}`);
    return await res.json();
  },
    // ثبت درخواست تسویه در جدول payout_requests
  requestPayout: async (userId, amount) => {
    const res = await fetchWithAuth(`${API_BASE}/tailor.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_payout', user_id: userId, amount }),
    });
    return await res.json();
  },
  // ثبت ماندگار تکمیل اونبردینگ (کارت راه‌اندازی فقط یک‌بار نمایش داده می‌شود)
  markOnboardingDone: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/tailor.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_onboarding_done', user_id: userId }),
    });
    return await res.json();
  },
};

/**
 * سرویس‌های دفترچه اندازه‌گیری مشتری (Measurements)
 */
export const measurementsApi = {
  // دریافت همه پروفایل‌های اندازه کاربر از دیتابیس
  getByUser: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/measurements.php?user_id=${userId}`);
    return await res.json();
  },

  // ایجاد پروفایل اندازه جدید (با فیلدهای دلخواه)
createProfile: async (userId, name, fields = []) => {
const res = await fetchWithAuth(`${API_BASE}/measurements.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'create', user_id: userId, name, fields }),
});
return await res.json();
},
// حذف پروفایل سفارشی
deleteProfile: async (profileId, userId) => {
const res = await fetchWithAuth(`${API_BASE}/measurements.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'delete', id: profileId, user_id: userId }),
});
return await res.json();
},

  // ذخیره و به‌روزرسانی مقادیر اندازه در دیتابیس
save: async (measurementData) => {
const res = await fetchWithAuth(`${API_BASE}/measurements.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'save', ...measurementData }),
});
return await res.json();
},
// تب‌های لباس سفارشی (قالب + مقادیر شخص)
getCustomGarments: async (userId, profileId) => {
const res = await fetchWithAuth(`${API_BASE}/measurements.php?action=custom_garments&user_id=${userId}&profile_id=${profileId || 0}`);
return await res.json();
},
createGarment: async (payload) => {
const res = await fetchWithAuth(`${API_BASE}/measurements.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'create_garment', ...payload }),
});
return await res.json();
},
saveGarment: async (payload) => {
const res = await fetchWithAuth(`${API_BASE}/measurements.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'save_garment', ...payload }),
});
return await res.json();
},
deleteGarment: async (garmentId, userId) => {
const res = await fetchWithAuth(`${API_BASE}/measurements.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'delete_garment', garment_id: garmentId, user_id: userId }),
});
return await res.json();
},
};

/**
 * سرویس‌های گفت‌وگو و چت زنده سفارش (Chat)
 */
export const chatApi = {
// دریافت افزایشی پیام‌ها + حضور طرف مقابل + آواتارها
getMessages: async (orderId, afterId = 0, peerId = 0) => {
const res = await fetchWithAuth(`${API_BASE}/chat.php?order_id=${encodeURIComponent(orderId)}&after_id=${afterId}&peer_id=${peerId}`);
return await res.json();
},
// ارسال پیام متنی یا تصویری
sendMessage: async (payload) => {
const res = await fetchWithAuth(`${API_BASE}/chat.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(payload),
});
return await res.json();
},
  // ضربان قلب: ثبت حضور کاربر (هر ۳۰ ثانیه) — فقط وقتی اپ در پیش‌زمینه است
  heartbeat: async (userId, active = true) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/chat.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat', user_id: userId, active }),
      });
      return await res.json();
    } catch (e) { return { success: false }; }
  },
  // ثبت خروج/پس‌زمینه: کاربر همان لحظه «آفلاین» می‌شود (keepalive تا بستن اپ هم ثبت شود)
  goOffline: async (userId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/chat.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'go_offline', user_id: userId }),
        keepalive: true,
      });
      return await res.json();
    } catch (e) { return { success: false }; }
  },
// وضعیت حضور یک کاربر (آنلاین / آخرین بازدید)
getPresence: async (userId) => {
const res = await fetchWithAuth(`${API_BASE}/chat.php?action=presence&user_id=${userId}`);
return await res.json();
},
// تعداد پیام‌های نخوانده per سفارش (برای بج)
getUnreadCounts: async (userId) => {
const res = await fetchWithAuth(`${API_BASE}/chat.php?action=unread_counts&user_id=${userId}`);
return await res.json();
},
// علامت‌گذاری پیام‌های طرف به‌عنوان خوانده‌شده (دو تیک)
markRead: async (orderId, viewerId) => {
try {
const res = await fetchWithAuth(`${API_BASE}/chat.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'mark_read', order_id: orderId, viewer_id: viewerId }),
});
return await res.json();
} catch (e) { return { success: false }; }
},
// حذف پیام (برای من / برای همه)
deleteMessage: async (messageId, mode = 'me', viewerRole = 'customer', viewerId = 0) => {
try {
const res = await fetchWithAuth(`${API_BASE}/chat.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'delete', message_id: messageId, mode, viewer_role: viewerRole, viewer_id: viewerId }),
});
return await res.json();
} catch (e) { return { success: false }; }
},
// لیست گفتگوهای پیش از سفارش برای صندوق خیاط
preorderThreads: async (userId) => {
const res = await fetchWithAuth(`${API_BASE}/chat.php?action=preorder_threads&user_id=${userId}`);
return await res.json();
},
// ساخت کلید یکتای گفتگوی پیش از سفارش بین یک مشتری و یک خیاط
preorderThreadKey: (customerId, tailorId) => {
const c = Math.max(1, parseInt(customerId, 10) || 0);
const t = Math.max(1, parseInt(tailorId, 10) || 0);
return (c * 1000000000 + t).toString();
},
};

/**
 * سرویس‌های نظرات و امتیازدهی (Reviews)
 */
export const reviewsApi = {
  submitReview: async (reviewPayload) => {
    const res = await fetchWithAuth(`${API_BASE}/reviews.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload),
    });
    return await res.json();
  },
  // دریافت نظرات مشتریان یک خیاط (برای نمایش روی صفحه طرح، شبیه کامنت)
  getByTailor: async (tailorUserId) => {
    const res = await fetchWithAuth(`${API_BASE}/reviews.php?tailor_user_id=${tailorUserId}`);
    return await res.json();
  },
  // دریافت نظراتِ فقط یک طرح مشخص (نظرات دیگر طرح‌ها نمایش داده نمی‌شود)
  getByDesign: async (designId, designTitle) => {
    const res = await fetchWithAuth(`${API_BASE}/reviews.php?design_id=${designId}&design_title=${encodeURIComponent(designTitle || '')}`);
    return await res.json();
  },
};

/**
 * سرویس‌های مدیریت آدرس‌های تحویل (Addresses)
 */
export const addressesApi = {
  getByUser: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/addresses.php?user_id=${userId}`);
    return await res.json();
  },
  create: async (addressData) => {
    const res = await fetchWithAuth(`${API_BASE}/addresses.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...addressData }),
    });
    return await res.json();
  },
  delete: async (addressId, userId) => {
    const res = await fetchWithAuth(`${API_BASE}/addresses.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: addressId, user_id: userId }),
    });
    return await res.json();
  },
};

/**
 * سرویس‌های تیکت و پشتیبانی (Support)
 */
export const supportApi = {
  // ۱. دریافت لیست تیکت‌های کاربر
  getUserTickets: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/support.php?user_id=${userId}`);
    return await res.json();
  },
  // ۲. دریافت چت کامل یک تیکت (تاریخچه پیام‌ها)
  getTicketThread: async (ticketId) => {
    const res = await fetchWithAuth(`${API_BASE}/support.php?ticket_id=${ticketId}`);
    return await res.json();
  },
  // ۳. ثبت تیکت کاملاً جدید
  createTicket: async (payload) => {
    const res = await fetchWithAuth(`${API_BASE}/support.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_ticket', ...payload }),
    });
    return await res.json();
  },
  // ۴. ارسال پیام جدید در داخل تیکت (چت رفت‌وبرگشتی)
  sendMessage: async (payload) => {
    const res = await fetchWithAuth(`${API_BASE}/support.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_message', ...payload }),
    });
    return await res.json();
  },
  // ۵. بستن تیکت
  closeTicket: async (ticketId, userId = 0) => {
    const res = await fetchWithAuth(`${API_BASE}/support.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close_ticket', ticket_id: ticketId, user_id: userId }),
    });
    return await res.json();
  },
};

/**
 * سرویس‌های اعلانات واقعی سیستم (Notifications)
 */
export const notificationsApi = {
  getByUser: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/notifications.php?user_id=${userId}`);
    return await res.json();
  },
  getUnreadCount: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/notifications.php?action=unread_count&user_id=${userId}`);
    return await res.json();
  },
  getNewSince: async (userId, afterId) => {
    const res = await fetchWithAuth(`${API_BASE}/notifications.php?user_id=${userId}&after_id=${afterId}`);
    return await res.json();
  },
  // علامت‌گذاری یک اعلان مشخص به عنوان خوانده‌شده (حل باگ عدم تغییر وضعیت)
  markRead: async (notifId, userId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/notifications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id: notifId, user_id: userId }),
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },
  // خواندن همه اعلانات
  markAllAsRead: async (userId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/notifications.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read', user_id: userId }),
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },
};

/**
 * سرویس‌های پنل مدیریت (Admin API)
 */
export const adminApi = {
  login: async (username, password) => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password }),
    });
    return await res.json();
  },
  getStats: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php?action=stats`);
    return await res.json();
  },
  getAllOrders: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php?action=all_orders`);
    return await res.json();
  },
  getAllTailors: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php?action=all_tailors`);
    return await res.json();
  },
  getPayoutRequests: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php?action=payout_requests`);
    return await res.json();
  },
  updatePayoutStatus: async (payoutId, status, trackingCode = '') => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_payout_status', payout_id: payoutId, status, tracking_code: trackingCode }),
    });
    return await res.json();
  },
  toggleTailorVerification: async (userId, isVerified) => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_tailor_verification', user_id: userId, is_verified: isVerified ? 1 : 0 }),
    });
    return await res.json();
  },
  getTailorDesigns: async (tailorUserId) => {
    const res = await fetchWithAuth(`${API_BASE}/designs.php?tailor_user_id=${tailorUserId}`);
    return await res.json();
  },
  getAllCustomers: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php?action=all_customers`);
    return await res.json();
  },
  getTransactions: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php?action=transactions`);
    return await res.json();
  },
  updateDesign: async (designData) => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_design', ...designData }),
    });
    return await res.json();
  },
  createAdminDesign: async (designPayload) => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_admin_design', ...designPayload }),
    });
    return await res.json();
  },
  getSupportTickets: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php?action=support_tickets`);
    return await res.json();
  },
  // نقشهٔ زندهٔ حضور کاربران (آنلاین/آفلاین) — فقط با نشست معتبر ادمین
  getPresenceMap: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php?action=presence_map`);
    return await res.json();
  },
  // گزارش فعالیت ورود/خروج یک کاربر (تحلیل ادمین)
  getUserActivity: async (userId) => {
    const res = await fetchWithAuth(`${API_BASE}/admin.php?action=user_activity&user_id=${userId}`);
    return await res.json();
  },
  replyTicket: async (ticketId, adminReply, status = 'answered', adminName = 'مدیر سیستم') => {
const res = await fetchWithAuth(`${API_BASE}/admin.php`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ action: 'reply_ticket', ticket_id: ticketId, admin_reply: adminReply, status, admin_name: adminName }),
});
return await res.json();
},
// نقشهٔ زندهٔ حضور + لیست کاربران برای تب «کاربران آنلاین»
getPresenceMap: async () => {
const res = await fetchWithAuth(`${API_BASE}/admin.php?action=presence_map`);
return await res.json();
},
// گزارش فعالیت ورود/خروج یک کاربر
getUserActivity: async (userId) => {
const res = await fetchWithAuth(`${API_BASE}/admin.php?action=user_activity&user_id=${userId}`);
return await res.json();
},
};


/**
سرویس به‌روزرسانی آواتار و اطلاعات کاربر
*/
export const userApi = {
  updateAvatar: async (userId, avatarUrl) => {
    const res = await fetchWithAuth(`${API_BASE}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_avatar', user_id: userId, avatar_url: avatarUrl }),
    });
    return await res.json();
  },
};