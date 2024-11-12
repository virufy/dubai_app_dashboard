import styled from 'styled-components';
import virufyLogo from '../virufyLogo.png';

export const VirufyLogoPNG = styled.img.attrs({
  src: virufyLogo
})`
  display: block;
  margin: 0px auto 30px; /* Center horizontally and add spacing below */
  min-height:60px;
  height: 6vh;
  padding-top: 10px; /* Add padding above the logo */
`;

export const DashboardContainer = styled.div`
  width: 90vw; /* 90% of the viewport width */
  height: 95vh; /* 90% of the viewport height */
  margin: auto;
  padding: 20px;
  border: 4px solid black; /* 4px black border */
  border-radius: 12px;
  background-color: #ffffff; /* White background for the Dashboard container */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const HeatmapContainer = styled.div`
  display: flex;
  gap: 10px;
  height: 50%;
`;

export const HeatmapCard = styled.div`
  width: 45vw; 
  height: 100%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: row;  /* Arrange items side by side */
`;

export const BottomCardsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  height: 35%;
`;

export const BottomCard = styled.div`
  flex: 1;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  background-color: #fff;
  text-align: center;
`;

export const MapContainer = styled.div`
  width: 82%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
`;

export const SelectionContainer = styled.div`
  width: 13%;
  min-width: 100px;
  padding: 10px;
  padding-right: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`;

export const SelectDropdown = styled.div`
  width: 100%;
  background-color: #f5f5f5;
  border-radius: 5px;
  border: 1px solid #ddd;
  padding: 10px;
  font-size: 14px;
`;

export const DropdownOption = styled.div`
  padding: 5px 0;
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: #e0e0e0;
  }

  &::before {
    content: "•";
    color: #007bff;
    margin-right: 10px;
  }
`;
