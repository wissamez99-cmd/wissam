const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const startBtn = document.getElementById("startBtn");
const captureBtn = document.getElementById("captureBtn");
const report = document.getElementById("report");

let stream = null;

// 1) تشغيل الكاميرا
startBtn.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: 1280, height: 720 },
      audio: false,
    });
    video.srcObject = stream;
    captureBtn.disabled = false;
    startBtn.textContent = "✅ الكاميرا تعمل";
    startBtn.disabled = true;
  } catch (err) {
    alert("تعذّر الوصول للكاميرا: " + err.message);
  }
});

// 2) تحليل الصورة (محاكاة + تحليل إضاءة حقيقي)
captureBtn.addEventListener("click", () => {
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const analysis = analyzeImage(imageData);

  renderReport(analysis);
});

// 3) تحليل الإضاءة والتباين من البكسل (حقيقي)
function analyzeImage(imageData) {
  const data = imageData.data;
  let totalBrightness = 0;
  let pixels = 0;
  let min = 255, max = 0;

  // عيّنة كل 40 بكسل لتسريع التحليل
  for (let i = 0; i < data.length; i += 40 * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += brightness;
    min = Math.min(min, brightness);
    max = Math.max(max, brightness);
    pixels++;
  }

  const avgBrightness = totalBrightness / pixels;
  const contrast = max - min;

  // قيم محاكاة للزوايا (يمكن استبدالها بـ MediaPipe لاحقاً)
  const chairAngle = 95 + Math.random() * 25;      // زاوية الكرسي
  const screenDistance = 45 + Math.random() * 40;  // سم
  const screenHeight = 5 + Math.random() * 20;     // سم من مستوى العين

  return {
    avgBrightness,
    contrast,
    chairAngle,
    screenDistance,
    screenHeight,
  };
}

// 4) عرض التقرير
function renderReport(a) {
  const lightStatus = getLightStatus(a.avgBrightness);
  const contrastStatus = getContrastStatus(a.contrast);
  const chairStatus = getChairStatus(a.chairAngle);
  const distanceStatus = getDistanceStatus(a.screenDistance);
  const heightStatus = getHeightStatus(a.screenHeight);

  const overall = computeOverall([
    lightStatus, contrastStatus, chairStatus, distanceStatus, heightStatus
  ]);

  report.innerHTML = `
    <h2>📊 تقرير التحليل</h2>

    <div class="metric">
      <div class="label">الإضاءة العامة</div>
      <div class="value">${a.avgBrightness.toFixed(0)} / 255</div>
      <span class="badge ${lightStatus.cls}">${lightStatus.text}</span>
    </div>

    <div class="metric">
      <div class="label">التباين في الغرفة</div>
      <div class="value">${a.contrast.toFixed(0)}</div>
      <span class="badge ${contrastStatus.cls}">${contrastStatus.text}</span>
    </div>

    <div class="metric">
      <div class="label">زاوية جلوس الكرسي</div>
      <div class="value">${a.chairAngle.toFixed(0)}°</div>
      <span class="badge ${chairStatus.cls}">${chairStatus.text}</span>
    </div>

    <div class="metric">
      <div class="label">مسافة الشاشة عن العين</div>
      <div class="value">${a.screenDistance.toFixed(0)} سم</div>
      <span class="badge ${distanceStatus.cls}">${distanceStatus.text}</span>
    </div>

    <div class="metric">
      <div class="label">ارتفاع الشاشة عن مستوى العين</div>
      <div class="value">${a.screenHeight.toFixed(0)} سم</div>
      <span class="badge ${heightStatus.cls}">${heightStatus.text}</span>
    </div>

    <div class="metric" style="border-right-color:#22c55e">
      <div class="label">التقييم العام</div>
      <div class="value">${overall.score}%</div>
      <span class="badge ${overall.cls}">${overall.text}</span>
    </div>

    <div class="tips">
      <h3>💡 توصيات هندسية</h3>
      <ul>${overall.tips.map(t => `<li>• ${t}</li>`).join("")}</ul>
    </div>

    <div class="tips">
      <h3>🛒 أثاث مقترح من متاجر محلية</h3>
      <div class="product"><span>كرسي مكتبي قابل للتعديل</span><span>120 د.أ</span></div>
      <div class="product"><span>حامل شاشة قابل للضبط</span><span>45 د.أ</span></div>
      <div class="product"><span>مصباح مكتبي LED مضاد للوهج</span><span>30 د.أ</span></div>
    </div>
  `;
}

// دوال مساعدة لتصنيف الحالة
function getLightStatus(b) {
  if (b < 80)  return { cls: "bad",  text: "إضاءة ضعيفة جداً" };
  if (b < 120) return { cls: "warn", text: "إضاءة متوسطة" };
  if (b > 220) return { cls: "warn", text: "إضاءة ساطعة جداً" };
  return { cls: "good", text: "إضاءة مثالية" };
}

function getContrastStatus(c) {
  if (c > 200) return { cls: "warn", text: "تباين عالٍ (ظلال قوية)" };
  return { cls: "good", text: "تباين متوازن" };
}

function getChairStatus(angle) {
  if (angle < 95)  return { cls: "bad",  text: "ميلان خاطئ" };
  if (angle > 115) return { cls: "warn", text: "استرخاء زائد" };
  return { cls: "good", text: "زاوية صحيحة" };
}

function getDistanceStatus(d) {
  if (d < 50)  return { cls: "bad",  text: "قريبة جداً من العين" };
  if (d > 75)  return { cls: "warn", text: "بعيدة قليلاً" };
  return { cls: "good", text: "مسافة مثالية" };
}

function getHeightStatus(h) {
  if (h > 15) return { cls: "bad",  text: "أعلى من مستوى العين" };
  if (h < 2)  return { cls: "warn", text: "منخفضة قليلاً" };
  return { cls: "good", text: "ارتفاع مناسب" };
}

function computeOverall(statuses) {
  let score = 0;
  const tips = [];

  statuses.forEach(s => {
    if (s.cls === "good") score += 20;
    else if (s.cls === "warn") { score += 12; tips.push(s.text + " — يحتاج تحسين"); }
    else { score += 5; tips.push("⚠ " + s.text + " — أولوية عالية"); }
  });

  if (tips.length === 0) tips.push("بيئة عملك ممتازة، حافظ عليها ✨");

  let cls = "good", text = "ممتاز";
  if (score < 60) { cls = "bad";  text = "يحتاج تحسين عاجل"; }
  else if (score < 85) { cls = "warn"; text = "جيد مع ملاحظات"; }

  return { score, cls, text, tips };
}
