import React, { useRef, useEffect, useState, useCallback } from 'react';
import MapComponent from './MapComponent';
import {
  DashboardContainer,
  HeatmapContainer,
  HeatmapCard,
  BottomCardsContainer,
  BottomCard,
} from './DashboardStyles';

// type HeatmapPoint = {
//   lat: number;
//   lng: number;
//   intensity: number;
// };

interface HealthDataEntry {
  AgeGroup: string;            // Example: "Adult"
  longitude: number;           // Example: -122.4194
  latitude: number;            // Example: 37.7749
  Sex: string;                 // Example: "Male" or "Female"
  DistanceMetric: number;      // Example: 12.34 (in km or miles, as appropriate)
  Symptoms: string[];          // Example: [{ "S": "cold" }, { "S": "covid" }, ...]
}
const symptoms = ['All', 'influenzaA', 'covid', 'cold', 'pneumonia', 'bronchitis', 'tuberculosis', 'copdEmphysema', 'asthma'];

const Dashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthDataEntry[]>([]);
  const [selectedSymptomsLeft, setSelectedSymptomsLeft] = useState<string[]>(['covid']);
  const [selectedSymptomsRight, setSelectedSymptomsRight] = useState<string[]>(['cold']);
  const [dataCount, setdataCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const retryStartTime = useRef<number | null>(null);

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

        // // Filter symptoms and update heatmap data for 'cold' and 'covid'
        // const hasCovid = healthData.Symptoms.includes('covid');
        // const hasCold = healthData.Symptoms.includes('cold');
        // console.log(hasCovid, hasCold);
        // if (hasCovid) {
        //   setCovidData((prevData) => [
        //     ...prevData,
        //     { lat: healthData.latitude, lng: healthData.longitude, intensity: 50 },
        //   ]);
        // }
    
        // if (hasCold) {
        //   setColdData((prevData) => [
        //     ...prevData,
        //     { lat: healthData.latitude, lng: healthData.longitude, intensity: 50 },
        //   ]);
        // }
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
    console.log('Number of Data:', healthData.length);
    setdataCount(healthData.length);
  },[healthData]);

  const handleLeftSymptomChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedSymptomsLeft(options);
  }, []);
  
  const handleRightSymptomChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedSymptomsRight(options);
  }, []);
  

  return (
    <DashboardContainer>
      <HeatmapContainer>
        <HeatmapCard>
          <div>
            <label>Select Symptoms:</label>
            <select multiple value={selectedSymptomsLeft} onChange={handleLeftSymptomChange}>
              {symptoms.map((symptom) => (
                <option key={symptom} value={symptom}>{symptom}</option>
              ))}
            </select>
          </div>
          <MapComponent
            lat={25.2048}
            lon={55.2708}
            zoom={10}
            points={healthData
              .filter((entry) =>
                selectedSymptomsLeft.includes("All") ||
                selectedSymptomsLeft.some((symptom) => entry.Symptoms.includes(symptom))
              )
              .map((entry) => ({ lat: entry.latitude, lng: entry.longitude, intensity: 1 }))
            }
          />
        </HeatmapCard>
        <HeatmapCard>
          <div>
            <label>Select Symptoms:</label>
            <select multiple value={selectedSymptomsRight} onChange={handleRightSymptomChange}>
              {symptoms.map((symptom) => (
                <option key={symptom} value={symptom}>{symptom}</option>
              ))}
            </select>
          </div>
          <MapComponent
            lat={25.2048}
            lon={55.2708}
            zoom={10}
            points={healthData
              .filter((entry) =>
                selectedSymptomsRight.includes("All") ||
                selectedSymptomsRight.some((symptom) => entry.Symptoms.includes(symptom))
              )
              .map((entry) => ({ lat: entry.latitude, lng: entry.longitude, intensity: 1 }))
            }
            />
        </HeatmapCard>
      </HeatmapContainer>
      <BottomCardsContainer>
        <BottomCard>Number of data: {dataCount}</BottomCard>
        <BottomCard>Placeholder for gender stats</BottomCard>
        <BottomCard>Hello World</BottomCard>
      </BottomCardsContainer>
    </DashboardContainer>
  );
};

export default Dashboard;
