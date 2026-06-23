// SELA F&B / Operation Contract template (mirrors "2026 F&B Operation
// Contract v1"). buildOperationContract fills the template from the DF data
// and returns the Arabic body (faithful to the source document) plus an
// English rendering used for the PDF.

import type { DFRequest } from "./types";

const BLANK = "____________";

function dateOnly(iso?: string): string {
  return iso ? iso.slice(0, 10) : BLANK;
}

function durationText(req: DFRequest): string {
  const d = req.df;
  if (!d) return BLANK;
  const parts: string[] = [];
  if (d.durationYears) parts.push(`${d.durationYears} سنة`);
  if (d.durationMonths) parts.push(`${d.durationMonths} شهر`);
  if (d.durationDays) parts.push(`${d.durationDays} يوم`);
  return parts.length ? parts.join(" ") : BLANK;
}

function durationTextEn(req: DFRequest): string {
  const d = req.df;
  if (!d) return BLANK;
  const parts: string[] = [];
  if (d.durationYears) parts.push(`${d.durationYears} year(s)`);
  if (d.durationMonths) parts.push(`${d.durationMonths} month(s)`);
  if (d.durationDays) parts.push(`${d.durationDays} day(s)`);
  return parts.length ? parts.join(" ") : BLANK;
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildOperationContract(req: DFRequest): {
  title: string;
  bodyEn: string;
  bodyAr: string;
  bodyHtml: string;
} {
  const d = req.df ?? {};
  const operator = d.legalName || req.counterparty || BLANK;
  const address = d.address || BLANK;
  const projectName = d.projectName || BLANK;
  const event = d.commercialBrand || d.businessUnit || projectName;
  const location = d.location || BLANK;
  const brand = d.commercialBrand || BLANK;
  const activity = d.contractNature || BLANK;
  const start = dateOnly(d.startDate);
  const end = dateOnly(d.endDate);
  const value = req.estimatedValue ?? d.totalValueExVat;
  const valueAr = value
    ? `مبلغ ثابت وقدره ${value.toLocaleString()} ${req.currency}`
    : BLANK;
  const valueEn = value
    ? `A fixed amount of ${value.toLocaleString()} ${req.currency}`
    : BLANK;
  const signatory = d.authorizedSignatory || BLANK;
  const repName = d.projectManager || BLANK;
  const repEmail = d.projectManagerEmail || BLANK;
  const repPhone = d.projectManagerPhone || BLANK;

  // The Scope of Work (the request's description) drives the contract content.
  const scopeParas = (req.description || "")
    .split(/\r?\n\s*\r?\n|\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const scopeAr = scopeParas.length ? scopeParas.join("\n") : BLANK;
  const scopeHtml = scopeParas.length
    ? scopeParas.map((p) => `<p>${esc(p)}</p>`).join("\n")
    : `<p>${BLANK}</p>`;

  const title = `عقد تشغيل — ${projectName} — ${operator}`;

  const bodyAr = `عقد تشغيل

شركة صلة؛ شركة مساهمة مقفلة سعودية، بسجل تجاري رقم (4030163376)، وعنوان مقرها الرئيسي: ص.ب. 40388، جدة 21499، المملكة العربية السعودية؛ ويشار إليها فيما بعد بـ("الطرف الأول").
${operator}، مسجلة بموجب سجل تجاري رقم (${BLANK}) وعنوانها ${address}، المملكة العربية السعودية؛ ويُشار إليها فيما بعد بــ ("الطرف الثاني / المشغل").

تمهيد
حيث تلاقت رغبة الطرفان في قيام الطرف الثاني بتشغيل مساحة محددة لأغراض تجارية وخدمية للفعالية التي يديرها الطرف الأول ورغبةً من الطرفان في توثيق الحقوق والإلتزامات بينهما، وتحديد الشروط والمواصفات اللازمة لإتمام الأعمال الواردة بهذا العقد، أبرم الطرفان هذا العقد وهما بكامل الأهلية الشرعية والنظامية، واتفقا على الآتي:

نطاق العمل
${scopeAr}

القسم الأول: المعلومات العامة للموقع والمشروع
اسم المشروع: ${projectName}
الفعالية: ${event}
موقع المشروع: ${location}
العلامة التجارية: ${brand}
النشاط التجاري: ${activity}
المدة: ${durationText(req)}
تاريخ بداية المدة: ${start}
تاريخ نهاية المدة: ${end}
المقابل المالي (غير شامل لضريبة القيمة المضافة): ${valueAr}
آلية الدفع: يتم الوفاء بالمقابل المالي فور توقيع العقد من الطرف الثاني، ولا يتم تسليم الموقع إلا بعد استيفاء قيمة المقابل المالي وتسليم العقد موقعاً من الطرف الثاني. ويتم السداد على الحساب البنكي المعتمد للطرف الأول.
حساب الطرف الأول: اسم المستفيد: شركة صلة، مصرف الراجحي (آيبان رقم: ${BLANK}).
ممثل الطرف الأول: قسم تأجير مساحات الفعاليات — البريد الإلكتروني: EventLeasing@sela.sa
ممثل الطرف الثاني: ${repName} — البريد الإلكتروني: ${repEmail} — رقم الجوال: ${repPhone}

التوقيع:
وافق عليه ووقع: شركة صلة ("الطرف الأول") — الاسم: عدنان كيال — الصفة: المفوض بالتوقيع — التاريخ: ${BLANK}
وافق عليه ووقع: ${operator} ("الطرف الثاني/المشغل") — الاسم: ${signatory} — الصفة: ${BLANK} — التاريخ: ${BLANK}

القسم الثاني: الشروط والأحكام

1. مدة العقد
يبدأ العمل بهذا العقد فور توقيعه ويظل سارياً طوال مدته حسب ما نصت عليه أحكام المعلومات العامة، ويجوز للطرف الأول تمديد مدة العقد بإخطار الطرف الثاني.
يجوز للطرف الأول إنهاء العقد فوراً بإخطار خطي في حال ارتكب الطرف الثاني إخلالاً جوهرياً، كما يجوز له الإنهاء بإرادته المنفردة بإخطار كتابي لا تقل مدته عن خمسة (5) أيام لأي سبب، مع احتفاظه بحقه في المطالبة بأي مستحقات متبقية.
يلتزم الطرف الثاني بإخلاء الموقع بعد انتهاء العقد بنفس الحالة الجيدة وخلال مدة لا تتجاوز يومين (2)، ويكون مسؤولاً عن قيمة أي أضرار.
ترتبط مدة هذا العقد بفترة الفعالية التي تقررها الجهات المعنية؛ وفي حال إيقاف أو إلغاء الفعالية تنتهي مدة العقد فوراً.

2. أحكام المقابل المالي وآلية الدفع
يلتزم الطرف الثاني بالوفاء بالمقابل المالي المحدد بموجب مطالبة أو فاتورة ضريبية، يتم سدادها مقدماً وخلال مدة لا تتجاوز خمسة (5) أيام من تاريخ المطالبة على حساب الطرف الأول.
في حال تضمن المقابل المالي نسبة مشاركة من المبيعات، يلتزم الطرف الثاني بتزويد الطرف الأول بتقرير مبيعات يومي وتسوية الفروقات بفاتورة ضريبية تُسدد خلال عشرة (10) أيام.
يلتزم الطرف الثاني بتجهيز الموقع بنظام متكامل لتسجيل عمليات البيع (نقدياً وإلكترونياً) وتمكين الطرف الأول من الاطلاع المباشر عليه.

3. الأحكام الخاصة — التزامات الطرف الأول
تمكين المشغل من استلام الموقع، وتوفير مياه الشرب والكهرباء خلال أوقات العمل المتفق عليها، مع حق الطرف الأول في التعاقد مع أطراف آخرين لخدمات مماثلة.

4. الأحكام الخاصة — التزامات الطرف الثاني (المشغل)
ممارسة النشاط التجاري المتفق عليه طوال مدة الفعالية وفقاً للسجل التجاري.
اتخاذ كافة إجراءات الأمن والسلامة والصحة العامة وتحمل كافة المسؤوليات والتعويضات الناشئة عن أي أضرار أو حوادث.
توفير بوليصة تأمين شاملة ضد المخاطر العامة تشمل التسمم الغذائي بحد أدنى (1) مليون ريال، وتأمين شامل للمساحة بحد أدنى (5) مليون ريال يكون الطرف الأول مؤمناً له إضافياً فيها، وتأمين ضد الحريق حتى (5) مليون ريال.
ضمان توفر جميع التراخيص والتصاريح المطلوبة، والالتزام بالاشتراطات الصحية والبلدية ومعايير سلامة الأغذية، وتقديم لوائح المنتجات والأسعار للطرف الأول خلال (3) أيام للموافقة.

5. الأحكام العامة
يلتزم الطرفان بحسن النية، ويتحمل الطرف الثاني مسؤولية عامليه. يقر الطرف الثاني بالالتزام بجدول المخالفات والجزاءات المالية (القسم الثالث).
لا يُسأل الطرف الأول عن أحوال القوة القاهرة، مع التزام الطرف المتأثر بالإخطار خلال (3) أيام.
يتعهد الطرف الثاني بالحفاظ على سرية المعلومات لمدة خمس (5) سنوات، ويعوّض الطرف الأول عن أي خسائر أو مطالبات.
يمثل هذا العقد وملحقاته الاتفاق الكامل بين الطرفين. يخضع العقد لأنظمة المملكة العربية السعودية، وتختص محاكم مدينة جدة بأي نزاع يتعذّر حله ودياً خلال ثلاثين (30) يوماً.

القسم الثالث: جدول مخالفات المشغلين (ملخص)
مخالفات أوقات/أحكام التشغيل، والنظافة والصحة العامة، والمخالفات العامة: جزاءات متدرجة (إنذار كتابي، ألف ريال، خمسة آلاف ريال، عشرة آلاف ريال) بحسب تكرار المخالفة. في حال كون المخالفة جوهرية أو تكرارها أكثر من (4) مرات يُفسخ العقد فوراً. جميع الجزاءات غير شاملة لضريبة القيمة المضافة.

— تم إنشاء هذه المسودة بواسطة محرك الذكاء الاصطناعي لإدارة العقود في سيلا، وهي بانتظار المراجعة والاعتماد والتوقيع.`;

  const bodyEn = `OPERATION CONTRACT — ${projectName} — ${operator}

Sela Company, a Saudi Closed Joint Stock Company, Commercial Registration No. (4030163376), principal office: P.O. Box 40388, Jeddah 21499, Kingdom of Saudi Arabia ("First Party").
${operator}, Commercial Registration No. (${BLANK}), address: ${address}, Kingdom of Saudi Arabia ("Second Party / Operator").

PREAMBLE
Whereas the parties wish for the Second Party to operate a designated space for commercial and service purposes within the event managed by the First Party, the parties have entered into this Contract and agreed as follows:

SCOPE OF WORK
${scopeParas.length ? scopeParas.join("\n") : BLANK}

SECTION 1 — GENERAL SITE & PROJECT INFORMATION
Project Name: ${projectName}
Event: ${event}
Project Location: ${location}
Commercial Brand: ${brand}
Commercial Activity: ${activity}
Duration: ${durationTextEn(req)}
Start Date: ${start}
End Date: ${end}
Consideration (excl. VAT): ${valueEn}
Payment Mechanism: The consideration is payable upon signing by the Second Party; the site is handed over only after payment and delivery of the signed contract, to the First Party's approved bank account.
First Party Account: Beneficiary: Sela Company, Al Rajhi Bank (IBAN: ${BLANK}).
First Party Representative: Events Space Leasing Dept. — Email: EventLeasing@sela.sa
Second Party Representative: ${repName} — Email: ${repEmail} — Mobile: ${repPhone}

SIGNATURES
For the First Party (Sela): Name: Adnan Kayyal — Title: Authorized Signatory — Date: ${BLANK}
For the Second Party (${operator}): Name: ${signatory} — Title: ${BLANK} — Date: ${BLANK}

SECTION 2 — TERMS & CONDITIONS

1. Term. This Contract takes effect upon signature and remains in force for its term per Section 1. The First Party may extend it by notice and may terminate immediately for material breach, or at will on no less than five (5) days' written notice. The Operator shall vacate the site within two (2) days of expiry in good condition and is liable for any damage. The term is tied to the event period set by the relevant authorities; if the event is stopped or cancelled, the term ends immediately.

2. Financial Terms & Payment. The consideration is paid in advance against an invoice within five (5) days of the claim, to the First Party's account. Where a revenue-share applies, the Operator provides a daily sales report and settles differences within ten (10) days. The Operator equips the site with an integrated (cash & electronic) sales-recording system and grants the First Party direct access.

3. First Party Obligations. Enable the Operator to take over the site; provide drinking water and electricity during agreed hours. The First Party may engage other parties for similar services (non-exclusive).

4. Second Party (Operator) Obligations. Carry out the agreed activity per its CR throughout the event; apply all security, safety and public-health measures and bear all resulting liabilities and indemnities. Maintain comprehensive insurance against general risks including food poisoning (min. SAR 1,000,000), a comprehensive site policy (min. SAR 5,000,000, First Party as additional insured), and fire insurance up to SAR 5,000,000. Secure all required licenses/permits, comply with health & municipal requirements and food-safety standards, and submit product and price lists for approval within three (3) days.

5. General Provisions. Both parties act in good faith; the Operator is responsible for its personnel and agrees to the penalties schedule (Section 3). The First Party is not liable for force-majeure events (notice within 3 days). The Operator keeps information confidential for five (5) years and indemnifies the First Party against any losses or claims. This Contract and its annexes are the entire agreement, governed by the laws of Saudi Arabia; disputes not settled amicably within thirty (30) days fall under the competent courts of Jeddah.

SECTION 3 — OPERATOR PENALTIES SCHEDULE (SUMMARY)
Operating-time/terms violations, cleanliness & public-health violations, and general violations carry escalating penalties (written warning, SAR 1,000, SAR 5,000, SAR 10,000) by recurrence. A material violation or recurrence beyond four (4) times terminates the contract immediately. All penalties are exclusive of VAT.

— Draft generated by the SELA CLM AI engine; pending review, approval and signature.`;

  const money = value ? `${value.toLocaleString()} ${esc(req.currency)}` : BLANK;
  const bodyHtml = `
<div class="ct-letterhead">
  <div class="ct-brand">
    <svg class="ct-logo" viewBox="0 0 178 56" width="132" height="42" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SELA">
      <path d="M6 6 H40 L54 20 V50 H6 Z" fill="#7a7d82"/>
      <path d="M40 6 H50 L16 50 H6 Z" fill="#ffffff"/>
      <text x="66" y="43" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#7a7d82" letter-spacing="-1.5">sela</text>
    </svg>
  </div>
  <div class="ct-ref">${esc(req.reference)}</div>
</div>
<h1 class="ct-title">عقد تشغيل — Operation Contract</h1>

<p>شركة صلة؛ شركة مساهمة مقفلة سعودية، بسجل تجاري رقم (4030163376)، وعنوان مقرها الرئيسي: ص.ب. 40388، جدة 21499، المملكة العربية السعودية؛ ويشار إليها فيما بعد بـ("الطرف الأول").</p>
<p>${esc(operator)}، مسجلة بموجب سجل تجاري رقم (${BLANK}) وعنوانها ${esc(address)}، المملكة العربية السعودية؛ ويُشار إليها فيما بعد بــ ("الطرف الثاني / المشغل").</p>

<h2 class="ct-h2">تمهيد — Preamble</h2>
<p>حيث تلاقت رغبة الطرفان في قيام الطرف الثاني بتشغيل مساحة محددة لأغراض تجارية وخدمية للفعالية التي يديرها الطرف الأول ورغبةً من الطرفان في توثيق الحقوق والإلتزامات بينهما، وتحديد الشروط والمواصفات اللازمة لإتمام الأعمال الواردة بهذا العقد، أبرم الطرفان هذا العقد وهما بكامل الأهلية الشرعية والنظامية، واتفقا على الآتي:</p>

<h2 class="ct-h2">نطاق العمل — Scope of Work</h2>
${scopeHtml}

<h2 class="ct-h2">القسم الأول: المعلومات العامة للموقع والمشروع</h2>
<table class="ct-table">
  <tr><th>اسم المشروع</th><td>${esc(projectName)}</td><th>الفعالية</th><td>${esc(event)}</td><th>موقع المشروع</th><td>${esc(location)}</td></tr>
  <tr><th>رقم الموقع</th><td>${BLANK}</td><th>المساحة</th><td>${BLANK}</td><th>نوع الموقع</th><td>${BLANK}</td></tr>
  <tr><th>العلامة التجارية</th><td>${esc(brand)}</td><th>النشاط التجاري</th><td>${esc(activity)}</td><th>المدة</th><td>${esc(durationText(req))}</td></tr>
  <tr><th>تاريخ بداية المدة</th><td colspan="2">${esc(start)}</td><th>تاريخ نهاية المدة</th><td colspan="2">${esc(end)}</td></tr>
  <tr><td colspan="6" style="font-size:11.5px">وفقاً لأحكام الفقرة (1) من الشروط والأحكام، في حالة تمديد مدة المشروع، يقوم الطرف الأول بإبلاغ الطرف الثاني كتابة بالتمديد وآثاره من ناحية المدة والمقابل المالي، ويلتزم الطرف الثاني باستمرار أعمال التشغيل دون توقف.</td></tr>
  <tr><th>المقابل المالي<br/>(غير شامل لضريبة القيمة المضافة)</th><td colspan="5">مبلغ ثابت وقدره ${money}</td></tr>
  <tr><th>آلية الدفع</th><td colspan="5">يتم الوفاء بالمقابل المالي (المبلغ الثابت) فور توقيع العقد من الطرف الثاني، ولا يتم تسليم الموقع إلا بعد استيفاء قيمة المقابل المالي وتسليم العقد موقعاً من الطرف الثاني. ويجوز للطرف الأول إلغاء هذا العقد في حال لم يقم الطرف الثاني بالسداد في المدة المقررة. ويتم السداد على الحساب البنكي المعتمد للطرف الأول.</td></tr>
  <tr><th>حساب الطرف الأول</th><td colspan="5">اسم المستفيد: شركة صلة، مصرف الراجحي (آيبان رقم: ${BLANK})</td></tr>
  <tr><th>الضمان المسترد</th><td colspan="5">( لا ينطبق )</td></tr>
  <tr><th>خدمات أنظمة البيع</th><td colspan="5">( لا ينطبق )</td></tr>
</table>

<table class="ct-table">
  <tr><th>ممثل الطرف الأول</th><td>قسم تأجير مساحات الفعاليات<br/>البريد الإلكتروني: EventLeasing@sela.sa</td></tr>
  <tr><th>ممثل الطرف الثاني</th><td>${esc(repName)}<br/>البريد الإلكتروني: ${esc(repEmail)} — رقم الجوال: ${esc(repPhone)}</td></tr>
</table>

<p style="font-size:11.5px">لتوثيق نية الطرفان في إنشاء العلاقة النظامية بينهما وتوثيق الحقوق والإلتزامات، والشروط والمواصفات اللازمة لإتمام الأعمال الواردة بهذا العقد وفقاً للمعلومات الموضحة أعلاه، إضافة إلى الشروط والأحكام في القسم الثاني من هذا العقد. وأقر الطرفان بعلمهم النافي للجهالة لجميع ما ورد في هذا العقد وما يترتب عليه من إلتزامات؛ وعليه جرى التوقيع:</p>

<table class="ct-table ct-sign">
  <tr><th>وافق عليه ووقع: شركة صلة ("الطرف الأول")</th><th>وافق عليه ووقع: ${esc(operator)} ("الطرف الثاني / المشغل")</th></tr>
  <tr>
    <td>الاسم: عدنان كيال<br/>الصفة: المفوض بالتوقيع<br/>التاريخ: ${BLANK}<br/>التوقيع: ____________<br/>الختم:</td>
    <td>الاسم: ${esc(signatory)}<br/>الصفة: ${BLANK}<br/>التاريخ: ${BLANK}<br/>التوقيع: ____________<br/>الختم:</td>
  </tr>
</table>

<h2 class="ct-h2">القسم الثاني: الشروط والأحكام</h2>

<h3 class="ct-h3">١. مدة العقد</h3>
<ol class="ct-terms">
  <li>يبدأ العمل بهذا العقد فيما بين الطرفين وتترتب كافة آثاره النظامية فور توقيع العقد ويظل سارياً طوال مدته حسب ما نصت عليه أحكام المعلومات العامة، ويجوز للطرف الأول تمديد مدة العقد عن طريق إخطار الطرف الثاني.</li>
  <li>يجوز للطرف الأول إنهاء العقد بشكل فوري بموجب إخطار خطي في حال ارتكب الطرف الثاني إخلالاً جوهرياً، كما يجوز له الإنهاء بإرادته المنفردة بموجب إخطار كتابي لا تقل مدته عن خمسة (5) أيام لأي سبب كان، مع احتفاظه بحقه في المطالبة بأي مستحقات متبقية في ذمة الطرف الثاني.</li>
  <li>يلتزم الطرف الثاني بإخلاء الموقع المخصص له بعد انتهاء/إنهاء العقد بنفس الحالة الجيدة وخلال مدة لا تتجاوز يومين (2)، ويكون مسؤولاً بالكامل عن قيمة أي أضرار.</li>
  <li>ترتبط مدة هذا العقد وجوداً وعدماً بفترة الفعالية التي تقررها الجهات المعنية؛ وفي حال إيقاف أو إلغاء الفعالية تنتهي مدة العقد فوراً مع إعداد كشف حساب تفصيلي ومخالصة نهائية بين الطرفين.</li>
  <li>في حال تمديد مدة الفعالية يُمدّد العمل بأحكام هذا العقد تلقائياً حتى انتهاء فترة التمديد، مع احتمال تغيير المقابل المالي بموجب خطاب من الطرف الأول يوافق عليه الطرف الثاني.</li>
  <li>يحق للطرف الأول إغلاق المكان لمدة معينة لأغراض الصيانة أو الظروف الطارئة دون أي تعويض للطرف الثاني.</li>
</ol>

<h3 class="ct-h3">٢. أحكام المقابل المالي وآلية الدفع</h3>
<ol class="ct-terms">
  <li>يلتزم الطرف الثاني بالوفاء بالمقابل المالي المحدد بموجب مطالبة أو فاتورة ضريبية، يُسدد مقدماً وخلال مدة لا تتجاوز خمسة (5) أيام من تاريخ المطالبة على حساب الطرف الأول. وعند عدم السداد يجوز للطرف الأول إلغاء العقد مباشرة وتسليم الموقع لمشغل آخر.</li>
  <li>يلتزم الطرف الثاني بتجهيز الموقع بنظام متكامل لتسجيل كافة عمليات البيع (نقدياً وإلكترونياً)، ويجوز للطرف الأول تدقيق ومراجعة النظام في جميع الأوقات.</li>
  <li>عند وجود نسبة مشاركة من إجمالي المبيعات يلتزم الطرف الثاني بتزويد الطرف الأول بتقرير مبيعات يومي وتسوية الفروقات بفاتورة ضريبية تُسدد خلال عشرة (10) أيام. وتُحسب نسبة المشاركة على إجمالي المبيعات غير شامل الضريبة ودون أي خصومات.</li>
  <li>يلتزم الطرف الثاني بتمكين الطرف الأول من الاطلاع المباشر على أنظمة تسجيل المبيعات والحساب البنكي المخصص للموقع.</li>
  <li>يُجيز امتناع الطرف الثاني عن السداد أو عن تزويد التقارير للطرف الأول إلغاء العقد وإحالته للجهات القضائية لتحصيل المستحقات.</li>
</ol>

<h3 class="ct-h3">٣. الأحكام الخاصة — التزامات الطرف الأول</h3>
<ol class="ct-terms">
  <li>تمكين المشغل من استلام الموقع لتنفيذ التزاماته، ويعد توقيع الطرف الثاني على العقد إقراراً باستلام الموقع.</li>
  <li>يجوز للطرف الأول التعاقد مع أطراف آخرين لخدمات مماثلة، ولا يشكل هذا العقد التزاماً حصرياً.</li>
  <li>لا يُعد الطرف الأول مسؤولاً عن أي التزامات أو تعويضات أو مصاريف تشغيلية تترتب على الطرف الثاني.</li>
  <li>يجوز للطرف الأول تطبيق جزاءات مالية عند مخالفة الضوابط التشغيلية أو معايير الصحة والأمن والسلامة، ويجوز إنهاء العقد عند تكرار المخالفة.</li>
  <li>يلتزم الطرف الأول بتوفير مياه الشرب والكهرباء خلال أوقات العمل المتفق عليها.</li>
</ol>

<h3 class="ct-h3">٤. الأحكام الخاصة — التزامات الطرف الثاني (المشغل)</h3>
<ol class="ct-terms">
  <li>ممارسة النشاط التجاري المتفق عليه وفقاً للسجل التجاري طوال مدة الفعالية بما يضمن جودة الخدمة واستمراريتها.</li>
  <li>المساهمة في الحملات التسويقية، مع حق الطرف الأول في استخدام حقوق الملكية الفكرية (الأسماء والعلامات والصور) في الوسائل الإعلانية دون مقابل.</li>
  <li>اتخاذ كافة إجراءات الأمن والسلامة والصحة العامة وفحص التوصيلات والأحمال الكهربائية.</li>
  <li>يتحمل المشغل كافة المسؤوليات والتعويضات الناشئة عن الأضرار والحوادث (بما فيها الوفاة والتسمم الغذائي) دون أدنى مسؤولية على الطرف الأول.</li>
  <li>في حال كون الموقع عربة، يلتزم المشغل بتزويد الطرف الأول بترخيص الفحص الدوري وجميع التراخيص النظامية وتجديد المنتهي منها.</li>
  <li>توفير بوليصة تأمين شاملة ضد المخاطر العامة تشمل التسمم الغذائي بحد أدنى مليون (1,000,000) ريال، وتأمين شامل للمساحة بحد أدنى خمسة ملايين (5,000,000) ريال يكون الطرف الأول مؤمناً له إضافياً فيها، وتأمين ضد الحريق حتى خمسة ملايين (5,000,000) ريال، أو أي اشتراطات تأمينية أخرى يفرضها الطرف الأول.</li>
  <li>تحمل جميع التكاليف التشغيلية وتكاليف صيانة الأصول المسلّمة طوال مدة العقد.</li>
  <li>التأكد من أن جميع العاملين مؤهلون ومرخصون، وعدم التعاقد من الباطن إلا بموافقة الطرف الأول الكتابية.</li>
  <li>الالتزام بجميع المعايير والضوابط الصحية الخاصة بالأطعمة والمشروبات وحصول العاملين على الشهادات الصحية المطلوبة.</li>
  <li>ضمان توفر جميع التراخيص والتصاريح من الجهات الحكومية قبل بدء النشاط، والتقيد بالاشتراطات البلدية والصحية.</li>
  <li>التقيد بجميع الاشتراطات الأمنية وتعليمات الدفاع المدني والإجراءات الاحترازية، واشتراطات الدعاية والإعلان واللوحات التجارية.</li>
  <li>تقديم لوائح المنتجات والأسعار للطرف الأول خلال ثلاثة (3) أيام من تاريخ العقد لمراجعتها والموافقة عليها، وإثبات أحقية استخدام العلامات التجارية.</li>
</ol>

<h3 class="ct-h3">٥. الأحكام العامة</h3>
<ol class="ct-terms">
  <li>يقر الطرفان بتطبيق العقد وفقاً لمبدأ حسن النية والتعامل النزيه.</li>
  <li>يتحمل الطرف الثاني مسؤولية العاملين لديه وفقاً لأنظمة المملكة، ولا يكون الطرف الأول مسؤولاً عنهم.</li>
  <li>يقر الطرف الثاني بالالتزام بجدول المخالفات والجزاءات المالية (القسم الثالث).</li>
  <li>لا يُسأل أي طرف عن الإخلال بالتزاماته بسبب القوة القاهرة، مع التزام الطرف المتأثر بالإخطار خطياً خلال ثلاثة (3) أيام.</li>
  <li>للطرف الأول الحق في تعديل أي سياسة تشغيلية أو تقنية أو أمنية خلال مدة العقد مع إلزام الطرف الثاني بالامتثال الفوري.</li>
  <li>يتعهد الطرف الثاني بالحفاظ على سرية المعلومات لمدة خمس (5) سنوات ميلادية كاملة.</li>
  <li>يكون الطرف الثاني مسؤولاً بالكامل عن حماية وتعويض الطرف الأول عن أي خسائر أو أضرار أو مطالبات تنشأ بموجب التزاماته أو بسببها.</li>
  <li>يمثل هذا العقد وملحقاته الاتفاق الكامل بين الطرفين وينسخ أي اتفاقات سابقة.</li>
  <li>الاستقلالية: بطلان أي بند لا يؤثر على سريان بقية البنود.</li>
  <li>تكون جميع المراسلات والإشعارات كتابية وتُوجّه إلى عناوين الممثلين الموضحة في المعلومات العامة.</li>
  <li>يلتزم المشغل بتوقيع العقد خلال مدة أقصاها سبعة (7) أيام من تاريخ بدء التشغيل، مع جوازية التوقيع إلكترونياً واعتبار النسخة بمثابة الأصل.</li>
  <li>يخضع هذا العقد لأنظمة المملكة العربية السعودية، وتختص المحاكم في مدينة جدة بأي نزاع يتعذّر حله ودياً خلال ثلاثين (30) يوماً. ويُعتمد التقويم الميلادي في احتساب المدد.</li>
</ol>

<h2 class="ct-h2">القسم الثالث: جدول مخالفات المشغلين</h2>
<table class="ct-table ct-penalties">
  <tr><th>المخالفة</th><th>المرة الأولى</th><th>المرة الثانية</th><th>المرة الثالثة</th><th>المرة الرابعة</th></tr>
  <tr><td>مخالفات أوقات/أحكام التشغيل (الإقفال خلال/قبل التشغيل، إدخال البضائع، التأخر في الفتح، تعديل الشكل الخارجي دون موافقة)</td><td>إنذار كتابي</td><td>1,000 ريال</td><td>5,000 ريال</td><td>10,000 ريال</td></tr>
  <tr><td>النظافة والصحة العامة (تخزين مواد خارج الموقع، عدم النظافة، عدم تجميع المخلفات، عدم الالتزام بالسلامة)</td><td>إنذار كتابي</td><td>1,000 ريال</td><td>5,000 ريال</td><td>10,000 ريال</td></tr>
  <tr><td>مخالفات عامة (إضافة عناصر دون موافقة، ملاحظات الصحة/الأمن، عدم التقيد باشتراطات الجهات الحكومية، إعاقة مراقبي صلة، أي مخالفات أخرى)</td><td>إنذار كتابي</td><td>1,000 ريال</td><td>5,000 ريال</td><td>10,000 ريال</td></tr>
</table>
<p class="ct-note">قيود الجزاءات: في حال كون المخالفة جوهرية يُفسخ العقد فوراً ويلتزم المشغل بالتعويض؛ وفي حال تكرار المخالفة لأكثر من (4) مرات يُفسخ العقد فوراً؛ وعند تخلّف المشغل عن مباشرة نشاطه في تاريخ بداية التشغيل يُفرض جزاء بقيمة خمسة آلاف (5,000) ريال. جميع الجزاءات غير شاملة لضريبة القيمة المضافة.</p>
`.trim();

  return { title, bodyEn, bodyAr, bodyHtml };
}
