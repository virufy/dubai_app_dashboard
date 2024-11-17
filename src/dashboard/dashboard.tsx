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
// import SicknessStatsChart from './SicknessStatsChart';
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

// const mean = 6.026709714020622;
// const stdDev = 2.170383376216376;

const mean = 2.170383376216376;
const stdDev = 2;

// const distanceMetric = [0.5, 0.4, 0.7, 1.1, 1.4];

type SymptomKey = 'All' | 'heavysmoker' | 'cold' | 'influenza' | 'covid' | 'sars' | 'rsv';

// Define symptoms with the specific type
const symptoms: Record<SymptomKey, string> = {
  All: 'All 🔴',
  heavysmoker: 'Heavy Smoker 🚬',
  cold: 'Cold 🤒',
  influenza: 'Influenza 😷',
  covid: 'COVID 🤧',
  sars: 'SARS 🦠',
  rsv: 'RSV 🏥',
};

// Extract keys for internal use
const symptomKeys = Object.keys(symptoms) as SymptomKey[];

const ageGroupLabels = ['<20', '20-30', '30-40', '40-50', '50-60', '60-80', '80+'];

// const testAge = [{ name: 'Sick Male', value: 0.25 * 100 },
// { name: 'Non-Sick Male', value: 0.20 * 100 },
// { name: 'Sick Female', value: 0.50 * 100 },
// { name: 'Non-Sick Female', value: 0.05 * 100 }]

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

  // If there is no data, return an empty array to prevent errors
  if (total === 0) return [];

  return [
    { name: 'Sick Male', value: (sickMale / total) * 100 },
    { name: 'Non-Sick Male', value: (nonSickMale / total) * 100 },
    { name: 'Sick Female', value: (sickFemale / total) * 100 },
    { name: 'Non-Sick Female', value: (nonSickFemale / total) * 100 },
  ].filter((entry) => entry.value > 0); 
};

const Dashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthDataEntry[]>([]);
  const [selectedSymptomsLeft, setSelectedSymptomsLeft] = useState<SymptomKey>('covid');
  const [selectedSymptomsRight, setSelectedSymptomsRight] = useState<SymptomKey>('cold');
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const retryStartTime = useRef<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const updateScreenSize = () => setIsDesktop(window.innerWidth > 768);

  const sicknessData = processSicknessData(healthData);
  const genderSicknessData = processGenderSicknessData(healthData);
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

      // // Retry logic with exponential backoff
      // if (retryStartTime.current === null) {
      //   retryStartTime.current = Date.now();
      // }

      // const elapsedTime = Date.now() - retryStartTime.current;
      // const maxRetryDuration = 60000;

      // if (elapsedTime < maxRetryDuration) {
      //   reconnectAttempts.current += 1;
      //   const delay = Math.min(10000, (2 ** reconnectAttempts.current) * 1000);
      //   setTimeout(() => {
      //     connectWebSocket();
      //   }, delay);
      // } else {
      //   console.error('Max retry duration reached. WebSocket connection could not be re-established.');
      // }
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

  const CustomTooltip = ({ payload, label, active }: any) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0];
      const percentage = value.toFixed(2);
      return (
        <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '5px' }}>
          <p>{`${name}: ${percentage}%`}</p>
        </div>
      );
    }
  
    return null;
  };

  return (
    <DashboardContainer>
      <HeaderContainer>

          <a href="https://virufy.org/en/" target="_blank" rel="noopener noreferrer">
            <VirufyLogoPNG />
          </a>
        <a href="https://main.d2m8rxm7onxcwh.amplifyapp.com/" target="_blank" rel="noopener noreferrer">
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
            <label style={{fontSize:'14px', marginBottom:'10px'}}>Symptoms:</label>
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
                  {symptoms[symptom]} {/* Display friendly name */}
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
            <label style={{fontSize:'14px', marginBottom:'10px'}}>Symptoms:</label>
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
                  {symptoms[symptom]} {/* Display friendly name */}
                  </DropdownOption>
              ))}
            </SelectDropdown>
          </SelectionContainer>
        </HeatmapCard>}
      </HeatmapContainer>
      <BottomCardsContainer>
        <BottomCard>
          <div style={{marginLeft:'auto', marginRight:'auto', marginBottom:"10px", height:"5%", fontSize:'100%'}}>Age</div>
          <ResponsiveContainer width="100%" height="93%">
            <BarChart data={sicknessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageGroup" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Sick" fill="#FF6B6B" />
              <Bar dataKey="NotSick" fill="#4ECDC4" />
            </BarChart>
          </ResponsiveContainer>
        </BottomCard>
        <BottomCard>
          <div style={{marginLeft:'auto', marginRight:'auto', marginBottom:"10px", height:"5%", fontSize:'100%'}}>Gender</div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}> {/* Adds margin for label space */}
              <Pie
                data={genderSicknessData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="100%" // Increased outer radius for more padding
                fill="#8884d8"
                labelLine={false} // Optional: Remove label lines if they crowd the chart
              >
                {genderSicknessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </BottomCard>
        <BottomCard>
          <div style={{marginLeft:'auto', marginRight:'auto', marginBottom:"10px", height:"5%", fontSize:'100%'}}>Cough Statistics</div>
          <DistanceMetricChart mean={mean} stdDev={stdDev} distanceMetrics={distanceMetrics} />
        </BottomCard>
      </BottomCardsContainer>
    </DashboardContainer>
  );
};

export default Dashboard;
