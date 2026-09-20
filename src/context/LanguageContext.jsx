import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const STORAGE_KEY = "sheq_language";

const translations = {
  English: {
    home: {
      eyebrow: "COMMUNITY × SAFETY × INSIGHT",
      heroSubtitle:
        "A community-driven platform for sharing safety information, understanding local concerns, and making informed decisions together.",
      ctaSignup: "Join SHEQ",
      ctaExplore: "Explore Safety",
      trustBadge: "Built around community reports and shared context",
      liveSignal: "LIVE COMMUNITY SIGNAL",
      whySheq: "WHY SHEQ",
      whySheqTitle: "Safety becomes stronger when we share what we know.",
      whySheqDesc:
        "SHEQ brings community reports, context, confirmations and local patterns together so people can understand what is happening around them.",
      networkTitle: "The community network",
      communityReports: "Community Reports",
      verifiedReports: "Verified Reports",
      activeHotspots: "Active Hotspots",
      confirmations: "Community Confirmations",
      ctaBoxTitle: "Help your community see the bigger picture.",
      ctaBoxDesc:
        "Share what you know, add context to existing reports, and help build a clearer picture of local safety."
    },
    nav: {
      home: "Home",
      howItWorks: "How It Works",
      dashboard: "Dashboard",
      sos: "SOS",
      report: "Report",
      map: "Safety Map",
      login: "Log in",
      signup: "Sign Up",
      overview: "Overview",
      reports: "Reports",
      hotspots: "Hotspots",
      issues: "Issues",
      escalations: "Escalations",
      moderation: "Moderation",
      publicHome: "Public Home",
      myProfile: "My Profile",
      myPlaces: "Saved Places",
      emergencyContacts: "Emergency Contacts",
      trustedContacts: "Trusted Contacts",
      notifications: "Notifications",
      privacy: "Account & Privacy",
      logout: "Log Out"
    },
    common: {
      save: "Save Changes",
      cancel: "Cancel",
      submit: "Submit",
      loading: "Loading...",
      verified: "Verified",
      underReview: "Under Review",
      resolved: "Resolved"
    }
  },

  Marathi: {
    home: {
      eyebrow: "समुदाय × सुरक्षितता × माहिती",
      heroSubtitle:
        "सुरक्षिततेची माहिती शेअर करण्यासाठी, स्थानिक समस्या समजून घेण्यासाठी आणि एकत्रितपणे माहितीपूर्ण निर्णय घेण्यासाठी समुदायावर आधारित व्यासपीठ.",
      ctaSignup: "SHEQ मध्ये सहभागी व्हा",
      ctaExplore: "सुरक्षितता पहा",
      trustBadge: "समुदाय अहवाल आणि सामायिक माहितीसह तयार केलेले",
      liveSignal: "थेट समुदाय संकेत",
      whySheq: "SHEQ का?",
      whySheqTitle: "आपल्याला माहीत असलेली माहिती शेअर केल्याने सुरक्षितता अधिक मजबूत होते.",
      whySheqDesc:
        "SHEQ समुदायाचे अहवाल, माहिती, पुष्टीकरणे आणि स्थानिक नमुने एकत्र आणते, ज्यामुळे आपल्या आसपास काय घडत आहे हे समजणे सोपे होते.",
      networkTitle: "समुदाय नेटवर्क",
      communityReports: "समुदाय अहवाल",
      verifiedReports: "पुष्टी केलेले अहवाल",
      activeHotspots: "सक्रिय हॉटस्पॉट्स",
      confirmations: "समुदाय पुष्टीकरणे",
      ctaBoxTitle: "तुमच्या समुदायाला संपूर्ण चित्र समजण्यास मदत करा.",
      ctaBoxDesc:
        "तुम्हाला माहीत असलेली माहिती शेअर करा, विद्यमान अहवालांमध्ये संदर्भ जोडा आणि स्थानिक सुरक्षिततेचे अधिक स्पष्ट चित्र तयार करण्यात मदत करा."
    },
    nav: {
      home: "मुख्यपृष्ठ (Home)",
      howItWorks: "कसे कार्य करते (How It Works)",
      dashboard: "डॅशबोर्ड (Dashboard)",
      sos: "आपत्कालीन SOS",
      report: "अहवाल द्या (Report)",
      map: "सुरक्षा नकाशा (Safety Map)",
      login: "लॉग इन (Login)",
      signup: "साइन अप (Sign Up)",
      overview: "आढावा (Overview)",
      reports: "अहवाल (Reports)",
      hotspots: "हॉटस्पॉट्स (Hotspots)",
      issues: "तक्रारी (Issues)",
      escalations: "प्रकरणे (Escalations)",
      moderation: "तपासणी (Moderation)",
      publicHome: "सार्वजनिक मुख्यपृष्ठ",
      myProfile: "माझे प्रोफाइल",
      myPlaces: "जतन केलेली ठिकाणे",
      emergencyContacts: "आपत्कालीन संपर्क",
      trustedContacts: "विश्वसनीय संपर्क",
      notifications: "सूचना सेटिंग्ज",
      privacy: "खाते आणि गोपनीयता",
      logout: "बाहेर पडा (Log Out)"
    },
    common: {
      save: "बदल जतन करा",
      cancel: "रद्द करा",
      submit: "सादर करा",
      loading: "लोड होत आहे...",
      verified: "सत्यापित",
      underReview: "पुनरावलोकनात",
      resolved: "निवारण झाले"
    }
  },

  Hindi: {
    home: {
      eyebrow: "समुदाय × सुरक्षा × जानकारी",
      heroSubtitle:
        "सुरक्षा संबंधी जानकारी साझा करने, स्थानीय चिंताओं को समझने और मिलकर बेहतर निर्णय लेने के लिए एक समुदाय-आधारित प्लेटफ़ॉर्म।",
      ctaSignup: "SHEQ से जुड़ें",
      ctaExplore: "सुरक्षा देखें",
      trustBadge: "समुदाय रिपोर्ट और साझा जानकारी पर आधारित",
      liveSignal: "लाइव कम्युनिटी सिग्नल",
      whySheq: "SHEQ क्यों?",
      whySheqTitle: "जब हम अपनी जानकारी साझा करते हैं, तो सुरक्षा और मजबूत होती है।",
      whySheqDesc:
        "SHEQ समुदाय की रिपोर्ट, संदर्भ, पुष्टि और स्थानीय पैटर्न को एक साथ लाता है ताकि लोग अपने आसपास हो रही गतिविधियों को बेहतर समझ सकें।",
      networkTitle: "कम्युनिटी नेटवर्क",
      communityReports: "कम्युनिटी रिपोर्ट",
      verifiedReports: "सत्यापित रिपोर्ट",
      activeHotspots: "सक्रिय हॉटस्पॉट",
      confirmations: "कम्युनिटी पुष्टियां",
      ctaBoxTitle: "अपने समुदाय को पूरी तस्वीर समझने में मदद करें।",
      ctaBoxDesc:
        "जो जानकारी आपके पास है उसे साझा करें, मौजूदा रिपोर्ट में संदर्भ जोड़ें और स्थानीय सुरक्षा की स्पष्ट तस्वीर बनाने में मदद करें।"
    },
    nav: {
      home: "होम (Home)",
      howItWorks: "यह कैसे काम करता है",
      dashboard: "डैशबोर्ड (Dashboard)",
      sos: "आपातकालीन SOS",
      report: "रिपोर्ट दर्ज करें",
      map: "सुरक्षा नक्शा (Safety Map)",
      login: "लॉग इन (Login)",
      signup: "साइन अप (Sign Up)",
      overview: "अवलोकन (Overview)",
      reports: "रिपोर्ट्स (Reports)",
      hotspots: "हॉटस्पॉट (Hotspots)",
      issues: "मुद्दे (Issues)",
      escalations: "मामले (Escalations)",
      moderation: "समीक्षा (Moderation)",
      publicHome: "सार्वजनिक होम",
      myProfile: "मेरी प्रोफ़ाइल",
      myPlaces: "सहेजे गए स्थान",
      emergencyContacts: "आपातकालीन संपर्क",
      trustedContacts: "विश्वसनीय संपर्क",
      notifications: "अधिसूचना सेटिंग्स",
      privacy: "खाता और गोपनीयता",
      logout: "लॉग आउट (Log Out)"
    },
    common: {
      save: "परिवर्तन सहेजें",
      cancel: "रद्द करें",
      submit: "जमा करें",
      loading: "लोड हो रहा है...",
      verified: "सत्यापित",
      underReview: "समीक्षाधीन",
      resolved: "हल किया गया"
    }
  }
};

function getNestedValue(object, path) {
  if (!object || !path) return undefined;
  return path.split(".").reduce((value, key) => value?.[key], object);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "English";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang =
      language === "English" ? "en" : language === "Marathi" ? "mr" : "hi";
  }, [language]);

  function setLanguage(nextLanguage) {
    if (!translations[nextLanguage]) {
      return;
    }
    setLanguageState(nextLanguage);
  }

  function t(key) {
    return (
      getNestedValue(translations[language], key) ??
      getNestedValue(translations.English, key) ??
      key
    );
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      availableLanguages: Object.keys(translations)
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}