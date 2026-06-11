import type { BotStrategy } from "../types";

/**
 * AI trader personas — versioned tuning layer over the static BOTS list.
 * Bump PERSONAS_VERSION in a release to re-apply strategy/level tuning to
 * live saves without wiping evolved wealth.
 */
export const PERSONAS_VERSION = 1;

export interface Persona {
  botId: string;
  strategy: BotStrategy;
  level: number; // seed level — drives إحسان eligibility (donor 25+, rescuer 50+)
  activity: number; // 0..1 weight when picking who acts
  chattiness: number; // 0..1 probability of posting about an action
  risk: number; // position size as a fraction of net worth
  bio: string;
  greetings: string[];
  replies: string[]; // generic chat replies
  marketReplies: string[]; // used with {sym} و {chg} placeholders
  open: string[]; // {item} placeholder
  win: string[]; // {item} {pnl}
  loss: string[]; // {item} {pnl}
  comment: string[]; // {sym} {chg}
}

export const PERSONAS: Persona[] = [
  {
    botId: "future-co",
    strategy: "whale",
    level: 71,
    activity: 0.5,
    chattiness: 0.35,
    risk: 0.3,
    bio: "صندوق استثماري مؤسسي — نحرك السوق ولا يحركنا",
    greetings: ["أهلًا بك، يسعدنا تواصلك مع إدارة الصندوق."],
    replies: [
      "نحن ندرس كل فرصة بعناية قبل الدخول.",
      "السيولة هي الملك في هذه المرحلة.",
      "ننصح بالتنويع وعدم المخاطرة بأكثر من 20% في أصل واحد.",
    ],
    marketReplies: [
      "ملف {sym} تحت المراجعة لدينا، التغير الأخير {chg} يستحق الانتباه.",
      "دخلنا مراكز كبيرة في {sym} — راقب السيولة.",
    ],
    open: ["الصندوق يبني مركزًا استراتيجيًا في {item} 🏛️"],
    win: ["أغلقنا مركز {item} بعائد {pnl} UCN — الأرقام تتحدث 📊"],
    loss: ["خروج تكتيكي من {item} بخسارة محدودة {pnl} UCN"],
    comment: ["تحرك {sym} بنسبة {chg} يعكس إعادة تسعير مؤسسية 🏛️"],
  },
  {
    botId: "saud",
    strategy: "value",
    level: 62,
    activity: 0.55,
    chattiness: 0.4,
    risk: 0.2,
    bio: "أشتري الجودة وقت الخوف وأبيعها وقت الطمع",
    greetings: ["هلا والله! نورت قائمة أصدقائي 🤝"],
    replies: [
      "الصبر مفتاح هذا السوق يا صديقي.",
      "لا تشترِ شيئًا لا تفهمه مهما كان مغريًا.",
      "أنا أنتظر التصحيح القادم بفارغ الصبر، النقد جاهز.",
    ],
    marketReplies: [
      "{sym} عند هذه المستويات؟ {chg} — أراها فرصة قيمة.",
      "أراقب {sym} من أسابيع، التغير {chg} لم يغير قناعتي.",
    ],
    open: ["اشتريت {item} بسعر مغرٍ — القيمة تنادي 🎯"],
    win: ["بعت {item} بربح {pnl} UCN — الصبر يدفع دائمًا 🌴"],
    loss: ["خسرت {pnl} UCN في {item}، لكن القناعة باقية"],
    comment: ["هبوط {sym} بنسبة {chg}؟ هذه ليست أزمة، هذه قائمة تسوق 🛒"],
  },
  {
    botId: "fahad",
    strategy: "momentum",
    level: 55,
    activity: 0.75,
    chattiness: 0.55,
    risk: 0.22,
    bio: "أركب الموجة قبل أن يراها الآخرون 🌊",
    greetings: ["يا هلا! جاهز نصيد الموجات مع بعض؟ 🌊"],
    replies: [
      "الاتجاه صديقك حتى ينكسر — لا تعاند السوق.",
      "أنا ما أمسك خاسر أكثر من يوم، القطع السريع نجاة.",
      "شوف الفوليوم قبل ما تدخل أي صفقة.",
    ],
    marketReplies: [
      "{sym} متحرك {chg} — الزخم واضح، أنا داخل 🚀",
      "إذا كسر {sym} القمة بعد {chg} هذه بكون أول المشترين.",
    ],
    open: ["دخلت {item} مع الزخم 🚀 الموجة بدأت"],
    win: ["أغلقت {item} بربح {pnl} UCN — الموجة وصلت الشاطئ 🏄"],
    loss: ["قطعت خسارة {item} عند {pnl} UCN — السرعة نجاة"],
    comment: ["{sym} يشتعل! {chg} والفوليوم يتضاعف 🔥"],
  },
  {
    botId: "sara",
    strategy: "momentum",
    level: 47,
    activity: 0.65,
    chattiness: 0.5,
    risk: 0.18,
    bio: "محللة فنية — الشموع تخبرني بكل شيء 🕯️",
    greetings: ["أهلًا! أتمنى لك تداولًا موفقًا اليوم ✨"],
    replies: [
      "الشموع اليابانية لا تكذب إذا عرفت تقرأها.",
      "ضع وقف الخسارة قبل أن تضع أمر الشراء.",
      "أفضل الصفقات هي التي تنتظرها طويلًا.",
    ],
    marketReplies: [
      "شمعة {sym} الأخيرة مع {chg} تشير لانعكاس محتمل 🕯️",
      "نموذج فني جميل يتشكل على {sym} بعد حركة {chg}.",
    ],
    open: ["الرسم البياني أعطى إشارة دخول على {item} 🕯️"],
    win: ["هدف {item} تحقق: +{pnl} UCN — التحليل الفني ينتصر 📐"],
    loss: ["وقف خسارة {item} تفعّل عند {pnl} UCN — حماية رأس المال أولًا"],
    comment: ["اختراق واضح على {sym} بنسبة {chg} — راقبوا الإغلاق 👀"],
  },
  {
    botId: "abdullah",
    strategy: "value",
    level: 41,
    activity: 0.5,
    chattiness: 0.35,
    risk: 0.15,
    bio: "مستثمر هادئ — أجمع الأصول الجيدة وأنام مرتاحًا",
    greetings: ["حياك الله أخوي، بالتوفيق في استثماراتك."],
    replies: [
      "العقار ما يخون على المدى الطويل.",
      "وزع محفظتك وخل ثلثها نقد دائمًا.",
      "الديون سلاح ذو حدين — انتبه للأقساط.",
    ],
    marketReplies: [
      "{sym} مع {chg}؟ ما زال ضمن نطاقه العادل برأيي.",
      "أفضل الانتظار حتى يستقر {sym} بعد حركة {chg}.",
    ],
    open: ["أضفت {item} إلى المحفظة طويلة الأجل 🗄️"],
    win: ["جنيت {pnl} UCN من {item} — شكرًا للصبر"],
    loss: ["{item} خسرني {pnl} UCN — درس جديد في دفتري"],
    comment: ["حركة {sym} بنسبة {chg} طبيعية ضمن الدورة الاقتصادية"],
  },
  {
    botId: "noura",
    strategy: "contrarian",
    level: 33,
    activity: 0.6,
    chattiness: 0.45,
    risk: 0.17,
    bio: "أشتري حين تسيل الدماء في الشوارع 🩸",
    greetings: ["أهلين! خلنا نخالف القطيع مع بعض 😏"],
    replies: [
      "إذا الكل يشتري فهذا وقت البيع غالبًا.",
      "الخوف الجماعي أفضل صديق للمستثمر الذكي.",
      "القمم تصنع في النشوة والقيعان في الذعر.",
    ],
    marketReplies: [
      "الكل خايف من {sym} بعد {chg}؟ ممتاز، أنا مشترية 🩸",
      "نشوة جماعية على {sym} مع {chg} — حان وقت الحذر.",
    ],
    open: ["الجميع يبيع {item}؟ إذًا أنا أشتري 😏"],
    win: ["+{pnl} UCN من {item} — مخالفة القطيع تدفع 🐺"],
    loss: ["عاند السوق فخسرت {pnl} UCN في {item} — يحدث"],
    comment: ["ذعر مبالغ فيه على {sym} ({chg}) — الفرص تولد هنا 🩸"],
  },
  {
    botId: "khaled",
    strategy: "scalper",
    level: 28,
    activity: 0.85,
    chattiness: 0.4,
    risk: 0.08,
    bio: "مئة صفقة صغيرة أفضل من صفقة كبيرة ⚡",
    greetings: ["هلا بك! سرعة في الدخول وسرعة في الخروج، هذا مذهبي ⚡"],
    replies: [
      "الربح الصغير المتكرر يبني جبالًا.",
      "لا تتزوج الصفقة — خذ ربحك وامشِ.",
      "عمولاتي أكبر من أرباح بعض الناس 😅",
    ],
    marketReplies: [
      "{sym} يتذبذب {chg} — ملعب مثالي للمضاربة ⚡",
      "أخذت 3 صفقات خاطفة على {sym} اليوم.",
    ],
    open: ["صفقة خاطفة على {item} ⚡"],
    win: ["+{pnl} UCN من {item} في دقائق ⚡ — التالي!"],
    loss: ["خسارة سريعة {pnl} UCN في {item} — القطع أنقذني"],
    comment: ["تذبذب {sym} بنسبة {chg} يعني وجبة دسمة للمضاربين ⚡"],
  },
  {
    botId: "reem",
    strategy: "hodler",
    level: 22,
    activity: 0.25,
    chattiness: 0.3,
    risk: 0.25,
    bio: "أشتري وأنسى — الزمن شريكي الاستثماري 💎",
    greetings: ["أهلًا وسهلًا 🌸 الاستثمار رحلة طويلة، استمتع بها."],
    replies: [
      "أنا ما أبيع، أنا أجمع 💎",
      "التقلبات اليومية ضجيج — المهم أين نكون بعد سنة.",
      "أفضل وقت للشراء كان أمس، وثاني أفضل وقت هو اليوم.",
    ],
    marketReplies: [
      "{sym} نزل {chg}؟ ممتاز، متوسطي بيتحسن 💎",
      "ما أتابع {sym} يوميًا أصلًا — الزمن كفيل.",
    ],
    open: ["أضفت {item} للخزنة وأغلقت الشاشة 💎"],
    win: ["فتحت الخزنة لقيت {item} رابح {pnl} UCN 💎"],
    loss: ["{item} نازل {pnl} UCN؟ فرصة لتحسين المتوسط"],
    comment: ["{sym} تحرك {chg}؟ ذكروني أشيك بعد سنة 💎"],
  },
  {
    botId: "majed",
    strategy: "scalper",
    level: 14,
    activity: 0.7,
    chattiness: 0.5,
    risk: 0.1,
    bio: "أتعلم بسرعة وأخطئ بسرعة أكبر 😅",
    greetings: ["هلااا! وش رايك بالسوق اليوم؟ 😄"],
    replies: [
      "تعلمت من أخطائي أكثر مما تعلمت من أرباحي 😅",
      "أحاول أقلد الكبار بس برأس مال صغير.",
      "يومين خضر وثلاثة حمر — هذه حياتي 📉📈",
    ],
    marketReplies: [
      "دخلت {sym} بعد ما شفته {chg}... ادعوا لي 🙏",
      "أحس {sym} بينفجر قريب، حدسي قال لي!",
    ],
    open: ["جربت حظي مع {item} 🤞"],
    win: ["ياااه ربحت {pnl} UCN من {item}! 🎉"],
    loss: ["ضاعت {pnl} UCN في {item} 😭 درس جديد"],
    comment: ["أحد يفهمني وش صاير في {sym}؟ {chg} في لحظات! 😵"],
  },
  {
    botId: "faisal",
    strategy: "contrarian",
    level: 9,
    activity: 0.45,
    chattiness: 0.35,
    risk: 0.12,
    bio: "مبتدئ عنيد — أعاكس التيار وأتحمل النتائج",
    greetings: ["مرحبا! توني داخل عالم الاستثمار، نتعلم سوا؟"],
    replies: [
      "قريت أن أفضل المستثمرين يخالفون القطيع، فقررت أجرب.",
      "رأس مالي صغير بس طموحي كبير.",
      "كل خسارة أكتبها في دفتر — صار عندي دفترين 😅",
    ],
    marketReplies: [
      "الكل يقول {sym} بينهار بعد {chg}... يعني وقت الشراء؟ 🤔",
      "ما فهمت ليش {sym} تحرك {chg} بس حاسس إنها فرصة.",
    ],
    open: ["خالفت الجميع واشتريت {item} 🎲"],
    win: ["عنادي ربحني {pnl} UCN في {item}! 💪"],
    loss: ["العناد كلفني {pnl} UCN في {item} 😬"],
    comment: ["{sym} {chg}... القطيع خايف وأنا أبتسم 🙃"],
  },
];

export function personaById(botId: string): Persona {
  return PERSONAS.find((p) => p.botId === botId) ?? PERSONAS[0];
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
