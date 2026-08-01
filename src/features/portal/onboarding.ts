import type { ProjectStage } from "@/lib/supabase/types";

export interface PortalStageGuidance {
  readonly phase: "היכרות" | "אפיון" | "הקמה" | "מסירה";
  readonly phaseIndex: 1 | 2 | 3 | 4;
  readonly headline: string;
  readonly detail: string;
  readonly systemizeNext: string;
  readonly clientActionRequired: boolean;
}

export const portalStageGuidance: Record<ProjectStage, PortalStageGuidance> = {
  lead: {
    phase: "היכרות",
    phaseIndex: 1,
    headline: "אנחנו מרכזים את הפרטים לקראת תחילת הדרך",
    detail: "הצוות שלנו עובר על הצרכים שעלו ומכין את השלב הבא בצורה מסודרת.",
    systemizeNext: "יצירת קשר ותיאום שיחת היכרות",
    clientActionRequired: false,
  },
  intro_call_scheduled: {
    phase: "היכרות",
    phaseIndex: 1,
    headline: "שיחת ההיכרות היא התחנה הבאה",
    detail: "בשיחה נבין את המצב הקיים, המטרות והדברים שהכי חשוב לפתור.",
    systemizeNext: "קיום שיחת ההיכרות ותיעוד הנקודות המרכזיות",
    clientActionRequired: true,
  },
  initial_summary_preparation: {
    phase: "היכרות",
    phaseIndex: 1,
    headline: "אנחנו מכינים עבורך סיכום מסודר",
    detail: "אין צורך לעשות דבר כרגע. נרכז את מה ששמענו ונציג אותו לאישור.",
    systemizeNext: "פרסום סיכום השיחה והצעת האפיון",
    clientActionRequired: false,
  },
  discovery_offer_awaiting_client: {
    phase: "אפיון",
    phaseIndex: 2,
    headline: "הצעת האפיון מוכנה לבדיקה שלך",
    detail: "כדאי לעבור על ההיקף, התוצרים ולוח הזמנים לפני האישור.",
    systemizeNext: "מענה לשאלות ועדכון ההצעה לפי הצורך",
    clientActionRequired: true,
  },
  discovery_payment_pending: {
    phase: "אפיון",
    phaseIndex: 2,
    headline: "התשלום עבור שלב האפיון ממתין להסדרה",
    detail: "לאחר אישור התשלום נוכל לפתוח את עבודת האפיון המלאה.",
    systemizeNext: "אישור קבלת התשלום ופתיחת שלב האפיון",
    clientActionRequired: true,
  },
  full_discovery_and_planning: {
    phase: "אפיון",
    phaseIndex: 2,
    headline: "האפיון והתכנון המלא נמצאים בעבודה",
    detail: "אנחנו הופכים את הצרכים לתהליכים, מסכים והחלטות שניתן לבנות לפיהם.",
    systemizeNext: "השלמת האפיון והצגת נקודות שדורשות החלטה",
    clientActionRequired: false,
  },
  solution_options_preparation: {
    phase: "אפיון",
    phaseIndex: 2,
    headline: "אנחנו בוחנים את חלופת הפתרון הנכונה",
    detail: "החלופות נבדקות מול המטרות, התקציב, הסיכונים והתחזוקה העתידית.",
    systemizeNext: "הצגת המלצה מנומקת וחלופות אפשריות",
    clientActionRequired: false,
  },
  proposal_and_contract_awaiting_client: {
    phase: "אפיון",
    phaseIndex: 2,
    headline: "ההצעה והחוזה מוכנים לעיון",
    detail: "אפשר לעבור על הגרסה המחייבת, לשאול שאלות ולחתום כשנוח לך.",
    systemizeNext: "מענה לשאלות וליווי עד להשלמת החתימה",
    clientActionRequired: true,
  },
  initial_payment_pending: {
    phase: "הקמה",
    phaseIndex: 3,
    headline: "התשלום הראשוני ממתין להסדרה",
    detail: "החתימה נשמרה. תחילת ההקמה תאושר לאחר קליטת התשלום.",
    systemizeNext: "אישור התשלום ופתיחת תכנית העבודה",
    clientActionRequired: true,
  },
  delivery: {
    phase: "הקמה",
    phaseIndex: 3,
    headline: "המערכת שלך נמצאת בבנייה",
    detail: "אנחנו עובדים לפי התכנית המאושרת ומעדכנים כאן בכל התקדמות משמעותית.",
    systemizeNext: "המשך ביצוע המשימות ופרסום עדכון התקדמות",
    clientActionRequired: false,
  },
  client_review: {
    phase: "הקמה",
    phaseIndex: 3,
    headline: "הגרסה מוכנה לבדיקה שלך",
    detail: "המשוב שלך בשלב הזה עוזר לנו לסגור פערים לפני העלייה לאוויר.",
    systemizeNext: "ריכוז המשוב, תיקונים ואישור מוכנות למסירה",
    clientActionRequired: true,
  },
  rollout: {
    phase: "מסירה",
    phaseIndex: 4,
    headline: "אנחנו מעלים את המערכת לשימוש מסודר",
    detail: "השלב כולל מעבר לסביבה הפעילה, הדרכה ובדיקות אחרונות.",
    systemizeNext: "השלמת ההטמעה והעברת חומרי ההדרכה",
    clientActionRequired: false,
  },
  support: {
    phase: "מסירה",
    phaseIndex: 4,
    headline: "המערכת באוויר ואנחנו ממשיכים ללוות",
    detail: "אפשר לרכז שאלות ובקשות, ואנחנו נוודא שהעבודה נשארת יציבה וברורה.",
    systemizeNext: "מעקב, תמיכה וטיפול בבקשות השירות",
    clientActionRequired: false,
  },
  completed: {
    phase: "מסירה",
    phaseIndex: 4,
    headline: "הפרויקט הושלם",
    detail: "כל ההחלטות והמסמכים נשמרים כאן כדי שתמיד יהיה מקור מידע אחד וברור.",
    systemizeNext: "המשך ליווי בהתאם למסלול השירות שסוכם",
    clientActionRequired: false,
  },
  cancelled: {
    phase: "מסירה",
    phaseIndex: 4,
    headline: "העבודה בפרויקט הופסקה",
    detail: "המידע שנצבר נשמר. לפרטים או לחידוש התהליך אפשר לפנות אלינו.",
    systemizeNext: "תיאום המשך לפי החלטה משותפת",
    clientActionRequired: false,
  },
};

export const portalJourneyPhases = ["היכרות", "אפיון", "הקמה", "מסירה"] as const;
