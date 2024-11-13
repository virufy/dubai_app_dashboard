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
  SelectDropdown, DropdownOption 
} from './DashboardStyles';
// import SicknessStatsChart from './SicknessStatsChart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

interface HealthDataEntry {
  AgeGroup: string;            // Example: "Adult"
  longitude: number;           // Example: -122.4194
  latitude: number;            // Example: 37.7749
  Sex: string;                 // Example: "Male" or "Female"
  DistanceMetric: number;      // Example: 12.34 (in km or miles, as appropriate)
  Symptoms: string[];          // Example: ["cold", "covid", ...]
}
const symptoms = ['All', 'heavysmoker', 'cold', 'influenza', 'covid', 'sars', 'rsv'];

const ageGroupLabels = ['<20', '30-40', '50-60', '60-80', '80+'];

const categorizeAgeGroup = (age: number): string => {
  if (age < 20) return '<20';
  if (age >= 30 && age < 40) return '30-40';
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
    const ageGroup = categorizeAgeGroup(parseInt(entry.AgeGroup, 10));
    const isSick = entry.Symptoms && !entry.Symptoms.includes('none');
    
    if (ageGroupCounts[ageGroup]) {
      if (isSick) {
        ageGroupCounts[ageGroup].sick += 1;
      } else {
        ageGroupCounts[ageGroup].notSick += 1;
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
        console.log("Sick Male Count:", sickMale); // Debugging
      } else {
        nonSickMale++;
        console.log("Non-Sick Male Count:", nonSickMale); // Debugging
      }
    } else if (entry.Sex === 'female') {
      if (isSick) {
        sickFemale++;
        console.log("Sick Female Count:", sickFemale); // Debugging
      } else {
        nonSickFemale++;
        console.log("Non-Sick Female Count:", nonSickFemale); // Debugging
      }
    }
  });

  const total = sickMale + sickFemale + nonSickMale + nonSickFemale;

  // Log total counts for verification
  console.log("Total Counts:", { sickMale, sickFemale, nonSickMale, nonSickFemale, total });

  // If there is no data, return an empty array to prevent errors
  if (total === 0) return [];

  return [
    { name: 'Sick Male', value: (sickMale / total) * 100 },
    { name: 'Sick Female', value: (sickFemale / total) * 100 },
    { name: 'Non-Sick Male', value: (nonSickMale / total) * 100 },
    { name: 'Non-Sick Female', value: (nonSickFemale / total) * 100 },
  ].filter((entry) => entry.value > 0); 
};


const Dashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthDataEntry[]>([]);
  const [selectedSymptomsLeft, setSelectedSymptomsLeft] = useState<string>('covid');
  const [selectedSymptomsRight, setSelectedSymptomsRight] = useState<string>('cold');
  const [dataCount, setdataCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const retryStartTime = useRef<number | null>(null);

  const sicknessData = processSicknessData(healthData);
  const genderSicknessData = processGenderSicknessData(healthData);
  console.log("gender data:",genderSicknessData); // Debugging: Check if data is processed correctly

  const COLORS = ['#FF6B6B', '#4ECDC4', '#1A535C', '#FFE66D']; // Colors for each category

  // Aggregate data for age and gender
  // const ageCounts = healthData.reduce((acc, entry) => {
  //   acc[entry.AgeGroup] = (acc[entry.AgeGroup] || 0) + 1;
  //   return acc;
  // }, {} as Record<string, number>);

  // const genderCounts = healthData.reduce((acc, entry) => {
  //   acc[entry.Sex] = (acc[entry.Sex] || 0) + 1;
  //   return acc;
  // }, {} as Record<string, number>);

  // Transform data into arrays compatible with Recharts
  // const ageData = Object.entries(ageCounts).map(([label, value]) => ({ label, value }));
  // const genderData = Object.entries(genderCounts).map(([label, value]) => ({ label, value }));

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

      // Retry logic with exponential backoff
      if (retryStartTime.current === null) {
        retryStartTime.current = Date.now();
      }

      const elapsedTime = Date.now() - retryStartTime.current;
      const maxRetryDuration = 60000;

      if (elapsedTime < maxRetryDuration) {
        reconnectAttempts.current += 1;
        const delay = Math.min(10000, (2 ** reconnectAttempts.current) * 1000);
        setTimeout(() => {
          connectWebSocket();
        }, delay);
      } else {
        console.error('Max retry duration reached. WebSocket connection could not be re-established.');
      }
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

  useEffect(() => {
    console.log("gender data:",genderSicknessData); // Debugging: Check if data is processed correctly
    console.log('Number of Data:', healthData.length);
    setdataCount(healthData.length);
  },[healthData, genderSicknessData]);

  // const handleLeftSymptomChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const options = Array.from(e.target.selectedOptions, (option) => option.value);
  //   setSelectedSymptomsLeft(options);
  // }, []);
  
  // const handleRightSymptomChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const options = Array.from(e.target.selectedOptions, (option) => option.value);
  //   setSelectedSymptomsRight(options);
  // }, []);

  const handleSymptomSelectLeft = useCallback((symptom: string) => {
    setSelectedSymptomsLeft(symptom); // Single-select
    // setSelectedSymptomsLeft((prev) =>
    //   prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    // );
  }, []);

  const handleSymptomSelectRight = useCallback((symptom: string) => {
    setSelectedSymptomsRight(symptom); // Single-select
    // setSelectedSymptomsRight((prev) =>
    //   prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    // );
  }, []);

  return (
    <DashboardContainer>
      <VirufyLogoPNG/>
      <HeatmapContainer>
        <HeatmapCard>
          <MapComponent
            lat={25.2048}
            lon={55.2708}
            zoom={10}
            points={healthData
              .filter((entry) =>
                selectedSymptomsLeft === "All" ||
                entry.Symptoms.includes(selectedSymptomsLeft)
              )
              .map((entry) => ({ lat: entry.latitude, lng: entry.longitude, intensity: 10 }))
            }
          />
          <SelectionContainer>
            <label style={{fontSize:'14px', marginBottom:'10px'}}>Select Symptoms:</label>
            <SelectDropdown>
              {symptoms.map((symptom) => (
                <DropdownOption
                  key={symptom}
                  onClick={() => handleSymptomSelectLeft(symptom)}
                  style={{
                    fontWeight: selectedSymptomsLeft.includes(symptom) ? 'bold' : 'normal',
                    color: selectedSymptomsLeft.includes(symptom) ? '#007bff' : 'black',
                  }}
                >
                  {symptom}
                </DropdownOption>
              ))}
            </SelectDropdown>
          </SelectionContainer>
        </HeatmapCard>
        <HeatmapCard>
          <MapComponent
            lat={25.2048}
            lon={55.2708}
            zoom={10}
            points={healthData
              .filter((entry) =>
                selectedSymptomsRight === "All" ||
                entry.Symptoms.includes(selectedSymptomsRight)
              )
              .map((entry) => ({ lat: entry.latitude, lng: entry.longitude, intensity: 10 }))
            }
            />
          <SelectionContainer>
            <label style={{fontSize:'14px', marginBottom:'10px'}}>Select Symptoms:</label>
            <SelectDropdown>
              {symptoms.map((symptom) => (
                <DropdownOption
                  key={symptom}
                  onClick={() => handleSymptomSelectRight(symptom)}
                  style={{
                    fontWeight: selectedSymptomsRight.includes(symptom) ? 'bold' : 'normal',
                    color: selectedSymptomsRight.includes(symptom) ? '#007bff' : 'black',
                  }}
                >
                  {symptom}
                </DropdownOption>
              ))}
            </SelectDropdown>
          </SelectionContainer>
        </HeatmapCard>
      </HeatmapContainer>
      <BottomCardsContainer>
        <BottomCard>Number of data: {dataCount}</BottomCard>
        <BottomCard>
          <ResponsiveContainer width="100%" height="100%">
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
          <ResponsiveContainer width="100%" height="90%">
              <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Pie
                  data={genderSicknessData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  fill="#8884d8"
                  label={({ name, percent }) => `${name}: ${(100*percent).toFixed(0)}%`}
                >
                  {genderSicknessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
        </BottomCard>
      </BottomCardsContainer>
    </DashboardContainer>
  );
};

export default Dashboard;
