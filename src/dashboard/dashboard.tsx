import React, { useRef, useEffect, useState } from 'react';
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

const Dashboard: React.FC = () => {
  const ws = useRef<WebSocket | null>(null);
  const [dataCount, setdataCount] = useState(0);
  const [covidData, setCovidData] = useState<HeatmapPoint[]>([]);
  const [influenzaData, setInfluenzaData] = useState<HeatmapPoint[]>([]);  

  useEffect(() => {
    // Initialize the WebSocket connection once
    if (!ws.current) {
      ws.current = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL || '');

      ws.current.onopen = () => console.log('WebSocket connection opened');
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Handle incoming data
        if (data.condition === 'covid') {
          setCovidData((prevData) => [
            ...prevData,
            { lat: data.latitude, lng: data.longitude, intensity: data.intensity },
          ]);
        } else if (data.condition === 'influenza') {
          setInfluenzaData((prevData) => [
            ...prevData,
            { lat: data.latitude, lng: data.longitude, intensity: data.intensity },
          ]);
        }        
      };

      ws.current.onclose = () => console.log('WebSocket connection closed');
      ws.current.onerror = (error) => console.error('WebSocket error:', error);
    }

    return () => {
      // Close WebSocket connection when component unmounts
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

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
          <MapComponent lat={25.2048} lon={55.2708} zoom={10} points={influenzaData} />
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
