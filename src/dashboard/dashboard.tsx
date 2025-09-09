import React, { useRef, useEffect, useState, useCallback } from 'react';
import MapComponent from './MapComponent';
import {
  DashboardContainer,
  HeatmapContainer,
  HeatmapCard,
  BottomCardsContainer,
  BottomCard,
  VirufyLogoPNG,  
  SelectionContainer,
  SelectDropdown, DropdownOption, QRCode, HeaderContainer
} from './DashboardStyles';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import DistanceMetricChart from './DistanceMetricChart';

interface HealthDataEntry {
  AgeGroup: string;      
  longitude: number;     
  latitude: number;      
  Sex: string;           
  DistanceMetric: number;
  Symptoms: string[];    
}

const translations = {
  en: {
    languageLabel: "Language:",
    symptomsLabel: "Symptoms:",
    ageTitle: "Age",
    genderTitle: "Gender",
    coughStatsTitle: "Cough Statistics",
    chartKeys: {
      sick: "Sick",
      notSick: "NotSick",
    },
  },
  ar: {
    languageLabel: "اللغة:",
    symptomsLabel: "الأعراض:",
    ageTitle: "العمر",
    genderTitle: "الجنس",
    coughStatsTitle: "إحصائيات السعال",
    chartKeys: {
      sick: "مريض",
      notSick: "غير مريض",
    },
  },
  ja: {
    languageLabel: "言語:",
    symptomsLabel: "症状:",
    ageTitle: "年齢",
    genderTitle: "性別",
    coughStatsTitle: "咳の統計",
    chartKeys: {
      sick: "病気",
      notSick: "健康",
    },
  },
};

const genderTranslations = {
  en: {
    sickMale: "Sick Male",
    nonSickMale: "Non-Sick Male",
    sickFemale: "Sick Female",
    nonSickFemale: "Non-Sick Female",
  },
  ar: {
    sickMale: "ذكر مريض",
    nonSickMale: "ذكر غير مريض",
    sickFemale: "أنثى مريضة",
    nonSickFemale: "أنثى غير مريضة",
  },
  ja: {
    sickMale: "病気の男性",
    nonSickMale: "健康な男性",
    sickFemale: "病気の女性",
    nonSickFemale: "健康な女性",
  },
};

// const mean = 6.026709714020622;
// const stdDev = 2.170383376216376;

const mean = 2.170383376216376;
const stdDev = 2;

type SymptomKey = 'All' | 'heavysmoker' | 'cold' | 'flu' | 'covid' | 'Asthma' | 'rsv';

const symptoms: Record<SymptomKey, string> = {
  All: 'All 🔴',
  heavysmoker: 'Smoker 🚬',
  cold: 'Cold 🤒',
  flu: 'flu 😷',
  covid: 'COVID 🤧',
  Asthma: 'Asthma 🦠',
  rsv: 'RSV 🏥',
};

// Extract keys for internal use
const symptomKeys = Object.keys(symptoms) as SymptomKey[];

const symptomsTranslations: Record<'en' | 'ar' | 'ja', Record<SymptomKey, string>> = {
  en: {
    All: 'All 🔴',
    heavysmoker: 'Smoker 🚬',
    cold: 'Cold 🤒',
    flu: 'flu 😷',
    covid: 'COVID 🤧',
    Asthma: 'Asthma 🦠',
    rsv: 'RSV 🏥',
  },
  ar: {
    All: 'الكل 🔴',
    heavysmoker: 'مدخن ثقيل 🚬',
    cold: 'برد 🤒',
    flu: 'إنفلونزا 😷',
    covid: 'كوفيد 🤧',
    Asthma: 'الربو 🦠',
    rsv: 'الفيروس المخلوي التنفسي 🏥',
  },
  ja: {
    All: "すべて 🔴",
    heavysmoker: "ヘビースモーカー 🚬",
    cold: "風邪 🤒",
    flu: "インフルエンザ 😷",
    covid: "COVID 🤧",
    Asthma: "Asthma 🦠",
    rsv: "RSV 🏥",
  },
};


const ageGroupLabels = ['<20', '20-30', '30-40', '40-50', '50-60', '60-80', '80+'];

const categorizeAgeGroup = (age: number): string => {
  if (age < 20) return '<20';
  if (age >= 20 && age < 30) return '20-30';
  if (age >= 30 && age < 40) return '30-40';
  if (age >= 40 && age < 50) return '40-50';
  if (age >= 50 && age < 60) return '50-60';
  if (age >= 60 && age < 80) return '60-80';
  return '80+';
};

