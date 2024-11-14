import styled from 'styled-components';
import virufyLogo from '../virufyLogo.png';
import qrCode from '../qrcode.png';

// Flex container for logo and QR code
export const HeaderContainer = styled.div`
  display: flex;
  align-items: center; /* Vertically align items */
  justify-content: space-between; /* Space between logo and QR code */
  width: 98%;
`;

export const QRCode = styled.img.attrs({
  src: qrCode
})`
  margin-left: auto;
  min-height: 140px;
  height: 9vh;
`;

export const VirufyLogoPNG = styled.img.attrs({
  src: virufyLogo
})`
  display: block;
  margin-left: auto;
  min-height:60px;
  height: 6vh;
`;

export const DashboardContainer = styled.div`
  width: 90vw; /* 90% of the viewport width */
  height: 97vh; /* 90% of the viewport height */
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
