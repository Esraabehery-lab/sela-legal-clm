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

export function buildOperationContract(req: DFRequest): {
  title: string;
  bodyEn: string;
  bodyAr: string;
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

  const title = `عقد تشغيل — ${projectName} — ${operator}`;

  const bodyAr = `عقد تشغيل

شركة صلة؛ شركة مساهمة مقفلة سعودية، بسجل تجاري رقم (4030163376)، وعنوان مقرها الرئيسي: ص.ب. 40388، جدة 21499، المملكة العربية السعودية؛ ويشار إليها فيما بعد بـ("الطرف الأول").
${operator}، مسجلة بموجب سجل تجاري رقم (${BLANK}) وعنوانها ${address}، المملكة العربية السعودية؛ ويُشار إليها فيما بعد بــ ("الطرف الثاني / المشغل").

تمهيد
حيث تلاقت رغبة الطرفان في قيام الطرف الثاني بتشغيل مساحة محددة لأغراض تجارية وخدمية للفعالية التي يديرها الطرف الأول ورغبةً من الطرفان في توثيق الحقوق والإلتزامات بينهما، وتحديد الشروط والمواصفات اللازمة لإتمام الأعمال الواردة بهذا العقد، أبرم الطرفان هذا العقد وهما بكامل الأهلية الشرعية والنظامية، واتفقا على الآتي:

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

  return { title, bodyEn, bodyAr };
}
