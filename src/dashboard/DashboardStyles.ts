import styled from 'styled-components';
import virufyLogo from '../virufyLogo.png';
import qrCode from '../qrcode.png';

interface HeatmapCardProps {
  $hideOnMobile?: boolean;
}

export const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 98%;
  padding: 12px;
  position: relative;
  height: 12vh;
`;

export const QRCode = styled.img.attrs({
  src: qrCode
})`
  height: 12vh;
  padding-bottom: 10px;
  padding-top: 10px;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
`;

export const VirufyLogoPNG = styled.img.attrs({
  src: virufyLogo
})`
  min-height: 45px;
  height: 6vh;
`;

export const DashboardContainer = styled.div`
  width: 90vw;
  height: 97vh;
  border-radius: 12px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (max-width: 768px) {
    width: 90vw;
    height: auto;
  }
  @media (max-height: 800px) {
    height: auto;
  }
`;

export const HeatmapContainer = styled.div`
  display: flex;
  gap: 10px;
  height: 50%;

  @media (max-width: 768px) {
    flex-direction: column;
    height: 500px;
    width: 90vw;
  }
  @media (max-height: 800px) {
    height: 400px;
  }
`;

export const HeatmapCard = styled.div<HeatmapCardProps>`
  width: 45vw; 
  height: 100%;
  min-height: 300px;
  min-width: 300px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: row;  /* Arrange items side by side */

  @media (max-width: 768px) {
    height: 500px;
    width: 90vw;
  }
`;

export const BottomCardsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  height: 35%;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    height: auto;
    width: 90vw;
  }
  @media (max-height: 800px) {
    height: 250px;
  }
`;

export const BottomCard = styled.div`
  flex: 1;
  margin: 10px;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  background-color: #fff;
  text-align: center;
  @media (max-width: 768px) {
    width: calc(100% - 30px + 10px);
    min-height: 220px;
  }
`;

export const MapContainer = styled.div`
  width: 82%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  @media (max-width: 768px) {
    width: 94%;
  }
`;

export const SelectionContainer = styled.div`
  width: 13%;
  min-width: 75px;
  padding: 10px;
  padding-right: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  @media (max-width: 768px) {
    width: 6%;
  }
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