const processSicknessData = (healthData: HealthDataEntry[]) => {
  const ageGroupCounts = ageGroupLabels.reduce((acc, label) => {
    acc[label] = { sick: 0, notSick: 0 };
    return acc;
  }, {} as Record<string, { sick: number; notSick: number }>);

  healthData.forEach((entry) => {
    if (entry.AgeGroup && !isNaN(parseInt(entry.AgeGroup, 10))) {
      const ageGroup = categorizeAgeGroup(parseInt(entry.AgeGroup, 10));
      const isSick = entry.Symptoms && !entry.Symptoms.includes('none');
      
      if (ageGroupCounts[ageGroup]) {
        if (isSick) {
          ageGroupCounts[ageGroup].sick += 1;
        } else {
          ageGroupCounts[ageGroup].notSick += 1;
        }
      }
    }
  });

  return Object.entries(ageGroupCounts).map(([label, counts]) => ({
    ageGroup: label,
    Sick: counts.sick,
    NotSick: counts.notSick,
  }));
};

const processGenderSicknessData = (healthData: HealthDataEntry[]) => {
  let sickMale = 0, sickFemale = 0, nonSickMale = 0, nonSickFemale = 0;

  healthData.forEach((entry) => {
    const isSick = entry.Symptoms && !entry.Symptoms.includes('none');
    
    if (entry.Sex === 'male') {
      if (isSick) {
        sickMale++;
      } else {
        nonSickMale++;
      }
    } else if (entry.Sex === 'female') {
      if (isSick) {
        sickFemale++;
      } else {
        nonSickFemale++;
      }
    }
  });

  const total = sickMale + sickFemale + nonSickMale + nonSickFemale;

  // Return default structure with 0 values if no data is available
  if (total === 0) {
    return [
      { name: 'Sick Male', value: 0 },
      { name: 'Non-Sick Male', value: 0 },
      { name: 'Sick Female', value: 0 },
      { name: 'Non-Sick Female', value: 0 },
    ];
  }

  return [
    { name: 'Sick Male', value: (sickMale / total) * 100 },
    { name: 'Non-Sick Male', value: (nonSickMale / total) * 100 },
    { name: 'Sick Female', value: (sickFemale / total) * 100 },
    { name: 'Non-Sick Female', value: (nonSickFemale / total) * 100 },
  ];
};


const Dashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthDataEntry[]>([]);
  const [selectedSymptomsLeft, setSelectedSymptomsLeft] = useState<SymptomKey>('covid');
  const [selectedSymptomsRight, setSelectedSymptomsRight] = useState<SymptomKey>('cold');
  const ws = useRef<WebSocket | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar' | 'ja'>('en');
  const reconnectAttempts = useRef(0);
  const retryStartTime = useRef<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const updateScreenSize = () => setIsDesktop(window.innerWidth > 768);
    
  const t = translations[selectedLanguage];
  const tg = genderTranslations[selectedLanguage];

  const sicknessData = processSicknessData(healthData);
  const genderSicknessData = processGenderSicknessData(healthData) || [
    { name: 'Sick Male', value: 0 },
    { name: 'Non-Sick Male', value: 0 },
    { name: 'Sick Female', value: 0 },
    { name: 'Non-Sick Female', value: 0 },
  ];
  
  const distanceMetrics = healthData.map(entry => entry.DistanceMetric);

  const COLORS = ['#FF6B6B', '#4ECDC4', '#1A535C', '#B565A7'];

  const connectWebSocket = useCallback(() => {
    const websocketURL = process.env.REACT_APP_WEBSOCKET_URL || '';
    ws.current = new WebSocket(websocketURL);

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
      reconnectAttempts.current = 0;
      retryStartTime.current = null;

      ws.current?.send(JSON.stringify({ action: 'send_initial_data' }));
    };

    ws.current.onmessage = (event) => {
      console.log("Message from Backend:", event);
      console.log("Data from Backend:", event.data);
      const data = JSON.parse(event.data);
    
      if (data.message === 'pong' || data.message === 'Received') {
        console.log('Ping response from server:', data.message);
      } else {
        // Handle health data updates
        const healthData = data as HealthDataEntry;
        console.log(healthData);
        setHealthData((prevData) => [...prevData, healthData]);
      }
    };    

    ws.current.onclose = (event) => {
      console.log('WebSocket connection closed unexpectedly');
      console.log(`Code: ${event.code}, Reason: ${event.reason}`);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    connectWebSocket(); // Initial connection attempt

    // Ping every 5 minutes to keep the connection alive
    const pingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ action: 'ping', message: 'ping' }));
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(pingInterval);
      ws.current?.close();
    };
  }, [connectWebSocket]);

  const handleSymptomSelectLeft = useCallback((symptom: SymptomKey) => {
    setSelectedSymptomsLeft(symptom);
  }, []);

  const handleSymptomSelectRight = useCallback((symptom: SymptomKey) => {
    setSelectedSymptomsRight(symptom);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  const handleLanguageChange = useCallback((language: 'en' | 'ar' | 'ja') => {
    setSelectedLanguage(language);
    console.log(`Language changed to: ${language}`);
  }, []);

  const CustomTooltipBar = ({ payload, label, active }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "10px",
            boxShadow: "0 0 5px rgba(0, 0, 0, 0.2)",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold" }}>{label}</p>
          {payload.map((entry: any, index: number) => {
            const localizedName =
              entry.dataKey === "Sick" ? t.chartKeys.sick : t.chartKeys.notSick;
            return (
              <p
                key={index}
                style={{
                  margin: "5px 0",
                  color: entry.color, // Use the color of the bar
                }}
              >
                {`${localizedName}: ${entry.value}`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPie = ({ payload, active }: any) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0];
      const localizedName =
        name === "Sick Male"
          ? tg.sickMale
          : name === "Non-Sick Male"
          ? tg.nonSickMale
          : name === "Sick Female"
          ? tg.sickFemale
          : tg.nonSickFemale;
      const isRTL = selectedLanguage === 'ar';

      return (
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "10px",
            boxShadow: "0 0 5px rgba(0, 0, 0, 0.2)",
            textAlign: isRTL ? "right" : "left", // Align text based on language
            direction: isRTL ? "rtl" : "ltr",   // Set text direction for RTL languages
          }}
        >
          <p style={{ margin: 0 }}>{`${localizedName}: ${value.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  

  return (
    <DashboardContainer>
      <HeaderContainer style={{marginBottom: '4px'}}>
        <SelectionContainer style={{width: '60px', left:'0', position: 'absolute', paddingLeft: '0px'}}>
            <label style={{ fontSize: '14px', marginBottom: '4px', paddingTop: '10px', }}>{t.languageLabel}</label>
            <SelectDropdown style={{  padding: '4px', height: '100%', position: 'relative'}}>
              <DropdownOption
                key="en"
                onClick={() => handleLanguageChange('en')}
                style={{
                  fontWeight: selectedLanguage === 'en' ? 'bold' : 'normal',
                  color: selectedLanguage === 'en' ? '#007bff' : 'black',
                  padding: '2px'
                }}
              >
                English
              </DropdownOption>
              <DropdownOption
                key="ja"
                onClick={() => handleLanguageChange("ja")}
                style={{
                  fontWeight: selectedLanguage === "ja" ? "bold" : "normal",
                  color: selectedLanguage === "ja" ? "#007bff" : "black",
                  padding: '2px'
                }}
              >
                Japanese
              </DropdownOption>
              <DropdownOption
                key="ar"
                onClick={() => handleLanguageChange('ar')}
                style={{
                  fontWeight: selectedLanguage === 'ar' ? 'bold' : 'normal',
                  color: selectedLanguage === 'ar' ? '#007bff' : 'black',
                  padding: '2px'
                }}
              >
                Arabic
              </DropdownOption>
            </SelectDropdown>
          </SelectionContainer>
          <a href="https://virufy.org/en/" target="_blank" rel="noopener noreferrer">
            <VirufyLogoPNG />
          </a>
          <a href="https://virufy.org/en/" target="_blank" rel="noopener noreferrer">
            <QRCode />
          </a>
      </HeaderContainer>
      <HeatmapContainer>
        <HeatmapCard>
          <MapComponent
            lat={25.2048}
            lon={55.2708}
            zoom={10}
            points={healthData
              .filter((entry) => {
                if (selectedSymptomsLeft === "All") {
                  return !entry.Symptoms.includes("none"); // Include all entries without 'none'
                }
                return entry.Symptoms.includes(selectedSymptomsLeft);
              })
              .map((entry) => ({ lat: entry.latitude, lng: entry.longitude, intensity: 10 }))
            }
          />
          <SelectionContainer>
            <label style={{fontSize:'14px', marginBottom:'10px'}}>{t.symptomsLabel}</label>
            <SelectDropdown>
              {symptomKeys.map((symptom: SymptomKey) => (
                <DropdownOption
                  key={symptom}
                  onClick={() => handleSymptomSelectLeft(symptom)}
                  style={{
                    fontWeight: selectedSymptomsLeft.includes(symptom) ? 'bold' : 'normal',
                    color: selectedSymptomsLeft.includes(symptom) ? '#007bff' : 'black',
                  }}
                >
                  {symptomsTranslations[selectedLanguage][symptom]}
                  </DropdownOption>
              ))}
            </SelectDropdown>
          </SelectionContainer>
        </HeatmapCard>
        {isDesktop && <HeatmapCard>
          <MapComponent
            lat={25.2048}
            lon={55.2708}
            zoom={10}
            points={healthData
              .filter((entry) => {
                if (selectedSymptomsRight === "All") {
                  return !entry.Symptoms.includes("none"); // Include all entries without 'none'
                }
                return entry.Symptoms.includes(selectedSymptomsRight);
              })
              .map((entry) => ({ lat: entry.latitude, lng: entry.longitude, intensity: 10 }))
            }
            />
          <SelectionContainer>
            <label style={{fontSize:'14px', marginBottom:'10px'}}>{t.symptomsLabel}</label>
            <SelectDropdown>
              {symptomKeys.map((symptom: SymptomKey) => (
                <DropdownOption
                  key={symptom}
                  onClick={() => handleSymptomSelectRight(symptom)}
                  style={{
                    fontWeight: selectedSymptomsRight.includes(symptom) ? 'bold' : 'normal',
                    color: selectedSymptomsRight.includes(symptom) ? '#007bff' : 'black',
                  }}
                >
                  {symptomsTranslations[selectedLanguage][symptom]}
                  </DropdownOption>
              ))}
            </SelectDropdown>
          </SelectionContainer>
        </HeatmapCard>}
      </HeatmapContainer>
      <BottomCardsContainer>
        <BottomCard>
          <div style={{marginLeft:'auto', marginRight:'auto', marginBottom:"10px", height:"5%", fontSize:'100%'}}>{t.ageTitle}</div>
          <ResponsiveContainer width="100%" height="93%">
            <BarChart data={sicknessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageGroup" />
              <YAxis />
              <Tooltip content={<CustomTooltipBar />} />
              <Legend
                formatter={(value, entry: any) =>
                  entry?.dataKey === "Sick" ? t.chartKeys.sick : t.chartKeys.notSick
                }
              />
              <Bar dataKey="Sick" name={t.chartKeys.sick} fill="#FF6B6B" />
              <Bar dataKey="NotSick" name={t.chartKeys.notSick} fill="#4ECDC4" />
            </BarChart>
          </ResponsiveContainer>
        </BottomCard>
        <BottomCard>
          <div style={{marginLeft:'auto', marginRight:'auto', marginBottom:"10px", height:"5%", fontSize:'100%'}}>{t.genderTitle}</div>
          <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}> {/* Adds margin for label space */}
          <Pie
            data={genderSicknessData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="100%"
            fill="#8884d8"
            labelLine={false}
          >
            {genderSicknessData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltipPie selectedLanguage={selectedLanguage} />} />
          <Legend
            formatter={(value) => {
              return value === "Sick Male"
                ? genderTranslations[selectedLanguage].sickMale
                : value === "Non-Sick Male"
                ? genderTranslations[selectedLanguage].nonSickMale
                : value === "Sick Female"
                ? genderTranslations[selectedLanguage].sickFemale
                : genderTranslations[selectedLanguage].nonSickFemale;
            }}
          />
        </PieChart>
          </ResponsiveContainer>
        </BottomCard>
        <BottomCard>
          <div style={{marginLeft:'auto', marginRight:'auto', marginBottom:"10px", height:"5%", fontSize:'100%'}}>{t.coughStatsTitle}</div>
          <DistanceMetricChart mean={mean} stdDev={stdDev} distanceMetrics={distanceMetrics} language={selectedLanguage} />
        </BottomCard>
      </BottomCardsContainer>
    </DashboardContainer>
  );
};

export default Dashboard;
