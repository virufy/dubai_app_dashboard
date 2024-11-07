import React, { useRef, useEffect, useState, useCallback } from 'react';
import MapComponent from './MapComponent';
import {
  DashboardContainer,
  HeatmapContainer,
  HeatmapCard,
  BottomCardsContainer,
  BottomCard,
} from './DashboardStyles';

type HeatmapPoint = {
  lat: number;
  lng: number;
  intensity: number;
};

interface HealthDataEntry {
  AgeGroup: string;            // Example: "Adult"
  longitude: number;           // Example: -122.4194
  latitude: number;            // Example: 37.7749
  Sex: string;                 // Example: "Male" or "Female"
  DistanceMetric: number;      // Example: 12.34 (in km or miles, as appropriate)
  Symptoms: { S: string }[];   // Example: [{ "S": "cold" }, { "S": "covid" }, ...]
}

const Dashboard: React.FC = () => {
  const [covidData, setCovidData] = useState<HeatmapPoint[]>([]);
  const [coldData, setColdData] = useState<HeatmapPoint[]>([]);
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
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
    
      if (data.message === 'pong' || data.message === 'Received') {
        console.log('Ping response from server:', data.message);
      } else {
        // Handle health data updates
        const healthData = data as HealthDataEntry;
    
        // Filter symptoms and update heatmap data for 'cold' and 'covid'
        const hasCovid = healthData.Symptoms.some((symptom) => symptom.S === 'covid');
        const hasCold = healthData.Symptoms.some((symptom) => symptom.S === 'cold');
    
        if (hasCovid) {
          setCovidData((prevData) => [
            ...prevData,
            { lat: healthData.latitude, lng: healthData.longitude, intensity: 100 },
          ]);
        }
    
        if (hasCold) {
          setColdData((prevData) => [
            ...prevData,
            { lat: healthData.latitude, lng: healthData.longitude, intensity: 100 },
          ]);
        }
      }
    };    

    ws.current.onclose = () => {
      console.log('WebSocket connection closed unexpectedly');

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
    console.log('Number of Data:', covidData.length);
    setdataCount(covidData.length);
  },[covidData]);

  return (
    <DashboardContainer>
      <HeatmapContainer>
        <HeatmapCard>
          <MapComponent lat={25.2048} lon={55.2708} zoom={10} points={covidData} />
        </HeatmapCard>
        <HeatmapCard>
          <MapComponent lat={25.2048} lon={55.2708} zoom={10} points={ coldData } />
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
