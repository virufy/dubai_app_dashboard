import React from 'react';
import { ComposedChart, Scatter, Line, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';

interface DistanceMetricChartProps {
  mean: number;
  stdDev: number;
  distanceMetrics: number[];
}

const generateBellCurveData = (mean: number, stdDev: number) => {
  const data = [];
  for (let i = mean - 3 * stdDev; i <= mean + 3 * stdDev; i += 0.1) {
    const probabilityDensity =
      (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((i - mean) / stdDev) ** 2);
    data.push({ x: i, y: probabilityDensity });
  }
  return data;
};

const generateColor = (index: number, total: number) => {
    if (index === total - 1) {
      return 'rgba(255, 0, 0, 1)'; // Latest line: Fully opaque red
    } else if (index === total - 2) {
      return 'rgba(255, 0, 0, 0.4)'; // Second latest line: Less opaque red
    } else {
      const opacity = 0.1+(0.3 * (index / total)); // Gradually increase opacity for older lines
      return `rgba(255, 0, 0, ${opacity})`;
    }
  };
// Custom tooltip content renderer
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const bellCurveValue = payload.find((entry: any) => entry.name === "Probability");
      return (
        <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: '5px' }}>
          <p style={{ color: '#ff5632' }}>{`Distance Metric: ${label.toFixed(2)}`}</p>
          {bellCurveValue && <p style={{ color: '#4BC0C0' }}>{`Probability: ${bellCurveValue.value.toFixed(4)}`}</p>}
        </div>
      );
    }
    return null;
  };

const generateTicks = (min: number, max: number) => {
    const interval = (max - min) / 4;
    return [
        min,
        min + interval,
        min + 2 * interval,
        min + 3 * interval,
        max,
    ];
};

const DistanceMetricChart: React.FC<DistanceMetricChartProps> = ({ mean, stdDev, distanceMetrics }) => {
  const bellCurveData = generateBellCurveData(mean, stdDev);
  // Calculate min and max values for the x-axis based on the bell curve data
  const minX = mean - 3 * stdDev;
  const maxX = mean + 3 * stdDev;

  // Generate five evenly spaced ticks
  const ticks = generateTicks(minX, maxX);
  return (
    <ResponsiveContainer width="100%" height="93%">
      <ComposedChart>
        <XAxis
          dataKey="x"
          label={{ value: 'Distance Metric', position: 'insideBottom', offset: -5 }}
          type="number"
          domain={['dataMin', 'dataMax']}
          ticks={ticks}
          tickFormatter={(value) => value.toFixed(2)}
        />
        {/* <YAxis label={<CustomYAxisLabel />} /> */}
        <YAxis label={{ value: 'Probability Density', angle: -90, position: 'insideLeft', offset: 10, dy:65}} />
        <ZAxis range={[30, 31]} />
        <Tooltip content={<CustomTooltip />} />

        {/* Shaded Area Under the Curve */}
        <Area
          type="monotone"
          dataKey="y"
          data={bellCurveData}
          fill="rgba(75, 192, 192, 0.2)"
          stroke="#4BC0C0" // Slightly darker color
          name="Probability"
        />

        {/* Multiple lines for each distanceMetric with progressively darker colors */}
        {distanceMetrics.map((metric, index) => {
          // Calculate y-value on bell curve at this metric
          const yValue =
            (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((metric - mean) / stdDev) ** 2);
          
          return (
            <React.Fragment key={`line-${index}`}>
              {/* Vertical Line without dots */}
              <Line
                type="monotone"
                data={[
                  { x: metric, y: 0 },
                  { x: metric, y: yValue }
                ]}
                dataKey="y"
                stroke={generateColor(index, distanceMetrics.length)}
                strokeWidth={2}
                dot={false} // No dots on the line itself
              />
              {/* Dot at the top of the line */}
              <Scatter
                data={[{ x: metric, y: yValue }]}
                dataKey="y"
                fill={generateColor(index, distanceMetrics.length)}
              />
            </React.Fragment>
          );
        })}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default DistanceMetricChart;
