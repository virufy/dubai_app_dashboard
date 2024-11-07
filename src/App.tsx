import React from 'react';
import { GlobalStyle } from './globalStyle';
import Dashboard from './dashboard/dashboard';

const App: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Dashboard />
    </>
  );
};

export default App;
